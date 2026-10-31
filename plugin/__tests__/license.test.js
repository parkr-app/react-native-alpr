const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { PUBLIC_KEYS, verifyLicenseKey } = require('../license');
const { telemetryDisabled } = require('../telemetry');

const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
const publicKeys = { test: publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64url') };

function sign(payload, key = privateKey) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${crypto.sign(null, Buffer.from(encoded), key).toString('base64url')}`;
}

const payload = { v: 1, kid: 'test', sub: 'cus_1', ids: ['com.example.app'], plan: 'pro', updatesUntil: '2099-01-01' };

test('accepts a key signed for the app id', () => {
  const result = verifyLicenseKey(sign(payload), 'com.example.app', publicKeys);
  assert.equal(result.valid, true);
  assert.equal(result.payload.trial, undefined);
});

test('rejects missing, malformed, foreign and tampered keys', () => {
  const reason = (key, appId = 'com.example.app') => verifyLicenseKey(key, appId, publicKeys).reason;
  assert.equal(reason(undefined), 'no license key');
  assert.equal(reason('  '), 'no license key');
  assert.equal(reason('abc'), 'the license key is malformed');
  assert.equal(reason('!!!.abc'), 'the license key is malformed');
  assert.equal(reason(sign({ ...payload, kid: 'other' })), 'the license key was not issued by Bileier');
  assert.equal(reason(sign({ ...payload, v: 2 })), 'the license key was not issued by Bileier');
  assert.equal(reason(sign(payload, crypto.generateKeyPairSync('ed25519').privateKey)), 'the license key signature is invalid');
  assert.equal(reason(sign(payload), 'com.other.app'), 'the license key does not cover com.other.app');
});

test('rejects expired trials', () => {
  const expired = sign({ ...payload, trial: true, exp: Math.floor(Date.now() / 1000) - 60 });
  assert.equal(verifyLicenseKey(expired, 'com.example.app', publicKeys).reason, 'the trial license key expired');
  const active = sign({ ...payload, trial: true, exp: Math.floor(Date.now() / 1000) + 60 });
  assert.equal(verifyLicenseKey(active, 'com.example.app', publicKeys).payload.trial, true);
});

test('honors DO_NOT_TRACK and ALPR_TELEMETRY', () => {
  assert.equal(telemetryDisabled({}), false);
  assert.equal(telemetryDisabled({ DO_NOT_TRACK: '1' }), true);
  assert.equal(telemetryDisabled({ DO_NOT_TRACK: '0' }), false);
  assert.equal(telemetryDisabled({ DO_NOT_TRACK: 'False' }), false);
  assert.equal(telemetryDisabled({ ALPR_TELEMETRY: 'false' }), true);
  assert.equal(telemetryDisabled({ ALPR_TELEMETRY: '1' }), false);
});

test('uses the same public keys as the Gradle build check', () => {
  const gradle = fs.readFileSync(path.join(__dirname, '../../android/build.gradle'), 'utf8');
  for (const [kid, key] of Object.entries(PUBLIC_KEYS)) assert.match(gradle, new RegExp(`"${kid}": "${key}"`));
});
