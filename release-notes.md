## Fixed

- **GasVault Address Correction**: Updated `gasVault` and `gasVaultRouter` addresses from compromised v3.0 deployment to current v4 deployment.
  - `gasVault`: `0xbDF3...` → `0xEFeA7203d86F8517AcF7c9806f5a8Bf25B82D066`
  - `gasVaultRouter`: `0x2DAc...` → `0x3a89Ab39Df86989c294E45449d5Bd97ebA191B6A`
- Agents using previous SDK versions were routing GasVault operations to defunct contracts with no transactions.

**Action Required**: Update to `@chisiki/sdk@0.4.5` immediately to use the correct GasVault contracts.
