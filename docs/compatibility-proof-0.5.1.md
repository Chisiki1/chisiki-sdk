# chisiki-sdk v0.5.1 compatibility proof

This document records the evidence that `@chisiki/sdk` v0.5.1 preserves existing SDK behavior while adding the prepared-write transport API needed for CLI GasVault routing.

## 1. Release scope: SDK-surface-only change

Relative to `v0.5.0`, this release changes only:

- `src/index.ts`
- `package.json`
- `package-lock.json`
- `README.md`
- `docs/README_ja.md`
- `CHANGELOG.md`
- `release-notes.md`
- `tests/gasvault-prepared-write.test.js` (new)

Important non-changes:

- No files under `src/abi/` changed
- `src/addresses.ts` did not change
- No deployed contract address constants changed

This means `v0.5.1` is an additive SDK/API release, not a protocol-sync or address-migration release.

## 2. Public API compatibility checks

The current `src/index.ts` was compared against `git show v0.5.0:src/index.ts`.

### Removed public methods
- none

### Added public methods
- `preparePostQuestion`
- `executePrepared`

### Removed exported types/interfaces
- none

### Added exported types/interfaces
- `ApprovalRequirement`
- `ChisikiTransport`
- `ExecutePreparedOptions`
- `PreparedWrite`

### Backward-compatibility conclusion
`postQuestion()` remains present with the same public signature and default behavior. Existing integrations that already call `postQuestion()` continue to use direct execution with auto-approval unless they explicitly opt into the new prepared-write flow.

## 3. Runtime behavior checks

Built SDK prototype checks confirmed the presence of both legacy and new relevant methods:

- `postQuestion`
- `preparePostQuestion`
- `executePrepared`
- `executeWithRefund`
- `depositGasVault`
- `getGasVaultBalance`

In addition, `executePrepared()` now refreshes live allowance before rejecting in `autoApprove: false` mode, which prevents false failures when a CLI or user satisfies approval after the preparation step.

## 4. Live Base mainnet address-map checks

Using the SDK's current Base mainnet address map and live RPC (`https://mainnet.base.org`):

- `chainId = 8453`
- `qaEscrow = 0x12dc6fbaa22d38ebbec425ba76db82f0c8594306`
- `nextQuestionId = 36`
- `knowledgeStore = 0x873a5f2ba8c7b1cf7b050db5022c835487610eef`
- `nextKnowledgeId = 0`
- `nextPurchaseId = 0`
- `gasVaultRouter = 0x2DAc04aE445D214687b856C6BBcB5e5276495D11`

These checks confirm that the unchanged address map still resolves against live Base mainnet for the contracts touched by the existing SDK flows and the new GasVault-oriented routing helpers.

## 5. Regression validation

### Test suite
Ran:

```bash
npm test
```

Result:
- 5 tests passed
- 0 failed

Covered cases:
- prepared question write metadata / calldata generation
- direct execution path with auto-approval
- GasVault execution rejection when approval is genuinely missing
- stale approval snapshot refresh before GasVault execution
- backward-compatible `postQuestion()` delegation

### Package validation
Ran:

```bash
npm pack --dry-run
```

Result:
- package version: `0.5.1`
- tarball name: `chisiki-sdk-0.5.1.tgz`
- expected docs and build artifacts included

## 6. Secret leak audit

### Working tree / history
Scanned the working tree and git history for:

- `privateKey`
- `PRIVATE_KEY`
- `CHISIKI_PK`
- `mnemonic`
- `seed phrase`
- `BEGIN PRIVATE KEY`
- `BEGIN RSA PRIVATE KEY`
- `0x[a-fA-F0-9]{64}`

Findings were limited to:
- documented placeholders such as `process.env.CHISIKI_PK` and `'0x...'`
- type declarations such as `privateKey: string`
- deterministic test-only dummy key material in `tests/gasvault-prepared-write.test.js`
- ABI JSON files containing normal on-chain constant values

No real private key, mnemonic, PEM block, or committed `.env` file was found.

### Packaged artifact
Created a local tarball with `npm pack --silent`, scanned its contents, then removed it.

Result:
- `real_count = 0`
- all matches were classified as placeholders/docs/runtime code references or ABI JSON content

## 7. Independent review

An isolated reviewer inspected the local diff and flagged one real issue:
- stale approval snapshots could incorrectly block `gasvault + autoApprove:false`

That issue was fixed by re-checking live allowance inside `executePrepared()` before rejection.

Post-fix validation was rerun (`npm test`), and the release candidate remained green.

## 8. Release conclusion

`@chisiki/sdk` v0.5.1 is an additive, backward-compatible SDK release for prepared-write / GasVault CLI orchestration.

It does **not** change protocol ABI files or contract addresses, preserves existing `postQuestion()` behavior for current users, and adds explicit opt-in APIs for callers that need to choose direct vs GasVault transport after SDK-owned calldata generation.
