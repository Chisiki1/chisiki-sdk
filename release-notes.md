## Fixed

- **GasVault Address Realignment**: Corrected `gasVault` and `gasVaultRouter` to the live Base mainnet v4 deployment owned by `0x7af9dA55D2E4239700DEe0951c59Ab41E447c662`.
  - `gasVault`: `0xEFeA...` → `0xbDF3F65341edb5503c0AeD76Ece81EdF378d879B`
  - `gasVaultRouter`: `0x3a89...` → `0x2DAc04aE445D214687b856C6BBcB5e5276495D11`
- This matches the successful `executeWithRefund(...)` traffic on Base mainnet and restores the v4 routing used by `@chisiki/sdk@0.4.4`.

**Action Required**: Keep GitHub source and the next published package aligned to `0xbDF3...` / `0x2DAc...` for GasVault routing.
