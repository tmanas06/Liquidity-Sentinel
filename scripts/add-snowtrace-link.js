import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const appPath = join(process.cwd(), 'frontend', 'src', 'App.jsx');
const content = await readFile(appPath, 'utf8');

const lines = content.split('\n');

// Find the </pre> line that is followed by a closing </div>
const preIdx = lines.findIndex(line => line.trim() === '</pre>');
if (preIdx === -1) {
  throw new Error('Could not find </pre> line in App.jsx');
}

// Next line should be the closing div of the same block
const nextIdx = preIdx + 1;
if (nextIdx >= lines.length || !lines[nextIdx].trim().startsWith('</div>')) {
  throw new Error('Expected closing </div> immediately after </pre>');
}

// Preserve indentation: use same leading whitespace as the </pre> line for the new div
const indent = lines[preIdx].match(/^\s*/)[0];
const newDiv = `${indent}<div className="text-xs font-mono text-[#bbcabf]">Payment transaction: <a href={\`https://testnet.snowtrace.io/tx/${unlockedPayload.paymentTx}\`} target="_blank" rel="noreferrer" className="text-[#4edea3] hover:underline">{unlockedPayload.paymentTx}</a></div>`;

lines.splice(nextIdx, 0, newDiv);
const modified = lines.join('\n');

await writeFile(appPath, modified, 'utf8');
console.log('Added SnowTrace link to App.jsx Success modal');