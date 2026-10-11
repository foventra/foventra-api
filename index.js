'use strict';

// Foventra ONE API usage example, not the SDK implementation.
// Install: npm install @foventra/api@beta
// Set FOVENTRA_API_KEY in your server environment. Never put it in this file.
const { FoventraClient, FoventraApiError } = require('@foventra/api');

async function getMonitors({
  apiKey = process.env.FOVENTRA_API_KEY,
  baseUrl = process.env.FOVENTRA_API_BASE_URL || 'https://api.foventra.com/v1'
} = {}) {
  const client = new FoventraClient({ apiKey, baseUrl, timeout: 10_000, retries: 1 });
  // Read-only. Requires uptime.read; consumes normal API quota.
  return client.requestWithMeta('GET', '/monitors', {
    query: { type: 'all', limit: 20 }
  });
}

if (require.main === module) {
  getMonitors().then(result => {
    console.log(JSON.stringify({
      webMonitors: result.data.web.length,
      minecraftMonitors: result.data.minecraft.length,
      remaining: result.rateLimit.remaining,
      resetsInSeconds: result.rateLimit.resetsInSeconds,
      requestId: result.requestId
    }, null, 2));
  }).catch(error => {
    if (error instanceof FoventraApiError) {
      console.error('Foventra API:', error.code, error.status, error.requestId);
    } else {
      console.error('Check the server environment and client configuration.');
    }
    process.exitCode = 1;
  });
}

module.exports = { getMonitors };
