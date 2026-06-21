import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const agentPath = join(process.cwd(), 'agent', 'src', 'agent.js');
const content = await readFile(agentPath, 'utf8');

const oldLine = '  log("agent.payment.sent", { requestId: invoice.requestId, txHash });';
if (!content.includes(oldLine)) {
  throw new Error('Expected line not found in agent.js. Code may have changed.');
}

const newBlock = oldLine +
'  if (config.paymentMode === "fuji") {\n' +
'    log("agent.payment.explorer", {\n' +
'      requestId: invoice.requestId,\n' +
'      txHash,\n' +
'      url: `https://testnet.snowtrace.io/tx/${txHash}`\n' +
'    });\n' +
'  }\n';

const newContent = content.replace(oldLine, newBlock);

await writeFile(agentPath, newContent, 'utf8');
console.log('agent.js updated with explorer logging');