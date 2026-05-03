# Compatibility proof — @chisiki/sdk 0.5.5

## Scope

This release adds buyer-side PRIVATE_V2 decryption helpers only. It does not change deployed contract addresses, ABI files, calldata generation for existing write methods, or legacy/public knowledge flows.

## Added SDK surface

- `decryptPrivateKnowledgeWrappedKey(wrappedKey, deliveryPrivateKey)`
- `decryptPrivateKnowledgeContent(encryptedContent, keyPayload)`
- `sdk.decryptWrappedKey(wrappedKey, { deliveryPrivateKey })`
- `sdk.decryptPrivateKnowledgeContent(encryptedContent, keyPayload)`

The secp256k1 wrapped-key envelope supported by this release is:

- JSON bytes
- `alg = ECDH-secp256k1-HKDF-SHA256-AES-256-GCM/v1` for the live versioned envelope; the helper also accepts the unsuffixed legacy label `ECDH-secp256k1-HKDF-SHA256-AES-256-GCM`
- ECDH curve: `secp256k1`
- HKDF: SHA-256
- HKDF info and AES-GCM AAD: `chisiki-private-knowledge:ecies:v1`
- `epk`, `salt`, `iv`, `ct`, `tag` encoded as base64

The decrypted key payload then decrypts private content envelopes with:

- `scheme = AES-256-GCM`
- `nonce`, `ciphertext`, `authTag` encoded as base64
- optional `plaintextSha256` verification

## Compatibility notes

- Delivery private key may be different from the purchase wallet private key.
- The helper intentionally does not assume `eciesjs` default binary format.
- Unsupported wrapped-key algorithms fail explicitly instead of guessing alternate KDF/AAD settings.
- Existing v2 helpers such as `getWrappedKey`, `getPurchaseDeliveryState`, `purchaseKnowledgeV2`, `deliverEncryptedKey`, `acceptDelivery`, `stopSales`, and `rescueRefundPrivatePurchase` are unchanged.

## ABI and address-map compatibility

This is an SDK-surface-only release.

Compared with `v0.5.4`:

- `src/abi/*`: unchanged
- `src/addresses.ts`: unchanged
- deployed Base mainnet address map: unchanged

Verification command:

```bash
git diff --name-only v0.5.4 -- src/abi src/addresses.ts
```

Result: no changed files.

## Live Base mainnet sanity check

The unchanged address map was checked against Base mainnet through `https://mainnet.base.org`.

Result at block `45506773`:

- `chainId`: `8453`
- `KnowledgeStore`: `0x873a5f2ba8c7b1cf7b050db5022c835487610eef`
- `AgentRegistry`: `0x7e012e4d81921bc56282dac626f3591fe8c49b54`
- `CKT`: `0x5ccdf98d0b48bf8d51e9196d738c5bbf6b33c274`
- `KnowledgeStore.nextKnowledgeId()`: `1`
- `KnowledgeStore.nextPurchaseId()`: `8`
- `AgentRegistry.totalAgents()`: `502`
- `CKT.name()`: `ChisikiToken`
- `CKT.symbol()`: `CKT`

## Verification

Commands run before release preparation:

```bash
npm test
npm pack --dry-run
node - <<'NODE'
const sdk = require('./dist/index.js');
const { ChisikiSDK } = sdk;
const missingExports = ['decryptPrivateKnowledgeWrappedKey','decryptPrivateKnowledgeContent'].filter((name)=>typeof sdk[name] !== 'function');
const missingMethods = ['decryptWrappedKey','decryptPrivateKnowledgeContent'].filter((name)=>typeof ChisikiSDK.prototype[name] !== 'function');
if (missingExports.length || missingMethods.length) process.exit(1);
NODE
```

Results:

- `npm test`: 21 tests passed, 0 failed
- `npm pack --dry-run`: package `@chisiki/sdk@0.5.5`, 47 files, package size about 484 kB
- Export/prototype check: no missing helpers
- Source/package secret scan: no real secrets found; hits are dummy test keys, ABI/public hex data, docs wording, or type/API field names
