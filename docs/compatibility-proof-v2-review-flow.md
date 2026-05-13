# Compatibility proof — v2 review/completion flow

## Scope

This compatibility note covers the SDK changes for the protocol-side PUBLIC_V2 / PRIVATE_V2 review and completion fix.

The SDK change is additive for consumers:

- `submitReview(purchaseId, productScore, sellerScore)` keeps the same calldata surface: `review(uint256,uint256,uint256)`.
- `acceptDelivery(purchaseId)` remains available and still only accepts/finalizes delivery; it does not submit a rating.
- `getPurchaseDeliveryState(purchaseId)` keeps all previous fields and adds review-state helpers.
- ABI sync preserves previously fixed live surface entries such as `getWrappedKey` as `view` and `REFUND_REASON_SELLER_CANCELLED()`.

## Added SDK surface

- `PurchaseDeliveryState.explicitReviewSubmitted`
- `PurchaseDeliveryState.reviewClosed`
- `PurchaseDeliveryState.canSubmitReview`
- `PurchaseDeliveryState.recommendedNextAction`
- `sdk.submitReviewThenAcceptDelivery(purchaseId, productScore, sellerScore)`

## Review state interpretation

`canSubmitReview` is an SDK-side estimate; the contract remains the source of truth.

It returns `true` when:

- `explicitReviewSubmitted == false`
- `getPurchase(purchaseId).delivered == true`
- delivery state is one of:
  - `2` — `DELIVERED_AWAITING_RESPONSE`
  - `5` — `REDELIVERED_AWAITING_RESPONSE`
  - `6` — `CLEAN_FINALIZED`

This covers:

- PRIVATE_V2 review before accept
- PRIVATE_V2 review after clean accept/finalization when no explicit review was submitted yet
- PUBLIC_V2 review after purchase/finalization

## ABI compatibility guard

ABI sync was performed by preserving the existing SDK ABI JSON artifacts and merging only missing additive entries from the protocol build outputs:

- `KnowledgeStore.finalizePublicV2Purchase(uint256)`
- `KnowledgeStoreV2SalesModule.finalizePublicV2Purchase(uint256)`
- `KnowledgeStoreV2DeliveryModule.review(uint256,uint256,uint256)`
- `KnowledgeStoreV2Module.finalizePublicV2Purchase(uint256)`
- `KnowledgeStoreV2Module.review(uint256,uint256,uint256)`

This avoids regressing prior SDK compatibility fixes where the clean protocol worktree does not include unrelated live/seller-refund ABI changes.

## Verified

Protocol worktree:

```bash
forge test --match-contract KnowledgeUpgradeSpecTest -vv
forge test --force -vv
npm test
BASE_MAINNET_RPC_URL=https://mainnet.base.org npm run upgrade:mainnet:dry-run
```

Results observed during implementation:

- `KnowledgeUpgradeSpecTest`: 32 passed, 0 failed
- full `forge test --force -vv`: 32 passed, 0 failed
- protocol `npm test` / storage-layout scripts: 22 passed, 0 failed
- mainnet upgrade dry-run completed; no broadcast transaction was sent

SDK worktree:

```bash
npm test
npm pack --dry-run
```

Results observed during implementation:

- SDK tests: 37 passed, 0 failed
- `npm pack --dry-run`: completed successfully

