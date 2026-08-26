#!/usr/bin/env node

// The claim rules in GOVERNANCE.md and the amendment in #16, enforced.
//
// Every timer here existed as prose before this file did, and prose does not run while the
// maintainer is asleep. On 2026-08-18 three people implemented one task because nothing on an
// open issue said it was taken; on 2026-08-19 the rule that was meant to fix that awarded two
// tasks to an account with no deliveries, because it required a human to assign them. Both are
// in GOVERNANCE-LOG.md. This file is the answer to both.
//
// Two entry points: `oncomment` handles a single `/claim`, `sweep` walks open tasks on a
// schedule. Both are driven by the pure functions above them, which take a clock rather than
// reading one.

const API = 'https://api.github.com'
const CLAIM_RE = /^\s*\/(claim|attempt)\b/im

// #16: flat per tier. 2x the tier estimate gave an S task a one-hour window, which punishes
// not sharing the maintainer's timezone rather than punishing idleness.
const CLAIM_WINDOW_HOURS = { S: 24, M: 48, L: 72 }

// A delivery PR with no commit and no author reply for this long releases the claim. The PR
// stays open — it is the author's work — but it stops holding the escrow hostage.
const STALE_DELIVERY_DAYS = 7

// GOVERNANCE.md: the maintainer has 30 minutes to object before a claim stands on its own.
const SELF_ASSIGN_AFTER_MINUTES = 30

// Red line 4. Claiming every open task in one burst is the signature of a script, not of
// enthusiasm. GOVERNANCE.md also caps concurrent claims at 2.
const BURST_WINDOW_MINUTES = 10
const BURST_CLAIM_COUNT = 3
const MAX_CONCURRENT_CLAIMS = 2

const MARKER = '<!-- claim-bot -->'

export function parseClaim(body) {
  return CLAIM_RE.test(body ?? '') ? 'claim' : null
}

export function tierFromLabels(labels) {
  for (const tier of ['L', 'M', 'S']) if (labels.includes(tier)) return tier
  return 'S'
}

export function claimDeadline(claimedAt, tier) {
  return new Date(new Date(claimedAt).getTime() + CLAIM_WINDOW_HOURS[tier] * 3600_000)
}

/**
 * #16: measure silence, not elapsed time. Someone who says "halfway through, pnpm is fighting
 * me" and someone who has vanished are in different situations and a wall clock cannot tell
 * them apart. Any substantive comment or draft PR from the claimant resets the clock.
 *
 * @returns {'ok'|'warn'|'expire'}
 */
export function claimState({ claimedAt, lastActivityAt, tier, now, warned }) {
  const since = new Date(lastActivityAt ?? claimedAt).getTime()
  const window = CLAIM_WINDOW_HOURS[tier] * 3600_000
  const elapsed = now.getTime() - since
  if (elapsed >= window) return 'expire'
  // Losing a claim should never be the first you hear about it.
  if (elapsed >= window * 0.75 && !warned) return 'warn'
  return 'ok'
}

export function deliveryIsStale({ lastCommitAt, lastAuthorReplyAt, now }) {
  const last = Math.max(
    lastCommitAt ? new Date(lastCommitAt).getTime() : 0,
    lastAuthorReplyAt ? new Date(lastAuthorReplyAt).getTime() : 0,
  )
  if (!last) return false
  return now.getTime() - last >= STALE_DELIVERY_DAYS * 86400_000
}

/**
 * Red line 4. Deliberately does not fire on a single fast claim — the distinction between a
 * script and an enthusiastic person moving fast is a judgement call, and this only flags for a
 * human. It never sanctions on its own.
 */
export function looksAutomated(claimTimes, now) {
  const recent = claimTimes.filter((t) => now.getTime() - new Date(t).getTime() <= BURST_WINDOW_MINUTES * 60_000)
  return recent.length >= BURST_CLAIM_COUNT
}

// --- GitHub plumbing ---------------------------------------------------------------------

const repo = process.env.GITHUB_REPOSITORY ?? 'mxx1111/spare-cycles'
const token = process.env.GITHUB_TOKEN

async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} → ${res.status} ${await res.text()}`)
  return res.status === 204 ? null : res.json()
}

const comment = (n, body) => api(`/repos/${repo}/issues/${n}/comments`, { method: 'POST', body: JSON.stringify({ body: `${MARKER}\n${body}` }) })
const addLabel = (n, ...labels) => api(`/repos/${repo}/issues/${n}/labels`, { method: 'POST', body: JSON.stringify({ labels }) })
const removeLabel = (n, label) => api(`/repos/${repo}/issues/${n}/labels/${encodeURIComponent(label)}`, { method: 'DELETE' }).catch(() => null)
const assign = (n, ...assignees) => api(`/repos/${repo}/issues/${n}/assignees`, { method: 'POST', body: JSON.stringify({ assignees }) })
const unassign = (n, ...assignees) => api(`/repos/${repo}/issues/${n}/assignees`, { method: 'DELETE', body: JSON.stringify({ assignees }) })

const openTasks = () => api(`/repos/${repo}/issues?state=open&labels=bounty&per_page=100`)
const issueComments = (n) => api(`/repos/${repo}/issues/${n}/comments?per_page=100`)

/** Claims are read back off the timeline rather than kept in a file — the timeline is the record. */
async function claimEvents(n) {
  const events = await api(`/repos/${repo}/issues/${n}/timeline?per_page=100`, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  return events.filter((e) => e.event === 'assigned').map((e) => ({ who: e.assignee?.login, at: e.created_at }))
}

// --- Entry points ------------------------------------------------------------------------

async function onComment() {
  const event = JSON.parse(process.env.EVENT_PAYLOAD ?? '{}')
  const issue = event.issue
  const body = event.comment?.body
  const who = event.comment?.user?.login
  if (!issue || !who || !parseClaim(body)) return

  const labels = (issue.labels ?? []).map((l) => l.name ?? l)
  if (!labels.includes('bounty')) return

  const now = new Date()
  const tier = tierFromLabels(labels)

  // Already assigned to someone else? Say so plainly rather than letting a second person
  // spend an evening on work that is already taken — the exact failure of 2026-08-18.
  const holder = (issue.assignees ?? [])[0]?.login
  if (holder && holder !== who) {
    await comment(
      issue.number,
      `@${who} 这个任务已经指派给 @${holder}，认领窗口到 ${claimDeadline(issue.updated_at, tier).toISOString()}。\n\n` +
        `不要现在动手。窗口到期或 @${holder} 主动释放后，这里会自动放开，届时你会看到一条通知。\n\n` +
        `This task is already assigned to @${holder}. Do not start work — the board will release it here if the claim expires.`,
    )
    return
  }
  if (holder === who) return

  // GOVERNANCE.md: two concurrent claims per person.
  const tasks = await openTasks()
  const held = tasks.filter((t) => (t.assignees ?? []).some((a) => a.login === who))
  if (held.length >= MAX_CONCURRENT_CLAIMS) {
    await comment(
      issue.number,
      `@${who} 你已经同时持有 ${held.length} 个认领（${held.map((t) => `#${t.number}`).join('、')}），` +
        `上限是 ${MAX_CONCURRENT_CLAIMS} 个。先交付或释放一个再来接这个。\n\n` +
        `Concurrent claim limit reached. Deliver or release one first.`,
    )
    return
  }

  // Red line 4, flagged for a human, never sanctioned automatically.
  const mine = []
  for (const t of tasks) {
    for (const c of await issueComments(t.number)) {
      if (c.user?.login === who && parseClaim(c.body)) mine.push(c.created_at)
    }
  }
  if (looksAutomated(mine, now)) {
    await addLabel(issue.number, 'needs-review')
    await comment(
      issue.number,
      `**认领节奏已标记待人工复核，没有拦截任何事。**\n\n@${who} 在 ${BURST_WINDOW_MINUTES} 分钟内认领了 ${mine.length} 个任务，` +
        `这符合 COMPLIANCE.md 红线 4 关注的模式（无人值守的自动认领）。维护者会看一眼。如果你确实是本人在快速浏览板子，` +
        `在这里说一句你打算怎么做就行——一句话就够，这个标签会被移除。\n\n` +
        `Flagged for review under red line 4. Nothing is blocked. Reply with what you are planning and the label comes off.`,
    )
  }

  await assign(issue.number, who)
  await addLabel(issue.number, 'claimed')
  const deadline = claimDeadline(now.toISOString(), tier)
  await comment(
    issue.number,
    `已认领：@${who}，tier ${tier}，窗口 ${CLAIM_WINDOW_HOURS[tier]} 小时，到 **${deadline.toISOString()}**。\n\n` +
      `这条认领不需要维护者批准就已生效——规则要求维护者醒着的那个版本在 2026-08-19 已经作废，理由见 ` +
      `[#16](https://github.com/${repo}/issues/16)。\n\n` +
      `计时器测的是沉默不是耗时：**你在这里说一句话，或者开一个 draft PR，计时就重置。**` +
      `卡住了、要多花两天、想放弃，都直接说，说了就不会被回收。剩 25% 时这里会先提醒一次，不会静默收走。\n\n` +
      `Claimed by @${who}. The clock measures silence, not elapsed time — any substantive comment or a draft PR resets it.`,
  )
}

async function sweep() {
  const now = new Date()
  const tasks = await openTasks()

  for (const task of tasks) {
    const labels = (task.labels ?? []).map((l) => l.name ?? l)
    const holder = (task.assignees ?? [])[0]?.login
    if (!holder) {
      if (labels.includes('claimed')) await removeLabel(task.number, 'claimed')
      continue
    }

    const tier = tierFromLabels(labels)
    const events = await claimEvents(task.number)
    const claimedAt = events.filter((e) => e.who === holder).at(-1)?.at ?? task.updated_at

    const comments = await issueComments(task.number)
    const warned = comments.some((c) => c.body?.includes(MARKER) && c.body.includes('剩余不到 25%'))
    // A bot comment is not activity. Only the claimant speaking counts.
    const lastActivityAt = comments
      .filter((c) => c.user?.login === holder && !c.body?.includes(MARKER))
      .map((c) => c.created_at)
      .sort()
      .at(-1)

    const state = claimState({ claimedAt, lastActivityAt, tier, now, warned })
    const deadline = claimDeadline(lastActivityAt ?? claimedAt, tier)

    if (state === 'warn') {
      await comment(
        task.number,
        `@${holder} 这个认领的窗口**剩余不到 25%**，到 ${deadline.toISOString()} 释放。\n\n` +
          `还在做就在这里说一句，计时立刻重置，说什么都行。不想做了也直接说，释放掉对谁都好。\n\n` +
          `Less than 25% of the claim window remains. One comment resets the clock.`,
      )
      continue
    }

    if (state === 'expire') {
      await unassign(task.number, holder)
      await removeLabel(task.number, 'claimed')
      await comment(
        task.number,
        `认领已释放：@${holder} 自 ${new Date(lastActivityAt ?? claimedAt).toISOString()} 起 ${CLAIM_WINDOW_HOURS[tier]} 小时无动静，` +
          `此前已提醒过一次。任务重新开放，谁都可以 \`/claim\`。\n\n` +
          `@${holder} 这不是处分，你的记录上什么都不会留下。想继续做，重新认领就行。\n\n` +
          `Claim released after ${CLAIM_WINDOW_HOURS[tier]}h of silence. No sanction, nothing recorded. Reclaim freely.`,
      )
    }
  }
}

// #16's fourth timer: delivery stops the claim clock, the review clock is the requester's
// problem, and a half-finished PR pins the escrow with nothing watching it.
async function sweepDeliveries() {
  const now = new Date()
  const prs = await api(`/repos/${repo}/pulls?state=open&per_page=100`)
  for (const pr of prs) {
    const commits = await api(`/repos/${repo}/pulls/${pr.number}/commits?per_page=100`)
    const lastCommitAt = commits.at(-1)?.commit?.committer?.date
    const comments = await issueComments(pr.number)
    const lastAuthorReplyAt = comments
      .filter((c) => c.user?.login === pr.user?.login)
      .map((c) => c.created_at)
      .sort()
      .at(-1)

    if (!deliveryIsStale({ lastCommitAt, lastAuthorReplyAt, now })) continue
    if (comments.some((c) => c.body?.includes(MARKER) && c.body.includes('stale-delivery'))) continue

    await comment(
      pr.number,
      `<!-- stale-delivery -->这个 PR 已经 ${STALE_DELIVERY_DAYS} 天没有新提交、作者也没有回复，` +
        `它关联任务上的托管因此一直被占着，既不结算也不释放。\n\n` +
        `**PR 不会被关闭**——这是你的工作，随时可以接着做。被释放的只是任务上的认领，任务重新开放给其他人。\n\n` +
        `如果你还在做，回一句就行。\n\n` +
        `No commits or author replies for ${STALE_DELIVERY_DAYS} days. The claim is released; this PR stays open.`,
    )
  }
}

const mode = process.argv[2]
if (mode === 'oncomment') await onComment()
else if (mode === 'sweep') { await sweep(); await sweepDeliveries() }
else if (mode) { console.error(`unknown mode: ${mode}`); process.exit(1) }
