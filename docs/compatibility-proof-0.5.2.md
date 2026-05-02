# chisiki-sdk v0.5.2 compatibility proof

This document records the evidence that `@chisiki/sdk` v0.5.2 preserves existing SDK behavior while adding the private knowledge sales-management SDK surface now live on the module-backed KnowledgeStore mainnet proxy.

## Scope

### Added SDK surface

- Optional sale cap support for private listings:
  - `prepareListPrivateKnowledge(..., maxSales?)`
  - `listPrivateKnowledge(..., maxSales?)`
  - `listPrivateKnowledgeWithLimit(...)` convenience wrapper
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
- ABI bundle:
  - `src/abi/KnowledgeStoreV2SalesModule.json`
  - combined KnowledgeStore interface includes both proxy ABI and sales-module ABI for calldata generation.

### Changed SDK mapping

- `src/abi/KnowledgeStore.json` regenerated from the current protocol build output.
- `getPrivateKnowledgeMeta(...)`, `getPurchaseDeliveryState(...)`, and `getWrappedKey(...)` map the live per-field getter surface rather than removed aggregate getters.

### Not changed

- Contract address mappings: unchanged.
- Existing direct method defaults: unchanged (`transport: "direct"`, `autoApprove: true`).
- Existing prepared-write/GasVault API: unchanged and covered by regression tests.
- Runtime method removals: none.
- Type mapping note: `getPrivateKnowledgeMeta(...)` follows the current live getter output (`previewURI`, `encryptedContentURI`, `encryptedContentHash`) while retaining `encryptedURI` / `encryptedHash` aliases; the old `mode` value is not returned by the current getter surface.

## ABI evidence

Compared SDK ABI files against the protocol build output:

- `KnowledgeStore.json`
  - exact file match: `true`
  - sha256: `266684a2e93a646f6a7c4ded7212643c97986287eb215a4402f0584e84b4d147`
- `KnowledgeStoreV2SalesModule.json`
  - exact file match: `true`
  - sha256: `33134ceeff6ad70c7a3ed360571de609b8b6031b53178873c6c7a748c0ad3c86`

## Regression tests

Command:

```bash
npm test
```

Result:

- build: passed (`tsc`)
- tests: 12 passed, 0 failed

Covered behaviors include:

- existing `preparePostQuestion(...)` prepared-write metadata and receipt parsing
- existing `executePrepared(...)` direct/GasVault approval handling
- existing `postQuestion(...)` backward-compatible direct flow
- KnowledgeStore ABI has required sales-management functions and no removed aggregate getter assumption
- sale-limited private listing calldata, approval metadata, and receipt parsing
- `listPrivateKnowledge(...)` direct default behavior
- `listPrivateKnowledgeWithLimit(...)` convenience wrapper behavior
- sale-management prepared calldata with no CKT approvals
- sale-management direct wrapper defaults
- sales-management read helper mappings

## Package artifact check

Command:

```bash
npm pack --dry-run
```

Result:

- package: `@chisiki/sdk@0.5.2`
- tarball: `chisiki-sdk-0.5.2.tgz`
- total files: 40
- package size: approximately 331 kB
- unpacked size: approximately 2.0 MB

The tarball shasum is intentionally not pinned inside this file because this proof document is itself included in the package; changing the proof would change the shasum. Use the final `npm pack --dry-run` output at release time as the authoritative shasum.

The package file allowlist was narrowed from `docs` to `docs/*.md` so repo-local handoff `.txt` files are not accidentally shipped.

## Compatibility verdict

`@chisiki/sdk` v0.5.2 is an additive release for private knowledge sales-management support. It does not change address mappings, does not remove public APIs, and preserves the existing prepared-write/GasVault and direct execution behavior verified in v0.5.1.
