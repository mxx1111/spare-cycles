# What actually showed up

**English** | [简体中文](#简体中文)

This board opened on 2026-08-18. Within a week it had been claim-flooded, spammed with
templated pitches, sent a fake delivery with a crypto wallet attached, and had a contributor's
account vanish mid-debt.

None of that is in the README, because the README describes what the project is for. This file
describes what it met. It exists because a mechanism that has never been attacked is an
untested mechanism, and most projects that publish governance documents have no way of telling
you whether theirs would hold.

Every number below is recomputable. The ledger is append-only, `node ledger/verify.mjs` replays
every balance from history, and the reasoning behind each decision is in
[GOVERNANCE-LOG.md](GOVERNANCE-LOG.md) with timestamps.

---

## 1. Claim flooding

**What happened.** On day one, `OpensrcLord` commented `/claim` or `/attempt` on **all five open
tasks in 24 seconds** (`00:08:19`–`00:08:43`), then opened a pull request into the wrong
repository. Five hours after a claim rule was published, the same account claimed **all three**
newly posted tasks within four minutes. Eight claims across every task the board had ever
opened. Zero deliveries.

**What the board did.** Claims voided, 30-day suspension under red line 4, with the full
timestamp record published in the sanction notice. Not permanent — the difference between a
script and an enthusiastic person moving fast is a judgement call, and a judgement call should
not be irreversible. The notice invited the account to reply with what it actually had; nothing
came.

**What it cost.** The rule that was supposed to prevent this required a maintainer to assign
tasks by hand. The maintainer was asleep for the four minutes that decided it. Read literally,
the rule awarded three tasks to the account that had never delivered and put the person who
delivered two of them in violation.

**What was added.** [`scripts/claim-bot.mjs`](scripts/claim-bot.mjs) — claims stand on their own
within 30 minutes, no human needed. Burst detection flags an account claiming several tasks in
minutes, **but only labels it for review and never sanctions on its own.** Replayed against
OpensrcLord's real timestamps, it fires. Against a single fast claim, it does not.

There is also a rule that would have caught this before the first comment: accounts must be 90
days old. That account was **86 days old**. The check was documented and never automated, so it
never ran.

## 2. Templated solicitation

`chfr19820610-cell` posted **18** near-identical pitches across the board's history — fluent
paragraphs about TypeScript expertise and a promise to finish "within 2–3 days," one per new
task, never a claim, never a line of code. `romansolovey-del` asked for a 15-minute call about
a 30 TP task.

Minimized as spam. No sanction: red line 4 attaches to claiming, and neither account ever
claimed anything. **Noise, not a claim-blocker** — the distinction matters, because a board that
sanctions annoying behaviour starts sanctioning unusual behaviour shortly after.

## 3. Fake delivery with a payout address

**2026-08-25.** `adityawaghamare04` opened [#21](https://github.com/mxx1111/spare-cycles/pull/21)
against a task that had already been delivered and closed. It added one file restating the
issue, with an "Implementation" section consisting of commented-out lines reporting test results
it had not run — the numbers were copied from a maintainer review comment. At the bottom: a
Base L2 wallet address labelled **Payout Address**.

That account's other pull requests include one to a repository named `bounty-copilot-lab`.

Closed with the reasoning published, no sanction, and an explicit statement that has since been
promoted to the README: **Task Points have no cash value, cannot be transferred or cashed out,
and no payment will ever be sent to any address by anyone here.**

## 4. An account disappeared, owing and owed

`@xusuxiang8` submitted the best design of three competing implementations on 2026-08-19. Six
days later the account returns 404 and the pull request is gone with it.

10 TP was owed under `split`. It cannot be paid — there is no balance to pay into, and writing
the settlement anyway would put a number in the ledger corresponding to nobody.

The obvious suggestion was to issue extra TP and hand it over. That fails three ways: no account
receives it, TP cannot be transferred or cashed out so the amount is meaningless to someone who
cannot log in, and **issuing outside the funding clause for a sympathetic reason is how a clause
tightened that same morning starts coming apart.**

What was added instead: [When an account disappears](GOVERNANCE.md#when-an-account-disappears).
The debt is recorded, never expires, and becomes payable if the person proves they are the
person. The clause states plainly that it may never be usable — when an account goes, the
commits, emails and signatures go with it, so the evidence needed to claim the debt is often
destroyed by the same event that created it.

## 5. The audit that found real holes

Not an attack. The most valuable thing that happened, and it arrived unsolicited with nothing
escrowed behind it.

`@AuroraNest` submitted a full-repository security audit: 18 files, six high-confidence
findings. Two were real vulnerabilities rather than hardening:

- **`refund` checked the amount against the escrow but never the recipient.** Anyone could route
  another account's escrowed TP into their own balance.
- **`scan-repo.mjs` silently skipped any tracked file it could not read.** A credential scanner
  whose failure mode is "cannot read it, must be fine."

A third finding was not a bug at all. **P2 was documented as "the code never touches the
worker's disk". That was false** — the Codespace runs under the worker's own account, and branch
protection restricts writes, never reads, downloads or copies. The correction rewrites the tier
as temporary trusted access, with a checklist that makes the requester acknowledge the worker
can keep a permanent copy of everything visible.

*Status: the fix is in [#17](https://github.com/mxx1111/spare-cycles/pull/17), still open as a
draft at the time of writing. The claim above describes what that pull request does, not what
this repository currently says. It is listed here rather than after the merge because the
finding is the point, and a file about being audited should not wait for the flattering half.*

An over-promise in a privacy tier is worse than not offering the tier. That text was written
knowing how Codespaces work.

The ledger now has **11 invariants instead of 9**. Both new ones — escrow ownership and refund
recipient — were added to a ledger with 18 existing entries and replayed clean, which means they
were never a retroactive blessing of the status quo.

**It then sat unanswered for six days**, which is the single worst thing a board premised on
"deliver work, get a record" can do to someone.

## 6. Three people implemented the same task

On 2026-08-18, one sparepack task received three independent implementations: `15:29`, `22:03`,
and `05:09` the next day. All three were correct. One could be paid.

**Nobody was at fault.** Nothing on the open issue said it was taken, because saying so required
a maintainer to assign it, and the maintainer was asleep. Both wasted contributors saw an open,
unclaimed task and were right to act on it.

Compensated 10 TP each through the `split` route — charged against the task's escrow, not issued
directly, because a compensation that bypasses escrow is a maintainer paying people out of thin
air. The escrow was topped up under the funding clause to make the task solvent enough to pay
everyone.

The best design came from the submission that lost. It is now
[#19](https://github.com/mxx1111/spare-cycles/issues/19), credited to its author, whose account
has since disappeared.

---

## Who actually showed up

The uncomfortable part, stated with the same numbers as everything else.

The board was built on an assumption: that people with spare AI-coding capacity would trade real
work for a public track record. The activity profiles of the accounts that arrived do not
support it.

| Account | Public repos | Followers | Signature |
|---|---|---|---|
| `ghzhost` | 106 | 2 | Last 100 events: 42 pull requests across **46 distinct repositories**, 2 pushes of its own, **0 stars ever given** |
| `rafaio1` | 119 | 1 | Same shape |
| `OpensrcLord` | 36 | 0 | 8 claims, 0 deliveries, suspended |
| `adityawaghamare04` | 48 | 3 | Fake delivery, wallet address, active in `bounty-copilot-lab` |

The entry point is the `bounty` label. It is what aggregators scrape, and it brought a stream of
accounts whose entire GitHub presence is pull requests into strangers' repositories.

**Eight tasks have been posted. All eight by the maintainer.** Asked directly whether they had
anything they wanted done, nobody answered, across six days. That is not reluctance — the
question does not apply to whatever is on the other end.

**And yet the work was real.** `ghzhost` delivered six times with no rewrites, including the P1
that this project's entire design rests on: implementing against interfaces and acceptance tests
alone, never seeing the business logic, and getting it right. AuroraNest's findings were verified
line by line against the live repository before merge.

So the accurate statement is not "it was all bots." It is: **the code was real and the motive was
not the one the design assumed.** Which is worth knowing, and is why this file exists.

---

# 简体中文

# 实际来的是谁

这块板子 2026-08-18 开张。一周之内，它被刷过认领、被模板推销灌过、收到过一份附着加密货币
钱包地址的假交付，还有一个贡献者的账号在欠着钱的时候消失了。

这些都不在 README 里，因为 README 写的是这个项目要干什么。这个文件写的是它撞上了什么。
它存在的理由是：**一套从没被攻击过的机制是一套未经测试的机制**，而大多数发布治理文档的
项目，没有办法告诉你他们那套扛不扛得住。

下面每一个数字都可复算。账本只追加，`node ledger/verify.mjs` 从历史重放每一个余额，
每个决定的理由带时间戳记在 [GOVERNANCE-LOG.md](GOVERNANCE-LOG.md) 里。

---

## 1. 刷认领

**发生了什么。** 开张第一天，`OpensrcLord` 在 **24 秒内**（`00:08:19`–`00:08:43`）
对当时全部五个开放任务评论了 `/claim` 或 `/attempt`，然后往错误的仓库提了一个 PR。
认领规则发布五小时后，同一个账号在四分钟内认领了**全部三个**新发布的任务。
八次认领，覆盖这块板子开过的每一个任务。零交付。

**板子做了什么。** 认领作废，按红线 4 停权 30 天，完整时间戳记录随处分公告发布。
不是永久——脚本和一个热情过头的人之间的区别是个判断，而判断不该不可逆。
公告邀请该账号回复他实际做了什么，没有回音。

**代价。** 本该防住这件事的规则，要求维护者手工指派任务。而决定这件事的那四分钟里
维护者在睡觉。按字面执行，规则把三个任务判给了从未交付的账号，同时让真正交付了
其中两个的人变成违规。

**补了什么。** [`scripts/claim-bot.mjs`](scripts/claim-bot.mjs)——认领 30 分钟内
自动生效，不需要人。突发认领检测会标记短时间内认领多个任务的账号，
**但只加标签待人工复核，绝不自动处分。** 用 OpensrcLord 的真实时间戳回放，它会触发；
对单次快速认领，不会。

另外还有一条规则本该在第一条评论之前就拦住他：账号必须注册满 90 天。那个账号当时
**86 天**。这条检查写在文档里，从未自动化，所以从未运行。

## 2. 模板推销

`chfr19820610-cell` 在板子的历史上发了 **18** 条几乎一模一样的推销——流利地讲
TypeScript 专长，承诺"2–3 天内完成"，每来一个新任务发一条，从不认领，从不写一行代码。
`romansolovey-del` 为一个 30 TP 的任务要求开个 15 分钟的会。

标记为 spam 折叠。不处分：红线 4 针对的是认领行为，而这两个账号从没认领过任何东西。
**这是噪音，不是认领阻塞。**这个区分很重要，因为一块开始处分"讨厌行为"的板子，
很快就会开始处分"不寻常行为"。

## 3. 附收款地址的假交付

**2026-08-25。**`adityawaghamare04` 对一个已经交付并关闭的任务开了
[#21](https://github.com/mxx1111/spare-cycles/pull/21)。它新增一个文件，把 issue 内容
复述一遍，"Implementation" 一节是几行注释掉的代码，报告了它并没有运行过的测试结果——
那些数字是从维护者的评审评论里抄的。底部是一个 Base L2 钱包地址，标着 **Payout Address**。

那个账号的其他 PR 里，有一个提给了名为 `bounty-copilot-lab` 的仓库。

公开理由后关闭，不处分，并明确声明一句话，这句话此后被提到了 README：
**积分没有现金价值、不可转让、不可提现，这里不会向任何地址支付任何款项。**

## 4. 一个账号消失了，欠着也被欠着

`@xusuxiang8` 在 2026-08-19 提交了三份竞争实现里设计最好的一份。六天后账号返回 404，
PR 随之消失。

按 `split` 欠他 10 TP。这笔付不出去——没有可以付进去的余额，硬写一笔结算，
等于在账本里放一个不对应任何人的数字。

一个很自然的建议是：多发点 TP 补给他。三个地方行不通：没有账号可以接收；
TP 不可转让不可提现，对一个登录不了的人来说发多少都等于零；而**为了一个善意的理由
绕开供资条款发放，正是一条当天上午刚收紧的条款开始松掉的方式。**

补上的是这个：[账号消失时](GOVERNANCE.md#账号消失时)。债记下来，不设时效，
本人能自证身份就照付。条款明说它可能永远用不上——账号消失时，提交、邮箱、签名
一起消失，认领这笔债所需要的证据，往往被制造这笔债的同一件事销毁了。

## 5. 那份找出真洞的审计

这不是攻击。这是发生过的最有价值的事，而且它是主动送来的，背后没有任何托管。

`@AuroraNest` 提交了一份全仓安全审计：18 个文件，六处高置信度发现。其中两处是真漏洞，
不是加固：

- **`refund` 校验金额是否超过托管，却从不校验退给谁。** 任何人都能把别人托管的 TP
  退进自己的余额。
- **`scan-repo.mjs` 会静默跳过任何读不出来的被跟踪文件。** 一个凭据扫描器最不该有的
  失败模式就是"读不了就当没事"。

第三处根本不是 bug。**P2 被写成"代码不落接单者磁盘"，这是假的**——Codespace 跑在
接单者自己账号下，分支保护限制的是写入，从不限制读取、下载或复制。修正把这个档位改写为
"临时受信访问"，检查清单里要求发布者确认接单者可以永久保留所有可见内容。

**隐私档位上的过度承诺，比不提供这个档位更糟。**那段文字是在明知 Codespace 怎么工作的
情况下写的。

账本将变成 **11 条不变量而不是 9 条**。新增的两条——托管归属和退款收款人——是加在
一个已有 18 条记录的账本上重放通过的，这说明它们不是对现状的事后追认。

*状态：修复在 [#17](https://github.com/mxx1111/spare-cycles/pull/17) 里，写这段时它仍是
draft 未合并。上面描述的是那个 PR 做了什么，不是这个仓库当前的样子。放在这里而不是等
合并后再写，是因为重点在于那个发现本身——一份讲自己被审计的文件，不该等到好看的那半边
才开始写。*

**然后它在队列里躺了六天没人回。**一块声称"交付换履历"的板子，最不能对人干的就是这件事。

## 6. 三个人做了同一个任务

2026-08-18，一个 sparepack 任务收到三份独立实现：`15:29`、`22:03`、次日 `05:09`。
三份都是对的。只有一份能拿到报酬。

**没有人做错。** 开放的 issue 上没有任何东西说它已经有人在做，因为说这句话需要维护者
指派，而维护者在睡觉。两个白干的人看到的是一个开放的、无人认领的任务，他们的判断没有错。

各补偿 10 TP，走 `split` 路径——记在任务的托管上，而不是直接发放，因为一笔绕开托管的
补偿，等于维护者凭空给人发钱。托管按供资条款补足，好让这个任务付得起所有人。

设计最好的那份来自落选的提交。它现在是 [#19](https://github.com/mxx1111/spare-cycles/issues/19)，
署了作者的名，而那个账号此后消失了。

---

## 实际来的是谁

不舒服的那部分，用和其他部分一样的数字说。

这块板子建立在一个假设上：有 AI 编码余力的人，愿意用真实的活换一份公开履历。
实际到来的那些账号的活动画像，不支持这个假设。

| 账号 | 公开仓库 | 粉丝 | 特征 |
|---|---|---|---|
| `ghzhost` | 106 | 2 | 最近 100 个事件：42 个 PR 分布在 **46 个不同仓库**，自有 push 2 次，**从未 star 过任何仓库** |
| `rafaio1` | 119 | 1 | 同样形状 |
| `OpensrcLord` | 36 | 0 | 8 次认领 0 次交付，已停权 |
| `adityawaghamare04` | 48 | 3 | 假交付、钱包地址、活跃于 `bounty-copilot-lab` |

入口是 `bounty` 标签。它正是各种赏金聚合器抓取的目标，带来了一批 GitHub 活动几乎全部
是"给陌生人仓库提 PR"的账号。

**八个任务发布，八个来自维护者本人。**直接问他们有没有想让人帮着做的事，六天，
没有人回答。那不是冷淡——是这个问题对电线另一头的东西根本不成立。

**但活是真的。**`ghzhost` 交付六次零返工，包括这个项目全部设计所依赖的那次 P1：
只看接口和验收测试、从没见过业务逻辑，把活干对了。AuroraNest 的每一条发现，
在合并前都对着活的仓库逐行验证过。

所以准确的说法不是"全是机器人"。是：**代码是真的，动机不是设计时假设的那个。**
这件事值得知道，也是这个文件存在的理由。
