# Privacy Tiers / 隐私分级

**English** | [简体中文](#简体中文)

Most people use AI coding tools on private business code. That code cannot go on a public task board. This document defines the four ways around that, ordered by how much the worker gets to see.

Every task issue must declare exactly one tier.

---

## P0 · Public

The task lives in a repository that is already public. Point at it and go.

**Worker sees:** everything, same as any open-source contributor.
**Setup cost:** none.
**Use for:** open-source maintenance, general-purpose tooling, algorithm work, anything where the code is not the secret.

Phase 0 of this project runs P0 only. Get the social mechanics working before adding machinery.

---

## P1 · Redacted pack — the default for private work

The idea: **do not hand over code, hand over a specification.** Interface signatures, acceptance tests, and fake fixtures. The worker writes an implementation that makes the tests pass. Your business logic never leaves your machine.

Produced by the `sparepack` CLI:

```bash
sparepack init            # writes a commented sparepack.yaml
sparepack pack            # extract → redact → scan → review → emit
sparepack verify <pkg>    # re-derive the pack from disk and re-scan it
```

### Allowlist only

Nothing is exposed unless you name it. There is no "exclude these and ship the rest" mode, because that mode is how leaks happen.

```yaml
include:    [ "src/payment/types.ts" ]        # exposed verbatim
interfaces: [ "src/payment/gateway.ts" ]      # signatures kept, bodies emptied
tests:      [ "tests/payment/*.spec.ts" ]     # this IS the task specification
fixtures:   { "data/orders.json": "shape:5" }   # empty | shape[:n] | rows:n | text:n
redact:     [ { pattern: "acme-corp|ACME", replace: "example-org" } ]
```

### What gets scanned

Built-in patterns for API key prefixes across major providers, private key blocks, JWTs, connection strings carrying a real password, hardcoded secret assignments, Chinese national ID and mobile numbers, email addresses, private IP ranges, and internal hostnames.

Findings never carry the full matched text — a report that leaks what it found is worse than no report, so each one shows a masked excerpt and a length. Credentials and personal data block the build; internal topology only warns.

### The human gate

Automated redaction is not trustworthy enough to be the last step. After packing, `sparepack` prints the complete file manifest with byte counts and a per-file summary of what was kept, emptied, or substituted, and waits for you to type `publish` before anything is written to disk.

If you would not be comfortable posting the manifest publicly, do not confirm.

The scanner is lexical: it finds patterns, not meaning. A business rule spelled out in a comment, an internal codename you forgot to add to `redact`, a customer name that looks like an ordinary word — none of those get caught. **The manifest review is the part that actually decides what gets published.** Everything else in the tool exists to make that review possible.

### Status: implemented

`sparepack` works today and lives in its own repository: [mxx1111/sparepack](https://github.com/mxx1111/sparepack), published as [`sparepack` on npm](https://www.npmjs.com/package/sparepack).

```bash
npx sparepack init
```

It does not depend on this project — you do not need a task board to want help with your code without handing over the codebase.

### When P1 does not fit

Some tasks genuinely need the surrounding codebase — debugging an integration issue, tracking down a race condition, anything where the bug is in the interaction rather than in one function. Those go to P2.

---

## P2 · Temporary trusted access

The worker can read and copy the complete visible repository. A Codespace keeps execution
off the worker's local machine, but it does not prevent downloads or retained copies.
Revoking access stops future reads; it cannot recall code the worker already saw.

1. Requester grants collaborator access to the repository and uses branch protection to limit changes to one dedicated branch. Read access still covers the repository.
2. Worker opens a **Codespace on their own GitHub account** and runs **their own** Claude Code inside it.
3. Work happens, PR goes up, requester merges.
4. Requester removes the collaborator and deletes the branch. This ends future access only.

### Why Codespaces and not a container on the requester's machine

**Neither party runs code on the other's hardware.** This protects the worker's credentials,
not the requester's source from a worker who has already been granted access.

If the sandbox ran on the requester's hardware, the requester would be root on the box where the worker's `~/.claude/.credentials.json` is mounted. That turns a privacy feature into a credential-harvesting device — strictly worse than not doing it at all. Putting the sandbox on Microsoft's infrastructure makes it a neutral third party to both sides, and personal accounts get 60 free core-hours a month.

The cost is that your code passes through GitHub's cloud. For most projects that is already true. For the ones where it is not, see P3.

The Codespace belongs to the worker's account. Branch protection limits writes, not reads,
downloads, terminal commands, or copies to another location. Use P1 or a separate repository
containing only the minimum required code unless the worker may permanently retain everything
they can see.

### Checklist for the requester

- [ ] The worker is trusted with a permanent copy of every visible file
- [ ] A minimum-code temporary repository was considered before granting full-repository access
- [ ] Branch protection limits changes to the task branch and is not treated as read isolation
- [ ] Secrets and unrelated sensitive files are removed before access is granted
- [ ] No secrets in the repo's Codespaces secrets for that branch
- [ ] Repository-level Actions permissions reviewed before granting access
- [ ] Calendar reminder to revoke future access after merge

---

## P3 · Trust circle

Full repository access under an NDA, for people you already have a relationship with. Requires 5+ successful deliveries in the community before a worker is eligible.

### Self-hosted sandbox (not implemented)

For code that genuinely cannot go to any cloud. **There is no implementation of this today** — what follows is the requirement, not a thing you can go and use.

A container the requester hosts, with: egress allowlisted to `api.anthropic.com` plus package registries and nothing else, access granted through a per-task ephemeral credential pinned to the worker's single device, full session recording, and destruction of both container and credential when the task closes.

An earlier draft of this document pointed at a self-hosted terminal gateway as the starting point for building it. That project is no longer maintained, so the pointer has been removed rather than left to rot. If you need this tier, expect to build it, and read the warning below first — it may change your mind about wanting it.

**⚠️ Read this before using it.** In this mode the host can technically read credentials inside the container. The mitigations (session recording, ephemeral tokens, egress control) reduce the blast radius but do not eliminate that fact. Use it only where the trust already exists and both sides understand the tradeoff. If you are the worker and you do not know the requester personally, decline and ask for P1 or P2 instead.

---

## Choosing a tier

```
Is the code already public?                      → P0
Can the task be expressed as tests + interfaces? → P1   ← try hard to land here
Does it need the live codebase to reproduce?     → P2
Can the code not go to any cloud at all?         → P3, only with people you know
```

Bias toward P1. If you find yourself reaching for P2 often, the tasks are probably too large — split them.

---

# 简体中文

大部分人是拿 AI 在私有业务代码上干活的，那种代码没法往公开任务板上贴。本文件定义绕开这个问题的四种办法，按接单者能看到的信息量排序。

每个任务 issue 必须且只能声明一个级别。

---

## P0 · 公开

任务在一个本来就公开的仓库里，直接给链接就完事。

**接单者能看到：** 全部，跟任何开源贡献者一样。
**准备成本：** 零。
**适用于：** 开源维护、通用工具、算法题，以及任何"代码本身不是秘密"的场景。

本项目 Phase 0 只跑 P0。先把社会协作那套跑通，再上机械。

---

## P1 · 脱敏任务包 —— 私有项目的默认选择

思路是：**不给代码，给规约。** 接口签名、验收测试、假数据。接单者写一个能让测试通过的实现。你的业务逻辑压根没离开过你的机器。

由 `sparepack` CLI 生成：

```bash
sparepack init            # 生成一份带注释的 sparepack.yaml
sparepack pack            # 抽取 → 脱敏 → 扫描 → 人工复核 → 产出
sparepack verify <pkg>    # 从磁盘重新推导任务包并再扫一遍
```

### 白名单制

你不点名的东西一概不暴露。**没有**"排除这几个、剩下的都发出去"这种模式，因为泄露就是这么发生的。

```yaml
include:    [ "src/payment/types.ts" ]        # 原样暴露
interfaces: [ "src/payment/gateway.ts" ]      # 保留签名，清空函数体
tests:      [ "tests/payment/*.spec.ts" ]     # 这就是任务规约本身
fixtures:   { "data/orders.json": "shape:5" }   # empty | shape[:n] | rows:n | text:n
redact:     [ { pattern: "acme-corp|ACME", replace: "example-org" } ]
```

### 扫什么

内置规则覆盖各家厂商的 API key 前缀、私钥块、JWT、带真实密码的连接串、硬编码的密钥赋值、中国大陆身份证号与手机号、邮箱、内网 IP 段和内部域名。

findings 永远不含完整匹配内容——一份会泄露它所发现之物的报告，比没有报告更糟，所以每条只给遮蔽摘要和长度。凭证和个人数据会阻断构建，内网拓扑只警告。

### 人工闸门

自动脱敏没可靠到能当最后一道关。打包完成后，`sparepack` 会打印完整的文件清单（带字节数）和逐文件的处理摘要（保留了什么、清空了什么、替换了什么），然后等你敲 `publish`，在此之前不写任何东西到盘上。

判断标准很简单：这份清单你敢不敢公开贴出来。不敢就别确认。

扫描器是词法级的，它找的是模式，不是含义。写在注释里的业务规则、你忘了加进 `redact` 的内部代号、一个看起来像普通词的客户名——这些都抓不到。**真正决定什么东西被公开的，是那一步人工复核。** 工具里其余所有东西，存在的意义只是让那次复核成为可能。

### 状态：已实现

`sparepack` 现在就能用，在它自己的仓库里：[mxx1111/sparepack](https://github.com/mxx1111/sparepack)，已发布到 npm：[`sparepack`](https://www.npmjs.com/package/sparepack)。

```bash
npx sparepack init
```

它不依赖本项目——想让人帮你改代码又不想交出整个代码库，这件事本身不需要一个任务板。

### P1 搞不定的情况

有些任务确实需要周边代码库，比如排查集成问题、追一个竞态条件，凡是 bug 在"交互"而不在"某个函数"里的，都属于这类。这些走 P2。

---

## P2 · 临时受信访问

接单者可以读取并复制完整的可见仓库。Codespace 只是让执行环境不在接单者的本地机器上，
它不能阻止下载或保留副本。撤权只能阻止后续读取，无法收回接单者已经看过的代码。

1. 发布者授予接单者仓库 collaborator 权限，并用分支保护把改动限制在专用分支；读取权限仍覆盖仓库。
2. 接单者在**自己的 GitHub 账号下**开 Codespace，在里面跑**他自己的** Claude Code。
3. 干活，提 PR，发布者合并。
4. 发布者移除 collaborator、删分支。这只能终止后续访问。

### 为什么用 Codespaces 而不是发布者机器上的容器

**双方都不在对方的硬件上运行代码。** 这保护的是接单者的凭证，不是已经授权给接单者读取的源码。

如果沙箱跑在发布者的硬件上，发布者就是那台机器的 root，而接单者的 `~/.claude/.credentials.json` 正挂在里面。那样一个隐私功能就变成了凭证收割装置，比不做还糟。把沙箱放在微软的基础设施上，对双方而言它都是中立第三方，而且个人账号每月有 60 核时免费额度。

代价是代码要过 GitHub 的云。对大多数项目来说这本来就已经是事实了。不是的那些，看 P3。

Codespace 属于接单者账号。分支保护限制的是写入，不会限制读取、下载、终端命令或复制到别处。
除非你能接受接单者永久保留所有可见内容，否则应使用 P1，或单独建立只包含最低必要代码的临时仓库。

### 发布者检查清单

- [ ] 已确认接单者可以永久持有每一个可见文件的副本
- [ ] 授予完整仓库访问前，已经考虑过只放最低必要代码的临时仓库
- [ ] 分支保护只把改动限制在任务分支，没有被当作读取隔离
- [ ] 授权前已经移除密钥和无关敏感文件
- [ ] 该分支相关的 Codespaces secrets 里没有密钥
- [ ] 授权前复查过仓库级的 Actions 权限
- [ ] 设好合并后回收后续访问权限的提醒

---

## P3 · 信任圈

NDA 下的完整仓库访问，只给你已经有关系的人。接单者需要在社区内有 5 次以上成功交付才有资格。

### 自托管沙箱（尚无实现）

给那种确实不能上任何云的代码。**目前没有实现**，下面写的是要求，不是一个你可以拿来就用的东西。

一个由发布者托管的容器：出网白名单只放行 `api.anthropic.com` 和包管理源，其余一律禁止；访问权通过一次性凭据授予，并锁死接单者的单个设备；全程会话录制；任务关闭时容器和凭据一起销毁。

本文档早先的版本把一个自托管终端网关项目指为搭建它的起点。那个项目已不再维护，所以这里把指针删掉，而不是留着烂在文档里。真需要这一级的话，做好自己从头搭的准备，而且先读下面那段警告——读完你可能就不想要了。

**⚠️ 用之前必须读这段。** 这个模式下，宿主方在技术上可以读到容器内的凭证。那些缓解措施（会话录制、临时令牌、出网管控）能缩小影响范围，但消不掉这个事实。只在信任已经存在、且双方都理解这个取舍的情况下用。如果你是接单者、又不认识发布者本人，直接拒绝，要求改走 P1 或 P2。

---

## 怎么选

```
代码本来就是公开的吗？              → P0
任务能表达成「测试 + 接口」吗？      → P1   ← 尽量往这里落
必须有活的代码库才能复现吗？        → P2
代码完全不能上任何云吗？            → P3，且只跟认识的人
```

优先 P1。如果你发现自己老是想用 P2，多半是任务切得太大了，拆开。
