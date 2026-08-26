# @xusuxiang8

Joined 2026-08-19 · 0 accepted deliveries · 0 disputes · 10 TP (unsettleable — account gone)

## Deliveries

| Date | Task | Tier | Privacy | PR | Requester's note |
|---|---|---|---|---|---|
| 2026-08-19 | sparepack destination path remapping | S | P0 | `mxx1111/sparepack#3` (gone with the account) | Closed as the latest of three submissions and the only one without tests. Contains the best design in the set: `remap: [{from, to}]` generalises the accepted `stripPrefix`, and the PR states the root cause more precisely than the task issue did. |

## Note

Closed, and the design was kept.

`stripPrefix` removes one leading prefix. `remap` maps any prefix to any other, which is the
general form of the same problem. The PR also identified why the documented workaround fails —
running sparepack from a subdirectory does not help when config, tests and source share no
useful common root — a limitation the task issue never stated.

Same rule defect as [rafaio1](rafaio1.md): claiming required a maintainer to assign by hand,
the maintainer was asleep, and the board showed an open task to everyone who looked.
Compensated 10 TP through the `split` route.

The follow-up task generalising `remap` credits this PR as its source and is held for this
contributor for seven days before opening to the board.

---

**Account no longer exists.** As of 2026-08-25 `github.com/xusuxiang8` returns 404 and the pull
request went with it — deleted or deactivated, and which one is not this board's business.

The 10 TP owed under `split` cannot be settled. There is no balance to settle it into, and
inventing one would put a number in the ledger that corresponds to nobody. It is recorded here
as owed and unpayable rather than removed.

**If this account's owner comes back, the debt is payable.** Same 10 TP, at the tier rate that
applied when the work was delivered. The terms and the standard of proof are in
[GOVERNANCE.md → When an account disappears](../GOVERNANCE.md#when-an-account-disappears), added
on 2026-08-25 because of this case. Whether the evidence to claim it still exists is another
question — the pull request went with the account — but the debt does not lapse for want of a
claimant.

**The profile stays.** The design in that pull request is in
[#19](https://github.com/mxx1111/spare-cycles/issues/19) with attribution, and it is the reason
`remap` exists as a task at all. A record that quietly drops the people who leave is not a
record — it is a record of whoever happens to still be around, which is a different and much
less useful thing.
