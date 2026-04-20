## 0.5.0

> This is the first public tag for the Knowledge v2 + latest-mainnet-sync line. The intermediate `0.5.1` working version was not tagged or released and is folded into this `0.5.0` release.

### Added
- Knowledge v2 SDK surface for seller delivery config, seller base stake, merchant stats, and trusted buyer checks.
- New v2 knowledge helpers for public/private listing, encrypted delivery, subjective/objective challenge, redelivery, and finalize flows.
- Legacy compatibility preserved for `listKnowledge()`, `purchase()`, and `deliverKnowledge()`.

### Changed
- README / README_ja now state that Base mainnet keeps the same `KnowledgeStore` proxy address while delegating v2 logic internally to a companion module.
- No SDK address migration is required for existing integrations.

### Fixed
- Regenerated `AgentRegistry`, `KnowledgeStore`, and `TempoReward` ABIs from the latest protocol build outputs.
- `KnowledgeStore` ABI now includes `v2Module()` and `setV2Module(address)` so the SDK matches the live post-upgrade contract surface.

### Proof of latest contract compatibility
- Normalized ABI-array SHA-256 matched between SDK `src/abi/*.json` and protocol build outputs in `chisikiprotocol/out/*/*.json` (compare the parsed ABI arrays, not raw file bytes / metadata wrappers):
  - `AgentRegistry`: `e3c6e1399ba349eff49284efc088e2b4649995641885bf2c2b6bb2d4ba70efac`
  - `KnowledgeStore`: `7b663a38e1427ea7d13ecef70dd3337b502dd4b2294956a04262a3243367b1cd`
  - `TempoReward`: `51da70dde4c17bbd18aa6a4a8e79a67bffabbdfbfa8fc2222254c694de4678f1`
- Base mainnet live checks from SDK addresses passed:
  - chainId `8453`
  - `knowledgeStore = 0x873a5f2ba8c7b1cf7b050db5022c835487610eef`
  - `nextKnowledgeId = 0`
  - `nextPurchaseId = 0`
  - `v2Module = 0xb00C09b496B886827B91385e5BF52986d4B95859`
- Verified SDK methods exist for the latest contracts:
  - `setDeliveryConfig`, `depositSellerBaseStake`, `withdrawSellerBaseStake`
  - `listPublicKnowledgeV2`, `listPrivateKnowledge`, `purchaseKnowledgeV2`
  - `deliverEncryptedKey`, `acceptDelivery`, `challengeDeliverySubjective`, `challengeDeliveryObjective`, `redeliverEncryptedKey`, `finalizeCleanTimeout`, `finalizeUndelivered`
  - `getPrivateKnowledgeMeta`, `getPurchaseDeliveryState`, `getQualifiedMerchantStats`, `isTrustedBuyer`
  - legacy `listKnowledge`, `purchase`, `deliverKnowledge`

### Checklist evidence
- [x] README 英語版更新
- [x] README 日本語版更新
- [x] ABI 再同期（AgentRegistry / KnowledgeStore / TempoReward）
- [x] 最新 `KnowledgeStore` module-backed upgrade 対応
- [x] legacy API 維持
- [x] new API 追加
- [x] package artifact に `docs/README_ja.md` / `CONTRIBUTING.md` を同梱
- [x] build / package / leak audit / independent review を release 前に実施
