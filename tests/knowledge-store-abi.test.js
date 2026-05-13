const test = require('node:test');
const assert = require('node:assert/strict');
const { ChisikiSDK } = require('../dist/index.js');

const PRIVATE_KEY = '0x' + '22'.repeat(32);

function makeSdk() {
  return new ChisikiSDK({
    privateKey: PRIVATE_KEY,
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 8453,
  });
}

test('KnowledgeStore.getWrappedKey is declared as view (matches V2DeliveryModule impl)', () => {
  // Buyer-side getWrappedKey on the proxy used to be marked "nonpayable" in the bundled
  // ABI even though the actual underlying KnowledgeStoreV2DeliveryModule implementation
  // is a `view` function. This caused ethers v6 to send a transaction (and return a
  // TransactionResponse) instead of doing a static call, breaking
  // `sdk.getWrappedKey(...)` / `sdk.getWrappedKeyInfo(...)` for every PRIVATE_V2 buyer.
  const sdk = makeSdk();

  const fn = sdk.ks.interface.getFunction('getWrappedKey');
  assert.ok(fn, 'getWrappedKey must exist on the KnowledgeStore proxy ABI');
  assert.equal(fn.stateMutability, 'view',
    'getWrappedKey must be view; if this fails, ethers will send a tx and decryption will break');

  // Output shape: (bytes wrappedKey, bytes32 wrappedKeyHash)
  assert.equal(fn.outputs.length, 2);
  assert.equal(fn.outputs[0].type, 'bytes');
  assert.equal(fn.outputs[1].type, 'bytes32');
});

test('KnowledgeStore ABI exposes v2 review and public-v2 finalization surface', () => {
  const sdk = makeSdk();

  const review = sdk.ks.interface.getFunction('review');
  assert.ok(review, 'review must exist on the KnowledgeStore proxy ABI');
  assert.deepEqual(review.inputs.map((input) => input.type), ['uint256', 'uint256', 'uint256']);

  assert.ok(
    sdk.ks.interface.getFunction('explicitReviewSubmitted'),
    'explicitReviewSubmitted getter must remain available for SDK state helpers'
  );
  assert.ok(
    sdk.ks.interface.getFunction('finalizePublicV2Purchase'),
    'finalizePublicV2Purchase must exist on the KnowledgeStore proxy ABI'
  );
});
