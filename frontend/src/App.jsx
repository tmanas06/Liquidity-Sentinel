import React, { useState, useEffect } from 'react';
import { useSentinelData } from './hooks/useSentinelData';
import { Activity, ShieldCheck, FileText, Settings, Bell, LayoutDashboard } from 'lucide-react';

export default function App() {
  const { agents, vaultBalance, liveBlocks, eventsFeed, loading, executeAdminSlash } = useSentinelData();
  const [targetId, setTargetId] = useState('');
  const [scoreInput, setScoreInput] = useState('');
  const [isSlasherPending, setIsSlasherPending] = useState(false);
  const [activeTab, setActiveTab] = useState('billing');

  const handleSlashSubmission = async (e) => {
    e.preventDefault();
    if (!targetId || !scoreInput) return;
    setIsSlasherPending(true);
    try {
      await executeAdminSlash(targetId, Number(scoreInput));
      alert(`Successfully updated on-chain reputation for ${targetId}!`);
      setTargetId('');
      setScoreInput('');
    } catch (err) {
      alert(`Transaction rejected: ${err.message}`);
    } finally {
      setIsSlasherPending(false);
    }
  };

  const navItems = [
    { id: 'hub', label: 'Operations Hub', icon: LayoutDashboard },
    { id: 'trust', label: 'Trust Registry', icon: ShieldCheck },
    { id: 'billing', label: 'Billing Terminal', icon: FileText },
    { id: 'gov', label: 'Governance Panel', icon: Settings }
  ];

  return (
    <div className="flex h-screen bg-[#081425] text-[#d8e3fb] font-sans antialiased overflow-hidden">
      
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#081425] border-r border-[#1e293b] flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 pb-2">
            <h1 className="text-xl font-bold tracking-wider text-[#4edea3]">AVAX SENTINEL</h1>
            <div className="text-[10px] text-[#bbcabf] font-mono mt-1 tracking-widest uppercase">NOC Operator</div>
          </div>
          <nav className="mt-4 border-t border-[#1e293b]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-6 py-4 text-sm transition-colors border-b border-[#1e293b] ${
                    activeTab === item.id 
                      ? 'text-[#4edea3] bg-[#2a3548]/30 font-bold' 
                      : 'text-[#bbcabf] hover:text-white hover:bg-[#2a3548]/20 font-medium'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>
        <div className="p-6">
            <button className="w-full bg-[#10b981] hover:bg-[#006c49] text-[#003824] font-bold py-3 rounded-none text-xs uppercase tracking-wider transition-colors mb-6">
                Initialize Node
            </button>
            <div className="space-y-4 text-xs text-[#bbcabf] font-medium">
                <div className="flex items-center cursor-pointer hover:text-white transition"><ShieldCheck className="w-4 h-4 mr-3"/> Security Logs</div>
                <div className="flex items-center cursor-pointer hover:text-white transition"><Activity className="w-4 h-4 mr-3"/> System Status</div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#040e1f]">
        
        {/* Top Navbar */}
        <header className="h-[72px] border-b border-[#1e293b] bg-[#081425] flex items-center justify-between px-8 shrink-0">
          <div className="font-bold text-[20px] tracking-wider text-white uppercase font-sans">
             AVAX SENTINEL
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-[#152031] px-3 py-1.5 rounded-sm border border-[#3c4a42]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></div>
                <span className="text-[11px] font-mono text-[#4edea3] font-bold uppercase tracking-widest">Fuji_RPC_Sync</span>
            </div>
            <div className="flex items-center space-x-4">
                <Bell className="w-4 h-4 text-[#bbcabf] cursor-pointer hover:text-white transition" />
                <Settings className="w-4 h-4 text-[#bbcabf] cursor-pointer hover:text-white transition" />
            </div>
            <div className="flex items-center space-x-2 border border-[#3c4a42] px-4 py-2 rounded-sm text-[11px] font-mono cursor-pointer hover:bg-[#2a3548] transition text-white font-bold">
                <span>CONNECT WALLET</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content Body */}
        <main className="flex-1 p-8 overflow-y-auto">
            {activeTab === 'hub' && (
                <div className="space-y-6 max-w-7xl mx-auto">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 bg-[#081425] border border-[#1e293b] p-6 relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981] opacity-[0.03] rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                             <h2 className="text-[11px] font-mono text-[#bbcabf] font-bold uppercase tracking-widest mb-3">Total Vault Liquidity</h2>
                             <div className="text-[32px] font-bold font-sans tracking-tight text-white mb-6 leading-none">
                                ${loading ? "..." : Number(vaultBalance).toLocaleString()} <span className="text-base text-[#bbcabf] font-normal">USDC</span>
                             </div>
                             <div className="h-16 flex items-end space-x-1.5 opacity-80">
                                {[30, 45, 25, 60, 40, 70, 50, 80, 55, 90, 65, 85, 45, 75].map((h, i) => (
                                    <div key={i} className="w-full bg-[#10b981] opacity-20" style={{height: `${h}%`}}></div>
                                ))}
                             </div>
                        </div>
                        <div className="col-span-1 bg-[#081425] border border-[#1e293b] p-6 flex flex-col justify-between">
                            <div>
                                <h2 className="text-[11px] font-mono text-[#bbcabf] font-bold uppercase tracking-widest mb-4">Network Height</h2>
                                <div className="text-3xl font-mono text-[#4edea3] font-bold">{liveBlocks || "SYNCING..."}</div>
                            </div>
                            <div className="mt-4 text-[13px] text-[#bbcabf] leading-relaxed border-t border-[#1e293b] pt-4 font-mono">
                                Connected to Avalanche Fuji Testnet. Block time ~2.0s.
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#081425] border border-[#1e293b] overflow-hidden flex flex-col h-[500px]">
                        <div className="px-6 py-4 border-b border-[#1e293b] flex justify-between items-center bg-[#081425]">
                             <div className="text-[11px] font-mono font-bold text-[#bbcabf] uppercase tracking-widest">Global Telemetry Stream</div>
                             <div className="text-[10px] font-mono text-[#4edea3] bg-[#4edea3]/10 px-2 py-1 rounded-sm border border-[#4edea3]/20 font-bold uppercase tracking-widest flex items-center">
                                 <div className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse mr-2"></div>
                                 LISTENING
                             </div>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto font-mono text-[13px] space-y-4 bg-[#040e1f]">
                            {eventsFeed.length === 0 && (
                                <div className="text-[#86948a] italic">Awaiting on-chain activity...</div>
                            )}
                            {eventsFeed.map((item, idx) => (
                                <div key={idx} className="flex space-x-4 text-[#d8e3fb]">
                                    <span className="text-[#86948a] shrink-0">[{item.time}]</span>
                                    <span className="text-[#4edea3] font-bold shrink-0">[{item.type}]</span>
                                    {item.isHtml ? 
                                       <span className="break-all" dangerouslySetInnerHTML={{ __html: item.msg }}></span> : 
                                       <span className="break-all">{item.msg}</span>
                                    }
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'trust' && (
                <div className="bg-[#081425] border border-[#1e293b] max-w-7xl mx-auto">
                    <div className="p-8 border-b border-[#1e293b]">
                        <h2 className="text-[24px] font-bold text-white mb-2 leading-none">ERC-8004 Registry</h2>
                        <p className="text-[14px] text-[#bbcabf]">Live indexed identities and computational trust scores.</p>
                    </div>
                    <div className="overflow-x-auto p-8">
                        <table className="w-full text-left border-collapse">
                            <thead className="text-[11px] font-mono text-[#bbcabf] font-bold uppercase tracking-widest border-b border-[#1e293b]">
                                <tr>
                                    <th className="pb-4">Agent Identifier</th>
                                    <th className="pb-4 text-center">Score</th>
                                    <th className="pb-4 text-center">Validations</th>
                                    <th className="pb-4 text-right">Risk Tier</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] font-mono">
                                {loading ? (
                                    <tr><td colSpan="4" className="py-8 text-center text-[#86948a] border-b border-[#1e293b]">Syncing ledger...</td></tr>
                                ) : agents.length === 0 ? (
                                    <tr><td colSpan="4" className="py-8 text-center text-[#86948a] border-b border-[#1e293b]">No agents registered.</td></tr>
                                ) : agents.map(agent => (
                                    <tr key={agent.id} className="border-b border-[#1e293b] hover:bg-[#152031] transition-colors group">
                                        <td className="py-5 font-bold text-white group-hover:text-[#4edea3] transition-colors">{agent.id}</td>
                                        <td className="py-5 text-center font-bold text-[#4edea3]">{agent.score}/100</td>
                                        <td className="py-5 text-center text-[#bbcabf]">{agent.validations}</td>
                                        <td className="py-5 text-right">
                                             <span className={`px-2 py-1 text-[11px] border font-bold uppercase tracking-widest ${
                                                agent.score > 90 ? 'bg-[#10b981]/10 text-[#4edea3] border-[#10b981]/20' : 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/20'
                                             }`}>
                                                {agent.score > 90 ? "Trusted Flow" : "Standard Risk"}
                                             </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'billing' && (
                <div className="bg-[#081425] border border-[#1e293b] h-full flex flex-col max-w-7xl mx-auto">
                    <div className="px-8 py-6 border-b border-[#1e293b] bg-[#081425] flex justify-between items-end shrink-0">
                        <div>
                            <h2 className="text-[24px] font-bold text-white mb-2 leading-none">Billing Terminal (x402)</h2>
                            <p className="text-[11px] text-[#bbcabf] font-mono font-bold tracking-widest uppercase flex items-center">
                                <FileText className="w-3.5 h-3.5 mr-2" /> Live Transaction & Challenge Feed
                            </p>
                        </div>
                        <div className="text-right">
                             <div className="text-[11px] text-[#bbcabf] font-mono font-bold uppercase tracking-widest mb-2">Total Processed (24h)</div>
                             <div className="text-[18px] font-mono font-bold text-[#4edea3]">14,204.50 USDC</div>
                        </div>
                    </div>
                    <div className="flex-1 bg-[#040e1f] p-8 overflow-y-auto font-mono text-[13px] leading-[1.6] space-y-5">
                         <div className="text-[#86948a] font-bold mb-8 text-[11px] tracking-widest flex items-center border-b border-[#1e293b] pb-4">
                             NODE: AVAX-FUJI-NOC-1 <span className="mx-3 text-[#3c4a42]">|</span> <span className="text-[#4edea3] flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse mr-2"></div> STREAM ACTIVE</span>
                         </div>
                         
                         {eventsFeed.length === 0 && (
                            <div className="text-[#86948a] italic">Awaiting live x402 payment cycles...</div>
                         )}
                         {eventsFeed.map((item, idx) => {
                             if (item.isSuccess) {
                                 return (
                                     <div key={idx} className="flex text-white bg-[#006c49]/20 p-3 -mx-3 border-l-2 border-[#4edea3]">
                                         <span className="w-28 shrink-0 text-[#86948a] ml-3">{item.time}</span>
                                         <span><span className="text-[#4edea3] font-bold">[{item.type}]</span> <span dangerouslySetInnerHTML={{ __html: item.msg }}></span></span>
                                     </div>
                                 );
                             }
                             return (
                                 <div key={idx} className="flex text-[#ffb95f]">
                                     <span className="w-28 shrink-0 text-[#86948a]">{item.time}</span>
                                     <span><span className="font-bold">[{item.type}]</span> {item.isHtml ? <span dangerouslySetInnerHTML={{ __html: item.msg }}></span> : <span>{item.msg}</span>}</span>
                                 </div>
                             );
                         })}

                         <div className="text-[#4edea3] font-bold mt-6 text-[16px] animate-pulse">{">"} <span className="w-2 h-4 inline-block bg-[#4edea3] align-middle -mt-1 ml-1"></span></div>
                    </div>
                </div>
            )}

            {activeTab === 'gov' && (
                <div className="max-w-3xl mx-auto mt-8">
                    <div className="bg-[#081425] border border-[#1e293b] relative overflow-hidden">
                        {/* Red warning bar at top */}
                        <div className="h-1 w-full bg-[#ffb4ab]"></div>
                        
                        <div className="p-8 border-b border-[#1e293b] bg-[#152031]/50">
                            <h2 className="text-[20px] font-bold text-[#ffb4ab] flex items-center leading-none"><Settings className="w-5 h-5 mr-3" /> Administrator Override</h2>
                            <p className="text-[14px] text-[#bbcabf] mt-3">Directly modify on-chain ERC-8004 reputation parameters. Requires multisig or admin wallet connection.</p>
                        </div>
                        
                        <form onSubmit={handleSlashSubmission} className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[11px] font-mono font-bold text-[#bbcabf] mb-3 uppercase tracking-widest">Target Agent ID</label>
                                    <input 
                                        type="text" 
                                        value={targetId}
                                        onChange={(e) => setTargetId(e.target.value)}
                                        className="w-full bg-[#040e1f] border border-[#3c4a42] p-3 text-[14px] text-white focus:outline-none focus:border-[#4edea3] transition-colors font-mono"
                                        placeholder="e.g. 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-mono font-bold text-[#bbcabf] mb-3 uppercase tracking-widest">Override Score (0-100)</label>
                                    <input 
                                        type="number" 
                                        value={scoreInput}
                                        onChange={(e) => setScoreInput(e.target.value)}
                                        className="w-full bg-[#040e1f] border border-[#3c4a42] p-3 text-[14px] text-white focus:outline-none focus:border-[#4edea3] transition-colors font-mono"
                                        placeholder="0"
                                        min="0" max="100"
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-[#1e293b]">
                                <button 
                                    type="submit"
                                    disabled={isSlasherPending}
                                    className="bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/20 border border-[#ffb4ab]/50 text-[#ffb4ab] font-bold py-3 px-8 text-[12px] uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {isSlasherPending ? "Broadcasting to Network..." : "Execute On-Chain Slash"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>

      </div>
    </div>
  );
}
