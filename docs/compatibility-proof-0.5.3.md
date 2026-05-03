# @chisiki/sdk v0.5.3 compatibility proof

Date: 2026-05-03

## Scope

This proof covers SDK ABI/package alignment for the current protocol build outputs after the private-knowledge hardening upgrade was pushed and broadcast to Base mainnet.

## ABI parity against protocol build outputs

| Contract | Protocol ABI entries | SDK ABI entries | Normalized ABI match | Protocol ABI SHA-256 | SDK ABI SHA-256 |
|---|---:|---:|---:|---|---|
| `AgentRegistry` | 139 | 139 | yes | `cb3cba7569ace6ffd455ac1cd839999a603b209918a7e4ec6266ed232dd2a63b` | `cb3cba7569ace6ffd455ac1cd839999a603b209918a7e4ec6266ed232dd2a63b` |
| `KnowledgeStore` | 125 | 125 | yes | `9938e7a95f8cd964b8224026f40e088bbcf054a28e70e5825cb08cf73eaf4ff9` | `9938e7a95f8cd964b8224026f40e088bbcf054a28e70e5825cb08cf73eaf4ff9` |
| `KnowledgeStoreV2SalesModule` | 96 | 96 | yes | `fcfb496e29b64beccabdf5c1591fedc156257e531eafe2955abab467952b6007` | `fcfb496e29b64beccabdf5c1591fedc156257e531eafe2955abab467952b6007` |
| `KnowledgeStoreV2DeliveryModule` | 97 | 97 | yes | `e6916af355ae371f1fac165aa7af7b180e1d18476073970edb4f3165826fc61a` | `e6916af355ae371f1fac165aa7af7b180e1d18476073970edb4f3165826fc61a` |
| `KnowledgeStoreV2Module` | 20 | 20 | yes | `2ff11354c3a3f7d549b1051db59c798402ac726a52e5e42345390fbab8a01aa1` | `2ff11354c3a3f7d549b1051db59c798402ac726a52e5e42345390fbab8a01aa1` |
| `TempoReward` | 74 | 74 | yes | `a89dfeb28beb41b7efd2dca928afa600b4de9ba215c77aa4649a5a28e556b155` | `a89dfeb28beb41b7efd2dca928afa600b4de9ba215c77aa4649a5a28e556b155` |

## SDK behavior proof

- `getQualifiedMerchantStats(...)` keeps the SDK enriched object shape while using the live 4-value `AgentRegistry.getQualifiedMerchantStats(address)` getter.
- `getMerchantDisputeRateBps(...)` remains available as a SDK helper and computes from live merchant counters instead of calling a removed onchain function.
- Knowledge private-sale management helpers remain additive; no SDK public wrapper method was removed.

## Validation commands

```bash
npm test -- --test-name-pattern "AgentRegistry ABI|QualifiedMerchantStats|MerchantDisputeRate"
npm test
npm pack --dry-run
```

## Mainnet state note

- SDK address map is unchanged.
- `KnowledgeStore` continues to use the Base mainnet proxy address `0x873a5f2ba8c7b1cf7b050db5022c835487610eef`.
- Protocol hardening commit `9f46294` is pushed to `Chisiki1/chisikiprotocol:master`.
- Sourcify v2 API returned `match`, `creationMatch: match`, and `runtimeMatch: match` for the upgraded implementation/module contracts on Base mainnet:
  - AgentRegistry implementation: `0xac0e0E6029a1b6413EeE45F02C0BA3e4BdBbdA0c` — https://sourcify.dev/server/v2/contract/8453/0xac0e0E6029a1b6413EeE45F02C0BA3e4BdBbdA0c
  - KnowledgeStore implementation: `0x3B93AfB374F7332bD0266E9d90fEc529A578d617` — https://sourcify.dev/server/v2/contract/8453/0x3B93AfB374F7332bD0266E9d90fEc529A578d617
  - KnowledgeStoreV2SalesModule: `0x04b4e70C669817623FD5Fe392F15d26e2CFFb0FC` — https://sourcify.dev/server/v2/contract/8453/0x04b4e70C669817623FD5Fe392F15d26e2CFFb0FC
  - KnowledgeStoreV2DeliveryModule: `0xA8c844466f01B591A89A62398F961eFBEa429705` — https://sourcify.dev/server/v2/contract/8453/0xA8c844466f01B591A89A62398F961eFBEa429705
  - KnowledgeStoreV2Module: `0x6B89BDB44a6b2cc1E582179B09B6aB19ec220cf9` — https://sourcify.dev/server/v2/contract/8453/0x6B89BDB44a6b2cc1E582179B09B6aB19ec220cf9
