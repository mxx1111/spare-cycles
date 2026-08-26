# @rafaio1

Joined 2026-08-18 · 0 accepted deliveries · 0 disputes · 10 TP (pending settlement)

## Deliveries

| Date | Task | Tier | Privacy | PR | Requester's note |
|---|---|---|---|---|---|
| 2026-08-18 | sparepack destination path remapping | S | P0 | [sparepack#2](https://github.com/mxx1111/sparepack/pull/2) (closed) | Correct implementation, closed in favour of an earlier submission with test coverage. Validated traversal on both the configured prefix and the resulting stripped paths — the accepted implementation checked only the latter. |

## Note

Closed, not rejected. Three implementations of the same task arrived on one day; this one was
6.5 hours behind the first and did not carry the two test suites that decided it.

Recorded here because the duplication was caused by a rule defect, not by a misjudgement. The
claim rule at the time required the maintainer to assign the issue by hand, and the maintainer
was asleep. Nothing on the task said it was taken. Anyone reading the board would have seen an
open, unclaimed task — which is what this contributor saw.

Compensated 10 TP through the `split` route on those grounds. The traversal check on the
configured prefix is being carried into the follow-up task with attribution.

---

**Pending.** The 10 TP above is decided but not yet in `ledger.jsonl`. A `settle` entry must
name a merged pull request and is verified against the GitHub API by `npm run ledger:prs`, so
the entry follows the merge rather than preceding it. This note comes off when it lands.
