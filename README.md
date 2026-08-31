# Spare Cycles（余力）

**English** | [简体中文](README.zh-CN.md)

**Hand a slice of private work to someone you have no reason to trust, and verify they actually did it.**

You have a task — a bug you keep putting off, a test suite nobody wants to write, a script that needs porting. The code belongs to your employer, so you cannot paste it into a public issue. So it sits there.

Three things stacked, each usable on its own:

| | |
|---|---|
| [**sparepack**](https://github.com/mxx1111/sparepack) | Cuts a minimal, redacted slice out of a private repo. Allowlist only, function bodies stripped to signatures, real data swapped for fixtures, and you review it file by file before anything is written. |
| **The board** | Hands that slice to whoever turns up, under a claim protocol that runs without a human awake. |
| **The ledger** | Append-only, eleven invariants, every balance replayed from history by `node ledger/verify.mjs`, with settlement PRs verified against GitHub's API. |

This started as a mutual-aid board for people whose Claude Max limit runs out by Wednesday while someone else's rolls over unused. That framing was half right. The supply of people willing to do the work is real — six deliveries, no rewrites. The rest of it did not survive contact: **every task ever posted came from one account**, and the activity profiles of the accounts that arrived look nothing like the community it was built for.

That is written up in full, with the numbers, in [**ADVERSARIAL.md**](ADVERSARIAL.md) — along with the claim flooding, the templated solicitation, the fake delivery with a crypto wallet attached, and the security audit that found two real holes in this repository. If you only read one file here to decide whether the mechanism is worth anything, read that one.

## What this is not

**This is not a way to share, lend, pool, or resell AI subscription quota.** That is against Anthropic's terms and gets accounts banned. From the Consumer Terms:

> You may not share your Account login information, Anthropic API key, or Account credentials with anyone else. You also may not make your Account available to anyone else.

In February 2026 Anthropic went further and prohibited using Pro/Max OAuth tokens anywhere outside Claude Code and claude.ai, including routing other people's requests through your seat — even at low volume, even for an internal team tool.

So there are no quota pools here, no token relays, no proxies, no shared accounts. If you came looking for that, this is the wrong project. See [COMPLIANCE.md](COMPLIANCE.md).

## What this actually is

Whoever does the work **does it themselves** and hands over the **result** — a pull request — rather than access to their account. They sit at their own keyboard, on their own subscription, and review what they ship. That is ordinary freelance work, and it is fine.

**There is no payout address.** Task Points have no cash value, cannot be transferred, sold, or cashed out, and no payment of any kind will ever be sent to any wallet or account by anyone here. If you found this repository on a bounty aggregator, that is the whole answer.

The original claim was that the scarce resource is people with time and willingness rather than tokens. Half of that held: the work got done. The half that did not is that nobody who did the work ever wanted anything done in return — see [ADVERSARIAL.md](ADVERSARIAL.md).

## What you get out of it

**A verifiable public track record.** Every delivery is a merged PR in someone's real repository, recorded in `profiles/<your-handle>.md` with the task type, privacy tier, and the requester's assessment. Real production code, not toy problems. That is worth something when you are job hunting or pitching contract work, in a way that a LeetCode streak is not.

Stated honestly: this has not turned out to be what draws people here, and the profiles of contributors who left are kept anyway — including one whose account no longer exists.

**Task Points (TP)** are the second thing, and they are deliberately boring. TP are an internal quota mechanism, not a reward — they exist so that nobody can post tasks forever without ever doing any. You earn them by delivering, you spend them by requesting. They cannot be transferred, gifted, cashed out, or traded. There is no secondary market and there will not be one.

## The privacy problem

Most people use AI coding tools on private business code. You cannot paste that onto a public task board. This is the hard part of the problem and most of the engineering here goes into it.

Every task declares a privacy tier:

| Tier | What the worker sees | Use when |
|---|---|---|
| **P0 · Public** | An ordinary open-source repo | The code is already public |
| **P1 · Redacted pack** | Interfaces, acceptance tests, fake fixtures. No business logic. | Default for private projects |
| **P2 · Temporary trusted access** | A worker-controlled Codespace with full, copyable access to the visible repository. Revocation stops future access but cannot recall copies. | The task needs the real codebase and the worker is trusted with it |
| **P3 · Trust circle** | Full access under NDA | Established relationships only |

P1 is the interesting one. The `sparepack` CLI extracts a minimal reproducible subset from your private repo — allowlist only, nothing is exposed unless you name it — strips function bodies down to signatures, swaps real data for generated fixtures, scans for credentials and PII, and makes you review the output file by file before it writes anything. The worker implements against the tests. Your business logic never leaves your machine.

Details in [PRIVACY-TIERS.md](PRIVACY-TIERS.md).

## How it works

There is no website and no server. The whole thing runs on GitHub.

1. **Post** — open an issue with the task template. Your TP go into escrow.
2. **Claim** — a worker comments `/claim`. Limits apply: 2 concurrent, 5 per week. Real humans doing real work do not exceed that; bots hit the wall immediately.
3. **Deliver** — the worker opens a PR against *your* repo, closing the issue. The PR template requires them to confirm they reviewed the change themselves and shared no credentials.
4. **Settle** — you merge, the ledger records the transfer, both profiles update.

**This repository never hosts your code.** Task metadata, the ledger, and reputation live here. The code itself moves directly between the two parties' own repositories.

## Out of quota this week?

You can still earn TP with work that does not burn any:

| Task | TP |
|---|---|
| Review someone else's delivery | 5 |
| Audit a `sparepack` output before it goes public | 10 |
| Write acceptance tests for someone's task spec | 15 |
| Arbitrate a dispute (requires 5+ deliveries) | 10 |

## Let your agent watch the board — and press the button yourself

Most people here develop with an AI agent, and the board is built for that. The division of
labour is precise: **the agent may watch, draft, and do the work; the decision to claim and
the review before delivery are yours.** An unattended agent that auto-claims is
[red line 4](COMPLIANCE.md) — claims voided, 30-day suspension — and the first thing this
board attracted was exactly that, so the rule is enforced from experience, not caution.

Watching requires nothing from us — the issues *are* the API:

```bash
gh api 'repos/mxx1111/spare-cycles/issues?labels=bounty&state=open' \
  --jq '.[] | {title, url: .html_url, labels: [.labels[].name]}'
```

If you run OpenClaw or a similar scheduler-equipped agent, paste it this and you are done:

> Every 2 hours, check https://github.com/mxx1111/spare-cycles/issues?q=is%3Aopen+label%3Abounty
> for tasks I have not seen yet. If one matches my skills (TypeScript/Node), message me the
> title, tier, and link. Never comment, never `/claim` — claiming is my decision, not yours.

That last sentence is load-bearing. What you get is "tasks find me, I only decide" — which is
all the automation that survives contact with a board where the scarce thing is tasks, not
workers.

## Status

Phase 0. Running tasks by hand to find out whether anyone actually shows up before building automation for it. Come break it.

## License

MIT
