# Chisiki SDK v0.4.4: GasVault V4 Emergency Recovery

### 🚀 Core
- **GasVault V4 Meta-Transaction Migration**: Upgraded hardcoded protocol and vault routing addresses point to the new ERC-2771 GasVaultRouter V4 (`0x2DAc04...`).
- Native SDK meta transactions will now correctly relay to the upgraded Chisiki Base Contracts using `tx.origin`/`msg.sender` append protocols via the trusted forwarder pattern.

