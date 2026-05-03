const test = require('node:test');
const assert = require('node:assert/strict');
const { ethers } = require('ethers');
const { ChisikiSDK } = require('../dist/index.js');

const PRIVATE_KEY = '0x' + '22'.repeat(32);

function makeSdk() {
  return new ChisikiSDK({
    privateKey: PRIVATE_KEY,
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 8453,
  });
}

test('AgentRegistry ABI follows current live/protocol merchant stats surface', () => {
  const sdk = makeSdk();

  const stats = sdk.registry.interface.getFunction('getQualifiedMerchantStats');
  assert.equal(stats.outputs.length, 4);
  assert.deepEqual(stats.outputs.map((o) => o.name), [
    'successCount',
    'distinctBuyerCount',
    'explicitRatingAvg',
    'disputeCountForSeller',
  ]);

  assert.ok(sdk.registry.interface.getFunction('totalAgentsRepairApplied'));
  assert.ok(sdk.registry.interface.getFunction('repairTotalAgentsFromLegacyAndBuggySlots'));
  assert.equal(sdk.registry.interface.getFunction('getMerchantDisputeRateBps'), null);
  assert.equal(sdk.registry.interface.getFunction('TIER1_BASE_STAKE'), null);
});

test('getQualifiedMerchantStats enriches the 4-value live getter without requiring removed ABI functions', async () => {
  const sdk = makeSdk();
  const seller = '0x00000000000000000000000000000000000000aa';

  sdk.registry.getQualifiedMerchantStats = async (actualSeller) => {
    assert.equal(actualSeller, seller);
    return [3n, 2n, 450n, 1n];
  };
  sdk.registry.sellerBaseStakeAmount = async (actualSeller) => {
    assert.equal(actualSeller, seller);
    return ethers.parseEther('50');
  };
  sdk.registry.hasSellerBaseStake = async (actualSeller) => {
    assert.equal(actualSeller, seller);
    return true;
  };
  sdk.registry.getMerchantDisputeRateBps = async () => {
    throw new Error('removed live ABI function must not be called');
  };

  const stats = await sdk.getQualifiedMerchantStats(seller);

  assert.equal(stats.successCount, 3n);
  assert.equal(stats.distinctBuyerCount, 2n);
  assert.equal(stats.explicitRatingAverage, 450n);
  assert.equal(stats.disputeCountForSeller, 1n);
  assert.equal(stats.disputeRateBps, 3333n);
  assert.equal(stats.currentBaseStake, ethers.parseEther('50'));
  assert.equal(stats.hasRequiredBaseStake, true);
});

test('getMerchantDisputeRateBps computes from current merchant counters and returns zero for no successes', async () => {
  const sdk = makeSdk();
  const seller = '0x00000000000000000000000000000000000000bb';

  sdk.registry.getQualifiedMerchantStats = async (actualSeller) => {
    assert.equal(actualSeller, seller);
    return [0n, 0n, 0n, 2n];
  };
  sdk.registry.getMerchantDisputeRateBps = async () => {
    throw new Error('removed live ABI function must not be called');
  };

  assert.equal(await sdk.getMerchantDisputeRateBps(seller), 0n);
});
