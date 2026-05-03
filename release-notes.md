## 0.5.6 — Seller-initiated undelivered PRIVATE_V2 refunds

### Summary
This release syncs the SDK with the latest live/protocol KnowledgeStore refund surface for PRIVATE_V2 purchases. Sellers can now prepare or execute a pre-delivery refund when a private purchase cannot or should not be delivered before the first encrypted key is sent.

The refund path returns buyer escrow plus buyer bond and does not credit seller payout/merchant success, including the explicit seller-cancelled reason.

### Added
- `UNDELIVERED_REFUND_REASONS` stable reason constants:
  - `INVALID_DELIVERY_CONFIG = 1`
  - `UNSUPPORTED_BUYER_KEY = 2`
  - `STALE_OR_INCONSISTENT_BUYER_TX = 3`
  - `SELLER_CANCELLED = 4`
- `sdk.prepareRefundUndeliveredPurchase(purchaseId, reason)` for prepared calldata / GasVault-compatible integration paths.
- `sdk.refundUndeliveredPurchase(purchaseId, reason)` as the backward-compatible direct execution helper.
- Read helpers:
  - `sdk.isUndeliveredSellerRefundApplied(purchaseId)`
  - `sdk.getUndeliveredRefundReason(purchaseId)`
  - `sdk.getSellerUndeliveredRefundCount(seller)`
  - `sdk.getBuyerUndeliveredRefundReceivedCount(buyer)`
  - `sdk.getKnowledgeUndeliveredRefundCount(knowledgeId)`

### Changed
- Resynced KnowledgeStore-related ABI artifacts from the latest protocol build outputs:
  - `src/abi/KnowledgeStore.json`
  - `src/abi/KnowledgeStoreV2Module.json`
  - `src/abi/KnowledgeStoreV2SalesModule.json`
  - `src/abi/KnowledgeStoreV2DeliveryModule.json`
- README and Japanese README now document the seller pre-delivery refund path for PRIVATE_V2 purchases.
- `KnowledgeStoreV2Module.json` now follows the current protocol artifact and includes the additive `refundUndeliveredPurchase(...)` selector; sales and delivery selectors remain available through the combined SDK `KnowledgeStore` interface.

### Compatibility proof
- No deployed SDK address-map migration is required; `KnowledgeStore` keeps the same Base mainnet proxy address.
- Normalized ABI-array SHA-256 and exact artifact-file checks match the current protocol build outputs for the resynced KnowledgeStore ABI files.
- Live Base mainnet readback at block `45514211`:
  - `chainId = 8453`
  - `KnowledgeStore = 0x873a5f2ba8c7b1cf7b050db5022c835487610eef`
  - `KnowledgeStore` implementation slot = `0xa3842c02d392eee9163bfc72b86c5834906c8438`
  - `v2Module = 0x7E32fECd6caeD248C6a81C441727f7b2EB836527`
  - `nextKnowledgeId = 1`
  - `nextPurchaseId = 8`
  - refund reason constants read back as `1`, `2`, `3`, `4`
- Sourcify v2 verification:
  - KnowledgeStore implementation `0xa3842c02d392eee9163bfc72b86c5834906c8438`: `match/exact_match`, `creationMatch/exact_match`, `runtimeMatch/exact_match`
  - v2Module `0x7E32fECd6caeD248C6a81C441727f7b2EB836527`: `match`, `creationMatch`, `runtimeMatch`
  - proxy address itself returns Sourcify 404, so implementation-slot verification is recorded instead.
- SDK surface check confirms the new helpers and required contract interface selectors exist after build.

### Validation before push
- `forge test --match-path test/KnowledgeUpgradeSpec.t.sol` ✅ — protocol upgrade spec tests passed before ABI sync.
- `npm test` ✅ — 21 tests passed, 0 failed after adding refund regression coverage.
- Full pack, package secret scan, and independent review are part of the final push gate and should be re-run after this release-note update.
