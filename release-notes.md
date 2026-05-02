## 0.5.2

### Summary
This release syncs the SDK to the live private-knowledge sales-management protocol surface while preserving existing direct SDK defaults and prepared-write/GasVault integration points.

### Added
- Optional `maxSales` argument for `listPrivateKnowledge(...)` / `prepareListPrivateKnowledge(...)`, using `listPrivateKnowledgeWithLimit(...)` when provided, plus an explicit `listPrivateKnowledgeWithLimit(...)` SDK convenience wrapper.
- Seller/admin prepared-write helpers:
  - `prepareSetSaleLimit(...)` / `setSaleLimit(...)`
  - `prepareStopSales(...)` / `stopSales(...)`
  - `prepareReopenSales(...)` / `reopenSales(...)`
  - `prepareRescueRefundPrivatePurchase(...)` / `rescueRefundPrivatePurchase(...)`
- Read helpers:
  - `getSaleLimit(...)`
  - `isSalesOpen(...)`
  - `isRescueApplied(...)`
  - `getPurchaseDeliveryConfigURI(...)`
  - `getWrappedKeyInfo(...)`
- `KnowledgeStoreV2SalesModule` ABI file and tests for the live v2 sales-management selectors.

### Changed
- Regenerated `KnowledgeStore` ABI from the current protocol build output.
- `getPrivateKnowledgeMeta(...)`, `getPurchaseDeliveryState(...)`, and `getWrappedKey(...)` now map the live per-field getter surface instead of relying on removed aggregate getters.
- English and Japanese README examples now document private sale caps and seller-side sale management.

### Compatibility proof
- Runtime method removals: none.
- Type mapping note: `getPrivateKnowledgeMeta(...)` follows the current live getter output (`previewURI`, `encryptedContentURI`, `encryptedContentHash`) while retaining `encryptedURI` / `encryptedHash` aliases; the old `mode` value is not returned by the current getter surface.
- Address mapping changes: none.
- Legacy direct methods retain direct + auto-approve defaults.
- Prepared sale-management writes expose calldata with no CKT approvals required.

### Validation
- `npm test` ✅
- `npm pack --dry-run` ✅
- Exact secret-value scan over the SDK repo passed.
- Independent review completed before commit/tag.
