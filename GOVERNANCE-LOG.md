# Governance log / 治理记录

Every sanction is recorded here with the red line it cites. GOVERNANCE.md promises no secret
enforcement, and this file is where that promise is kept. Entries are append-only.

每一次处分都记在这里，并注明违反的是哪条红线。GOVERNANCE.md 承诺不搞暗箱执行，这个文件就是
兑现那句承诺的地方。只追加。

---

## 2026-08-18 · Comments minimized on the first batch of tasks

**What happened.** The first five tasks were posted at 00:06 UTC. Within hours the board
attracted automated bounty-farming behaviour alongside the genuine deliveries.

| Account | Behaviour | Red line |
|---|---|---|
| `OpensrcLord` | Posted `/attempt` or `/claim` on four tasks between 00:08:19 and 00:08:43 — **four tasks in twenty-four seconds** — each with near-identical filler ("I'm reading the codebase", "will drop a PR shortly"). No pull request followed on any of them. | 4 (no headless auto-claiming), and the 2-concurrent limit |
| `chfr19820610-cell` | Pasted the same LLM-written pitch four or five times on each of five issues, fifteen comments in total, across a sixteen-minute window. | Spam. No red line names it directly; GOVERNANCE.md's sanction table covers it under repeated abuse. |

**Action taken.** Nineteen comments minimized — the `chfr19820610-cell` duplicates as SPAM,
the `OpensrcLord` claims as OFF_TOPIC. No accounts banned, no balances touched. Neither
account held TP; neither had been onboarded.

**Why minimizing rather than banning.** Both behaviours are covered by sanctions that assume
a member of the community — someone who onboarded, holds TP, and has something to lose.
Neither of these accounts did. There is nothing to zero out and nothing to suspend. What the
comments actually cost is the attention of people reading the board, so removing them from
view is the proportionate response. If either account returns and does the same thing, that
becomes repeat behaviour and the table in GOVERNANCE.md applies properly.

**Not sanctioned.** `Rithikmahadev12` quoted a price in US dollars on #5. That is a
misunderstanding of what this board is, not a violation — the task descriptions do not say
loudly enough that TP have no cash value. A reply explaining it is the right response, and
the landing page now says it in the first screen. `manav8498` opened a pull request against
Homelab without commenting on the issue first; under the claim rule added today that would
now be out of order, but the rule did not exist when they did it, so it does not count
against them.

**What this changed.** The claim rule in GOVERNANCE.md went from a description of intended
behaviour to an enforced precondition, because #7 had two people independently deliver the
same work and only one could be paid. That waste is the board's fault, not the workers'.

---

**2026-08-18 (later).** Issue #6, opened by `OpensrcLord` one minute after its four-claims-in-24-seconds
spree, was closed as not-planned. It was a PR-shaped body claiming to implement #5 — which was in fact
delivered by `ghzhost` and settled — with no pull request behind it. Found while verifying the
agent-watch API example in the README against the real board: the query returned an "open bounty"
that the ledger said was settled. The ledger was right.

---

**2026-08-18 — duplicate delivery, second occurrence.** `macakii327-prog` opened
[mxx1111/wechat-mp-writer-skill-mxx#3](https://github.com/mxx1111/wechat-mp-writer-skill-mxx/pull/3)
at 11:04, 210 lines solving task #3. The task was settled with `ghzhost` at 11:14 — ten minutes
later. The account never commented on the issue and never claimed it; it forked, worked, and
delivered.

No sanction, and no fault on their side. The claim rule had been posted to that issue at 10:30,
thirty-four minutes earlier, which is not a window anyone could reasonably be expected to catch.
The PR was closed as superseded with a full explanation of the timeline and an explicit statement
that no consolation TP exists — points go to the assignee, are not transferable, and the
maintainer balance is zero.

This is the same failure as task #7 on the same day. Two occurrences means the claim rule was
necessary but is not sufficient while it lives only in prose: nothing on an open issue mechanically
signals "taken". That is the strongest argument yet for the Phase 1 bot, and it now has a cost
attached — two contributors' evenings.

---

**2026-08-18 — maintainer issued 50 TP to fund the board, and amended the rule that forbade it.**

The board reached zero open tasks with the maintainer at 0 TP. Posting escrows points immediately,
and all four no-quota earning routes (`review`, `redact-audit`, `spec`, `arbitrate`) attach to a
task somebody else has already posted — of which there were none. Nobody but the maintainer had
ever posted a task, so the board could not restart itself.

GOVERNANCE.md previously read *"Maintainers cannot: create TP out of nothing … or grant themselves
TP."* That clause was amended rather than ignored. The rule-change procedure requires 7 days of
open discussion only for changes to **TP pricing or red lines**; issuance rules are neither, so a
`governance` issue was opened instead ([#12](https://github.com/mxx1111/spare-cycles/issues/12)).

The amendment is deliberately narrow: issuance is permitted only to fund tasks other people get
paid for, only while fewer than three accounts have ever posted a task, 50 TP at a time, never
while the maintainer holds an unescrowed balance, and every unit must reach escrow within 24 hours.
The distinction it rests on is that TP cannot be transferred or cashed out, so points passing
through the maintainer's balance into escrow buy the maintainer nothing.

What actually happened, in the ledger:

| seq | type | amount | detail |
|---|---|---|---|
| 14 | `adjust` | +50 | issued to `mxx1111`, `by` mxx1111, reason cites the clause |
| 15 | `escrow` | −30 | task [#9](https://github.com/mxx1111/spare-cycles/issues/9), sparepack scaffold emission (M) |
| 16 | `escrow` | −10 | task [#10](https://github.com/mxx1111/spare-cycles/issues/10), sparepack path remapping (S) |
| 17 | `escrow` | −10 | task [#11](https://github.com/mxx1111/spare-cycles/issues/11), generate landing-page stats from the ledger (S) |

Maintainer balance after: **0 TP**. Total issued rose from 50 to 100, which `npm run ledger`
reports on every run — the inflation is visible by construction rather than by disclosure.

This is the second maintainer privilege exercised on this board, after the one-time timestamp
correction earlier the same day. Both are written down here. A third should prompt someone to ask
whether the rules are being written around the maintainer.

---

**2026-08-18 — `OpensrcLord` suspended 30 days under red line 4.** Claims voided; suspension
runs to **2026-09-17**. No balance touched, because the account never had one.

Eight claims, zero deliveries, across every task this board has ever had open:

| When | What |
|---|---|
| 00:08:19–00:08:43 | `/claim` or `/attempt` on #1–#5 — all five, in 24 seconds |
| 00:09:44 | PR #6, filing an `mdlook` CI file into this repository, body claiming to close #5 |
| 15:11–15:14 | `/claim` or `/attempt` on #9, #10, #11 — all three, minutes after posting |

The first burst was written off as the board's failure: it predated the claim rule, and nothing
on an issue could say "taken". The rule was published at 10:30. The second burst came at 15:11
with the same signature — every open task, minutes after posting, identical filler about reading
the codebase, no pull request after. That repetition is what decided it.

Separately: the account was **86 days old** at first contact, against a documented onboarding
minimum of 90 days with public contribution history. That check exists in GOVERNANCE.md and is
not automated, so it never ran. It would have blocked this account before the first comment.
That is now the strongest concrete argument for the Phase 1 bot on record, and it cost eight
spurious claims across two rounds.

The sanction is 30 days rather than permanent because red line 4 distinguishes a script from an
enthusiastic person moving fast, and that distinction is a judgement call. The comment invites
the account to reply with what they actually had, and states that an honest account reverses this
with the reversal written into this log.

`chfr19820610-cell` posted three more identical pitches (one per new task), bringing that account
to **18** for the board's history. Minimized as spam, no sanction issued yet — the account has
never claimed anything, so red line 4 does not attach. It is noise, not a claim-blocker.

---

**2026-08-18 — claim rule referred back for revision, one day after it was written.**
[#16](https://github.com/mxx1111/spare-cycles/issues/16), open for 7 days by choice.

Three tasks went up at 15:10. `OpensrcLord` claimed all three by 15:14; `ghzhost` delivered two
of them by 15:38. Nobody was assigned, because assignment is manual and the maintainer was
asleep. Read literally the rule awards the tasks to the account that has never delivered and
puts the person who delivered both in violation.

The rule has an unwritten dependency: it requires a maintainer to be awake. The proposal keeps
the intent — nobody should lose an evening to work already done — via self-assignment after 30
minutes, expiry at 2× the tier estimate, no blocking hold for accounts with no delivery history,
and delivering-without-a-claim treated as a risk taken rather than an offence.

Held open for 7 days despite the procedure not requiring it. This is the third
maintainer-convenient rule change in two days, after the timestamp correction and the funding
clause. #12 said a third should prompt someone to ask whether the rules are being written around
the maintainer; the answer to that is not to decide this one alone.

---

**2026-08-19 — claim expiry folded into [#16](https://github.com/mxx1111/spare-cycles/issues/16)
rather than opened separately.** Claiming and expiry are two halves of one mechanism; deciding
them apart produces rules that contradict each other.

Four changes proposed to the expiry half:

1. **The board sets the deadline, not the requester.** The requester already sets it by choosing
   the tier, which *is* a time estimate. A separate field would let a task contradict its own
   tier. The market reason matters more: workers are the scarce side here — one account has
   posted every task, two people have ever delivered — and a requester-set deadline is a
   pressure lever aimed at the scarce side. Requesters may extend, never shorten, by comment.
2. **Flat 24 / 48 / 72 h instead of 2× the tier estimate.** 2× gives an S task a one-hour
   window, which punishes not sharing the maintainer's timezone rather than punishing idleness.
3. **Measure silence, not elapsed time.** Any substantive comment or draft PR resets the clock;
   a warning fires at 75% instead of a silent repossession. The signal worth detecting is
   holding a task while saying nothing, and the cost of saying something is near zero.
4. **New: a delivery PR with no commit and no author reply for 7 days releases the claim.** None
   of the three existing timers covers a worker who opens a half-finished PR and disappears —
   delivery stops the claim clock and the task is pinned by a PR nobody will finish.

All of it is unenforced, like every other timer, until the Phase 1 bot exists. Recorded as a
specification for that bot rather than as a rule taking effect on merge — the last rule written
quickly required a maintainer to be awake, and that went unnoticed until it awarded two tasks to
an account with no deliveries.


---

**2026-08-24 — Phase 0 closed. The board is not a two-sided market, and the rules now say so.**

[#8](https://github.com/mxx1111/spare-cycles/issues/8) asked contributors two things on
2026-08-18: why they claimed, and whether they had anything they wanted done. Six days, zero
replies. [PHASE-0.md](PHASE-0.md) is closed on that basis.

The first two questions came back better than expected — claims inside 30 minutes, five
settlements with no rewrites, one of them P1. The third came back empty, and empty is an
answer: eight tasks posted, all eight from one account, 60 TP sitting with people who have
never spent any of it. Supply exists. There is no demand side.

Three changes follow.

**1. The funding clause no longer expires on someone else's behaviour.** It read "until three
separate accounts have each posted at least one task". With no demand side that condition may
never fire, and an expiry that never fires is a permanent grant with better manners — the exact
thing [#12](https://github.com/mxx1111/spare-cycles/issues/12) asked people to watch me for. It
now ends two ways: three requesters appearing (kept, because it should end the clause
instantly if it ever happens), or a missed 90-day review. The review is the operative one: the
clause must be re-argued in this log on a schedule, in public, where anyone can contradict it.
First review due **2026-11-22**. Miss it and no further issuance is legitimate.

**2. Second and third issuances under the clause: 50 TP each — decided, not yet written.**
They will fund a 20 TP top-up on [#10](https://github.com/mxx1111/spare-cycles/issues/10) and an
80 TP escrow on the audit task described below, taking `total_issued` from 100 to 200 and
returning the maintainer balance to 0.

Two issuances rather than one because the clause caps a single issuance at 50 TP and forbids
issuing while an unescrowed balance is held — the first 50 must be fully escrowed before the
second is drawn.

**They are not in `ledger.jsonl` as this entry is written, and that is deliberate.** A `settle`
entry now has to name a pull request that exists, references the task, and has actually been
merged — `npm run ledger:prs` checks it against the GitHub API. The settlements these issuances
pay for are on pull requests that are not merged yet. Writing the entries first would mean
either a ledger that fails its own verification, or timestamps invented ahead of the events they
claim to record, which is exactly the mistake that required the seq 1–8 correction on
2026-08-18.

So the decision is logged here and the entries follow the merges. Anyone reading this before
they land will see `total_issued` at 100 and a discrepancy with this paragraph; that
discrepancy is the honest state of things and it closes when the merges happen.

The audit is priced at the tier-L rate of 80 TP from the table in this document. It is not
discounted for having been posted late; charging a contributor for a defect in the board's own
process would be the wrong way round.

**3. Claim automation stops being a discussion.** The specification in
[#16](https://github.com/mxx1111/spare-cycles/issues/16) gets built rather than debated further.
The argument for it is no longer theoretical — see the cost accounting below.

---

**2026-08-24 — five days of maintainer silence, and what it cost other people.**

Last commit before this entry: 2026-08-19. In the gap, four contributors' pull requests sat
unanswered.

| PR | Waiting | What it was |
|---|---|---|
| [spare-cycles#17](https://github.com/mxx1111/spare-cycles/pull/17) | 5 days | Unsolicited security audit, 18 files, six findings, no escrow behind it |
| [sparepack#1](https://github.com/mxx1111/sparepack/pull/1) | 5 days | Mergeable since 18:46 on 2026-08-18, when the requested docs commit landed |
| [sparepack#2](https://github.com/mxx1111/sparepack/pull/2) | 5 days | Correct implementation, 6.5 hours behind #1 |
| [sparepack#3](https://github.com/mxx1111/sparepack/pull/3) | 5 days | Latest of three, and the only one with a better design than the winner |

Three implementations of one task, two of them wasted. The cause is on record from
2026-08-18: claiming required the maintainer to assign by hand, and nothing on an open task
told a reader it was already being worked. Both wasted contributors saw an open, unclaimed task
and were right to act on it.

Compensation is 10 TP each through the `split` route, charged against #10 rather than issued to
them directly — a compensation that bypassed task escrow would be a maintainer paying people
out of thin air, which is the thing the escrow rule exists to prevent. The top-up in change 2
above is what makes #10 solvent enough to pay all three.

`@xusuxiang8`'s `remap: [{from, to}]` is the general form of the `stripPrefix` that won. The
follow-up task generalising it credits that PR and is held for its author for seven days
before opening to the board.

**The audit is a harder case and was handled by admitting the gap rather than working around
it.** Nothing escrowed it and no `no-quota` route fits — `review`, `redact-audit`, `spec` and
`arbitrate` all attach to a task somebody else has posted, and none of them describes an
unprompted full-repository security audit. A task is being opened retroactively and escrowed at 80
TP so the settlement has something real to reference. Posting a task after its delivery is
irregular; doing it in the open is better than inventing a route that does not exist, and the
gap itself is now a known defect in the `no-quota` list.

One finding in that audit was not a bug. P2 was documented as "the code never touches the
worker's disk", which was false — the Codespace runs under the worker's account, and branch
protection restricts writes, not reads or copies. The tier is now documented as temporary
trusted access. **An over-promise in a privacy tier is worse than not offering the tier**, and
that text was written knowing how Codespaces work.

---

**2026-08-25 — a contributor's account no longer exists, and what that does to the ledger.**

`@xusuxiang8` submitted the `remap` design in `mxx1111/sparepack#3` on 2026-08-19. Six days
later the account returns 404 and the pull request is gone with it. Deleted or deactivated;
which one is not this board's business.

Three things follow, recorded because the alternative is a ledger that quietly rounds off the
people who leave.

**The 10 TP owed under `split` cannot be paid.** There is no balance to pay it into. It is
written into [the profile](profiles/xusuxiang8.md) as owed and unpayable rather than deleted.
Inventing a settlement would put a number in the ledger corresponding to nobody, which is worse
than an acknowledged debt that cannot be discharged.

**The escrow arithmetic changes.** [#10](https://github.com/mxx1111/spare-cycles/issues/10) was
to be topped up by 20 TP to cover three payouts. It now needs 10 — @ghzhost's settlement and
@rafaio1's compensation. The top-up is reduced rather than the surplus being left sitting in an
escrow nobody can claim.

**The attribution stands.** The design is credited in
[#19](https://github.com/mxx1111/spare-cycles/issues/19) with a dead link left in place, because
that is where it came from. The seven-day hold that issue opened with has been removed — holding
a task for an account that cannot claim it is theatre.

There is a rule gap here and it is being left open rather than patched in a hurry: nothing in
GOVERNANCE.md says what happens to escrowed or owed TP when an account disappears. It has now
happened once. If it happens twice, it needs a rule rather than a log entry.

---

**2026-08-25 — a clause for debts owed to accounts that no longer exist.**

Added [When an account disappears](GOVERNANCE.md#when-an-account-disappears) to GOVERNANCE.md.
Proposed in [#22](https://github.com/mxx1111/spare-cycles/issues/22).

The prompt was the obvious question about the 10 TP owed to `@xusuxiang8`: why not just issue
more TP and hand it over. The answer is that it does not work in any of the three ways that
matter — there is no account to receive it, TP cannot be transferred or cashed out so the amount
is irrelevant to someone who cannot log in, and **issuing outside the funding clause for a
sympathetic reason is how a clause that was tightened this morning starts coming apart.** The
funding clause was rewritten today to expire on a 90-day review precisely so that it stops
depending on the maintainer's judgement about special cases. Making an exception for a good
reason on the same day would have answered #12's question about whether the rules are written
around the maintainer, in the wrong direction.

So the debt is not paid out of thin air. It is written down, it does not expire, and it becomes
payable if the person can prove they are the person. The burden of proof is on the claimant, the
judgement is public and appealable, and paying it uses the ordinary escrow route rather than a
new issuance power.

**The clause is probably unenforceable in this specific case and says so.** When the account
went, the pull request went with it, and so did the commits, the email addresses and the
signatures — the evidence needed to claim the debt was destroyed by the same event that created
it. Writing a clause that admits it may never be used is better than either paying a stranger
who says the right name, or deleting the line and pretending the work never happened.

This is the fifth maintainer-convenient decision in eight days by the count [#12](https://github.com/mxx1111/spare-cycles/issues/12)
asked for — except this one costs the maintainer rather than helps him, which is worth noting
without treating it as proof of anything.
