const test = require('node:test');
const assert = require('node:assert/strict');
const { ChisikiSDK } = require('../dist/index.js');

const PRIVATE_KEY = '0x' + '33'.repeat(32);

function makeSdk() {
  return new ChisikiSDK({
    privateKey: PRIVATE_KEY,
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 8453,
  });
}

function stubDeliveryState(sdk, {
  state,
  explicitReviewSubmitted = false,
  delivered = true,
  reviewed = false,
  credited = false,
}) {
  sdk.ks = {
    deliveryState: async () => BigInt(state),
    deliveryAttemptCount: async () => 1n,
    purchaseDeliveryConfigSnapshot: async () => '0x' + '11'.repeat(32),
    buyerBondAmount: async () => 0n,
    creditApplied: async () => credited,
    explicitReviewSubmitted: async () => explicitReviewSubmitted,
    getPurchase: async () => ({ delivered, reviewed }),
  };
}

test('getPurchaseDeliveryState exposes explicit review and accepted-review availability', async () => {
  const sdk = makeSdk();
  stubDeliveryState(sdk, { state: 6, explicitReviewSubmitted: false, delivered: true, reviewed: true });

  const state = await sdk.getPurchaseDeliveryState(12);

  assert.equal(state.state, 6);
  assert.equal(state.explicitReviewSubmitted, false);
  assert.equal(state.reviewClosed, true);
  assert.equal(state.canSubmitReview, true);
  assert.equal(state.recommendedNextAction, 'accepted_review_available');
});

test('getPurchaseDeliveryState disables review after explicit review was submitted', async () => {
  const sdk = makeSdk();
  stubDeliveryState(sdk, { state: 6, explicitReviewSubmitted: true, delivered: true, reviewed: true });

  const state = await sdk.getPurchaseDeliveryState(12);

  assert.equal(state.canSubmitReview, false);
  assert.equal(state.recommendedNextAction, 'finalized');
});

test('getPurchaseDeliveryState recommends decrypt-and-review before accept for delivered PRIVATE_V2', async () => {
  const sdk = makeSdk();
  stubDeliveryState(sdk, { state: 2, explicitReviewSubmitted: false, delivered: true, reviewed: false });

  const state = await sdk.getPurchaseDeliveryState(13);

  assert.equal(state.canSubmitReview, true);
  assert.equal(state.recommendedNextAction, 'decrypt_and_review');
});

test('submitReview keeps review(uint256,uint256,uint256) calldata-compatible write path', async () => {
  const sdk = makeSdk();
  let args = null;
  sdk.ks = {
    review: async (purchaseId, productScore, sellerScore) => {
      args = [purchaseId, productScore, sellerScore];
      return { wait: async () => ({ hash: '0x' + '44'.repeat(32), blockNumber: 99, gasUsed: 123n, logs: [] }) };
    },
  };

  const result = await sdk.submitReview(12, 5, 4);

  assert.deepEqual(args, [12, 5, 4]);
  assert.equal(result.hash, '0x' + '44'.repeat(32));
  assert.equal(result.gasUsed, '123');
});

test('submitReviewThenAcceptDelivery runs explicit review before accept', async () => {
  const sdk = makeSdk();
  const calls = [];
  sdk.submitReview = async (purchaseId, productScore, sellerScore) => {
    calls.push(['review', purchaseId, productScore, sellerScore]);
    return { hash: '0xreview' };
  };
  sdk.acceptDelivery = async (purchaseId) => {
    calls.push(['accept', purchaseId]);
    return { hash: '0xaccept' };
  };

  const result = await sdk.submitReviewThenAcceptDelivery(12, 5, 5);

  assert.deepEqual(calls, [['review', 12, 5, 5], ['accept', 12]]);
  assert.deepEqual(result, { review: { hash: '0xreview' }, accept: { hash: '0xaccept' } });
});
