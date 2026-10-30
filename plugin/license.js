const crypto = require('crypto');

const PUBLIC_KEYS = {
  '2026-1': 'pebhl12eGUtAYyk_gJp6i6RHnVnSqC_46VLHmeIp0ss',
  '2026-2': 'gFejwoYrliBTPgJbjyMIfKTC_Z2X_uiGEmtE0sWHbEE',
};

const SPKI_ED25519_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

function verifyLicenseKey(key, appId, publicKeys = PUBLIC_KEYS) {
  if (!key || !String(key).trim()) return { valid: false, reason: 'no license key' };
  const parts = String(key).trim().split('.');
  if (parts.length !== 2) return { valid: false, reason: 'the license key is malformed' };
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  } catch {
    return { valid: false, reason: 'the license key is malformed' };
  }
  const raw = publicKeys[payload.kid];
  if (payload.v !== 1 || !raw) return { valid: false, reason: 'the license key was not issued by Bileier' };
  const publicKey = crypto.createPublicKey({
    key: Buffer.concat([SPKI_ED25519_PREFIX, Buffer.from(raw, 'base64url')]),
    format: 'der',
    type: 'spki',
  });
  if (!crypto.verify(null, Buffer.from(parts[0]), publicKey, Buffer.from(parts[1], 'base64url'))) {
    return { valid: false, reason: 'the license key signature is invalid' };
  }
  if (!Array.isArray(payload.ids) || !payload.ids.includes(appId)) {
    return { valid: false, reason: `the license key does not cover ${appId}`, payload };
  }
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    return { valid: false, reason: 'the trial license key expired', payload };
  }
  return { valid: true, payload };
}

module.exports = { PUBLIC_KEYS, verifyLicenseKey };
