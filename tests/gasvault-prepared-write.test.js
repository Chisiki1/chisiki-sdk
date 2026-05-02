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

test('KnowledgeStore ABI matches live v2 sales-management surface', () => {
  const sdk = makeSdk();
  const requiredFunctions = [
    'listPrivateKnowledgeWithLimit',
    'setSaleLimit',
    'stopSales',
    'reopenSales',
    'rescueRefundPrivatePurchase',
    'maxSalesByKnowledge',
    'salesOpen',
    'rescueApplied',
    'purchaseDeliveryConfigURI',
  ];

  for (const name of requiredFunctions) {
    assert.ok(sdk.ks.interface.getFunction(name), `${name} missing from KnowledgeStore ABI`);
  }

  assert.equal(sdk.ks.interface.getFunction('getPrivateKnowledgeMeta').outputs.length, 3);
  assert.equal(sdk.ks.interface.getFunction('getWrappedKey').outputs.length, 2);
  assert.equal(sdk.ks.interface.getFunction('getPurchaseDeliveryState'), null);
});

test('prepareListPrivateKnowledge supports sale limit preflight metadata and receipt parsing', async () => {
  const sdk = makeSdk();
  sdk.ckt.allowance = async () => ethers.parseEther('1');
  const encryptedHash = '0x' + '22'.repeat(32);
  const contentHash = '0x' + '33'.repeat(32);

  const prepared = await sdk.prepareListPrivateKnowledge(
    'Entry Filter',
    'mt5,trading',
    '20',
    'ipfs://preview',
    'ipfs://encrypted',
    encryptedHash,
    contentHash,
    10,
  );

  assert.equal(prepared.kind, 'ks.listPrivateKnowledgeWithLimit');
  assert.equal(prepared.target, sdk.addresses.knowledgeStore);
  assert.equal(prepared.approvals.length, 1);
  assert.equal(prepared.approvals[0].spender, sdk.addresses.knowledgeStore);
  assert.equal(prepared.approvals[0].required, ethers.parseEther('4'));
  assert.equal(prepared.approvals[0].currentAllowance, ethers.parseEther('1'));
  assert.equal(prepared.approvals[0].satisfied, false);

  const decoded = sdk.ks.interface.decodeFunctionData('listPrivateKnowledgeWithLimit', prepared.data);
  assert.equal(decoded.title, 'Entry Filter');
  assert.equal(decoded.tags, 'mt5,trading');
  assert.equal(decoded.price, ethers.parseEther('20'));
  assert.equal(decoded.previewURI, 'ipfs://preview');
  assert.equal(decoded.encryptedContentURI, 'ipfs://encrypted');
  assert.equal(decoded.encryptedContentHash, encryptedHash);
  assert.equal(decoded.contentHash, contentHash);
  assert.equal(decoded.maxSales, 10n);

  const event = sdk.ks.interface.encodeEventLog(
    sdk.ks.interface.getEvent('KnowledgeListedV2'),
    [42n, sdk.address, 2, ethers.parseEther('20')],
  );
  const parsed = prepared.parseReceipt({
    hash: '0x' + '44'.repeat(32),
    blockNumber: 222,
    gasUsed: 333n,
    logs: [{ topics: event.topics, data: event.data }],
  });

  assert.deepEqual(parsed, {
    hash: '0x' + '44'.repeat(32),
    blockNumber: 222,
    gasUsed: '333',
    knowledgeId: 42,
  });
});

test('listPrivateKnowledge keeps backward-compatible direct flow through prepared write helper', async () => {
  const sdk = makeSdk();
  const prepared = { sentinel: true };
  let executeOptions = null;

  sdk.prepareListPrivateKnowledge = async (...args) => {
    assert.deepEqual(args, [
      'Entry Filter',
      'mt5,trading',
      '20',
      'ipfs://preview',
      'ipfs://encrypted',
      '0x' + '22'.repeat(32),
      '0x' + '33'.repeat(32),
      10,
    ]);
    return prepared;
  };

  sdk.executePrepared = async (value, options) => {
    assert.equal(value, prepared);
    executeOptions = options;
    return { hash: '0x' + '55'.repeat(32), blockNumber: 333, gasUsed: '444', knowledgeId: 9 };
  };

  const result = await sdk.listPrivateKnowledge(
    'Entry Filter',
    'mt5,trading',
    '20',
    'ipfs://preview',
    'ipfs://encrypted',
    '0x' + '22'.repeat(32),
    '0x' + '33'.repeat(32),
    10,
  );

  assert.deepEqual(executeOptions, { transport: 'direct', autoApprove: true });
  assert.equal(result.knowledgeId, 9);
});

test('listPrivateKnowledgeWithLimit convenience wrapper delegates to listPrivateKnowledge with maxSales', async () => {
  const sdk = makeSdk();
  let calledArgs = null;
  sdk.listPrivateKnowledge = async (...args) => {
    calledArgs = args;
    return { hash: '0x' + '77'.repeat(32), blockNumber: 555, gasUsed: '666', knowledgeId: 10 };
  };

  const result = await sdk.listPrivateKnowledgeWithLimit(
    'Entry Filter',
    'mt5,trading',
    '20',
    'ipfs://preview',
    'ipfs://encrypted',
    '0x' + '22'.repeat(32),
    '0x' + '33'.repeat(32),
    20,
  );

  assert.deepEqual(calledArgs, [
    'Entry Filter',
    'mt5,trading',
    '20',
    'ipfs://preview',
    'ipfs://encrypted',
    '0x' + '22'.repeat(32),
    '0x' + '33'.repeat(32),
    20,
  ]);
  assert.equal(result.knowledgeId, 10);
});

test('private sale-management prepared writes expose calldata without approvals', () => {
  const sdk = makeSdk();

  const limit = sdk.prepareSetSaleLimit(42, 1);
  assert.equal(limit.kind, 'ks.setSaleLimit');
  assert.equal(limit.target, sdk.addresses.knowledgeStore);
  assert.deepEqual(limit.approvals, []);
  assert.deepEqual(
    Array.from(sdk.ks.interface.decodeFunctionData('setSaleLimit', limit.data)),
    [42n, 1n],
  );

  const stop = sdk.prepareStopSales(42);
  assert.equal(stop.kind, 'ks.stopSales');
  assert.deepEqual(Array.from(sdk.ks.interface.decodeFunctionData('stopSales', stop.data)), [42n]);

  const reopen = sdk.prepareReopenSales(42);
  assert.equal(reopen.kind, 'ks.reopenSales');
  assert.deepEqual(Array.from(sdk.ks.interface.decodeFunctionData('reopenSales', reopen.data)), [42n]);

  const rescue = sdk.prepareRescueRefundPrivatePurchase(8, 2);
  assert.equal(rescue.kind, 'ks.rescueRefundPrivatePurchase');
  assert.deepEqual(
    Array.from(sdk.ks.interface.decodeFunctionData('rescueRefundPrivatePurchase', rescue.data)),
    [8n, 2n],
  );
});

test('private sale-management wrappers preserve direct execution defaults', async () => {
  const sdk = makeSdk();
  const calls = [];

  sdk.executePrepared = async (prepared, options) => {
    calls.push({ kind: prepared.kind, options });
    return { hash: '0x' + '66'.repeat(32), blockNumber: 444, gasUsed: '555' };
  };

  await sdk.setSaleLimit(42, 1);
  await sdk.stopSales(42);
  await sdk.reopenSales(42);
  await sdk.rescueRefundPrivatePurchase(8, 2);

  assert.deepEqual(calls, [
    { kind: 'ks.setSaleLimit', options: { transport: 'direct', autoApprove: true } },
    { kind: 'ks.stopSales', options: { transport: 'direct', autoApprove: true } },
    { kind: 'ks.reopenSales', options: { transport: 'direct', autoApprove: true } },
    { kind: 'ks.rescueRefundPrivatePurchase', options: { transport: 'direct', autoApprove: true } },
  ]);
});

test('private sale-management read helpers map live getter types', async () => {
  const sdk = makeSdk();
  sdk.ks.maxSalesByKnowledge = async (knowledgeId) => {
    assert.equal(knowledgeId, 42);
    return 1n;
  };
  sdk.ks.salesOpen = async (knowledgeId) => {
    assert.equal(knowledgeId, 42);
    return true;
  };
  sdk.ks.rescueApplied = async (purchaseId) => {
    assert.equal(purchaseId, 8);
    return false;
  };
  sdk.ks.purchaseDeliveryConfigURI = async (purchaseId) => {
    assert.equal(purchaseId, 8);
    return 'ipfs://delivery-config';
  };

  assert.equal(await sdk.getSaleLimit(42), 1n);
  assert.equal(await sdk.isSalesOpen(42), true);
  assert.equal(await sdk.isRescueApplied(8), false);
  assert.equal(await sdk.getPurchaseDeliveryConfigURI(8), 'ipfs://delivery-config');
});
