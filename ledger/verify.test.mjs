#!/usr/bin/env node
// Tests for verify.mjs. Run: node --test ledger/
// No dependencies. Each case writes a fixture ledger, runs the verifier as a subprocess,
// and asserts on the exit code and the reported errors.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const VERIFY = join(HERE, 'verify.mjs')

const T = '2026-08-18T09:00:00Z'
const later = (mins) => new Date(Date.parse(T) + mins * 60_000).toISOString().replace('.000', '')

/** Run the verifier over an in-memory ledger, return its parsed --json report. */
function verify(entries) {
  const dir = mkdtempSync(join(tmpdir(), 'sc-ledger-'))
  const file = join(dir, 'fixture.jsonl')
  const body = entries.map((e) => (typeof e === 'string' ? e : JSON.stringify(e))).join('\n')
  writeFileSync(file, body ? body + '\n' : '')

  let stdout, code = 0
  try {
    stdout = execFileSync(process.execPath, [VERIFY, file, '--json'], { encoding: 'utf8' })
  } catch (err) {
    stdout = err.stdout
    code = err.status
    if (!stdout) throw new Error(err.stderr || err.message)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
  return { code, ...JSON.parse(stdout) }
}

/** Assert the run failed and at least one error mentions `needle`. */
function assertRejected(report, needle) {
  assert.equal(report.ok, false, 'expected the ledger to be rejected')
  assert.equal(report.code, 1, 'expected exit code 1')
  assert.ok(
    report.errors.some((e) => e.toLowerCase().includes(needle.toLowerCase())),
    `expected an error mentioning "${needle}", got:\n${report.errors.join('\n')}`,
  )
}

const grant = (seq, to, amount, ts = T) => ({ seq, ts, type: 'grant', to, amount, reason: 'onboarding' })
const escrow = (seq, from, amount, ref, ts = T) => ({ seq, ts, type: 'escrow', from, amount, ref })
const settle = (seq, to, amount, ref, ts = T) =>
  ({ seq, ts, type: 'settle', to, amount, ref, pr: 'https://github.com/o/r/pull/1' })

// --- happy paths ---------------------------------------------------------

test('empty ledger is valid', () => {
  const r = verify([])
  assert.equal(r.ok, true)
  assert.equal(r.code, 0)
  assert.deepEqual(r.balances, {})
})

test('a full post-claim-deliver-settle cycle balances out', () => {
  const r = verify([
    grant(1, 'alice', 50),
    grant(2, 'bob', 50),
    escrow(3, 'alice', 30, '#1', later(1)),
    settle(4, 'bob', 30, '#1', later(2)),
  ])
  assert.equal(r.ok, true, r.errors.join('\n'))
  assert.deepEqual(r.balances, { alice: 20, bob: 80 })
  assert.equal(r.in_escrow, 0)
  assert.equal(r.total_issued, 100)
})

test('a timed-out task refunds the requester in full', () => {
  const r = verify([
    grant(1, 'alice', 50),
    escrow(2, 'alice', 30, '#1', later(1)),
    { seq: 3, ts: later(2), type: 'refund', to: 'alice', amount: 30, ref: '#1', reason: 'claim timeout' },
  ])
  assert.equal(r.ok, true, r.errors.join('\n'))
  assert.deepEqual(r.balances, { alice: 50 })
  assert.equal(r.in_escrow, 0)
})

test('a refund cannot be redirected to a different account', () => {
  const r = verify([
    grant(1, 'alice', 50),
    escrow(2, 'alice', 30, '#1', later(1)),
    { seq: 3, ts: later(2), type: 'refund', to: 'bob', amount: 30, ref: '#1', reason: 'claim timeout' },
  ])
  assertRejected(r, 'must return to escrow owner alice')
})

test('an arbitrated split divides escrow between both parties', () => {
  const r = verify([
    grant(1, 'alice', 80),
    escrow(2, 'alice', 80, '#1', later(1)),
    { seq: 3, ts: later(2), type: 'split', to: 'bob', amount: 50, ref: '#1', by: 'carol', reason: 'partial delivery' },
    { seq: 4, ts: later(2), type: 'split', to: 'alice', amount: 30, ref: '#1', by: 'carol', reason: 'partial delivery' },
  ])
  assert.equal(r.ok, true, r.errors.join('\n'))
  assert.deepEqual(r.balances, { alice: 30, bob: 50 })
})

test('unsettled escrow is reported as a warning, not an error', () => {
  const r = verify([grant(1, 'alice', 50), escrow(2, 'alice', 30, '#7', later(1))])
  assert.equal(r.ok, true, r.errors.join('\n'))
  assert.equal(r.in_escrow, 30)
  assert.ok(r.warnings.some((w) => w.includes('#7')), 'expected a warning naming the open issue')
})

test('comments and blank lines are skipped', () => {
  const r = verify(['// bootstrap', '', JSON.stringify(grant(1, 'alice', 50)), ''])
  assert.equal(r.ok, true, r.errors.join('\n'))
  assert.deepEqual(r.balances, { alice: 50 })
})

// --- red line 5: no transfers -------------------------------------------

test('a user-to-user transfer is rejected and cites red line 5', () => {
  const r = verify([
    grant(1, 'alice', 50),
    { seq: 2, ts: later(1), type: 'transfer', from: 'alice', to: 'bob', amount: 50, ref: '#1' },
  ])
  assertRejected(r, 'red line 5')
})

test('any unrecognized type is treated as tampering', () => {
  const r = verify([grant(1, 'alice', 50), { seq: 2, ts: later(1), type: 'gift', to: 'bob', amount: 10 }])
  assertRejected(r, 'unknown transaction type')
})

// --- tamper detection ----------------------------------------------------

test('a deleted entry is caught by the seq gap', () => {
  const r = verify([grant(1, 'alice', 50), grant(3, 'bob', 50, later(1))])
  assertRejected(r, 'seq must be 2')
})

test('reordered entries are rejected', () => {
  const r = verify([grant(2, 'alice', 50), grant(1, 'bob', 50)])
  assertRejected(r, 'seq must be 1')
})

test('a future-dated entry is rejected', () => {
  // The regression that motivated this invariant: entries 1-8 were written with invented
  // times, the last several hours ahead. Monotonicity passed because they increased; the
  // error only surfaced when a real timestamp arrived behind the invented one, by which
  // point settlement was blocked. A future date is proof the time was typed, not observed.
  const future = new Date(Date.now() + 6 * 3600_000).toISOString().replace('.000', '')
  assertRejected(verify([grant(1, 'alice', 50, future)]), 'in the future')
})

test('small clock skew is tolerated', () => {
  const skewed = new Date(Date.now() + 60_000).toISOString().replace('.000', '')
  const r = verify([grant(1, 'alice', 50, skewed)])
  assert.equal(r.ok, true, `a minute of skew should pass:\n${r.errors.join('\n')}`)
})

test('a backdated entry is rejected', () => {
  const r = verify([grant(1, 'alice', 50, later(10)), grant(2, 'bob', 50, T)])
  assertRejected(r, 'goes backwards')
})

test('malformed JSON is reported, not swallowed', () => {
  const r = verify(['{"seq":1, oops}'])
  assertRejected(r, 'not valid JSON')
})

// --- conservation and non-negativity ------------------------------------

test('spending TP you never had is rejected', () => {
  const r = verify([grant(1, 'alice', 10), escrow(2, 'alice', 30, '#1', later(1))])
  assertRejected(r, 'with only 10 available')
})

test('a balance that dips negative mid-history is caught even if it recovers', () => {
  const r = verify([
    grant(1, 'alice', 10),
    escrow(2, 'alice', 30, '#1', later(1)), // invalid at this point
    grant(3, 'alice', 100, later(2)),       // ...even though the end state looks fine
  ])
  assertRejected(r, 'with only 10 available')
})

test('paying out more than an issue escrowed is rejected', () => {
  const r = verify([grant(1, 'alice', 100), escrow(2, 'alice', 30, '#1', later(1)), settle(3, 'bob', 80, '#1', later(2))])
  assertRejected(r, 'only 30 TP is held in escrow')
})

test('double-settling the same issue is rejected', () => {
  const r = verify([
    grant(1, 'alice', 100),
    escrow(2, 'alice', 30, '#1', later(1)),
    settle(3, 'bob', 30, '#1', later(2)),
    settle(4, 'bob', 30, '#1', later(3)),
  ])
  assertRejected(r, 'only 0 TP is held in escrow')
})

test('settling an issue that never escrowed anything is rejected', () => {
  const r = verify([grant(1, 'alice', 50), settle(2, 'bob', 30, '#99', later(1))])
  assertRejected(r, 'nothing was ever escrowed')
})

// --- field validation ----------------------------------------------------

test('settle without a PR link is rejected', () => {
  const r = verify([
    grant(1, 'alice', 50),
    escrow(2, 'alice', 30, '#1', later(1)),
    { seq: 3, ts: later(2), type: 'settle', to: 'bob', amount: 30, ref: '#1' },
  ])
  assertRejected(r, 'requires "pr"')
})

test('settle with fabricated PR evidence is rejected', () => {
  const r = verify([
    grant(1, 'alice', 50),
    escrow(2, 'alice', 30, '#1', later(1)),
    { seq: 3, ts: later(2), type: 'settle', to: 'bob', amount: 30, ref: '#1', pr: 'not-a-url' },
  ])
  assertRejected(r, 'GitHub pull request URL')
})

test('adjust without an authorizing maintainer is rejected', () => {
  const r = verify([{ seq: 1, ts: T, type: 'adjust', to: 'alice', amount: 10, reason: 'correcting #4' }])
  assertRejected(r, 'requires "by"')
})

test('a non-integer amount is rejected', () => {
  const r = verify([{ seq: 1, ts: T, type: 'grant', to: 'alice', amount: 12.5, reason: 'onboarding' }])
  assertRejected(r, 'positive integer')
})

test('a zero or negative amount is rejected', () => {
  assertRejected(verify([{ seq: 1, ts: T, type: 'grant', to: 'alice', amount: 0, reason: 'x' }]), 'positive integer')
  assertRejected(verify([{ seq: 1, ts: T, type: 'grant', to: 'alice', amount: -50, reason: 'x' }]), 'positive integer')
})

test('an invalid GitHub handle is rejected', () => {
  const r = verify([{ seq: 1, ts: T, type: 'grant', to: 'not a handle!', amount: 50, reason: 'onboarding' }])
  assertRejected(r, 'not a valid GitHub handle')
})

test('a malformed issue ref is rejected', () => {
  const r = verify([grant(1, 'alice', 50), { seq: 2, ts: later(1), type: 'escrow', from: 'alice', amount: 30, ref: 'issue-1' }])
  assertRejected(r, 'must look like "#123"')
})

test('an unparseable timestamp is rejected', () => {
  const r = verify([{ seq: 1, ts: 'last tuesday', type: 'grant', to: 'alice', amount: 50, reason: 'onboarding' }])
  assertRejected(r, 'not a valid timestamp')
})
