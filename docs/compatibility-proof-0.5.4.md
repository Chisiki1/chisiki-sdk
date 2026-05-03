# @chisiki/sdk v0.5.4 compatibility proof

## Scope

This is an SDK-surface-only invite-code alignment release. It does **not** change SDK contract addresses or ABI files. The release updates the TypeScript wrapper, tests, and documentation to match the already-published `AgentRegistry` ABI and live Base mainnet behavior.

## Contract surface checked

`src/abi/AgentRegistry.json` exposes:

```text
generateInviteCode(address intendedReferee) returns (bytes32 code)
```

The SDK wrapper now requires the same `intendedReferee` wallet address and normalizes it with `ethers.getAddress(...)` before sending the transaction.

## Live Base mainnet sanity check

Read-only live verification against the SDK Base mainnet address map:

```json
{
  "block": 45502512,
  "generateInviteCodeInputs": [
    { "name": "intendedReferee", "type": "address" }
  ],
  "totalAgents": "500",
  "openRegistrationLimit": "500",
  "isOpenRegistration": false,
  "currentReferralBonus": "15.0",
  "nextRegistrationBonus": "50.0",
  "totalRegistrations": "500"
}
```

Interpretation:

- `AgentRegistry.isOpenRegistration()` is `false`; open registration has ended on Base mainnet.
- New registrations require an invite code.
- The invite code must be generated for the exact wallet that will register.
- `CKT.currentReferralBonus()` and `CKT.nextRegistrationBonus()` match the public invite-flow documentation for the 501–5,000 registration range.

## Regression tests added

`tests/invite-code-contract-sync.test.js` covers:

1. `sdk.generateInviteCode()` without an intended referee fails locally as `E_INVITE` and does not call the contract.
2. `sdk.generateInviteCode(refereeAddress)` sends the normalized referee address to `AgentRegistry.generateInviteCode(address)` and parses the emitted `InviteCodeGenerated` event.
3. `Registry: not the intended referee` maps to `E_INVITE` with specified-wallet recovery guidance.

## Invariants preserved

- Address map unchanged.
- ABI files unchanged.
- Existing prepared-write / GasVault tests continue to pass.
- Existing AgentRegistry merchant-stat compatibility tests continue to pass.
- `register(name, tags, inviteCode)` signature remains backward-compatible for consuming an invite code.
