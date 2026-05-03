## 0.5.4

### Summary
This release aligns invite-code generation with the live `AgentRegistry.generateInviteCode(address intendedReferee)` contract surface. Invite codes are wallet-bound: the intended referee wallet must be known before code generation, and registration must be sent from that same wallet.

### Fixed
- Changed `sdk.generateInviteCode(...)` from the stale optional salt/no-arg wrapper to `sdk.generateInviteCode(intendedReferee)`.
- Added local address validation so SDK callers fail with `E_INVITE` before sending a transaction when the intended referee wallet is missing or invalid.
- Updated invite-related `E_INVITE` recovery guidance to mention the specified wallet flow and map `Registry: not the intended referee` to `E_INVITE`.
- Updated English and Japanese README examples to explain wallet-bound invite codes and the non-public-link behavior.

### Compatibility proof
- Address mapping changes: none.
- ABI file changes: none; the existing `AgentRegistry` ABI already exposes `generateInviteCode(address intendedReferee)`.
- Live Base mainnet check at block `45502512`: `AgentRegistry.generateInviteCode` input is `intendedReferee: address`, `AgentRegistry.totalAgents=500`, `AgentRegistry.isOpenRegistration=false`, `CKT.currentReferralBonus()=15 CKT`, `CKT.nextRegistrationBonus()=50 CKT`.
- New invite-code regression tests cover required intended-referee validation, address-normalized contract calls, event parsing, and wallet-mismatch error mapping.

### Validation before push
- `npm test` ✅
- `npm pack --dry-run` ✅
- Source/package secret scan ✅ (no real secrets; hits are dummy test keys, ABI/public addresses, docs wording, or CI secret references without values)
- Independent review ✅ (no blocking code/security issue; documentation wording clarified after review)
