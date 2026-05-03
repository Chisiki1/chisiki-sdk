# Compatibility proof — @chisiki/sdk 0.5.6

## Scope

This release syncs the SDK with the latest live/protocol KnowledgeStore seller-initiated undelivered-refund surface for PRIVATE_V2 purchases.

It is additive for SDK consumers:

- no SDK address-map migration
- no removal of existing public methods
- existing direct methods remain available
- new prepared/direct refund helpers and read helpers are added
- KnowledgeStore ABI artifacts are resynced to the current protocol build outputs

## Added SDK surface

- `UNDELIVERED_REFUND_REASONS`
- `sdk.prepareRefundUndeliveredPurchase(purchaseId, reason)`
- `sdk.refundUndeliveredPurchase(purchaseId, reason)`
- `sdk.isUndeliveredSellerRefundApplied(purchaseId)`
- `sdk.getUndeliveredRefundReason(purchaseId)`
- `sdk.getSellerUndeliveredRefundCount(seller)`
- `sdk.getBuyerUndeliveredRefundReceivedCount(buyer)`
- `sdk.getKnowledgeUndeliveredRefundCount(knowledgeId)`

Stable reason constants:

| SDK constant | Value | Meaning |
| --- | ---: | --- |
| `UNDELIVERED_REFUND_REASONS.INVALID_DELIVERY_CONFIG` | `1` | Delivery config is invalid or unusable. |
| `UNDELIVERED_REFUND_REASONS.UNSUPPORTED_BUYER_KEY` | `2` | Buyer key/capability cannot be supported. |
| `UNDELIVERED_REFUND_REASONS.STALE_OR_INCONSISTENT_BUYER_TX` | `3` | Buyer transaction context is stale or inconsistent. |
| `UNDELIVERED_REFUND_REASONS.SELLER_CANCELLED` | `4` | Seller chooses to cancel before first delivery. |

Protocol behavior documented by the SDK:

- the seller refund path is only for pre-delivery PRIVATE_V2 purchases
- it returns buyer escrow plus buyer bond
- it does not apply seller payout or merchant success credit
- it records seller/buyer/knowledge refund counters and a reason code

## ABI parity against protocol build outputs

The protocol build was refreshed before the SDK ABI sync with:

```bash
PATH=/home/PC_User/.foundry/bin:$PATH forge test --match-path test/KnowledgeUpgradeSpec.t.sol
```

Result: 29/29 protocol upgrade spec tests passed.

The SDK ABI files below were then compared against the current protocol artifacts using exact file equality and normalized ABI-array SHA-256. The normalized hash is computed from the parsed `abi` array, not raw artifact metadata.

| Contract artifact | Exact file match | Normalized ABI hash |
| --- | --- | --- |
| `KnowledgeStore` | yes | `ed5938a80e2ae2490cc3ea2ee3fdf87c8c445cf747744a215e5a9652a6eb4fb7` |
| `KnowledgeStoreV2Module` | yes | `460e945942536c37c46c0e33f2c307568b8637ea5f758bfa36795516cafc75db` |
| `KnowledgeStoreV2SalesModule` | yes | `f4a11bb10ec526051fd33bdfc2a881c3901d485e34fc88a36b6fd9fd47aff5f7` |
| `KnowledgeStoreV2DeliveryModule` | yes | `32344c2bbf78bba8f655179d964269a8dd3b737c1dbc6d18a25cc434861dcb72` |

`KnowledgeStoreV2Module.json` is copied from the current protocol artifact and includes the additive `refundUndeliveredPurchase(...)` selector. Sales and delivery selectors remain available in the combined SDK `KnowledgeStore` interface through the SalesModule and DeliveryModule ABI artifacts.

## Live Base mainnet readback

Checked through `https://mainnet.base.org` at block `45514211`.

| Item | Result |
| --- | --- |
| `chainId` | `8453` |
| `KnowledgeStore` proxy | `0x873a5f2ba8c7b1cf7b050db5022c835487610eef` |
| EIP-1967 implementation slot | `0xa3842c02d392eee9163bfc72b86c5834906c8438` |
| `KnowledgeStore.nextKnowledgeId()` | `1` |
| `KnowledgeStore.nextPurchaseId()` | `8` |
| `KnowledgeStore.v2Module()` | `0x7E32fECd6caeD248C6a81C441727f7b2EB836527` |
| `REFUND_REASON_INVALID_DELIVERY_CONFIG()` | `1` |
| `REFUND_REASON_UNSUPPORTED_BUYER_KEY()` | `2` |
| `REFUND_REASON_STALE_OR_INCONSISTENT_BUYER_TX()` | `3` |
| `REFUND_REASON_SELLER_CANCELLED()` | `4` |

Sourcify v2 checks:

| Address | Result |
| --- | --- |
| KnowledgeStore implementation `0xa3842c02d392eee9163bfc72b86c5834906c8438` | `match=exact_match`, `creationMatch=exact_match`, `runtimeMatch=exact_match` |
| v2Module `0x7E32fECd6caeD248C6a81C441727f7b2EB836527` | `match=match`, `creationMatch=match`, `runtimeMatch=match` |
| KnowledgeStore proxy `0x873a5f2ba8c7b1cf7b050db5022c835487610eef` | Sourcify v2 returned 404 for the proxy address, so the implementation-slot result above is used as verification evidence. |

## SDK method and interface checks

The built SDK was checked for required additive methods:

```js
const requiredMethods = [
  'prepareRefundUndeliveredPurchase',
  'refundUndeliveredPurchase',
  'isUndeliveredSellerRefundApplied',
  'getUndeliveredRefundReason',
  'getSellerUndeliveredRefundCount',
  'getBuyerUndeliveredRefundReceivedCount',
  'getKnowledgeUndeliveredRefundCount',
  'prepareRescueRefundPrivatePurchase',
  'rescueRefundPrivatePurchase',
  'prepareSetSaleLimit',
  'prepareStopSales',
  'prepareReopenSales',
];
```

Result: no missing SDK prototype methods.

The combined `KnowledgeStore` interface was checked for required live selectors/constants:

```js
const requiredInterface = [
  'refundUndeliveredPurchase',
  'undeliveredSellerRefundApplied',
  'undeliveredRefundReason',
  'sellerUndeliveredRefundCount',
  'buyerUndeliveredRefundReceivedCount',
  'knowledgeUndeliveredRefundCount',
  'REFUND_REASON_SELLER_CANCELLED',
];
```

Result: no missing interface functions/constants.

## Regression tests

Added/updated Node regression tests cover:

- ABI surface includes seller-initiated undelivered refund methods and constants
- `prepareRefundUndeliveredPurchase(...)` emits the expected calldata target/kind without token approvals
- `refundUndeliveredPurchase(...)` preserves the existing direct execution default through `executePrepared(...)`
- read helpers map live getter types and normalize wallet addresses where appropriate

Current result before this proof update:

```bash
npm test
```

Result: 21 tests passed, 0 failed.

## Remaining public-release gate

Before push/tag/release, re-run the final verification bundle after all docs are committed in the working tree:

- `npm test`
- `npm pack --dry-run`
- source-tree and packed-tarball secret scan
- `git diff --check`
- independent review

No push/tag/GitHub Release/npm publish should be performed until the user approves that step.
