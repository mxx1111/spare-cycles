import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { escapeCommandData, escapeCommandProperty, isAllowed, listTrackedFiles } from './scan-repo.mjs'

test('tracked filenames use NUL framing and preserve Unicode and newlines', () => {
  const root = mkdtempSync(join(tmpdir(), 'sc-scan-'))
  const filename = '秘密\nvalue.txt'
  try {
    execFileSync('git', ['init', '-q'], { cwd: root })
    writeFileSync(join(root, filename), 'safe')
    execFileSync('git', ['add', '--', filename], { cwd: root })
    assert.deepEqual(listTrackedFiles(root), [filename])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('allowlist entries suppress only one exact finding', () => {
  const finding = { ruleId: 'private-key', path: 'fixture.txt', line: 7 }
  assert.equal(isAllowed(finding, new Set(['private-key:fixture.txt:7'])), true)
  assert.equal(isAllowed(finding, new Set(['private-key:fixture.txt'])), false)
  assert.equal(isAllowed(finding, new Set(['private-key:*'])), false)
})

test('GitHub annotation fields cannot inject workflow commands', () => {
  assert.equal(escapeCommandProperty('bad\n::error file=x,y:z'), 'bad%0A%3A%3Aerror file=x%2Cy%3Az')
  assert.equal(escapeCommandData('message%\r\n::warning::x'), 'message%25%0D%0A::warning::x')
})
