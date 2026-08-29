#!/usr/bin/env node
// Render computed ledger statistics into docs/index.html between marker comments.
// No dependencies. Reuses ledger/verify.mjs logic by executing it or importing invariants.
// Supports:
//   npm run stats          -> update docs/index.html in-place
//   npm run stats -- --check -> exit non-zero if docs/index.html is stale or differs

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const HTML_PATH = join(ROOT, 'docs', 'index.html')
const VERIFY_PATH = join(ROOT, 'ledger', 'verify.mjs')
const LEDGER_PATH = join(ROOT, 'ledger', 'ledger.jsonl')

const args = process.argv.slice(2)
const isCheck = args.includes('--check')

// Recompute stats using ledger/verify.mjs --json
let verifyOutput
try {
  const stdout = execFileSync(process.execPath, [VERIFY_PATH, LEDGER_PATH, '--json'], {
    encoding: 'utf8',
  })
  verifyOutput = JSON.parse(stdout)
} catch (err) {
  console.error('Failed to run ledger verification:')
  if (err.stdout) console.error(err.stdout)
  if (err.stderr) console.error(err.stderr)
  process.exit(1)
}

if (!verifyOutput.ok || (verifyOutput.errors && verifyOutput.errors.length > 0)) {
  console.error('Refusing to render stats because ledger invariants are broken:')
  for (const e of verifyOutput.errors || []) console.error(e)
  process.exit(1)
}

// Compute metrics from verifyOutput and raw ledger entries
let rawLedger
try {
  rawLedger = readFileSync(LEDGER_PATH, 'utf8')
} catch (err) {
  console.error(`Could not read ${LEDGER_PATH}:`, err.message)
  process.exit(1)
}

const lines = rawLedger
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('//'))
  .map((l) => JSON.parse(l))

const entryCount = lines.length
const totalIssued = verifyOutput.total_issued
const inEscrow = verifyOutput.in_escrow
const balances = verifyOutput.balances || {}

// Settled tasks count: count of settle entries
const settledEntries = lines.filter((e) => e.type === 'settle')
const settledTaskCount = settledEntries.length

// Also count open tasks in escrow
const openEscrowKeys = Object.keys(verifyOutput.open_escrow || {})
const openTaskCount = openEscrowKeys.length

// Read existing HTML
let originalHtml
try {
  originalHtml = readFileSync(HTML_PATH, 'utf8')
} catch (err) {
  console.error(`Could not read ${HTML_PATH}:`, err.message)
  process.exit(1)
}

// Helper to replace content between marker comments
function replaceMarker(html, markerName, newContent) {
  const startMarker = `<!-- stats:${markerName} -->`
  const endMarker = `<!-- /stats:${markerName} -->`
  const startIndex = html.indexOf(startMarker)
  const endIndex = html.indexOf(endMarker)

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Marker comments not found: ${startMarker} ... ${endMarker}`)
  }

  return (
    html.slice(0, startIndex + startMarker.length) +
    '\n' +
    newContent.trim() +
    '\n' +
    html.slice(endIndex)
  )
}

// Format CLI block
function renderTerminalBlock() {
  const sortedBalances = Object.entries(balances).sort((a, b) => b[1] - a[1])
  const balanceLines = sortedBalances.map(
    ([user, amount]) => `  ${user.padEnd(24)} ${String(amount).padStart(5)} TP`
  )
  const balanceTotal = Object.values(balances).reduce((a, b) => a + b, 0)

  return `<pre><span class="c">$ git clone https://github.com/mxx1111/spare-cycles &amp;&amp; cd spare-cycles</span>
$ node ledger/verify.mjs

ledger.jsonl — ${entryCount} entr${entryCount === 1 ? 'y' : 'ies'}

Balances:
${balanceLines.join('\n')}
  ${'—'.repeat(24)} ${'—'.repeat(5)}
  ${'in balances'.padEnd(24)} ${String(balanceTotal).padStart(5)} TP
  ${'in escrow'.padEnd(24)} ${String(inEscrow).padStart(5)} TP
  ${'total issued'.padEnd(24)} ${String(totalIssued).padStart(5)} TP

<span class="g">All invariants hold.</span></pre>`
}

// Format Stat Row: settled count
function renderSettledStat() {
  return `<span class="n">${settledTaskCount}</span><div class="k"><span data-zh>任务已结算</span><span data-en>tasks settled</span></div>`
}

// Format Summary text in highlights (03 账本谁都能从零重算)
function renderRecomputeSummary() {
  return `<span data-zh>${entryCount} 条记录、11 条不变量、一条命令。余额不是维护者说了算，是从完整历史重放出来的。快照和重算对不上，以重算为准。</span>
<span data-en>${entryCount} entries, 11 invariants, one command. Balances are not asserted by the maintainer, they are replayed from the full history. If the snapshot disagrees with the replay, the replay wins.</span>`
}

// Format Leaderboard balances table
function renderLeaderboardBalances() {
  const sorted = Object.entries(balances).sort((a, b) => {
    // If ghzhost, manav8498, mxx1111 keep order or sort by amount desc
    return b[1] - a[1]
  })

  // We map known accounts or render dynamic rows
  const rows = sorted.map(([user, amount], idx) => {
    const isFirst = idx === 0
    const posClass = isFirst ? 'pos first' : 'pos'
    if (user === 'ghzhost') {
      return `      <tr>
        <td><span class="${posClass}">${idx + 1}</span></td>
        <td><a href="https://github.com/ghzhost">@ghzhost</a></td>
        <td>#5 · #4 · #3 · #7</td>
        <td>${amount}</td>
        <td><span data-zh><span class="tag delivered">交付 ×4</span>另有一次白干（#2，任务撤销后才交付）</span><span data-en><span class="tag delivered">delivered ×4</span>plus one wasted run (#2, after withdrawal)</span></td>
      </tr>`
    }
    if (user === 'manav8498') {
      return `      <tr>
        <td><span class="${posClass}">${idx + 1}</span></td>
        <td><a href="https://github.com/manav8498">@manav8498</a></td>
        <td>#1</td>
        <td>${amount}</td>
        <td><span data-zh><span class="tag delivered">交付 ×1</span></span><span data-en><span class="tag delivered">delivered ×1</span></span></td>
      </tr>`
    }
    if (user === 'mxx1111') {
      return `      <tr>
        <td><span class="${posClass}">${idx + 1}</span></td>
        <td><a href="https://github.com/mxx1111">@mxx1111</a></td>
        <td><span data-zh>发布者 · 5 单</span><span data-en>poster · 5 tasks</span></td>
        <td>${amount}</td>
        <td><span data-zh><span class="tag words">发单者</span>50 TP 托管支出，全部结算给接单方</span><span data-en><span class="tag words">poster</span>50 TP of escrow spent, all settled to workers</span></td>
      </tr>`
    }
    return `      <tr>
        <td><span class="${posClass}">${idx + 1}</span></td>
        <td><a href="https://github.com/${user}">@${user}</a></td>
        <td>—</td>
        <td>${amount}</td>
        <td><span data-zh><span class="tag delivered">参与者</span></span><span data-en><span class="tag delivered">participant</span></span></td>
      </tr>`
  })

  return `<div class="tw">
    <table class="num">
      <tr><th><span data-zh>#</span><span data-en>#</span></th><th><span data-zh>账号</span><span data-en>Account</span></th><th><span data-zh>任务</span><span data-en>Tasks</span></th><th>TP</th><th><span data-zh>状态</span><span data-en>Standing</span></th></tr>
${rows.join('\n')}
    </table>
    </div>`
}

// Format Totals note under leaderboard
function renderTotalsNote() {
  const settledTotal = settledEntries.reduce((sum, e) => sum + e.amount, 0)
  return `<p class="note">
      <span data-zh>合计：发放 ${totalIssued} TP，结算 ${settledTotal} TP，托管中 ${inEscrow}（${openTaskCount} 个开放任务）。账本 ${entryCount} 条记录，11 条不变量全过。发放额从 50 涨到 100，是维护者为给板子供资发放的一笔——<a href="https://github.com/mxx1111/spare-cycles/issues/12">规则改动</a>与<a href="https://github.com/mxx1111/spare-cycles/blob/main/GOVERNANCE-LOG.md">全过程</a>都公开记录，那笔钱当天全部进了托管，维护者余额仍是 0。</span>
      <span data-en>Total: ${totalIssued} TP issued, ${settledTotal} TP settled, ${inEscrow} in escrow across ${openTaskCount} open tasks. ${entryCount} ledger entries, all eleven invariants holding. Issuance rose from 50 to 100 because the maintainer funded the board — the <a href="https://github.com/mxx1111/spare-cycles/issues/12">rule change</a> and <a href="https://github.com/mxx1111/spare-cycles/blob/main/GOVERNANCE-LOG.md">the whole of it</a> are on the record, all of it reached escrow the same day, and the maintainer balance is still zero.</span>
    </p>`
}

// If markers do not exist in HTML yet, insert them around target sections
let updatedHtml = originalHtml

if (!updatedHtml.includes('<!-- stats:summary -->')) {
  // Insert marker around the 4 things section (03 账本谁都能从零重算)
  const needle = '<b><span data-zh>账本谁都能从零重算</span><span data-en>Anyone can recompute the ledger</span></b>\n      <p>'
  const targetIdx = updatedHtml.indexOf(needle)
  if (targetIdx !== -1) {
    const pStart = targetIdx + needle.length
    const pEnd = updatedHtml.indexOf('</p>', pStart)
    if (pEnd !== -1) {
      updatedHtml =
        updatedHtml.slice(0, pStart) +
        '\n        <!-- stats:summary -->\n' +
        updatedHtml.slice(pStart, pEnd).trim() +
        '\n        <!-- /stats:summary -->\n      ' +
        updatedHtml.slice(pEnd)
    }
  }
}

if (!updatedHtml.includes('<!-- stats:terminal -->')) {
  const needle = '<pre><span class="c">$ git clone https://github.com/mxx1111/spare-cycles &amp;&amp; cd spare-cycles</span>'
  const preStart = updatedHtml.indexOf(needle)
  if (preStart !== -1) {
    const preEnd = updatedHtml.indexOf('</pre>', preStart) + 6
    updatedHtml =
      updatedHtml.slice(0, preStart) +
      '<!-- stats:terminal -->\n' +
      updatedHtml.slice(preStart, preEnd) +
      '\n<!-- /stats:terminal -->' +
      updatedHtml.slice(preEnd)
  }
}

if (!updatedHtml.includes('<!-- stats:settled -->')) {
  const needle = '<div class="stat"><span class="n">5 / 5</span>'
  const statStart = updatedHtml.indexOf(needle)
  if (statStart !== -1) {
    const innerStart = statStart + '<div class="stat">'.length
    const statEnd = updatedHtml.indexOf('</div>', innerStart)
    updatedHtml =
      updatedHtml.slice(0, innerStart) +
      '<!-- stats:settled -->' +
      updatedHtml.slice(innerStart, statEnd) +
      '<!-- /stats:settled -->' +
      updatedHtml.slice(statEnd)
  }
}

if (!updatedHtml.includes('<!-- stats:balances -->')) {
  const needle = '<div class="lb">\n    <div class="tw">\n    <table class="num">\n      <tr><th><span data-zh>#'
  const lbStart = updatedHtml.indexOf(needle)
  if (lbStart !== -1) {
    const tableDivStart = lbStart + '<div class="lb">\n    '.length
    const tableDivEnd = updatedHtml.indexOf('</div>\n    <div class="tw">\n    <table class="num">\n      <tr><th><span data-zh>账号</span>', tableDivStart) + 6
    updatedHtml =
      updatedHtml.slice(0, tableDivStart) +
      '<!-- stats:balances -->\n' +
      updatedHtml.slice(tableDivStart, tableDivEnd) +
      '\n    <!-- /stats:balances -->' +
      updatedHtml.slice(tableDivEnd)
  }
}

if (!updatedHtml.includes('<!-- stats:totals -->')) {
  const needle = '<p class="note">\n      <span data-zh>合计：发放'
  const noteStart = updatedHtml.indexOf(needle)
  if (noteStart !== -1) {
    const noteEnd = updatedHtml.indexOf('</p>', noteStart) + 4
    updatedHtml =
      updatedHtml.slice(0, noteStart) +
      '<!-- stats:totals -->\n    ' +
      updatedHtml.slice(noteStart, noteEnd) +
      '\n    <!-- /stats:totals -->' +
      updatedHtml.slice(noteEnd)
  }
}

// Now replace marked blocks with freshly computed values
updatedHtml = replaceMarker(updatedHtml, 'summary', renderRecomputeSummary())
updatedHtml = replaceMarker(updatedHtml, 'terminal', renderTerminalBlock())
updatedHtml = replaceMarker(updatedHtml, 'settled', renderSettledStat())
updatedHtml = replaceMarker(updatedHtml, 'balances', renderLeaderboardBalances())
updatedHtml = replaceMarker(updatedHtml, 'totals', renderTotalsNote())

if (isCheck) {
  if (updatedHtml !== originalHtml) {
    console.error('::error file=docs/index.html::docs/index.html is stale compared to ledger/ledger.jsonl')
    console.error("Run 'npm run stats' to update docs/index.html with current ledger stats.")
    process.exit(1)
  }
  console.log('docs/index.html matches computed ledger stats.')
  process.exit(0)
}

// Write in place
writeFileSync(HTML_PATH, updatedHtml)
console.log(`Rendered ledger stats into ${HTML_PATH}`)
