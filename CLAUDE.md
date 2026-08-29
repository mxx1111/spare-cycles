# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Spare Cycles is a mutual-aid task board run entirely on GitHub — no server, no website. Since the
sparepack split, the only code left here is `ledger/`: an append-only Task Point (TP) ledger and its
verifier. Everything else (`README*.md`, `GOVERNANCE.md`, `COMPLIANCE.md`, `PRIVACY-TIERS.md`,
`PHASE-0.md`, `profiles/`, `templates/`, `.github/ISSUE_TEMPLATE/`) is the protocol itself.

The docs are not commentary on the code — the code enforces the docs. The ledger's schema exists to
make a written rule impossible to break, so read the relevant doc before changing behaviour.

**`sparepack` lives in its own repository now**: [mxx1111/sparepack](https://github.com/mxx1111/sparepack),
published to npm. It used to be `packages/sparepack/` here; it was split out with `git subtree split`
(history preserved) because the tool stands on its own while the task board is still unproven. Do not
re-add it here. That repo releases itself from a version tag via GitHub Actions and npm trusted
publishing; its `RELEASE.md` is the reference, and nothing about publishing it belongs in this repo.

The project is in **Phase 0**: five real tasks run by hand to find out whether anyone claims them.
There is no bot and no task-lifecycle automation — `/claim`, settlement, and rate limits are all
done by hand. Do not build the bot or the lifecycle workflows unless asked; `PHASE-0.md` explains
why that is a deliberate hold, not a gap.

**Two CI workflows do exist** (`.github/workflows/`), and they are not lifecycle automation. They
exist because COMPLIANCE.md claimed several red lines were "enforced by CI rather than by trust"
while `.github/workflows/` did not exist at all — the enforcement table was describing a system
nobody had built. `ci.yml` runs tests, checks the ledger snapshot, scans tracked files for
credentials, and requires the PR attestation. `compliance.yml` scans issue and comment text for
credentials and quota-denominated pricing. The enforcement table in COMPLIANCE.md now marks each
row live or not enforced; keep it honest when you change either workflow.

## Commands

Node ≥ 22, ESM (`"type": "module"`), no build step and no linter. One devDependency: `sparepack`,
used by the credential scanner so that "what counts as a secret" has a single definition instead of
a copy here that drifts from the original. That is the whole reason for the dependency; if you find
yourself adding a second one, question it.

```bash
npm test                     # ledger verifier + pricing rules
npm run ledger               # verify ledger.jsonl, print balances (exit 1 = tampering)
npm run ledger:write         # verify and rewrite balances.json
npm run scan                 # scan tracked files for credentials (exit 1 = blocking finding)

# scan one piece of submitted text the way compliance.yml does
printf '%s' "$BODY" | node scripts/scan-text.mjs

# a single test by name
node --test --test-name-pattern "escrow" ledger/verify.test.mjs

# verify a fixture ledger instead of the real one (writes <path>.balances.json)
node ledger/verify.mjs /path/to/fixture.jsonl
```

## Ledger

`ledger/ledger.jsonl` is append-only: never edit, delete, or reorder a line. Corrections are new
compensating entries. `balances.json` is derived output — if it disagrees with the recomputation,
the recomputation is right and something tampered with the file.

Six transaction types only: `grant`, `escrow`, `settle`, `refund`, `split`, `adjust`. **There is no
`transfer` and never will be** — that is COMPLIANCE red line 5 (TP are not transferable) expressed
as a data structure instead of a promise, and `verify.mjs` treats any unrecognised type as
tampering. Balances and escrow are checked incrementally at every entry, so a history that dips
negative mid-way and recovers is invalid. Schema and the eleven invariants are in `ledger/README.md`.

Settling a task by hand: append the entry, run `npm test` and `npm run ledger:write`, then update
`profiles/<handle>.md`.

## The compliance red lines

`COMPLIANCE.md` is the hard boundary and it constrains code, not just conduct. Never implement,
suggest, or accept a contribution that shares credentials, routes anyone's requests through another
person's account, prices work in tokens or quota, enables headless auto-claiming, or makes TP
transferable between users. Workers do the work themselves on their own subscription and hand over
a PR; **this repo never hosts anyone's code** — a P1 task ships as a separate public repo produced
by sparepack, and only the task issue lives here.

## Conventions

- **Bilingual docs.** Top-level protocol docs carry English then 简体中文, usually with an anchor
  link between them (`README.md` ↔ `README.zh-CN.md`, others split by `---` and a `# 简体中文`
  heading). When editing one language, update the other — they are the same document, not a
  translation appendix.
- **Docs describe what exists.** PRIVACY-TIERS.md once described container-based verification,
  a `faker:` fixture syntax, and a gitleaks integration, none of which were ever implemented; that
  drift was corrected in 39e772e. Planned behaviour belongs in PHASE-0.md, not in the tier spec.
- **Comments and commit bodies explain the choice, not the mechanism.** Commits are conventional
  commits with a Chinese subject and a body stating which of two designs was taken and what goes
  wrong under the other one.
- Tests are `node:test` + `node:assert/strict`, no framework.
