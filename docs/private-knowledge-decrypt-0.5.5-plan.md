# @chisiki/sdk 0.5.5 PRIVATE_V2 復号対応プラン

## 結論

0.5.5では、PRIVATE_V2購入者がSDKだけで `wrappedKey` と暗号化コンテンツを復号できるようにする。主対象は現在のlive seller monitorが配送した `ECDH-secp256k1-HKDF-SHA256-AES-256-GCM/v1` JSON envelopeで、購入wallet秘密鍵ではなくdelivery config公開鍵に対応する秘密鍵を使うことを明記する。

## 現行

- SDKには `getWrappedKey()` / `getWrappedKeyInfo()` はある。
- しかし `wrappedKey` の復号helperがない。
- READMEにはbuyer側復号コードがない。
- secp256k1 delivery configを使った場合、`eciesjs`標準形式では復号できないことが明記されていない。
- そのためbuyerがKDF/AAD/IV形式を推測する必要があり、実運用で復号詰まりが発生した。

## 新仕様

- top-level helperを追加する。
  - `decryptPrivateKnowledgeWrappedKey(wrappedKey, deliveryPrivateKey)`
  - `decryptPrivateKnowledgeContent(encryptedContent, keyPayload)`
- `ChisikiSDK` instance helperを追加する。
  - `sdk.decryptWrappedKey(wrappedKey, { deliveryPrivateKey })`
  - `sdk.decryptPrivateKnowledgeContent(encryptedContent, keyPayload)`
- secp256k1 wrapped key仕様を固定する。
  - envelope: JSON bytes
  - `alg`: `ECDH-secp256k1-HKDF-SHA256-AES-256-GCM/v1` (SDK also accepts the unsuffixed legacy label)
  - ECDH: secp256k1
  - KDF: HKDF-SHA256
  - HKDF info / AES-GCM AAD: `chisiki-private-knowledge:ecies:v1`
  - `epk`, `salt`, `iv`, `ct`, `tag`: base64
- encrypted content仕様を固定する。
  - `scheme`: `AES-256-GCM`
  - `encoding`: `base64`
  - `nonce`, `ciphertext`, `authTag`: base64
  - `plaintextSha256` があれば検証する。

## 変更方針

- contract ABI/addressは変更しない。
- 既存の販売・配送tx helperは壊さない。
- 復号helperはローカル処理のみで、txは送らない。
- delivery private keyは引数で明示指定できるようにする。
- 指定がない場合のみSDK wallet private keyを使うが、READMEでは別鍵の可能性を明記する。
- 不明なwrappedKey形式は推測せず `ChisikiError` で失敗させる。

## タスク

1. `src/index.ts` に型と復号helperを追加する。
2. `ChisikiSDK` instance methodを追加する。
3. Node regression testを追加する。
4. README / docs/README_ja.md にbuyer復号例と注意を追加する。
5. CHANGELOGに0.5.5を追加する。
6. package versionを0.5.5へ上げる。
7. `npm test` / `npm pack --dry-run` まで確認する。
8. push / tag / GitHub Release / npm publishは、マスターの明示指示まで行わない。

## テスト

- secp256k1 delivery private keyでwrappedKey JSON envelopeを復号できること。
- 復号payloadでAES-256-GCM content envelopeを復号できること。
- `plaintextSha256` が一致すること。
- SDK instance helperが明示delivery private keyを受け取って同じ結果を返すこと。
- 既存のGasVault prepared write / invite code / ABI sync testsが回帰しないこと。
