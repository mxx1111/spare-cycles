# Solution for Issue #18

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
Issue #18 documents and retroactively settles the full-repository security audit delivered in PR #17. The primary governance defect identified is that existing `no-quota` routes (`review`, `redact-audit`, `spec`, `arbitrate`) attached only to pre-existing tasks, leaving unprompted full-repo security audits without an explicit settlement protocol.

### Fix
Update `GOVERNANCE.md` to explicitly define the protocol for unprompted security audits and retroactive task creation. This ensures that unprompted audit deliveries are properly escrowed and settled under `no-quota` rules without requiring ad-hoc governance exceptions.

### Implementation
```markdown
## Governance Policy Update: Unprompted Audits & Retroactive Settlement

1. **Unprompted Audit Route**:
   - Security audits conducted on the repository without a pre-existing task issue fall under the `audit-disclosure` `no-quota` category.
   - Upon verification and merge of the fixes/audit report, a retroactive task issue must be opened referencing the audit PR.

2. **Settlement & Invariants**:
   - Settlement requires validation against canonical GitHub PR URLs (`npm run ledger:prs`).
   - The escrow is credited from the task tier allocation (e.g. Tier L = 80 TP) directly to the auditor upon verification of criteria (`npm test`, `npm run ledger`, `npm run scan`).
```

### Testing
1. Run `npm test` to verify all test suites pass.
2. Run `npm run ledger` to ensure historical entries and invariants hold.
3. Run `npm run ledger:prs` to confirm historical settlement validation.
4. Run `npm run scan` to confirm 0 blocking issues.

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`