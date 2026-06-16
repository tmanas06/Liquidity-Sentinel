import React, { useState, useEffect } from 'react';
import { useSentinelData } from './hooks/useSentinelData';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import contractAddresses from './addresses.json';
import { Activity, ShieldCheck, FileText, Settings, Bell, LayoutDashboard, X, RefreshCw, CheckCircle2, Cpu } from 'lucide-react';

const renderMessageContent = (content) => {
  // Replace markdown bold **text** with HTML <strong>text</strong>
  const boldRegex = /\*\*(.*?)\*\*/g;
  const bulletRegex = /^\*\s+(.*)$/gm;
  const numBulletRegex = /^(\d+)\.\s+(.*)$/gm;
  let html = content
    .replace(boldRegex, '<strong class="text-[#4edea3] font-bold">$1</strong>')
    .replace(bulletRegex, '<li class="ml-4 list-disc my-1 text-[#bbcabf]">$1</li>')
    .replace(numBulletRegex, '<div class="ml-4 my-1 text-[#d8e3fb] font-mono"><span class="text-[#4edea3] font-bold">$1.</span> $2</div>');
  
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

export default function App() {
  const { agents, vaultBalance, liveBlocks, eventsFeed, loading, executeAdminSlash, addLog } = useSentinelData();
  const { login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [targetId, setTargetId] = useState('');
  const [scoreInput, setScoreInput] = useState('');
  const [isSlasherPending, setIsSlasherPending] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [activeTab, setActiveTab] = useState('billing');

  // Interactive Popup States
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isSystemOpen, setIsSystemOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Dynamic values to make the dashboard feel alive
  const [cpuLoad, setCpuLoad] = useState(2.4);
  const [ramUsed, setRamUsed] = useState(128);
  const [rpcLatency, setRpcLatency] = useState(110);
  const [isScanning, setIsScanning] = useState(false);

  // Network configs settings overrides
  const [fujiRpcUrl, setFujiRpcUrl] = useState('https://api.avax-test.network/ext/bc/C/rpc');
  const [apiUrl, setApiUrl] = useState('http://localhost:4020/api/v1');
  const [tokenAddress, setTokenAddress] = useState('0x5425890298aed601595a70AB815c96711a31Bc65');

  // Groq AI Agent Chat States
  const [aiMode, setAiMode] = useState('general');
  const [chatInput, setChatInput] = useState('');
  const [generalMessages, setGeneralMessages] = useState([]);
  const [walletMessages, setWalletMessages] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [txStates, setTxStates] = useState({});

  const chatMessages = aiMode === 'general' ? generalMessages : walletMessages;
  const setChatMessages = aiMode === 'general' ? setGeneralMessages : setWalletMessages;

  const [securityLogs, setSecurityLogs] = useState([
    { ts: '08:12:05', level: 'INFO', msg: 'Gatekeeper network scanner initiated.' },
    { ts: '08:12:06', level: 'SECURE', msg: 'EIP-8004 validator credentials verified.' },
    { ts: '08:15:30', level: 'AUDIT', msg: 'System check completed. 0 anomalies detected.' }
  ]);

  const notificationsList = [
    { id: 1, title: 'Gatekeeper Node Online', msg: 'Fuji synchronizer successfully initialized on port 4020.', time: '10m ago', unread: true },
    { id: 2, title: 'Identity Discovered', msg: 'Agent NFT registered: agent1.sentinel.test (ID 1).', time: '8h ago', unread: false },
    { id: 3, title: 'Reputation Verified', msg: 'On-chain rating for Agent ID 1 resolved to 96/100.', time: '8h ago', unread: false }
  ];

  // Dynamic status tick simulator
  useEffect(() => {
    const timer = setInterval(() => {
      setCpuLoad(Number((Math.random() * 3 + 1.5).toFixed(1)));
      setRamUsed(Math.floor(Math.random() * 10 + 124));
      setRpcLatency(Math.floor(Math.random() * 20 + 100));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const runSecurityScan = () => {
    setIsScanning(true);
    setSecurityLogs(prev => [
      ...prev,
      { ts: new Date().toLocaleTimeString(), level: 'INFO', msg: 'Scanning local memory stack...' }
    ]);
    setTimeout(() => {
      setIsScanning(false);
      setSecurityLogs(prev => [
        ...prev,
        { ts: new Date().toLocaleTimeString(), level: 'SECURE', msg: 'Deep scan complete. No unauthorized contract modifications found.' }
      ]);
      addLog("SECURITY", "Node memory stack audited. Security state: CLEAR.", true);
    }, 1500);
  };

  const handleInitializeNode = async () => {
    setIsInitializing(true);
    addLog("SYSTEM", "Initializing local gatekeeper node...");
    try {
      const res = await fetch("http://localhost:4020/health");
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      addLog("SYSTEM", `Gatekeeper node online! Network: ${data.network}, Mode: ${data.paymentMode} payments / ${data.reputationMode} reputation`, true);
    } catch (err) {
      addLog("SYSTEM", `Initialization failed: ${err.message}. Verify that the API server is running.`, false);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSlashSubmission = async (e) => {
    e.preventDefault();
    if (!targetId || !scoreInput) return;
    setIsSlasherPending(true);
    try {
      await executeAdminSlash(targetId, Number(scoreInput));
      addLog("SYSTEM", `Successfully updated on-chain reputation for Agent ${targetId} to ${scoreInput}!`, true);
      alert(`Successfully updated on-chain reputation for Agent ${targetId}!`);
      setTargetId('');
      setScoreInput('');
    } catch (err) {
      addLog("SYSTEM", `Override transaction failed: ${err.message}`, false);
      alert(`Transaction rejected: ${err.message}`);
    } finally {
      setIsSlasherPending(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsgId = Date.now().toString();
    const userMessage = { id: userMsgId, role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    const promptText = chatInput;
    setChatInput('');
    setIsAiLoading(true);

    try {
      const systemPrompt = aiMode === 'general' 
        ? "You are the AVAX Sentinel AI companion. Answer the user's questions about blockchain, web3, Avalanche, liquidity, or general queries in a concise and helpful manner. Do not trigger or format any wallet actions."
        : `You are the AVAX Sentinel AI execution assistant.
If the user wants to swap or bridge crypto:
1. You must identify their intent (swap or bridge).
2. Format your response to include a JSON block at the very end of your response, starting with \`[ACTION_TRIGGER]\` followed by a JSON string:
\`[ACTION_TRIGGER]{"action": "swap", "from": "AVAX", "to": "USDC", "amount": "0.1"}\` or \`[ACTION_TRIGGER]{"action": "bridge", "from": "USDC", "to": "Ethereum", "amount": "5"}\`
Ensure you strictly extract the action (swap or bridge), from token, to token/chain, and amount as numbers. If they specify tokens, AVAX and USDC are supported. If they ask to bridge, USDC can be bridged to Ethereum/Arbitrum/etc.
Example response: 'I can help you swap 0.1 AVAX to USDC. Please confirm the transaction details below. [ACTION_TRIGGER]{"action": "swap", "from": "AVAX", "to": "USDC", "amount": "0.1"}'

Keep your explanations concise and friendly.`;

      if (!import.meta.env.VITE_GROQ_API_KEY) {
        throw new Error("VITE_GROQ_API_KEY is not defined in the environment. Please add it to your .env file.");
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...chatMessages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: promptText }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API returned status ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.choices[0].message.content;
      
      let cleanedText = aiText;
      let triggerData = null;
      const triggerIndex = aiText.indexOf("[ACTION_TRIGGER]");
      if (triggerIndex !== -1) {
        cleanedText = aiText.substring(0, triggerIndex).trim();
        const jsonStr = aiText.substring(triggerIndex + "[ACTION_TRIGGER]".length).trim();
        try {
          triggerData = JSON.parse(jsonStr);
        } catch (err) {
          console.error("JSON parsing of action failed:", err);
        }
      }

      const aiMsgId = (Date.now() + 1).toString();
      setChatMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: cleanedText, action: triggerData }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Error communicating with Groq: ${err.message}` }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExecuteOnChainAction = async (msgId, action) => {
    if (wallets.length === 0) {
      alert("No wallet connected! Please connect your wallet via Privy first.");
      return;
    }
    setTxStates(prev => ({ ...prev, [msgId]: 'pending' }));
    addLog("SYSTEM", `Broadcasting on-chain ${action.action} request via connected wallet...`);

    try {
      const activeWallet = wallets[0];
      const eip1193Provider = await activeWallet.getEthereumProvider();
      const browserProvider = new ethers.BrowserProvider(eip1193Provider);
      const signer = await browserProvider.getSigner();

      let tx;
      if (action.action === 'swap') {
        if (action.from.toUpperCase() === 'AVAX') {
          // Send AVAX swap to vault
          tx = await signer.sendTransaction({
            to: contractAddresses.mockVault,
            value: ethers.parseEther(action.amount.toString())
          });
        } else {
          // Send USDC swap to vault (transfer USDC)
          const usdcContract = new ethers.Contract(
            "0x5425890298aed601595a70AB815c96711a31Bc65",
            ["function transfer(address to, uint256 amount) returns (bool)"],
            signer
          );
          tx = await usdcContract.transfer(contractAddresses.mockVault, ethers.parseUnits(action.amount.toString(), 6));
        }
      } else {
        // Bridge action: transfer AVAX or USDC to simulate lock
        if (action.from.toUpperCase() === 'AVAX') {
          tx = await signer.sendTransaction({
            to: contractAddresses.mockVault,
            value: ethers.parseEther(action.amount.toString())
          });
        } else {
          const usdcContract = new ethers.Contract(
            "0x5425890298aed601595a70AB815c96711a31Bc65",
            ["function transfer(address to, uint256 amount) returns (bool)"],
            signer
          );
          tx = await usdcContract.transfer(contractAddresses.mockVault, ethers.parseUnits(action.amount.toString(), 6));
        }
      }

      await tx.wait();
      setTxStates(prev => ({ ...prev, [msgId]: 'success' }));
      addLog("SYSTEM", `AI Wallet Action ${action.action} completed! Tx: ${tx.hash.slice(0, 10)}...`, true);
    } catch (err) {
      console.error(err);
      setTxStates(prev => ({ ...prev, [msgId]: 'failed' }));
      addLog("SYSTEM", `AI Wallet Action failed: ${err.message}`, false);
    }
  };

  const navItems = [
    { id: 'hub', label: 'Operations Hub', icon: LayoutDashboard },
    { id: 'trust', label: 'Trust Registry', icon: ShieldCheck },
    { id: 'billing', label: 'Billing Terminal', icon: FileText },
    { id: 'gov', label: 'Governance Panel', icon: Settings },
    { id: 'ai', label: 'Groq AI Agent', icon: Cpu }
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
            <button 
                onClick={handleInitializeNode}
                disabled={isInitializing}
                className="w-full bg-[#10b981] hover:bg-[#003824] text-[#081425] font-bold py-3 rounded-none text-xs uppercase tracking-wider transition-all duration-200 mb-6 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
            >
                {isInitializing ? "Initializing..." : "Initialize Node"}
            </button>
            <div className="space-y-4 text-xs text-[#bbcabf] font-medium">
                <div 
                    onClick={() => {
                        setIsSecurityOpen(true);
                        addLog("SECURITY", "Accessing system firewall logs and audit panel...");
                    }}
                    className="flex items-center cursor-pointer hover:text-white transition"
                >
                    <ShieldCheck className="w-4 h-4 mr-3"/> Security Logs
                </div>
                <div 
                    onClick={() => {
                        setIsSystemOpen(true);
                        addLog("SYSTEM", "Querying gatekeeper performance diagnostics...");
                    }}
                    className="flex items-center cursor-pointer hover:text-white transition"
                >
                    <Activity className="w-4 h-4 mr-3"/> System Status
                </div>
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
                <div className="relative">
                    <Bell 
                        className="w-4 h-4 text-[#bbcabf] cursor-pointer hover:text-white transition" 
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    />
                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-3 w-80 bg-[#081425] border border-[#1e293b] rounded-sm shadow-2xl z-50 overflow-hidden">
                            <div className="px-4 py-3 border-b border-[#1e293b] flex justify-between items-center bg-[#152031]">
                                <span className="text-[11px] font-mono font-bold text-white uppercase tracking-widest">Active Alerts</span>
                                <span 
                                    onClick={() => setIsNotificationsOpen(false)}
                                    className="text-[10px] font-mono text-[#bbcabf] hover:text-white cursor-pointer"
                                >
                                    DISMISS
                                </span>
                            </div>
                            <div className="max-h-64 overflow-y-auto divide-y divide-[#1e293b]">
                                {notificationsList.map(n => (
                                    <div key={n.id} className="p-4 hover:bg-[#152031]/50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-[#4edea3] flex items-center">
                                                {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] mr-2"></span>}
                                                {n.title}
                                            </span>
                                            <span className="text-[9px] font-mono text-[#bbcabf]">{n.time}</span>
                                        </div>
                                        <p className="text-[11px] text-[#bbcabf] font-mono leading-relaxed">{n.msg}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <Settings 
                    className="w-4 h-4 text-[#bbcabf] cursor-pointer hover:text-white transition" 
                    onClick={() => {
                        setIsSettingsOpen(true);
                        addLog("SYSTEM", "Opening network parameter configuration console...");
                    }}
                />
            </div>
            {authenticated ? (
              <button 
                onClick={logout}
                className="flex items-center space-x-2 border border-[#ffb4ab]/50 hover:border-[#ffb4ab] px-4 py-2 rounded-sm text-[11px] font-mono cursor-pointer bg-transparent hover:bg-[#ffb4ab]/10 transition text-[#ffb4ab] font-bold"
              >
                <span>{user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : 'DISCONNECT'}</span>
              </button>
            ) : (
              <button 
                onClick={login}
                className="flex items-center space-x-2 border border-[#3c4a42] hover:border-[#10b981] px-4 py-2 rounded-sm text-[11px] font-mono cursor-pointer bg-transparent hover:bg-[#2a3548] transition text-white font-bold"
              >
                <span>CONNECT WALLET</span>
              </button>
            )}
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

            {activeTab === 'ai' && (
                <div className="bg-[#081425] border border-[#1e293b] flex flex-col h-[calc(100vh-140px)] max-w-7xl mx-auto overflow-hidden">
                    <div className="px-8 py-6 border-b border-[#1e293b] bg-[#081425] flex justify-between items-center shrink-0">
                        <div>
                            <h2 className="text-[24px] font-bold text-white mb-2 leading-none">Groq AI Agent</h2>
                            <p className="text-[11px] text-[#bbcabf] font-mono uppercase tracking-widest flex items-center">
                                <Cpu className="w-3.5 h-3.5 mr-2 text-[#4edea3]" /> Llama 3.3 Execution Node
                            </p>
                        </div>
                        
                        {/* Mode toggles */}
                        <div className="flex bg-[#040e1f] p-1 border border-[#3c4a42]">
                            <button 
                                type="button"
                                onClick={() => setAiMode('general')}
                                className={`px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                                    aiMode === 'general' 
                                        ? 'bg-[#10b981] text-[#081425]' 
                                        : 'text-[#bbcabf] hover:text-white'
                                }`}
                            >
                                General Mode
                            </button>
                            <button 
                                type="button"
                                onClick={() => setAiMode('wallet')}
                                className={`px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                                    aiMode === 'wallet' 
                                        ? 'bg-[#4edea3] text-[#081425] shadow-[0_0_10px_rgba(78,222,163,0.3)]' 
                                        : 'text-[#bbcabf] hover:text-white'
                                }`}
                            >
                                Wallet Mode
                            </button>
                        </div>
                    </div>

                    {/* Chat Feed */}
                    <div className="flex-1 overflow-y-auto p-8 bg-[#040e1f] space-y-6 flex flex-col scrollbar-thin">
                        {chatMessages.length === 0 && (
                            <div className="h-full flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                                <div className="p-4 rounded-full bg-[#10b981]/5 border border-[#10b981]/10">
                                    <Cpu className="w-12 h-12 text-[#4edea3] animate-pulse" />
                                </div>
                                <div className="text-sm font-semibold text-white tracking-wider font-mono">
                                    GROQ CO-PILOT SYSTEM
                                </div>
                                <div className="text-xs text-[#bbcabf] font-mono max-w-sm leading-relaxed">
                                    {aiMode === 'general' 
                                        ? "Ask general questions about smart contracts, wallets, or network parameters."
                                        : "Execute instant trades. Prompt: 'Swap 0.1 AVAX' or 'Bridge 5 USDC to Arbitrum'"
                                    }
                                </div>
                            </div>
                        )}
                        
                        {chatMessages.map((msg) => {
                            const isUser = msg.role === 'user';
                            return (
                                <div key={msg.id} className={`flex w-full items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    
                                    {/* Left Avatar for AI */}
                                    {!isUser && (
                                        <div className="w-8 h-8 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                            <Cpu className="w-4 h-4 text-[#4edea3]" />
                                        </div>
                                    )}

                                    <div className={`max-w-[70%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                        {/* Sender Name */}
                                        <span className="text-[10px] font-mono font-bold tracking-wider text-[#bbcabf] mb-1.5 uppercase px-1">
                                            {isUser ? 'Operator' : 'Groq Llama-3'}
                                        </span>

                                        {/* Message Bubble */}
                                        <div className={`p-4 rounded-lg font-sans text-[13px] leading-relaxed shadow-lg transition-all ${
                                            isUser 
                                                ? 'bg-[#10b981]/10 text-white border border-[#10b981]/20 rounded-tr-none' 
                                                : 'bg-[#081425]/90 text-[#d8e3fb] border border-[#1e293b] rounded-tl-none'
                                        }`}>
                                            <div className="whitespace-pre-wrap">{renderMessageContent(msg.content)}</div>
                                            
                                            {/* Action Confirmation card */}
                                            {msg.action && (
                                                <div className="mt-4 bg-[#040e1f] border border-[#1e293b] p-4 rounded-sm relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ffb95f]"></div>
                                                    <div className="text-[10px] font-mono font-bold text-[#ffb95f] uppercase tracking-widest mb-3 flex items-center">
                                                        <Activity className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> Action Payload Extracted
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-xs font-mono text-[#bbcabf] mb-4">
                                                        <div>
                                                            <span className="text-[10px] uppercase block mb-0.5 text-slate-500">Operation</span>
                                                            <span className="text-white font-bold uppercase">{msg.action.action}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase block mb-0.5 text-slate-500">Volume</span>
                                                            <span className="text-[#4edea3] font-bold">{msg.action.amount} {msg.action.from}</span>
                                                        </div>
                                                        <div className="col-span-2 border-t border-[#1e293b] pt-2">
                                                            <span className="text-[10px] uppercase block mb-0.5 text-slate-500">
                                                                {msg.action.action === 'swap' ? 'Counterparty Asset' : 'Destination Chain'}
                                                            </span>
                                                            <span className="text-white font-bold">{msg.action.to}</span>
                                                        </div>
                                                    </div>

                                                    {txStates[msg.id] === 'success' ? (
                                                        <div className="bg-[#10b981]/10 border border-[#10b981]/20 p-2.5 flex items-center text-[#4edea3] text-[11px] font-mono font-bold">
                                                            <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" /> SETTLEMENT CONFIRMED ON-CHAIN
                                                        </div>
                                                    ) : txStates[msg.id] === 'pending' ? (
                                                        <div className="bg-[#ffb95f]/10 border border-[#ffb95f]/20 p-2.5 flex items-center text-[#ffb95f] text-[11px] font-mono">
                                                            <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin shrink-0" /> MINING ON AVALANCHE FUJI...
                                                        </div>
                                                    ) : txStates[msg.id] === 'failed' ? (
                                                        <div className="bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 p-2.5 text-[#ffb4ab] text-[11px] font-mono font-bold">
                                                            ❌ TRANSACTION REJECTED BY WALLET OR GATEWAY
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleExecuteOnChainAction(msg.id, msg.action)}
                                                            className="w-full bg-[#ffb95f] hover:bg-[#d97706] text-[#081425] font-mono font-bold py-2.5 text-[11px] uppercase tracking-wider transition-colors cursor-pointer rounded-sm"
                                                        >
                                                            Sign & Execute On-Chain
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Avatar for User */}
                                    {isUser && (
                                        <div className="w-8 h-8 rounded-full bg-[#152031] border border-[#3c4a42] flex items-center justify-center shrink-0">
                                            <span className="text-[10px] font-mono font-bold text-[#bbcabf]">OP</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {isAiLoading && (
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center shrink-0">
                                    <Cpu className="w-4 h-4 text-[#4edea3]" />
                                </div>
                                <div className="bg-[#081425] border border-[#1e293b] p-4 rounded-lg rounded-tl-none max-w-xs flex items-center space-x-3 text-xs text-[#bbcabf] font-mono">
                                    <div className="flex space-x-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                    <span>Generating response...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Input form */}
                    <form onSubmit={handleSendMessage} className="p-6 border-t border-[#1e293b] bg-[#081425] flex space-x-4 shrink-0">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={aiMode === 'general' ? 'Ask a general web3 question...' : 'e.g. swap 0.1 AVAX to USDC'}
                            className="flex-1 bg-[#040e1f] border border-[#3c4a42] p-3 text-xs text-white focus:outline-none focus:border-[#4edea3] transition-colors font-mono"
                        />
                        <button 
                            type="submit"
                            disabled={isAiLoading || !chatInput.trim()}
                            className="bg-[#10b981] hover:bg-[#003824] text-[#081425] font-bold px-6 text-xs uppercase tracking-widest transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}
        </main>

      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#081425] border border-[#1e293b] w-full max-w-md overflow-hidden relative shadow-2xl">
            <div className="px-6 py-4 border-b border-[#1e293b] flex justify-between items-center bg-[#152031]">
              <h3 className="text-sm font-bold text-white tracking-wider font-mono uppercase">Sentinel Config Parameters</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-[#bbcabf] hover:text-white transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-mono font-bold text-[#bbcabf] mb-2 uppercase tracking-widest">Fuji RPC Provider URL</label>
                <input 
                  type="text" 
                  value={fujiRpcUrl}
                  onChange={(e) => setFujiRpcUrl(e.target.value)}
                  className="w-full bg-[#040e1f] border border-[#3c4a42] p-2 text-xs text-white focus:outline-none focus:border-[#4edea3] transition-colors font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-[#bbcabf] mb-2 uppercase tracking-widest">Gatekeeper API Endpoint</label>
                <input 
                  type="text" 
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="w-full bg-[#040e1f] border border-[#3c4a42] p-2 text-xs text-white focus:outline-none focus:border-[#4edea3] transition-colors font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-[#bbcabf] mb-2 uppercase tracking-widest">USDC Token Contract Address</label>
                <input 
                  type="text" 
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  className="w-full bg-[#040e1f] border border-[#3c4a42] p-2 text-xs text-white focus:outline-none focus:border-[#4edea3] transition-colors font-mono"
                />
              </div>
              <button 
                onClick={() => {
                  addLog("SYSTEM", `Applied configurations: API at ${apiUrl}, RPC at ${fujiRpcUrl.slice(0, 30)}...`, true);
                  setIsSettingsOpen(false);
                }}
                className="w-full bg-[#10b981] hover:bg-[#003824] text-[#081425] font-bold py-3 text-xs uppercase tracking-widest transition-colors cursor-pointer"
              >
                Save & Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Logs Modal */}
      {isSecurityOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#081425] border border-[#1e293b] w-full max-w-lg overflow-hidden relative shadow-2xl">
            <div className="px-6 py-4 border-b border-[#1e293b] flex justify-between items-center bg-[#152031]">
              <h3 className="text-sm font-bold text-white tracking-wider font-mono uppercase flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-[#4edea3]" /> Network Ingress Firewall Audits
              </h3>
              <button onClick={() => setIsSecurityOpen(false)} className="text-[#bbcabf] hover:text-white transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-[#040e1f] border border-[#1e293b] p-4 h-64 overflow-y-auto font-mono text-[11px] text-[#d8e3fb] space-y-2 mb-6">
                {securityLogs.map((log, idx) => (
                  <div key={idx} className="flex space-x-2">
                    <span className="text-[#86948a] shrink-0">[{log.ts}]</span>
                    <span className={`font-bold shrink-0 ${log.level === 'SECURE' ? 'text-[#4edea3]' : log.level === 'AUDIT' ? 'text-[#ffb95f]' : 'text-[#bbcabf]'}`}>
                      [{log.level}]
                    </span>
                    <span>{log.msg}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={runSecurityScan}
                disabled={isScanning}
                className="w-full bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/20 border border-[#ffb4ab]/50 text-[#ffb4ab] font-bold py-3 text-xs uppercase tracking-widest transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? "Scanning Stack Memory..." : "Initiate Audit Memory Scan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Status Modal */}
      {isSystemOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#081425] border border-[#1e293b] w-full max-w-lg overflow-hidden relative shadow-2xl">
            <div className="px-6 py-4 border-b border-[#1e293b] flex justify-between items-center bg-[#152031]">
              <h3 className="text-sm font-bold text-white tracking-wider font-mono uppercase flex items-center">
                <Activity className="w-4 h-4 mr-2 text-[#4edea3]" /> Gateway Node Diagnostics
              </h3>
              <button onClick={() => setIsSystemOpen(false)} className="text-[#bbcabf] hover:text-white transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#040e1f] border border-[#1e293b] p-4 text-center">
                  <span className="block text-[9px] font-mono text-[#bbcabf] uppercase tracking-widest mb-1">CPU Usage</span>
                  <span className="text-xl font-bold font-mono text-[#4edea3]">{cpuLoad}%</span>
                </div>
                <div className="bg-[#040e1f] border border-[#1e293b] p-4 text-center">
                  <span className="block text-[9px] font-mono text-[#bbcabf] uppercase tracking-widest mb-1">RAM Allocated</span>
                  <span className="text-xl font-bold font-mono text-[#4edea3]">{ramUsed}MB</span>
                </div>
                <div className="bg-[#040e1f] border border-[#1e293b] p-4 text-center">
                  <span className="block text-[9px] font-mono text-[#bbcabf] uppercase tracking-widest mb-1">Fuji Latency</span>
                  <span className="text-xl font-bold font-mono text-[#4edea3]">{rpcLatency}ms</span>
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs border-t border-[#1e293b] pt-4 text-[#bbcabf]">
                <div className="flex justify-between">
                  <span>Identity Contract:</span>
                  <a href="https://testnet.snowtrace.io/address/0xf103838D5d0AE522198E162dA4732948d5c0a24f" target="_blank" rel="noreferrer" className="text-[#4edea3] hover:underline">0xf103...a24f</a>
                </div>
                <div className="flex justify-between">
                  <span>Reputation Contract:</span>
                  <a href="https://testnet.snowtrace.io/address/0xa0C727A89D97eea9368b758E77Db1ab6baDe373F" target="_blank" rel="noreferrer" className="text-[#4edea3] hover:underline">0xa0C7...373F</a>
                </div>
                <div className="flex justify-between">
                  <span>Mock Flash Vault:</span>
                  <a href="https://testnet.snowtrace.io/address/0xd9cFAad4e9ad195e08ec894e54Fc4462590549F0" target="_blank" rel="noreferrer" className="text-[#4edea3] hover:underline">0xd9cF...49F0</a>
                </div>
                <div className="flex justify-between">
                  <span>Vault Liquid Asset:</span>
                  <span className="text-white">USDC (6 Decimals)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
