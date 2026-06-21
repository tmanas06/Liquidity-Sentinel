import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const appPath = join(process.cwd(), 'frontend', 'src', 'App.jsx');
const content = await readFile(appPath, 'utf8');

let modified = content;

// Replace invoice.created block
modified = modified.replace(
  `      else if (data.event === "invoice.created") {
         const scoreFormat = data.score > 90 ? \`<span class="text-[#4edea3] font-bold">\${data.score}/100</span>\` : \`<span class="text-[#ffb4ab] font-bold">\${data.score}/100</span>\`;
         const amountFmt = ethers.formatUnits(data.amount, 6);
         const agentLabel = data.score > 90 ? "Trusted Flow Agent" : "Standard Risk Agent";

         feedItem = {
           time,
           type: 'x402 CHALLENGE ISSUED',
           msg: \`req-\${data.requestId.slice(-4)}: Assigned \${amountFmt} USDC invoice to \${agentLabel} \${data.agentId} (Score: \${scoreFormat}).\`,
           isHtml: true
         };
      }`,
  `      else if (data.event === "invoice.created") {
         const scoreFormat = data.score >= 80 ? \`<span class="text-[#4edea3] font-bold">\${data.score}/100</span>\` : \`<span class="text-[#ffb4ab] font-bold">\${data.score}/100</span>\`;
         const amountFmt = ethers.formatUnits(data.amount, 6);
         const agentLabel = data.score >= 80 ? "Trusted Flow Agent" : data.score >= 40 ? "Standard Risk Agent" : "New Agent";

         feedItem = {
           time,
           type: 'x402 CHALLENGE ISSUED',
           msg: \`req-\${data.requestId.slice(-4)}: Assigned \${amountFmt} USDC invoice to \${agentLabel} \${data.agentId} (Score: \${scoreFormat}).\`,
           isHtml: true
         };
      }`
);

// Replace Trust Registry className condition
modified = modified.replace(
  `                                                agent.score > 90 ? 'bg-[#10b981]/10 text-[#4edea3] border-[#10b981]/20' : 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/20'`,
  `                                                agent.score >= 80 ? 'bg-[#10b981]/10 text-[#4edea3] border-[#10b981]/20' : 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/20'`
);

// Replace Trust Registry label
modified = modified.replace(
  `                                                {agent.score > 90 ? "Trusted Flow" : "Standard Risk"}`,
  `                                                {agent.score >= 80 ? "Trusted Flow" : agent.score >= 40 ? "Standard Risk" : "New Agent"}`
);

// Replace x402 modal className condition
modified = modified.replace(
  `                    <span className={\`font-bold \${activeInvoice.reputationScore > 90 ? 'text-[#4edea3]' : 'text-amber-400'}\`}>`,
  `                    <span className={\`font-bold \${activeInvoice.reputationScore >= 80 ? 'text-[#4edea3]' : 'text-amber-400'}\`}>`
);

// Replace x402 modal label
modified = modified.replace(
  `                      {activeInvoice.reputationScore}/100 ({activeInvoice.pricingTier === 'trusted-agent' ? 'Trusted Flow' : 'Standard Risk'})`,
  `                      {activeInvoice.reputationScore}/100 ({activeInvoice.pricingTier === 'trusted-agent' ? 'Trusted Flow' : activeInvoice.pricingTier === 'standard-risk' ? 'Standard Risk' : 'New Agent'})`
);

await writeFile(appPath, modified, 'utf8');
console.log('App.jsx updated for 3-tier pricing');