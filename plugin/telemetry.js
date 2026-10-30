const ENDPOINT = 'https://alpr.parkr.app/t/build';

function telemetryDisabled(env = process.env) {
  const off = (value) => value != null && value !== '' && value !== '0' && value.toLowerCase() !== 'false';
  return off(env.DO_NOT_TRACK) || env.ALPR_TELEMETRY === '0' || env.ALPR_TELEMETRY === 'false';
}

async function sendBuildTelemetry(body) {
  if (telemetryDisabled()) return;
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ci: Boolean(process.env.CI), ...body }),
      signal: AbortSignal.timeout(2000),
    });
  } catch {}
}

module.exports = { sendBuildTelemetry, telemetryDisabled };
