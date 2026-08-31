#!/usr/bin/env node
// Verify ledger.jsonl against the invariants in ledger/README.md and recompute balances.
// No dependencies. Exit 0 if every invariant holds, 1 otherwise.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parsePullRequestUrl } from './pr-evidence.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))

// An explicit path lets the test suite point at fixture ledgers.
const pathArg = process.argv.slice(2).find((a) => !a.startsWith('--'))
const LEDGER = pathArg ?? join(HERE, 'ledger.jsonl')
const BALANCES = pathArg ? `${pathArg.replace(/\.jsonl$/, '')}.balances.json` : join(HERE, 'balances.json')

// Red line 5 lives here: there is no user-to-user transfer type, and never will be.
// Anything outside this set is treated as tampering.
const TYPES = {
  grant:  { to: true,               reason: true },
  escrow: { from: true, ref: true },
  settle: { to: true,   ref: true,  pr: true },
  refund: { to: true,   ref: true,  reason: true },
  split:  { to: true,   ref: true,  reason: true, by: true },
  adjust: { to: true,               reason: true, by: true },
}

const HANDLE = /^[A-Za-z\d](?:[A-Za-z\d]|-(?=[A-Za-z\d])){0,38}$/
const REF = /^#\d+$/

const errors = []
const warnings = []

const NOW = Date.now()
/** Clock skew between a contributor's machine and GitHub's is normal; hours of it is not. */
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000

function fail(seq, msg) {
  errors.push(`  line ${seq}: ${msg}`)
}

function readLedger() {
  let raw
  try {
    raw = readFileSync(LEDGER, 'utf8')
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
  return raw
    .split('\n')
    .map((line, i) => ({ line: line.trim(), lineNo: i + 1 }))
    .filter(({ line }) => line && !line.startsWith('//'))
    .map(({ line, lineNo }) => {
      try {
        return JSON.parse(line)
      } catch {
        errors.push(`  line ${lineNo}: not valid JSON`)
        return null
      }
    })
    .filter(Boolean)
}

function checkShape(e, expectedSeq, prevTs) {
  const where = e.seq ?? `(no seq, expected ${expectedSeq})`

  if (e.seq !== expectedSeq) {
    fail(where, `seq must be ${expectedSeq}, got ${JSON.stringify(e.seq)} — gaps and reordering are not allowed`)
  }

  const spec = TYPES[e.type]
  if (!spec) {
    // Naming the likely culprit explicitly, because this is the invariant that matters most.
    const hint = e.type === 'transfer'
      ? ' — user-to-user transfers do not exist in this ledger (COMPLIANCE.md red line 5)'
      : ''
    fail(where, `unknown transaction type ${JSON.stringify(e.type)}${hint}`)
    return null
  }

  if (!Number.isInteger(e.amount) || e.amount <= 0) {
    fail(where, `amount must be a positive integer, got ${JSON.stringify(e.amount)}`)
  }

  const ts = Date.parse(e.ts ?? '')
  if (Number.isNaN(ts)) {
    fail(where, `ts is not a valid timestamp: ${JSON.stringify(e.ts)}`)
  } else if (prevTs !== null && ts < prevTs) {
    fail(where, `ts goes backwards (${e.ts})`)
  } else if (ts > NOW + FUTURE_TOLERANCE_MS) {
    // Entries 1-8 were originally written with invented times, the last of them several
    // hours in the future. Nothing noticed until a real timestamp came in behind it and
    // tripped the monotonicity check, by which point settlement was deadlocked. A ts must
    // be an observed event time — issue createdAt, PR mergedAt — never a value typed to
    // look plausible. A future date is the one shape that proves it was not observed.
    fail(where, `ts is in the future (${e.ts}) — use the real event time, not an invented one`)
  }

  for (const field of Object.keys(spec)) {
    if (e[field] === undefined || e[field] === '') {
      fail(where, `${e.type} requires "${field}"`)
    }
  }

  for (const field of ['from', 'to', 'by']) {
    if (e[field] !== undefined && !HANDLE.test(e[field])) {
      fail(where, `"${field}" is not a valid GitHub handle: ${JSON.stringify(e[field])}`)
    }
  }

  if (e.ref !== undefined && !REF.test(e.ref)) {
    fail(where, `"ref" must look like "#123", got ${JSON.stringify(e.ref)}`)
  }

  if (e.pr !== undefined && !parsePullRequestUrl(e.pr)) {
    fail(where, `"pr" must be a canonical GitHub pull request URL, got ${JSON.stringify(e.pr)}`)
  }

  return Number.isNaN(ts) ? prevTs : ts
}

function replay(entries) {
  const balances = new Map()
  const escrow = new Map()        // ref -> TP currently held
  const escrowOwner = new Map()   // ref -> requester who funded it
  const escrowTaken = new Map()   // ref -> total ever escrowed
  const escrowFreed = new Map()   // ref -> total ever released
  let issued = 0                  // grant + adjust, i.e. TP created from nothing

  const bal = (u) => balances.get(u) ?? 0
  const add = (u, n) => balances.set(u, bal(u) + n)

  let prevTs = null
  entries.forEach((e, i) => {
    prevTs = checkShape(e, i + 1, prevTs)
    if (!TYPES[e.type] || !Number.isInteger(e.amount) || e.amount <= 0) return

    const where = e.seq ?? i + 1

    switch (e.type) {
      case 'grant':
      case 'adjust':
        add(e.to, e.amount)
        issued += e.amount
        break

      case 'escrow': {
        // Invariant 5, checked incrementally: no balance may dip negative mid-history.
        if (bal(e.from) < e.amount) {
          fail(where, `${e.from} escrowed ${e.amount} TP with only ${bal(e.from)} available`)
        }
        const owner = escrowOwner.get(e.ref)
        if (owner && owner !== e.from) {
          fail(where, `${e.ref} escrow is already owned by ${owner}, not ${e.from}`)
          break
        }
        add(e.from, -e.amount)
        escrowOwner.set(e.ref, e.from)
        escrow.set(e.ref, (escrow.get(e.ref) ?? 0) + e.amount)
        escrowTaken.set(e.ref, (escrowTaken.get(e.ref) ?? 0) + e.amount)
        break
      }

      case 'settle':
      case 'refund':
      case 'split': {
        const held = escrow.get(e.ref) ?? 0
        if (!escrowTaken.has(e.ref)) {
          fail(where, `${e.type} for ${e.ref} but nothing was ever escrowed against it`)
          break
        }
        const owner = escrowOwner.get(e.ref)
        if (e.type === 'refund' && e.to !== owner) {
          fail(where, `${e.type} for ${e.ref} must return to escrow owner ${owner}, not ${e.to}`)
          break
        }
        // Invariant 6 and 8: an issue cannot pay out more than it took in.
        if (held < e.amount) {
          fail(where, `${e.type} of ${e.amount} TP for ${e.ref} but only ${held} TP is held in escrow`)
          break
        }
        escrow.set(e.ref, held - e.amount)
        escrowFreed.set(e.ref, (escrowFreed.get(e.ref) ?? 0) + e.amount)
        add(e.to, e.amount)
        break
      }
    }
  })

  for (const [user, amount] of balances) {
    if (amount < 0) fail('final', `${user} ends with a negative balance of ${amount} TP`)
  }

  const open = [...escrow].filter(([, n]) => n > 0)
  const heldTotal = open.reduce((sum, [, n]) => sum + n, 0)
  const balanceTotal = [...balances.values()].reduce((a, b) => a + b, 0)

  // Invariant 9: nothing appears or vanishes. Everything is either in a balance or in escrow.
  if (balanceTotal + heldTotal !== issued) {
    fail('final', `TP conservation broken: ${balanceTotal} in balances + ${heldTotal} in escrow != ${issued} issued`)
  }

  if (open.length) {
    warnings.push(`${open.length} issue(s) with TP still in escrow: ${open.map(([r, n]) => `${r} (${n} TP)`).join(', ')}`)
  }

  return { balances, open, issued, heldTotal, balanceTotal }
}

// ---

const args = process.argv.slice(2)
const entries = readLedger()
const result = replay(entries)

const snapshot = {
  generated_from: 'ledger.jsonl',
  entries: entries.length,
  total_issued: result.issued,
  in_escrow: result.heldTotal,
  balances: Object.fromEntries([...result.balances].sort(([a], [b]) => a.localeCompare(b))),
  open_escrow: Object.fromEntries(result.open),
}

if (args.includes('--json')) {
  console.log(JSON.stringify({ ok: errors.length === 0, errors, warnings, ...snapshot }, null, 2))
} else {
  console.log(`ledger.jsonl — ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`)

  if (result.balances.size) {
    console.log('\nBalances:')
    for (const [user, amount] of [...result.balances].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${user.padEnd(24)} ${String(amount).padStart(5)} TP`)
    }
    console.log(`  ${'—'.repeat(24)} ${'—'.repeat(5)}`)
    console.log(`  ${'in balances'.padEnd(24)} ${String(result.balanceTotal).padStart(5)} TP`)
    console.log(`  ${'in escrow'.padEnd(24)} ${String(result.heldTotal).padStart(5)} TP`)
    console.log(`  ${'total issued'.padEnd(24)} ${String(result.issued).padStart(5)} TP`)
  } else {
    console.log('\nNo entries yet. Nothing to balance.')
  }

  for (const w of warnings) console.log(`\nnote: ${w}`)

  if (errors.length) {
    console.error(`\n${errors.length} problem(s):`)
    for (const e of errors) console.error(e)
    console.error('\nDo not trust balances.json until these are resolved.')
  } else {
    console.log('\nAll invariants hold.')
  }
}

if (args.includes('--write')) {
  if (errors.length) {
    console.error('\nRefusing to write balances.json while invariants are broken.')
    process.exit(1)
  }
  writeFileSync(BALANCES, JSON.stringify(snapshot, null, 2) + '\n')
  console.log(`\nWrote ${BALANCES}`)
}

process.exit(errors.length ? 1 : 0)
