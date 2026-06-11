export async function readJsonBody(req, maxBytes = 1_000_000) {
  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      const error = new Error("Request body is too large");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    const parseError = new Error(`Invalid JSON body: ${error.message}`);
    parseError.statusCode = 400;
    throw parseError;
  }
}

export function sendJson(res, statusCode, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    ...extraHeaders
  });
  res.end(body);
}

