## 0.5.3

### Summary
This release completes SDK/protocol alignment after the private-knowledge hardening upgrade by resyncing the ABI bundle and keeping SDK public helpers backward-compatible.

### Fixed
- Regenerated `src/abi/AgentRegistry.json` from the current protocol build artifact.
- Updated `getQualifiedMerchantStats(...)` to consume the live 4-value getter and enrich it with seller base-stake helpers plus locally computed `disputeRateBps`.
- Updated `getMerchantDisputeRateBps(...)` to compute from current merchant counters instead of calling the removed onchain `getMerchantDisputeRateBps(address)` function.
- Resynced `TempoReward`, `KnowledgeStoreV2DeliveryModule`, and `KnowledgeStoreV2Module` ABI artifacts to keep the package ABI bundle current.

### Compatibility proof
- Runtime method removals: none from the SDK public wrapper surface.
- Address mapping changes: none.
- `KnowledgeStore` proxy address remains unchanged.
- `KnowledgeStore` / `KnowledgeStoreV2SalesModule` ABI surfaces already matched the current protocol build outputs.
- New AgentRegistry ABI drift regression tests pass.

### Validation before push
- `npm test` ✅
- `npm pack --dry-run` ✅
- Source/package secret scan ✅ (no real secrets; package hits were historical proof checklist words only)
- Independent review ✅ (no blocking code/security issue after curating commit scope)
