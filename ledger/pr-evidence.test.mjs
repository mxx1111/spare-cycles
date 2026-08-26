import { test } from 'node:test'
import assert from 'node:assert/strict'

import { parsePullRequestUrl, verifyPullRequestEvidence } from './pr-evidence.mjs'

const entry = {
  seq: 1,
  ts: '2026-08-18T10:20:46Z',
  type: 'settle',
  to: 'worker',
  amount: 10,
  ref: '#7',
  pr: 'https://github.com/requester/project/pull/12',
}

function response(body, status = 200) {
  return { ok: status === 200, status, json: async () => body }
}

test('only canonical GitHub pull request URLs are accepted', () => {
  assert.deepEqual(parsePullRequestUrl(entry.pr), { owner: 'requester', repo: 'project', number: 12 })
  assert.equal(parsePullRequestUrl('not-a-url'), null)
  assert.equal(parsePullRequestUrl('https://example.com/requester/project/pull/12'), null)
})

test('merged settlement evidence must match its task and precede settlement', async () => {
  const fetchImpl = async () => response({
    merged_at: '2026-08-18T10:19:46Z',
    closed_at: '2026-08-18T10:19:46Z',
    body: 'Task: https://github.com/mxx1111/spare-cycles/issues/7',
  })
  assert.deepEqual(await verifyPullRequestEvidence([entry], { fetchImpl }), [])
})

test('closed unmerged evidence remains valid when its close event was accepted', async () => {
  const localEntry = { ...entry, pr: 'https://github.com/mxx1111/spare-cycles/pull/12' }
  const fetchImpl = async () => response({ merged_at: null, closed_at: entry.ts, body: 'Closes #7' })
  assert.deepEqual(await verifyPullRequestEvidence([localEntry], { fetchImpl }), [])
})

test('open, unrelated, stale, and missing pull request evidence is rejected', async () => {
  const cases = [
    [{ merged_at: null, closed_at: null, body: 'Task: mxx1111/spare-cycles#7' }, 'still open'],
    [{ merged_at: entry.ts, closed_at: entry.ts, body: 'Unrelated work' }, 'does not reference'],
    [{ merged_at: '2026-08-18T10:21:46Z', closed_at: entry.ts, body: 'Task: mxx1111/spare-cycles#7' }, 'timestamp'],
    [{ merged_at: 'not-a-timestamp', closed_at: entry.ts, body: 'Task: mxx1111/spare-cycles#7' }, 'timestamp'],
  ]

  for (const [body, expected] of cases) {
    const errors = await verifyPullRequestEvidence([entry], { fetchImpl: async () => response(body) })
    assert.ok(errors.some((error) => error.includes(expected)), errors.join('\n'))
  }

  const invalidEntryTime = await verifyPullRequestEvidence([{ ...entry, ts: 'not-a-timestamp' }], {
    fetchImpl: async () => response({ merged_at: entry.ts, closed_at: entry.ts, body: 'Closes #7' }),
  })
  assert.ok(invalidEntryTime.some((error) => error.includes('timestamp')), invalidEntryTime.join('\n'))

  const missing = await verifyPullRequestEvidence([entry], { fetchImpl: async () => response({}, 404) })
  assert.ok(missing.some((error) => error.includes('HTTP 404')), missing.join('\n'))
})
