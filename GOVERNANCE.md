# Governance / 治理

**English** | [简体中文](#简体中文)

## Task Points

### Pricing

Priced by complexity, never by tokens or quota (see [COMPLIANCE.md](COMPLIANCE.md) red line 3).

**Build tasks** — these consume the worker's AI quota:

| Tier | Scope | TP |
|---|---|---|
| S | ≤30 min. Bug fix, doc, missing test. | 10 |
| M | 30 min–2 h. One function, component, or endpoint. | 30 |
| L | 2 h–half a day. A complete feature with tests. | 80 |

There is no XL. Anything bigger gets split. Large single tasks are where disputes come from, and a half-finished XL is worthless to both sides.

**No-quota tasks** — these earn TP without burning any AI quota, so that being out of quota does not mean being locked out:

| Type | Scope | TP |
|---|---|---|
| `review` | Review someone's delivery PR | 5 |
| `redact-audit` | Second pair of eyes on a `sparepack` output before it goes public | 10 |
| `spec` | Write the acceptance tests that define someone's task | 15 |
| `arbitrate` | Serve as arbitrator on a dispute (5+ deliveries required) | 10 |

### Rules

- **New members start with 50 TP** — enough to post one M task.
- **Eligibility**: GitHub account 90+ days old with public contribution history. Checked at onboarding.
- **Escrow**: posting a task moves the TP out of your balance immediately. Insufficient balance, no task.
- **Not transferable.** Earned by delivering, spent by requesting, nothing else. No gifting, trading, selling, or holding on someone's behalf. The ledger has no user-to-user transfer type and the audit job treats one as tampering.
- **No expiry.** TP do not decay. There is no reason to hoard them and no reason to panic-spend.
- **No cash value.** Ever. Not redeemable, not refundable, not a security, not a currency.

### Claim limits

Two concurrent claims, five per rolling seven days. This is both an anti-abuse measure and evidence for red line 4: the throughput of this board is the throughput of people working by hand.

Limits are per person, not per account. Alt accounts to get around them are a ban.

---

## Task lifecycle

| Stage | Action | Timeout |
|---|---|---|
| Posted | Issue opened, TP escrowed | 30 days, then auto-close and refund |
| Claimed | `/claim` comment, **assigned by the board within 30 min** | S 24 h · M 48 h · L 72 h **of silence**, warning at 75% |
| Delivered | PR opened with `Closes #<issue>` | 7 days with no commit and no author reply releases the claim |
| Under review | Requester reviews | 7 days, then escalates to `stale-review` |
| Settled | PR merged, ledger updated, profiles updated | — |

### Claiming is a precondition, not an announcement

**Do not start work until the issue is assigned to you.** A `/claim` comment is a request; the
assignment is the answer. One person is assigned at a time, and only that person's delivery is
eligible for the TP.

This is not bureaucracy, it is the only thing standing between a contributor and wasted work.
On the board's first day, task #7 received two independently correct implementations two hours
apart. Both passed all nine acceptance tests. Only one could be paid. The second person spent
their evening on work that had already been done, and they had no way to know — nothing on the
issue said it was taken. That waste was the board's fault.

**The board assigns, not the maintainer.** The first version of this rule required a human to
assign, and on 2026-08-19 it awarded three tasks to an account that had never delivered while
putting the person who delivered two of them in violation — because the maintainer was asleep
for the four minutes that decided it. A rule with an unwritten dependency on someone being
awake is not a rule. `/claim` now stands on its own within 30 minutes, enforced by
[the claims workflow](.github/workflows/claims.yml).

If an issue is already assigned and you think you can do better, say so in a comment rather
than opening a competing PR. If the assignee goes quiet past the timeout, the claim releases
and you can take it.

### The clock measures silence, not elapsed time

A claim expires after **24 h (S) / 48 h (M) / 72 h (L)** — flat per tier, not a multiple of the
estimate. 2× an S estimate is a one-hour window, which punishes not sharing the maintainer's
timezone rather than punishing idleness.

**Any substantive comment or a draft PR resets the clock.** Someone who says "halfway through,
pnpm is fighting me" and someone who has vanished are in completely different situations, and a
wall clock cannot tell them apart. The thing worth detecting was never slowness; it is holding a
task while saying nothing. Saying something costs nearly nothing, which is exactly what makes it
a good filter.

**A warning fires at 75%, never a silent repossession.** Losing a claim should not be the first
you hear about it. Releases carry no sanction and leave nothing on your record — reclaim freely.

Requesters may **extend** a window by comment, never shorten it. The tier is already the
requester's time estimate; a second, tighter deadline would let a task contradict its own tier,
and it would aim a squeeze at the scarce side of this board. Workers are the scarce side.

A `/claim` on an already-assigned issue, or from someone already at their limit (2 concurrent,
5 per rolling week), is declined with a comment explaining which limit was hit.

`/release` gives up a claim voluntarily with no penalty. Doing it three times in a row triggers a maintainer conversation, not a sanction — usually it means the tasks are badly specified.

---

## Disputes

Either party applies the `dispute` label. An arbitrator with 5+ deliveries and no involvement in the task picks it up. Target resolution: 3 days.

The arbitrator can rule:

- **Deliver** — the work meets the stated acceptance criteria. TP go to the worker. A requester who moves the goalposts after the fact does not get a refund.
- **Refund** — the work does not meet the criteria. TP return to the requester.
- **Split** — partial delivery. TP divided, with the reasoning recorded.

Every ruling is written into `ledger.jsonl` with the arbitrator's handle and a link to the reasoning. Rulings are public and appealable once, to a different arbitrator.

**Acceptance criteria are the contract.** If it was not in the issue when the task was claimed, it is not grounds for refusing delivery. This cuts both ways and it is why the task template makes acceptance criteria mandatory.

---

## When an account disappears

An account that no longer exists cannot hold a balance. TP owed to it cannot be settled — there
is nothing to settle into — and writing the settlement anyway would put a number in the ledger
corresponding to nobody.

**The debt is recorded, not erased.** It stays in the contributor's profile marked owed and
unpayable, in GOVERNANCE-LOG.md with what caused it, and in any task issue that credits their
work. A record that quietly drops the people who leave is a record of whoever happens to still
be here, which is a different and much less useful thing.

**If they come back, they get paid.** Same amount, at the tier rate that applied when the work
was delivered. No interest, no goodwill top-up, no discount for the delay — the debt is the
debt.

Conditions:

- **The burden of proof is on the claimant.** Control of the email address on the original
  commits, a signature verifiable against them, or details of the delivery that were never
  public. A new account asserting it is the same person is not evidence.
- **The judgement is the maintainer's and is written into GOVERNANCE-LOG.md**, accepted or
  refused, with the reasoning. A refusal can go to `arbitrate` like any other dispute.
- **No time limit.** A debt does not expire because the person took a year to come back. The
  outstanding list is reviewed alongside the funding clause every 90 days.
- **This creates no new issuance power.** Paying it uses the ordinary route — escrow on a task,
  then `split` or `settle`. If the original escrow has already been cleared, it is topped up
  first, under the funding clause and its existing limits.

**This clause covers exactly one situation: an account that no longer exists.** It is not a
general power to pay people outside the escrow system, and it is not a precedent for other
sympathetic cases. Extending it needs its own rule change.

**It may well never be used.** When an account goes, its pull requests usually go with it, and
the commits, the email addresses and the signatures go too — the evidence someone would need to
prove they are the person owed is often destroyed by the same event that created the debt. That
is an honest limitation, not a reason to skip writing the clause. An acknowledged debt that
cannot be discharged is still better than a quiet deletion.

## Sanctions

| Behavior | Consequence |
|---|---|
| Sharing credentials (red line 1) | Permanent ban, balance zeroed |
| Routing others' requests (red line 2) | Permanent ban, balance zeroed |
| Transferring TP (red line 5) | Permanent ban, balance zeroed |
| Pricing in tokens/quota (red line 3) | Task voided, warning; repeat is a ban |
| Headless auto-claiming (red line 4) | Claims voided, 30-day suspension |
| Alt accounts to dodge rate limits | Permanent ban on all accounts |
| Delivering unreviewed AI output | Warning, then suspension. The attestation in the PR template is a statement of fact, and lying in it is the problem. |
| Repeatedly abandoning claims | Conversation first. Usually a task-quality problem, not a person problem. |

Bans are recorded publicly in `GOVERNANCE-LOG.md` with the red line cited. No secret enforcement.

---

## Maintainers

Currently one: [@mxx1111](https://github.com/mxx1111). This is a bootstrapping stage, not a permanent structure.

Maintainers can: arbitrate, apply sanctions, correct ledger errors (with a recorded reason), and merge changes to this repository.

Maintainers cannot: issue TP into their own balance for their own use, alter historical ledger entries, or settle a task to themselves as both requester and worker. Ledger corrections are append-only compensating entries, never edits. The audit job recomputes every balance from the full history and will surface any edit.

### The one exception: funding the board

The maintainer may issue TP for the single purpose of funding tasks that other people get paid
for.

The distinction this rests on: TP cannot be transferred, sold, or cashed out, so points that pass
through the maintainer's balance and into escrow buy the maintainer nothing. They leave for a
worker's balance and stay there. Issuing them is inflation, not self-dealing — and inflation is
already visible, because `total_issued` is recomputed from the full history on every run of
`npm run ledger`.

Conditions, all of them:

- Recorded as an `adjust` naming the authorizing maintainer in `by` and citing this clause in `reason`
- Escrowed on a posted task within 24 hours, or reversed with a compensating entry
- Listed in [GOVERNANCE-LOG.md](GOVERNANCE-LOG.md) with the amount and what it funded
- 50 TP at a time, and never while the maintainer already holds an unescrowed balance
- Reviewed and re-argued in [GOVERNANCE-LOG.md](GOVERNANCE-LOG.md) every 90 days. **Next review due: 2026-11-22.**

**None of this is machine-enforced.** `verify.mjs` will accept any `adjust` that balances; what
stops abuse is that every issuance is a line in a public append-only file with the maintainer's
name on it. This clause exists because the board's first month produced the opposite of the
expected failure: points accumulated with people who only deliver, and ran out for the only
person posting work.

**How this clause ends.** It used to end one way: when three separate accounts had each posted a
task. [Phase 0](PHASE-0.md) closed with no demand side at all — eight tasks, one requester, and
nobody who answered when asked whether they wanted anything done. A condition that may never fire
is not an expiry, it is a permanent grant wearing an expiry's clothes, which is the exact failure
[#12](https://github.com/mxx1111/spare-cycles/issues/12) asked people to watch for.

So there are now two ways out, and only one of them depends on anybody else:

1. **Three separate accounts have each posted at least one task.** The board has a demand side and
   no longer needs funding. Kept because if it ever happens it should end the clause immediately.
2. **A scheduled review is missed.** Every 90 days the clause must be re-argued in
   GOVERNANCE-LOG.md — what it funded, whether the board still needs it, and why it is still the
   least-bad option. Miss the date and the clause lapses; no further issuance is legitimate until
   it is re-adopted through the normal rule-change procedure.

The second one is the real one. It costs the maintainer something to keep this power — a public
argument, on a schedule, that anyone can show up and contradict — and it does not wait on a
requester who may never arrive.

**This rule has been broken once**, on 2026-08-18, and the exception is documented rather than hidden. The `ts` field on entries 1–8 had been hand-written as invented values instead of observed event times; the last of them was several hours in the future and had deadlocked settlement. All nine were rewritten in one pass with real times pulled from the GitHub API. No amount, type, account, or balance changed — only timestamps that were wrong to begin with. The reasoning is in the header of `ledger.jsonl` and in [GOVERNANCE-LOG.md](GOVERNANCE-LOG.md), and `verify.mjs` now rejects any future-dated entry, which would have caught it on the first line. If this needs doing again, it needs a `governance` issue and seven days of discussion like any other rule change.

## Changing these rules

Open an issue with the `governance` label. Changes affecting TP pricing or red lines need 7 days of open discussion before merging. Red lines 1, 2, and 5 are not up for negotiation while this project exists in its current form — if the community wants those changed, it wants a different project.

---

# 简体中文

## 积分（TP）

### 定价

按复杂度定价，永远不按 token 或额度（见 [COMPLIANCE.md](COMPLIANCE.md) 红线 3）。

**Build 类任务** —— 会消耗接单者的 AI 额度：

| 档位 | 范围 | TP |
|---|---|---|
| S | ≤30 分钟。修 bug、补文档、补测试。 | 10 |
| M | 30 分钟–2 小时。一个函数、组件或接口。 | 30 |
| L | 2 小时–半天。一个带测试的完整特性。 | 80 |

没有 XL。更大的必须拆。大颗粒的单个任务正是纠纷的来源，而一个做了一半的 XL 对双方都是废品。

**No-quota 类任务** —— 赚 TP 但不烧 AI 额度，让"这周额度用完了"不等于"没法参与"：

| 类型 | 范围 | TP |
|---|---|---|
| `review` | Review 别人的交付 PR | 5 |
| `redact-audit` | 在 `sparepack` 产出公开前当第二双眼睛复核 | 10 |
| `spec` | 帮别人写定义任务的验收测试 | 15 |
| `arbitrate` | 担任争议仲裁者（需 5 次以上交付） | 10 |

### 规则

- **新成员初始 50 TP**，刚好够发一个 M 任务。
- **准入门槛**：GitHub 账号注册满 90 天且有公开贡献记录，onboarding 时校验。
- **托管**：发布任务时 TP 立即从余额划走。余额不够就发不了。
- **不可转让。** 完成任务赚，发布任务花，没有第三条路径。不能赠与、交易、出售、代持。账本里不存在用户到用户的转账类型，审计任务发现即视为篡改。
- **不过期。** TP 不衰减。既没有囤积的理由，也没有恐慌性消费的理由。
- **无现金价值。** 永远不。不可兑换、不可退款，不是证券，不是货币。

### 接单上限

同时 2 个，滚动 7 天内 5 个。这既是防滥用措施，也是红线 4 的证据：这个板子的吞吐就是人手工干活的吞吐。

上限按人算，不按账号算。开小号绕过限制的，封。

---

## 任务生命周期

| 阶段 | 动作 | 超时 |
|---|---|---|
| 已发布 | issue 开启，TP 进托管 | 30 天后自动关闭并退回 |
| 已接单 | `/claim` 评论，**30 分钟内由板子自动指派** | S 24 小时 · M 48 小时 · L 72 小时**无动静**，75% 时先提醒 |
| 已交付 | 提 PR，正文含 `Closes #<issue>` | — |
| 待验收 | 发布者审阅 | 7 天后升级为 `stale-review` |
| 已结算 | PR 合并，账本与档案更新 | — |

### 认领是前置条件，不是通知

**issue 指派给你之前不要动手。** `/claim` 评论是申请，指派才是答复。同一时刻只指派一个人，
也只有那个人的交付有资格拿这份 TP。

这不是官僚流程，这是贡献者和白干之间唯一的那道屏障。板子开张第一天，任务 #7 在两小时内收到
两份各自都正确的实现，九个验收测试都全过，但只有一份能拿到钱。第二个人花了一晚上做一件已经
做完的事，而他没有任何办法知道——issue 上没有任何东西显示它已经被人接了。那份浪费是板子的
责任。

如果一个 issue 已经被指派，而你觉得自己能做得更好，在评论里说，不要另提一个 PR 竞争。如果
被指派的人超时没动静，认领会自动释放，那时你可以接。

**指派的是板子，不是维护者。** 这条规则的第一版要求人工指派，结果在 2026-08-19，
它把三个任务判给了一个从未交付过的账号，同时让真正交付了其中两个的人变成违规——
只因为决定这件事的那四分钟里维护者在睡觉。一条暗含"某人得醒着"这个前提的规则不是规则。
现在 `/claim` 在 30 分钟内自动生效，由[认领工作流](.github/workflows/claims.yml)执行。

### 计时器测的是沉默，不是耗时

认领窗口按档位固定：**S 24 小时 / M 48 小时 / L 72 小时**，不再用预估时长的 2 倍。
2 倍会给 S 任务只留一个小时，那惩罚的是"不和维护者同一个时区"，不是惩罚拖延。

**任何实质性的评论或一个 draft PR 都会重置计时。** 一个说"做了一半，pnpm 在跟我作对"的人，
和一个人间蒸发的人，处境完全不同，而挂钟分辨不出这个差别。真正值得检测的从来不是慢，
是占着任务却一声不吭。说一句话的成本几乎为零，这恰恰是它作为过滤器好用的原因。

**剩 25% 时会先提醒一次，绝不静默收回。** 认领被释放不该是你听到的第一个消息。
释放不带任何处分，你的记录上不会留下东西，随时可以重新认领。

发布者可以通过评论**延长**窗口，但不能缩短。档位本身就是发布者给的时间估计；
再加一个更紧的截止时间，会让任务和自己的档位互相矛盾，而且那是把压力对准了这块板子上稀缺的一侧。
稀缺的是接单者。

对已被指派的 issue 发 `/claim`，或者发起人已经到了上限（同时 2 个、滚动 7 天内 5 个），会被
拒绝并附上说明是哪条限制卡住了。

`/release` 是主动放弃接单，无惩罚。连续三次会触发一次维护者对话，但那不是处分，通常意味着任务本身写得不清楚。

---

## 争议处理

任一方打 `dispute` 标签。由一位有 5 次以上交付、且与该任务无关的仲裁者接手，目标 3 天内出结果。

仲裁者可以裁定：

- **交付成立** —— 工作满足了写明的验收标准，TP 归接单者。事后加需求的发布者不给退款。
- **退回** —— 工作不满足标准，TP 退回发布者。
- **拆分** —— 部分交付，TP 按比例分，并记录理由。

每一次裁定都会写进 `ledger.jsonl`，带仲裁者账号和理由链接。裁定公开，可向另一位仲裁者申诉一次。

**验收标准就是合同。** 接单时 issue 里没写的东西，不能作为拒收的理由。这一条对双方同样成立，也正是任务模板把验收标准设为必填的原因。

---

## 账号消失时

一个不存在的账号无法持有余额。欠它的 TP 结算不出去——没有可以结算进去的地方——
硬写一笔，等于在账本里放一个不对应任何人的数字。

**这笔债记下来，不抹掉。** 它留在贡献者的 profile 里，标为「已欠、不可支付」；
留在 GOVERNANCE-LOG.md 里，写明起因；也留在任何署了他名字的任务 issue 里。
一份悄悄把离开的人删掉的记录，记的只是「碰巧还在的人」，那是另一种东西，而且没什么用。

**人回来了，就付。** 原额，按交付当时的档位价目。不计息、不加补偿、也不因为拖久了打折。
欠多少就是多少。

条件：

- **举证责任在声称者。** 能证明控制原提交所用的邮箱、能提供可对原提交验证的签名、
  或说得出交付中从未公开过的细节。一个新账号自称是同一个人，不算证据。
- **判断由维护者做出，并写进 GOVERNANCE-LOG.md**，认或不认都写，连同理由。
  不认可以像其他争议一样走 `arbitrate`。
- **不设时效。** 一笔债不会因为本人过了一年才回来就消失。未偿清单在每 90 天复审
  供资条款时一并复核。
- **本条不产生任何新的发放权。** 支付走常规路径：任务托管，然后 `split` 或 `settle`。
  原托管如果已经结清，先按供资条款及其现有上限补足。

**本条只覆盖一种情况：账号不存在了。** 它不是一项绕开托管体系给人付钱的通用权力，
也不构成其他"情有可原"情形的先例。要扩展它，得单独走一次改规则程序。

**它很可能永远用不上。** 账号消失时，PR 通常一起消失，提交、邮箱、签名也跟着没了——
一个人要证明自己就是那个债主所需要的证据，往往被制造这笔债的同一件事销毁了。
这是个诚实的局限，不是不写这条款的理由。一笔承认了却还不上的债，仍然好过悄悄删掉。

## 处分

| 行为 | 后果 |
|---|---|
| 共享凭证（红线 1） | 永久封禁，余额清零 |
| 代理转发他人请求（红线 2） | 永久封禁，余额清零 |
| 转让 TP（红线 5） | 永久封禁，余额清零 |
| 按 token/额度计价（红线 3） | 任务作废并警告，再犯封禁 |
| 无人值守自动接单（红线 4） | 接单作废，停权 30 天 |
| 开小号绕过速率限制 | 所有账号永久封禁 |
| 交付未经审阅的 AI 输出 | 先警告后停权。PR 模板里那句声明是事实陈述，在那上面撒谎才是问题所在。 |
| 反复放弃接单 | 先对话。通常是任务质量问题，不是人的问题。 |

封禁记录公开写在 `GOVERNANCE-LOG.md` 里，注明违反的是哪条红线。不搞暗箱执行。

---

## 维护者

目前一位：[@mxx1111](https://github.com/mxx1111)。这是冷启动阶段的状态，不是长期结构。

维护者可以：仲裁、执行处分、更正账本错误（须记录理由）、合并本仓库的变更。

维护者不可以：把 TP 发进自己余额供自己使用、修改历史账本条目、把任务结算给自己（同时当发单方和接单方）。账本更正一律是只追加的冲正条目，绝不是编辑。审计任务会从完整历史重算每一个余额，任何编辑都会被翻出来。

### 唯一的例外：给板子供血

维护者可以发放 TP，且只能用于一个目的：给别人能拿到报酬的任务供资。

这一条依赖的区分是：TP 不可转让、不可交易、不能提现，所以经维护者余额进入托管的积分，对维护者本人一分钱价值都没有。它们会离开他的余额、进入接单者的余额，然后留在那儿。发放它是通胀，不是自肥——而通胀本来就是可见的，因为 `total_issued` 每次跑 `npm run ledger` 都会从完整历史重算一遍。

条件，缺一不可：

- 记为 `adjust`，`by` 写明授权的维护者，`reason` 里引用本条款
- 24 小时内必须托管到已发布的任务上，否则用冲正条目撤回
- 在 [GOVERNANCE-LOG.md](GOVERNANCE-LOG.md) 里列出金额和它资助了什么
- 一次 50 TP，且维护者手上还有未托管余额时不得再发
- 每 90 天必须在 [GOVERNANCE-LOG.md](GOVERNANCE-LOG.md) 里复审并重新论证一次。**下次复审截止：2026-11-22。**

**以上没有任何一条是机器强制的。** `verify.mjs` 会接受任何能平账的 `adjust`；真正防滥用的是每一次发放都是一个只追加的公开文件里、署着维护者名字的一行。这条例外之所以存在，是因为板子的第一个月出现的是和预期相反的失败：积分堆在了只交付的人手里，而唯一在发任务的人耗光了。

**这条例外怎么结束。** 原本只有一种结束方式：三个不同账号各自发过一个任务。
[Phase 0](PHASE-0.md) 结案时的事实是需求侧根本不存在——八个任务，一个发单方，
直接问有没有想让人做的事，没有人回答。一个可能永远不触发的条件不叫过期条件，
它是一份穿着过期条件外衣的永久授权，而这正是 [#12](https://github.com/mxx1111/spare-cycles/issues/12)
请大家盯着的那种情况。

所以现在有两条出路，其中只有一条依赖别人：

1. **三个不同账号各自至少发过一个任务。** 板子有了需求侧，不再需要供血。
   保留这一条，是因为它一旦真的发生，就该立刻终止本条款。
2. **错过一次定期复审。** 每 90 天必须在 GOVERNANCE-LOG.md 里重新论证一遍：
   这段时间它资助了什么、板子是否还需要它、为什么它仍是最不坏的选择。
   过了日子没写，条款即失效；在按常规改规则程序重新通过之前，任何新的发放都不合法。

第二条才是真正起作用的那条。它让维护者为保有这项权力付出成本——一次公开的、有时限的、
任何人都可以来反驳的论证——而且它不依赖一个可能永远不会出现的发单者。

**这条规则被破过一次**，2026-08-18，而这次例外是写下来的，不是藏起来的。前 8 条的 `ts` 当初是手写的编造值而不是实际观测到的事件时间，其中最后一条落在几小时之后的未来，把结算卡死了。九条时间戳一次性用 GitHub API 拉的真实时间重写。金额、类型、账户、余额一律未动，改的只是本来就是错的那些时间。理由写在 `ledger.jsonl` 的文件头和 [GOVERNANCE-LOG.md](GOVERNANCE-LOG.md) 里，`verify.mjs` 现在会拒绝任何未来时间的条目——那条不变量本来在第一行就能拦住它。如果还需要再来一次，就得走 `governance` issue 和七天讨论，跟任何其他规则变更一样。

## 修改这些规则

开一个带 `governance` 标签的 issue。涉及 TP 定价或红线的变更，需要 7 天公开讨论才能合并。红线 1、2、5 在本项目以当前形态存在期间不接受协商 —— 如果社区想改那几条，它想要的是另一个项目。
