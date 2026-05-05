const test = require('node:test');
const assert = require('node:assert/strict');
const { ethers } = require('ethers');
const { ChisikiSDK } = require('../dist/index.js');

const PRIVATE_KEY = '0x' + '55'.repeat(32);

function makeSdk() {
  return new ChisikiSDK({
    privateKey: PRIVATE_KEY,
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 8453,
  });
}

function captureAllowance(sdk, captured) {
  sdk._ensureAllowance = async (_spender, required) => {
    captured.value = required;
  };
  sdk.ks.purchaseKnowledgeV2 = async () => ({
    wait: async () => ({
      hash: '0x' + 'cc'.repeat(32),
      blockNumber: 1,
      gasUsed: 21000n,
      logs: [],
    }),
  });
}

const BOND_FLOOR = ethers.parseEther('1');           // 1 CKT
const BOND_CEILING = ethers.parseEther('1000');      // 1000 CKT

const scenarios = [
  { name: 'price = 1 CKT (well below floor)',                          priceCKT: '1',       expectedBond: BOND_FLOOR },
  { name: 'price = 199 CKT (just below floor boundary)',               priceCKT: '199',     expectedBond: BOND_FLOOR },
  { name: 'price = 200 CKT (floor boundary; 0.5% rounds to exactly 1 CKT)', priceCKT: '200', expectedBond: BOND_FLOOR },
  { name: 'price = 1440 CKT (mid-range, 0.5% = 7.2 CKT)',              priceCKT: '1440',    expectedBond: ethers.parseEther('7.2') },
  { name: 'price = 1,000,000 CKT (above ceiling)',                     priceCKT: '1000000', expectedBond: BOND_CEILING },
];

for (const { name, priceCKT, expectedBond } of scenarios) {
  test(`purchaseKnowledgeV2 approves price + buyer bond — ${name}`, async () => {
    const sdk = makeSdk();
    const captured = { value: undefined };
    const price = ethers.parseEther(priceCKT);
    sdk.ks.getKnowledge = async () => ({ price });
    captureAllowance(sdk, captured);
    await sdk.purchaseKnowledgeV2(0);
    assert.equal(captured.value, price + expectedBond);
  });
}
