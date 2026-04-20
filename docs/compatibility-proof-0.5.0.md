# chisiki-sdk v0.5.0 compatibility proof

This document records the evidence that `@chisiki/sdk` v0.5.0 matches the latest Chisiki protocol contracts and satisfies the release checklist relevant to the SDK.

This is the first public tag for the Knowledge v2 + latest-mainnet-sync line. The intermediate `0.5.1` working version was not tagged or released and is folded into this `0.5.0` release.

## 1. ABI parity with the latest protocol build

The SDK ABI files were compared against the latest protocol build outputs from `chisikiprotocol/out` by normalizing both sides to their parsed ABI arrays first and then hashing those arrays with SHA-256. This avoids false mismatches caused by JSON wrapper/metadata differences while still proving the callable ABI surface is identical.

| Contract | SDK ABI SHA-256 | Protocol ABI SHA-256 | Result |
|---|---|---|---|
| AgentRegistry | `e3c6e1399ba349eff49284efc088e2b4649995641885bf2c2b6bb2d4ba70efac` | `e3c6e1399ba349eff49284efc088e2b4649995641885bf2c2b6bb2d4ba70efac` | match |
| KnowledgeStore | `7b663a38e1427ea7d13ecef70dd3337b502dd4b2294956a04262a3243367b1cd` | `7b663a38e1427ea7d13ecef70dd3337b502dd4b2294956a04262a3243367b1cd` | match |
| TempoReward | `51da70dde4c17bbd18aa6a4a8e79a67bffabbdfbfa8fc2222254c694de4678f1` | `51da70dde4c17bbd18aa6a4a8e79a67bffabbdfbfa8fc2222254c694de4678f1` | match |

## 2. Base mainnet live checks

Using the SDK address map and live Base mainnet RPC:

- `chainId = 8453`
- `knowledgeStore = 0x873a5f2ba8c7b1cf7b050db5022c835487610eef`
- `nextKnowledgeId = 0`
- `nextPurchaseId = 0`
- `v2Module = 0xb00C09b496B886827B91385e5BF52986d4B95859`

The synced `KnowledgeStore` ABI also contains:

- `setV2Module(address)`
- `v2Module()`
- `deliverEncryptedKey(...)`
- `listPrivateKnowledge(...)`
- `finalizeCleanTimeout(...)`

This shows the SDK ABI matches the live module-backed `KnowledgeStore` surface after the Base mainnet upgrade.

## 3. SDK method surface checks

The built SDK prototype was checked for the required methods.

### New API present
- `setDeliveryConfig`
- `getDeliveryConfig`
- `depositSellerBaseStake`
- `withdrawSellerBaseStake`
- `listPublicKnowledgeV2`
- `listPrivateKnowledge`
- `purchaseKnowledgeV2`
- `deliverEncryptedKey`
- `acceptDelivery`
- `challengeDeliverySubjective`
- `challengeDeliveryObjective`
- `redeliverEncryptedKey`
- `finalizeCleanTimeout`
- `finalizeUndelivered`
- `getPrivateKnowledgeMeta`
- `getPurchaseDeliveryState`
- `getQualifiedMerchantStats`
- `isTrustedBuyer`

### Legacy compatibility retained
- `listKnowledge`
- `purchase`
- `deliverKnowledge`

## 4. Checklist coverage

### SDK code update checklist
- [x] `src/abi/KnowledgeStore.json` updated to latest ABI
- [x] `src/abi/AgentRegistry.json` updated to latest ABI
- [x] `src/abi/TempoReward.json` updated to latest ABI
- [x] legacy API retained
- [x] new v2 / merchant / delivery API present
- [x] existing proxy-based address map preserved

### README / docs checklist
- [x] English README updated
- [x] Japanese README updated
- [x] same-proxy / companion-module deployment note added
- [x] legacy vs v2 guidance documented

### Package artifact checklist
- [x] `docs/README_ja.md` included via package `files`
- [x] `CONTRIBUTING.md` included via package `files`
- [x] release notes and changelog updated for v0.5.0

## 5. Release conclusion

`@chisiki/sdk` v0.5.0 is aligned with the latest Chisiki protocol contract build outputs and with the current Base mainnet `KnowledgeStore` module-backed deployment, while retaining legacy SDK compatibility.
