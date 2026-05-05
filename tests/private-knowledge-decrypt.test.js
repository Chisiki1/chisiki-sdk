const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { ethers } = require('ethers');
const {
  decryptPrivateKnowledgeWrappedKey,
  decryptPrivateKnowledgeContent,
  ChisikiSDK,
} = require('../dist/index.js');

const PRIVATE_KEY = '0x' + '42'.repeat(32);

function makeSecpEnvelope(deliveryPrivateKey, payload, alg = 'ECDH-secp256k1-HKDF-SHA256-AES-256-GCM/v1') {
  const delivery = crypto.createECDH('secp256k1');
  delivery.setPrivateKey(Buffer.from(deliveryPrivateKey.slice(2), 'hex'));
  const deliveryPublicKey = delivery.getPublicKey(null, 'uncompressed');
  const eph = crypto.createECDH('secp256k1');
  eph.generateKeys();
  const sharedSecret = eph.computeSecret(deliveryPublicKey);
  const salt = Buffer.from('00112233445566778899aabbccddeeff', 'hex');
  const iv = Buffer.from('0102030405060708090a0b0c', 'hex');
  const info = 'chisiki-private-knowledge:ecies:v1';
  const key = crypto.hkdfSync('sha256', sharedSecret, salt, Buffer.from(info), 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(info));
  const ct = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(payload))), cipher.final()]);
  const tag = cipher.getAuthTag();
  return '0x' + Buffer.from(JSON.stringify({
    v: 1,
    alg,
    epk: eph.getPublicKey(null, 'uncompressed').toString('base64'),
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    ct: ct.toString('base64'),
    tag: tag.toString('base64'),
    info,
  })).toString('hex');
}

function makeEncryptedContent(plaintext, keyPayload) {
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(keyPayload.k, 'base64'),
    Buffer.from(keyPayload.n, 'base64'),
  );
  const ct = Buffer.concat([cipher.update(Buffer.from(plaintext)), cipher.final()]);
  return {
    version: 1,
    scheme: 'AES-256-GCM',
    encoding: 'base64',
    nonce: keyPayload.n,
    ciphertext: ct.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    plaintextSha256: crypto.createHash('sha256').update(Buffer.from(plaintext)).digest('hex'),
  };
}

test('decryptPrivateKnowledgeWrappedKey decrypts seller secp256k1 JSON envelopes', () => {
  const deliveryPrivateKey = '0x' + '11'.repeat(32);
  const payload = {
    v: 1,
    t: 'chisiki-key',
    kid: '0',
    pid: '6',
    alg: 'AES-256-GCM',
    k: Buffer.alloc(32, 7).toString('base64'),
    n: Buffer.alloc(12, 8).toString('base64'),
    tag: Buffer.alloc(16, 9).toString('base64'),
    h: '0x' + 'aa'.repeat(32),
  };

  const wrappedKey = makeSecpEnvelope(deliveryPrivateKey, payload);
  const result = decryptPrivateKnowledgeWrappedKey(wrappedKey, deliveryPrivateKey);

  assert.deepEqual(result, payload);

  const legacyAlgWrappedKey = makeSecpEnvelope(deliveryPrivateKey, payload, 'ECDH-secp256k1-HKDF-SHA256-AES-256-GCM');
  assert.deepEqual(decryptPrivateKnowledgeWrappedKey(legacyAlgWrappedKey, deliveryPrivateKey), payload);
});

test('decryptPrivateKnowledgeContent decrypts AES-256-GCM private content and verifies sha256', () => {
  const keyPayload = {
    v: 1,
    t: 'chisiki-key',
    kid: '0',
    pid: '6',
    alg: 'AES-256-GCM',
    k: Buffer.alloc(32, 7).toString('base64'),
    n: Buffer.alloc(12, 8).toString('base64'),
    tag: Buffer.alloc(16, 9).toString('base64'),
    h: '0x' + 'aa'.repeat(32),
  };
  const content = makeEncryptedContent('private entry filter spec', keyPayload);

  const plaintext = decryptPrivateKnowledgeContent(content, keyPayload);

  assert.equal(Buffer.from(plaintext).toString('utf8'), 'private entry filter spec');
});

test('decryptPrivateKnowledgeContent accepts envelopes whose `encoding` field carries a plaintext hint (utf-8) or is omitted', () => {
  const keyPayload = {
    v: 1,
    pid: '7',
    alg: 'AES-256-GCM',
    k: Buffer.alloc(32, 4).toString('base64'),
    n: Buffer.alloc(12, 5).toString('base64'),
    tag: Buffer.alloc(16, 6).toString('base64'),
    h: '0x' + 'cc'.repeat(32),
  };
  const base = makeEncryptedContent('hello world', keyPayload);

  // ciphertext / nonce / authTag are always base64 by convention; the `encoding`
  // field is a plaintext-encoding hint set by sellers and must not gate decryption.
  for (const variant of [
    { ...base, encoding: 'utf-8' },
    { ...base, encoding: 'binary' },
    { ...base, encoding: 'text' },
    (() => { const c = { ...base }; delete c.encoding; return c; })(),
  ]) {
    const plaintext = decryptPrivateKnowledgeContent(variant, keyPayload);
    assert.equal(Buffer.from(plaintext).toString('utf8'), 'hello world');
  }
});

test('decryptPrivateKnowledgeContent still detects ciphertext tampering via AES-GCM auth tag', () => {
  const keyPayload = {
    v: 1,
    pid: '7',
    alg: 'AES-256-GCM',
    k: Buffer.alloc(32, 4).toString('base64'),
    n: Buffer.alloc(12, 5).toString('base64'),
    tag: Buffer.alloc(16, 6).toString('base64'),
    h: '0x' + 'cc'.repeat(32),
  };
  const content = makeEncryptedContent('hello world', keyPayload);
  // flip a byte of the ciphertext: AES-GCM auth tag mismatch should still trigger
  // a decryption failure regardless of the (relaxed) encoding check.
  const tampered = Buffer.from(content.ciphertext, 'base64');
  tampered[0] ^= 0xff;
  const corrupted = { ...content, ciphertext: tampered.toString('base64') };
  assert.throws(() => decryptPrivateKnowledgeContent(corrupted, keyPayload));
});

test('ChisikiSDK instance exposes buyer decrypt helpers using explicit delivery private key', () => {
  const sdk = new ChisikiSDK({ privateKey: PRIVATE_KEY, rpcUrl: 'http://127.0.0.1:8545', chainId: 8453 });
  assert.equal(typeof sdk.decryptWrappedKey, 'function');
  assert.equal(typeof sdk.decryptPrivateKnowledgeContent, 'function');

  const deliveryPrivateKey = '0x' + '22'.repeat(32);
  const payload = {
    v: 1,
    t: 'chisiki-key',
    kid: '0',
    pid: '8',
    alg: 'AES-256-GCM',
    k: Buffer.alloc(32, 1).toString('base64'),
    n: Buffer.alloc(12, 2).toString('base64'),
    tag: Buffer.alloc(16, 3).toString('base64'),
    h: '0x' + 'bb'.repeat(32),
  };
  const wrappedKey = makeSecpEnvelope(deliveryPrivateKey, payload);
  assert.deepEqual(sdk.decryptWrappedKey(wrappedKey, { deliveryPrivateKey }), payload);
});
