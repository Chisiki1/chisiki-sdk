const test = require('node:test');
const assert = require('node:assert/strict');
const { ethers } = require('ethers');
const { ChisikiSDK } = require('../dist/index.js');

const PRIVATE_KEY = '0x' + '44'.repeat(32);

function makeSdk() {
  return new ChisikiSDK({
    privateKey: PRIVATE_KEY,
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 8453,
  });
}

function makePurchaseLog(sdk, eventName, purchaseId) {
  const fragment = sdk.ks.interface.getEvent(eventName);
  const buyer = '0x' + 'aa'.repeat(20);
  const data = sdk.ks.interface.encodeEventLog(fragment, [
    purchaseId,
    1,
    buyer,
    ethers.parseEther('1'),
  ]);
  return {
    address: sdk.addresses.knowledgeStore,
    topics: data.topics,
    data: data.data,
  };
}

function stubPurchaseKnowledgeV2(sdk, eventName, purchaseId) {
  sdk.ks.getKnowledge = async () => ({ price: ethers.parseEther('1') });
  sdk._ensureAllowance = async () => undefined;
  sdk.ks.purchaseKnowledgeV2 = async () => ({
    wait: async () => ({
      hash: '0x' + 'bb'.repeat(32),
      blockNumber: 1,
      gasUsed: 21000n,
      logs: [makePurchaseLog(sdk, eventName, purchaseId)],
    }),
  });
}

test('purchaseKnowledgeV2 returns purchaseId from PrivateKnowledgePurchased event', async () => {
  const sdk = makeSdk();
  stubPurchaseKnowledgeV2(sdk, 'PrivateKnowledgePurchased', 42);
  const result = await sdk.purchaseKnowledgeV2(0);
  assert.equal(result.purchaseId, 42);
});

test('purchaseKnowledgeV2 still returns purchaseId from KnowledgePurchased event (public v2)', async () => {
  const sdk = makeSdk();
  stubPurchaseKnowledgeV2(sdk, 'KnowledgePurchased', 7);
  const result = await sdk.purchaseKnowledgeV2(0);
  assert.equal(result.purchaseId, 7);
});