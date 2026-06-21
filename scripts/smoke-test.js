import { Readable, Writable } from 'node:stream';
import { createSentinelServer } from "../api/src/server.js";
import { runAgent } from "../agent/src/agent.js";

// A simple mock of IncomingMessage (Readable stream)
class MockRequest extends Readable {
  constructor(options) {
    super();
    this.url = options.url || '/';
    this.method = options.method || 'GET';
    this.headers = options.headers || {};
    this.body = options.body || null;
    this.reading = false;
  }

  _read() {
    if (this.reading) return;
    this.reading = true;
    if (this.body) {
      this.push(Buffer.from(this.body));
    }
    this.push(null);
  }
}

// A simple mock of ServerResponse (Writable stream)
class MockResponse extends Writable {
  constructor(callback) {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.chunks = [];
    this.callback = callback;
  }

  writeHead(statusCode, headers) {
    this.statusCode = statusCode;
    if (headers) {
      Object.assign(this.headers, headers);
    }
  }

  setHeader(name, value) {
    this.headers[name] = value;
  }

  getHeader(name) {
    const lowerName = name.toLowerCase();
    for (const [key, value] of Object.entries(this.headers)) {
      if (key.toLowerCase() === lowerName) {
        return value;
      }
    }
    return undefined;
  }

  _write(chunk, encoding, callback) {
    this.chunks.push(chunk);
    callback();
  }

  end(chunk) {
    if (chunk) {
      this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const body = Buffer.concat(this.chunks).toString('utf8');
    this.callback({
      status: this.statusCode,
      headers: this.headers,
      body: body
    });
  }
}

// Intercepts global fetch and routes to requestListener
function createMockFetch(requestListener) {
  return async (url, options = {}) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      url: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {},
      body: options.body || null
    };

    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        reqOptions.headers[key.toLowerCase()] = value;
      }
    }

    return new Promise((resolve) => {
      const req = new MockRequest(reqOptions);
      const res = new MockResponse((result) => {
        resolve({
          status: result.status,
          statusText: 'OK',
          ok: result.status >= 200 && result.status < 300,
          headers: {
            get: (name) => {
              const lowerName = name.toLowerCase();
              for (const [k, v] of Object.entries(result.headers)) {
                if (k.toLowerCase() === lowerName) return v;
              }
              return null;
            }
          },
          text: async () => result.body,
          json: async () => JSON.parse(result.body)
        });
      });

      requestListener(req, res);
    });
  }
}

async function main() {
  process.env.PAYMENT_MODE = "mock";
  process.env.REPUTATION_MODE = "mock";
  process.env.AGENT_AI_MODE = "off";

  const server = createSentinelServer({
    paymentMode: "mock",
    reputationMode: "mock",
    mockReputationScore: 96,
    lowTierAmount: "10000",
    highTierAmount: "500000"
  });

  const requestListener = server.listeners("request")[0];
  globalThis.fetch = createMockFetch(requestListener);

  try {
    const result = await runAgent({
      apiBaseUrl: "http://localhost",
      paymentMode: "mock",
      agentId: "1"
    });

    if (result.status !== 200) {
      throw new Error(`Smoke test failed with status ${result.status}`);
    }

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      event: "smoke.passed",
      requestId: result.body.requestId,
      paymentTx: result.body.paymentTx
    }));
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ts: new Date().toISOString(),
    event: "smoke.failed",
    message: error.message,
    stack: error.stack
  }));
  process.exitCode = 1;
});
