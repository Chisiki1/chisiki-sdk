## 0.5.1

### Summary
This release adds an additive prepared-write API so `chisiki-cli` can support `qa post-question --with-gasvault` without duplicating calldata/approval logic outside the SDK.

### Added
- `preparePostQuestion(ipfsCID, tags, rewardCKT, deadlineHours)`
- `executePrepared(prepared, { transport, autoApprove, requireGasVault, gasLimit })`
- Public helper types:
  - `PreparedWrite`
  - `ApprovalRequirement`
  - `ExecutePreparedOptions`
  - `ChisikiTransport`
- Regression tests for prepared writes, direct execution, stale approval refresh, and backward-compatible `postQuestion()` behavior

### Changed
- `postQuestion()` now internally delegates to the prepared-write flow while preserving its existing signature and default direct + auto-approve behavior.
- `executePrepared()` re-checks live allowance before rejecting in `autoApprove: false` mode, preventing false failures from stale approval snapshots.
- GasVault docs now describe routed execution as a refund / partial reimbursement path rather than guaranteed strict gaslessness.

### Compatibility proof
- No ABI files under `src/abi/` changed relative to `v0.5.0`.
- No address mappings changed relative to `v0.5.0`.
- Public API removals: none.
- Public API additions: `preparePostQuestion`, `executePrepared`, `PreparedWrite`, `ApprovalRequirement`, `ExecutePreparedOptions`, `ChisikiTransport`.
- Live Base mainnet read checks passed on the current SDK address map:
  - `chainId = 8453`
  - `qaEscrow = 0x12dc6fbaa22d38ebbec425ba76db82f0c8594306`
  - `nextQuestionId = 36`
  - `knowledgeStore = 0x873a5f2ba8c7b1cf7b050db5022c835487610eef`
  - `nextKnowledgeId = 0`
  - `nextPurchaseId = 0`
  - `gasVaultRouter = 0x2DAc04aE445D214687b856C6BBcB5e5276495D11`

### Validation
- `npm test` ✅
- `npm pack --dry-run` ✅
- secret leak audit ✅
- independent review ✅
