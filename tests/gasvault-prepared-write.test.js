const test = require('node:test');
const assert = require('node:assert/strict');
const { ethers } = require('ethers');
const { ChisikiSDK } = require('../dist/index.js');

const PRIVATE_KEY = '0x' + '11'.repeat(32);
const QUESTION_FEE = ethers.parseEther('1');

function makeSdk() {
  return new ChisikiSDK({
    privateKey: PRIVATE_KEY,
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 8453,
  });
}

test('preparePostQuestion returns target/data/approval metadata and parses receipt', async () => {
  const sdk = makeSdk();
  sdk.ckt.allowance = async () => ethers.parseEther('3');

  const prepared = await sdk.preparePostQuestion(
    'https://example.com/q1',
    'defi,gas',
    '5',
    24,
  );

  assert.equal(prepared.kind, 'qa.postQuestion');
  assert.equal(prepared.target, sdk.addresses.qaEscrow);
  assert.equal(prepared.approvals.length, 1);
  assert.equal(prepared.approvals[0].spender, sdk.addresses.qaEscrow);
  assert.equal(prepared.approvals[0].required, ethers.parseEther('5') + QUESTION_FEE);
  assert.equal(prepared.approvals[0].currentAllowance, ethers.parseEther('3'));
  assert.equal(prepared.approvals[0].satisfied, false);

  const decoded = sdk.qa.interface.decodeFunctionData('postQuestion', prepared.data);
  assert.equal(decoded.ipfsCID, 'https://example.com/q1');
  assert.equal(decoded.tags, 'defi,gas');
  assert.equal(decoded.reward, ethers.parseEther('5'));
  assert.equal(decoded.deadlineDuration, BigInt(24 * 3600));

  const event = sdk.qa.interface.encodeEventLog(
    sdk.qa.interface.getEvent('QuestionPosted'),
    [28n, sdk.address, ethers.parseEther('5'), BigInt(24 * 3600), 'defi,gas'],
  );

  const parsed = prepared.parseReceipt({
    hash: '0x' + 'ab'.repeat(32),
    blockNumber: 123,
    gasUsed: 456n,
    logs: [{ topics: event.topics, data: event.data }],
  });

  assert.deepEqual(parsed, {
    hash: '0x' + 'ab'.repeat(32),
    blockNumber: 123,
    gasUsed: '456',
    questionId: 28,
  });
});

test('executePrepared direct auto-approves and sends the prepared transaction', async () => {
  const sdk = makeSdk();
  const prepared = {
    kind: 'qa.postQuestion',
    target: sdk.addresses.qaEscrow,
    data: '0x1234',
    approvals: [{ spender: sdk.addresses.qaEscrow, required: 99n, satisfied: false }],
    parseReceipt: (receipt) => ({ ok: true, receipt }),
  };

  let approved = null;
  sdk._ensureAllowance = async (spender, required) => {
    approved = { spender, required };
  };

  sdk.wallet.sendTransaction = async (request) => ({
    wait: async () => ({
      hash: '0x' + 'cd'.repeat(32),
      blockNumber: 456,
      gasUsed: 789n,
      request,
    }),
  });

  const result = await sdk.executePrepared(prepared, { transport: 'direct' });

  assert.deepEqual(approved, { spender: sdk.addresses.qaEscrow, required: 99n });
  assert.equal(result.ok, true);
  assert.equal(result.receipt.request.to, sdk.addresses.qaEscrow);
  assert.equal(result.receipt.request.data, '0x1234');
});

test('executePrepared gasvault rejects missing approvals when autoApprove is false', async () => {
  const sdk = makeSdk();
  sdk.ckt.allowance = async () => 0n;

  const prepared = {
    target: '0x00000000000000000000000000000000000000aa',
    data: '0xabcdef',
    approvals: [{ token: 'CKT', spender: sdk.addresses.qaEscrow, required: ethers.parseEther('6'), currentAllowance: 0n, satisfied: false }],
    parseReceipt: () => ({ ok: true }),
  };

  await assert.rejects(
    () => sdk.executePrepared(prepared, { transport: 'gasvault', autoApprove: false }),
    /Approval required before execution/
  );
});

test('executePrepared gasvault re-checks stale approval snapshots before rejecting', async () => {
  const sdk = makeSdk();
  let routed = false;

  sdk.ckt.allowance = async () => ethers.parseEther('6');
  sdk.gasVaultRouter = {
    executeWithRefund: async (target, data, overrides) => {
      routed = true;
      assert.equal(target, '0x00000000000000000000000000000000000000aa');
      assert.equal(data, '0xabcdef');
      assert.deepEqual(overrides, {});
      return {
        wait: async () => ({ hash: '0x3', blockNumber: 9, gasUsed: 333n, logs: [] }),
      };
    },
  };

  const prepared = {
    target: '0x00000000000000000000000000000000000000aa',
    data: '0xabcdef',
    approvals: [{ token: 'CKT', spender: sdk.addresses.qaEscrow, required: ethers.parseEther('6'), currentAllowance: 0n, satisfied: false }],
    parseReceipt: (receipt) => ({ hash: receipt.hash, blockNumber: receipt.blockNumber }),
  };

  const result = await sdk.executePrepared(prepared, { transport: 'gasvault', autoApprove: false });
  assert.equal(routed, true);
  assert.deepEqual(result, { hash: '0x3', blockNumber: 9 });
  assert.equal(prepared.approvals[0].satisfied, true);
  assert.equal(prepared.approvals[0].currentAllowance, ethers.parseEther('6'));
});

test('postQuestion keeps backward-compatible direct flow via prepare/execute helpers', async () => {
  const sdk = makeSdk();
  const prepared = { sentinel: true };
  let prepareCalled = false;
  let executeOptions = null;

  sdk.preparePostQuestion = async (...args) => {
    prepareCalled = true;
    assert.deepEqual(args, ['https://example.com/q2', 'docs', '7', 48]);
    return prepared;
  };

  sdk.executePrepared = async (value, options) => {
    assert.equal(value, prepared);
    executeOptions = options;
    return { hash: '0x' + 'ef'.repeat(32), blockNumber: 999, gasUsed: '111', questionId: 77 };
  };

  sdk._ensureAllowance = async () => {};
  sdk.qa.postQuestion = async () => ({
    wait: async () => ({ hash: '0x' + '01'.repeat(32), blockNumber: 1, gasUsed: 2n, logs: [] }),
  });

  const result = await sdk.postQuestion('https://example.com/q2', 'docs', '7', 48);

  assert.equal(prepareCalled, true);
  assert.deepEqual(executeOptions, { transport: 'direct', autoApprove: true });
  assert.equal(result.questionId, 77);
});
