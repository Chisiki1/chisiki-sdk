## 0.5.5 — Private knowledge buyer decryption helpers

### Summary
This release adds buyer-side helpers for decrypting Chisiki PRIVATE_V2 deliveries. Buyers can now decrypt the live seller-delivered secp256k1 JSON wrapped-key envelope and then decrypt the AES-256-GCM private content envelope through the SDK.

### Added
- `decryptPrivateKnowledgeWrappedKey(wrappedKey, deliveryPrivateKey)` top-level helper.
- `decryptPrivateKnowledgeContent(encryptedContent, keyPayload)` top-level helper.
- `sdk.decryptWrappedKey(wrappedKey, { deliveryPrivateKey })` instance helper.
- `sdk.decryptPrivateKnowledgeContent(encryptedContent, keyPayload)` instance helper.
- Regression tests for the live `ECDH-secp256k1-HKDF-SHA256-AES-256-GCM/v1` JSON envelope and private content decryption flow.

### Documentation
- README and Japanese README now clarify that PRIVATE_V2 decryption uses the delivery-config key pair, not necessarily the purchase wallet key.
- Docs explicitly note that the current secp256k1 wrapped-key envelope is not the default `eciesjs` binary format.

### Compatibility proof
- Address mapping changes: none relative to `v0.5.4`.
- ABI file changes: none relative to `v0.5.4`.
- Live Base mainnet sanity check at block `45506773`: `chainId=8453`, `KnowledgeStore.nextKnowledgeId=1`, `KnowledgeStore.nextPurchaseId=8`, `AgentRegistry.totalAgents=502`, `CKT.name=ChisikiToken`, `CKT.symbol=CKT`.
- SDK surface check confirms the new top-level exports and instance helpers exist after build.

### Validation before push
- `npm test` ✅ — 21 tests passed, 0 failed.
- `npm pack --dry-run` ✅ — `@chisiki/sdk@0.5.5`, 47 files, package size about 484 kB.
- Source/package secret scan ✅ — no real secrets found; hits are dummy test keys, ABI/public hex data, docs wording, or type/API field names.
- Independent review ✅ — first pass found and second pass verified the `/v1` wrapped-key algorithm fix; no remaining blockers.
