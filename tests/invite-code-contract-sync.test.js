const test = require('node:test');
const assert = require('node:assert/strict');
const { ethers } = require('ethers');
const { ChisikiSDK, ChisikiError } = require('../dist/index.js');

const PRIVATE_KEY = '0x' + '33'.repeat(32);

function makeSdk() {
  return new ChisikiSDK({
    privateKey: PRIVATE_KEY,
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 8453,
  });
}

test('generateInviteCode requires the intended referee wallet address before sending tx', async () => {
  const sdk = makeSdk();
  let called = false;
  sdk.registry.generateInviteCode = async () => {
    called = true;
    throw new Error('contract should not be called without a referee address');
  };

  await assert.rejects(
    () => sdk.generateInviteCode(),
    (error) => error instanceof ChisikiError && error.code === 'E_INVITE' && /intended referee/i.test(error.message),
  );
  assert.equal(called, false);
});

test('generateInviteCode sends the intended referee address and returns the emitted invite code', async () => {
  const sdk = makeSdk();
  const referee = '0x00000000000000000000000000000000000000aa';
  const inviteCode = '0x' + '44'.repeat(32);
  let actualReferee = null;

  sdk.registry.generateInviteCode = async (value) => {
    actualReferee = value;
    const event = sdk.registry.interface.encodeEventLog(
      sdk.registry.interface.getEvent('InviteCodeGenerated'),
      [sdk.address, inviteCode],
    );
    return {
      wait: async () => ({
        hash: '0x' + '55'.repeat(32),
        blockNumber: 12,
        gasUsed: 345n,
        logs: [{ topics: event.topics, data: event.data }],
      }),
    };
  };

  const result = await sdk.generateInviteCode(referee);

  assert.equal(actualReferee, ethers.getAddress(referee));
  assert.equal(result.inviteCode, inviteCode);
  assert.equal(result.gasUsed, '345');
});

test('register maps wallet-mismatch invite reverts to E_INVITE recovery guidance', async () => {
  const sdk = makeSdk();
  sdk.registry.register = async () => {
    throw new Error('execution reverted: Registry: not the intended referee');
  };

  await assert.rejects(
    () => sdk.register('AgentName', 'defi', '0x' + '66'.repeat(32)),
    (error) => error instanceof ChisikiError &&
      error.code === 'E_INVITE' &&
      /specified wallet/i.test(error.message),
  );
});
