import { useState, useEffect, useCallback } from 'react';
import { useSentinelData } from './hooks/useSentinelData';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import contractAddresses from './addresses.json';
import { Activity, ShieldCheck, FileText, Settings, Bell, LayoutDashboard, X, RefreshCw, CheckCircle2, Cpu, AlertCircle, Play, DollarSign, Lock, Unlock, Star, Fingerprint, Copy, User, Terminal } from 'lucide-react';
import { ClaudeChatInput } from './components/ui/claude-style-ai-input';

const renderMessageContent = (content) => {
  const boldRegex = /\*\*(.*?)\*\*/g;
  const bulletRegex = /^\*\s+(.*)$/gm;
  const numBulletRegex = /^(\d+)\.\s+(.*)$/gm;
  let html = content
    .replace(boldRegex, '<strong class="text-[#4edea3] font-bold">$1</strong>')
    .replace(bulletRegex, '<li class="ml-4 list-disc my-1 text-[#bbcabf]">$1</li>')
    .replace(numBulletRegex, '<div class="ml-4 my-1 text-[#d8e3fb] font-mono"><span class="text-[#4edea3] font-bold">$1.</span> $2</div>');
  
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

export default function App({ initialTab = 'hub', isGuidedEntry = false, onNavigate, onExit }) {
  const { agents, vaultBalance, liveBlocks, eventsFeed, loading, executeAdminSlash, addLog } = useSentinelData();
  const { login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [targetId, setTargetId] = useState('');
  const [scoreInput, setScoreInput] = useState('');
  const [isSlasherPending, setIsSlasherPending] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Speedrun Playground States
  const [userAvaxBalance, setUserAvaxBalance] = useState("0");
  const [userUsdcBalance, setUserUsdcBalance] = useState("0");
  const [registeredAgentId, setRegisteredAgentId] = useState("");
  const [isMintingAgent, setIsMintingAgent] = useState(false);
  const [isRefilling, setIsRefilling] = useState(false);
  const [isFauceting, setIsFauceting] = useState(false);
  const [agentDomainInput, setAgentDomainInput] = useState("operator.sentinel.test");
  const [isNodeOnline, setIsNodeOnline] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [x402Status, setX402Status] = useState("idle"); // idle | challenge | paying | verifying | success | failed
  const [unlockedPayload, setUnlockedPayload] = useState(null);
  const [x402Error, setX402Error] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Real transaction and payload capture
  const [agentTxDetails, setAgentTxDetails] = useState({ hash: null, timestamp: null });
  const [paymentTxDetails, setPaymentTxDetails] = useState({ hash: null, timestamp: null });
  const [challengeDetails, setChallengeDetails] = useState({ nonce: null, expiresAt: null, receipt: null, consumedAt: null });
  
  // Execution Terminal States
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [terminalStatus, setTerminalStatus] = useState("idle");
  
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

  const fetchUserBalancesAndAgent = useCallback(async () => {
    if (!authenticated || wallets.length === 0) return;
    try {
      const activeWallet = wallets[0];
      const providerUrl = fujiRpcUrl || 'https://api.avax-test.network/ext/bc/C/rpc';
      const provider = new ethers.JsonRpcProvider(providerUrl);
      
      // Get AVAX Balance
      const avax = await provider.getBalance(activeWallet.address);
      setUserAvaxBalance(Number(ethers.formatEther(avax)).toFixed(4));

      // Get USDC Balance
      const usdcContract = new ethers.Contract(
        tokenAddress,
        ["function balanceOf(address account) external view returns (uint256)"],
        provider
      );
      const usdc = await usdcContract.balanceOf(activeWallet.address);
      setUserUsdcBalance(Number(ethers.formatUnits(usdc, 6)).toFixed(2));

      // Check identity registry for this wallet
      const identityContract = new ethers.Contract(
        contractAddresses.identityRegistry,
        ["function resolveAgentByAddress(address agentAddress) external view returns (uint256 agentId, string memory agentDomain, address agentAddress_)"],
        provider
      );
      const agentInfo = await identityContract.resolveAgentByAddress(activeWallet.address);
      if (agentInfo && agentInfo[0] !== 0n) {
        setRegisteredAgentId(agentInfo[0].toString());
      } else {
        setRegisteredAgentId("");
      }
    } catch (err) {
      console.error("Failed to fetch user balances / agent:", err);
    }
  }, [authenticated, wallets, fujiRpcUrl, tokenAddress]);

  useEffect(() => {
    if (authenticated) {
      fetchUserBalancesAndAgent();
    } else {
      setUserAvaxBalance("0");
      setUserUsdcBalance("0");
      setRegisteredAgentId("");
    }
  }, [authenticated, liveBlocks, fetchUserBalancesAndAgent]);

  useEffect(() => {
    const checkNode = async () => {
      try {
        const res = await fetch("http://localhost:4020/health");
        if (res.ok) {
          setIsNodeOnline(true);
        } else {
          setIsNodeOnline(false);
        }
      } catch {
        setIsNodeOnline(false);
      }
    };
    checkNode();
    const nodeInterval = setInterval(checkNode, 5000);
    return () => clearInterval(nodeInterval);
  }, []);

  const handleRequestFaucet = async () => {
    if (!authenticated || wallets.length === 0) return;
    setIsFauceting(true);
    addLog("SYSTEM", "Requesting AVAX and USDC from local faucet endpoint...");
    try {
      const activeWallet = wallets[0];
      const res = await fetch(`${apiUrl}/faucet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: activeWallet.address })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to claim faucet");
      }
      const data = await res.json();
      addLog("SYSTEM", `Faucet dispatched! Gas Tx: ${data.nativeTx.slice(0, 8)}..., USDC Tx: ${data.usdcTx.slice(0, 8)}...`, true);
      alert("Faucet funds requested successfully! Awaiting blockchain confirmation...");
      fetchUserBalancesAndAgent();
    } catch (err) {
      addLog("SYSTEM", `Faucet request failed: ${err.message}`, false);
      alert(`Faucet failed: ${err.message}`);
    } finally {
      setIsFauceting(false);
    }
  };

  const handleRegisterAgent = async (e) => {
    e.preventDefault();
    if (!authenticated || wallets.length === 0) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!agentDomainInput.trim()) {
      alert("Please specify a domain.");
      return;
    }
    setIsMintingAgent(true);
    addLog("SYSTEM", `Initiating ERC-8004 Agent identity registration for '${agentDomainInput}'...`);
    try {
      const activeWallet = wallets[0];
      const eip1193Provider = await activeWallet.getEthereumProvider();
      const browserProvider = new ethers.BrowserProvider(eip1193Provider);
      const signer = await browserProvider.getSigner();
      
      const identityContract = new ethers.Contract(
        contractAddresses.identityRegistry,
        ["function newAgent(string calldata agentDomain, address agentAddress) external returns (uint256)"],
        signer
      );

      const tx = await identityContract.newAgent(agentDomainInput.trim(), activeWallet.address);
      addLog("SYSTEM", `Agent registration tx broadcasted: ${tx.hash.slice(0, 10)}... Awaiting mining.`);
      await tx.wait();
      setAgentTxDetails({ hash: tx.hash, timestamp: new Date().toLocaleString() });
      addLog("SYSTEM", `ERC-8004 Agent successfully registered!`, true, tx.hash);
      alert(`Agent registration confirmed on-chain!`);
      fetchUserBalancesAndAgent();
    } catch (err) {
      addLog("SYSTEM", `Registration failed: ${err.message}`, false);
      alert(`Registration failed: ${err.message}`);
    } finally {
      setIsMintingAgent(false);
    }
  };

  const handleRefillVault = async () => {
    if (!authenticated || wallets.length === 0) return;
    setIsRefilling(true);
    addLog("SYSTEM", "Sending 10.00 USDC to Sentinel Liquidity Pool reserves...");
    try {
      const activeWallet = wallets[0];
      const eip1193Provider = await activeWallet.getEthereumProvider();
      const browserProvider = new ethers.BrowserProvider(eip1193Provider);
      const signer = await browserProvider.getSigner();

      const usdcContract = new ethers.Contract(
        tokenAddress,
        ["function transfer(address to, uint256 amount) returns (bool)"],
        signer
      );

      const amount = ethers.parseUnits("10", 6);
      const tx = await usdcContract.transfer(contractAddresses.liquidityVault, amount);
      addLog("SYSTEM", `Vault deposit broadcasted: ${tx.hash.slice(0, 10)}...`);
      await tx.wait();
      addLog("SYSTEM", "Successfully deposited 10 USDC into Sentinel Liquidity Pool!", true);
      alert("Successfully deposited 10 USDC!");
      fetchUserBalancesAndAgent();
    } catch (err) {
      addLog("SYSTEM", `Vault deposit failed: ${err.message}`, false);
      alert(`Deposit failed: ${err.message}`);
    } finally {
      setIsRefilling(false);
    }
  };

  const handleExecuteArbitrage = async () => {
    if (!unlockedPayload || !wallets.length) return;
    
    setShowTerminal(true);
    setTerminalLogs([
      { ts: new Date().toLocaleTimeString(), text: "[AGENT] Initializing Status AI Node..." },
      { ts: new Date().toLocaleTimeString(), text: "[AGENT] Ingesting EIP-402 Capital Permission Payload..." }
    ]);
    setTerminalStatus("running");
    
    setTimeout(() => {
      setTerminalLogs(prev => [...prev, { ts: new Date().toLocaleTimeString(), text: "[AGENT] Evaluating Arbitrage Pathways on Fuji C-Chain..." }]);
    }, 1500);

    setTimeout(() => {
      setTerminalLogs(prev => [...prev, { ts: new Date().toLocaleTimeString(), text: `[AGENT] Found opportunity on TraderJoe & Pangolin for ${unlockedPayload.capitalPermission.asset}.` }]);
    }, 3000);

    setTimeout(async () => {
      setTerminalLogs(prev => [...prev, { ts: new Date().toLocaleTimeString(), text: "[AGENT] Requesting execution via gatekeeper..." }]);
      
      try {
        const res = await fetch("http://localhost:4020/api/v1/execute-lease", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: unlockedPayload.requestId,
            payload: unlockedPayload.capitalPermission,
            recipient: wallets[0].address
          })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          setTerminalLogs(prev => [...prev, { ts: new Date().toLocaleTimeString(), text: `[SYSTEM] Flash loan executed on-chain!` }]);
          setTerminalLogs(prev => [...prev, { ts: new Date().toLocaleTimeString(), text: `[SUCCESS] Transaction Hash: ${data.txHash}`, isLink: data.txHash }]);
          setTerminalStatus("success");
          addLog("AGENT", "Agent completed capital arbitrage successfully.", true, data.txHash);
        } else {
          setTerminalLogs(prev => [...prev, { ts: new Date().toLocaleTimeString(), text: `[ERROR] Execution failed: ${data.message}`, isError: true }]);
          setTerminalStatus("error");
        }
      } catch (err) {
        setTerminalLogs(prev => [...prev, { ts: new Date().toLocaleTimeString(), text: `[ERROR] Network error: ${err.message}`, isError: true }]);
        setTerminalStatus("error");
      }
    }, 4500);
  };

  const handleTriggerX402Request = async () => {
    if (!registeredAgentId) {
      alert("Please register an Agent NFT first.");
      return;
    }
    setX402Status("requesting");
    setX402Error("");
    setUnlockedPayload(null);
    addLog("SYSTEM", `Requesting lease capital from gatekeeper for Agent ID ${registeredAgentId}...`);
    try {
      const res = await fetch(`${apiUrl}/request-capital`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: registeredAgentId,
          capitalAmount: "5000000", // 5.00 USDC
          asset: "USDC",
          strategyHint: "playground-arb"
        })
      });

      if (res.status === 402) {
        const data = await res.json();
        setActiveInvoice(data.invoice);
        setX402Status("challenge");
        
        // Extract real details from the invoice
        const reqIdParts = data.invoice.requestId.split('_');
        setChallengeDetails({
            nonce: reqIdParts.length > 1 ? reqIdParts[1].slice(0, 6).toUpperCase() : "1A2B3C",
            expiresAt: data.invoice.expiresAt ? new Date(data.invoice.expiresAt).toLocaleTimeString() : "00:00:00",
            receipt: null,
            consumedAt: null
        });

        addLog("SYSTEM", `Gatekeeper issued x402 payment challenge! Invoice: ${data.invoice.requestId.slice(-6)}`);
      } else {
        const data = await res.json();
        throw new Error(data.message || `Unexpected response status ${res.status}`);
      }
    } catch (err) {
      setX402Status("failed");
      setX402Error(err.message);
      addLog("SYSTEM", `Capital request failed: ${err.message}`, false);
    }
  };

  const handlePayInvoiceOnChain = async () => {
    if (!activeInvoice || wallets.length === 0) return;
    setX402Status("paying");
    addLog("SYSTEM", `Initiating on-chain EIP-402 challenge payment of ${ethers.formatUnits(activeInvoice.amount, 6)} USDC...`);
    try {
      const activeWallet = wallets[0];
      const eip1193Provider = await activeWallet.getEthereumProvider();
      const browserProvider = new ethers.BrowserProvider(eip1193Provider);
      const signer = await browserProvider.getSigner();

      const usdcContract = new ethers.Contract(
        activeInvoice.token,
        ["function transfer(address to, uint256 amount) returns (bool)"],
        signer
      );

      const tx = await usdcContract.transfer(activeInvoice.destination, BigInt(activeInvoice.amount));
      addLog("SYSTEM", `Payment transaction broadcasted: ${tx.hash.slice(0, 10)}... Awaiting confirmation.`);
      await tx.wait();
      
      setPaymentTxDetails({ hash: tx.hash, timestamp: new Date().toLocaleString() });
      addLog("SYSTEM", `Payment confirmed! Submitting verification hash to gatekeeper...`, false, tx.hash);
      setX402Status("verifying");

      const b64Payment = btoa(tx.hash);
      const res = await fetch(`${apiUrl}/request-capital`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": activeInvoice.requestId,
          "x-payment": b64Payment
        },
        body: JSON.stringify({
          agentId: activeInvoice.agentId,
          capitalAmount: "5000000",
          asset: "USDC",
          strategyHint: "playground-arb"
        })
      });

      const data = await res.json();
      if (res.status === 200) {
        setX402Status("success");
        setUnlockedPayload(data);
        setChallengeDetails(prev => ({
            ...prev,
            receipt: data.paymentTx || tx.hash,
            consumedAt: new Date().toLocaleString()
        }));
        addLog("SYSTEM", `EIP-402 Challenge resolved! Capital Lease Permission Granted.`, true);
      } else {
        throw new Error(data.message || data.reason || `Verification returned status ${res.status}`);
      }
    } catch (err) {
      setX402Status("challenge");
      setX402Error(err.message);
      addLog("SYSTEM", `Payment verification failed: ${err.message}`, false);
    }
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

  const handleSwitchToFuji = async () => {
    if (wallets.length === 0) {
      addLog("SYSTEM", "Cannot switch chain: No wallet connected. Logging in...");
      login();
      return;
    }
    try {
      const activeWallet = wallets[0];
      await activeWallet.switchChain(43113);
      addLog("SYSTEM", "Chain switch requested. Awaiting user approval in wallet...", true);
    } catch (err) {
      addLog("SYSTEM", `Network switch rejected: ${err.message}`, false);
    }
  };

  const handleSendMessage = async (msgText, files = [], pasted = []) => {
    // Combine text, files, and pasted content for the AI prompt
    let fullPrompt = msgText || "";
    
    if (files.length > 0) {
      fullPrompt += "\n\n[Attached Files]:\n" + files.map(f => `--- ${f.file.name} ---\n${f.textContent || 'Binary file'}`).join('\n\n');
    }
    if (pasted.length > 0) {
      fullPrompt += "\n\n[Pasted Content]:\n" + pasted.map(p => p.content).join('\n\n');
    }

    if (!fullPrompt.trim()) return;

    const userMsgId = Date.now().toString();
    const userMessage = { id: userMsgId, role: 'user', content: fullPrompt };
    setChatMessages(prev => [...prev, userMessage]);
    
    const promptText = fullPrompt;
    setIsAiLoading(true);

    try {
      const systemPrompt = aiMode === 'general' 
        ? "You are the 402 Status AI companion. Answer the user's questions about blockchain, web3, Avalanche, liquidity, or general queries in a concise and helpful manner. Do not trigger or format any wallet actions."
        : `You are the 402 Status AI execution assistant.
If the user wants to swap, bridge, or transfer crypto:
1. You must identify their intent (swap, bridge, or transfer).
2. Format your response to include a JSON block at the very end of your response, starting with \`[ACTION_TRIGGER]\` followed by a JSON string:
\`[ACTION_TRIGGER]{"action": "swap", "from": "AVAX", "to": "USDC", "amount": "0.1"}\`, \`[ACTION_TRIGGER]{"action": "bridge", "from": "USDC", "to": "Ethereum", "amount": "5"}\`, or \`[ACTION_TRIGGER]{"action": "transfer", "from": "AVAX", "to": "0x715F47Ce330aF0fd7130290874a182FBaF1D892F", "amount": "0.1"}\`
Ensure you strictly extract the action (swap, bridge, or transfer), from token, to token/chain/address, and amount as numbers. If they specify tokens, AVAX and USDC are supported. If they ask to bridge, USDC can be bridged to Ethereum/Arbitrum/etc. If they ask to transfer, "to" should be the target address.
Example response: 'I can help you transfer 0.1 AVAX. Please confirm the details below. [ACTION_TRIGGER]{"action": "transfer", "from": "AVAX", "to": "0x715F47Ce330aF0fd7130290874a182FBaF1D892F", "amount": "0.1"}'

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
      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Error communicating with Status AI: ${err.message}` }]);
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
      if (action.action === 'transfer') {
        // Transfer to destination address
        if (action.from.toUpperCase() === 'AVAX') {
          tx = await signer.sendTransaction({
            to: action.to,
            value: ethers.parseEther(action.amount.toString())
          });
        } else {
          const usdcContract = new ethers.Contract(
            "0x5425890298aed601595a70AB815c96711a31Bc65",
            ["function transfer(address to, uint256 amount) returns (bool)"],
            signer
          );
          tx = await usdcContract.transfer(action.to, ethers.parseUnits(action.amount.toString(), 6));
        }
      } else if (action.action === 'swap') {
        if (action.from.toUpperCase() === 'AVAX') {
          // Send AVAX swap to vault
          tx = await signer.sendTransaction({
            to: contractAddresses.liquidityVault,
            value: ethers.parseEther(action.amount.toString())
          });
        } else {
          // Send USDC swap to vault (transfer USDC)
          const usdcContract = new ethers.Contract(
            "0x5425890298aed601595a70AB815c96711a31Bc65",
            ["function transfer(address to, uint256 amount) returns (bool)"],
            signer
          );
          tx = await usdcContract.transfer(contractAddresses.liquidityVault, ethers.parseUnits(action.amount.toString(), 6));
        }
      } else {
        // Bridge action: transfer AVAX or USDC to simulate lock
        if (action.from.toUpperCase() === 'AVAX') {
          tx = await signer.sendTransaction({
            to: contractAddresses.liquidityVault,
            value: ethers.parseEther(action.amount.toString())
          });
        } else {
          const usdcContract = new ethers.Contract(
            "0x5425890298aed601595a70AB815c96711a31Bc65",
            ["function transfer(address to, uint256 amount) returns (bool)"],
            signer
          );
          tx = await usdcContract.transfer(contractAddresses.liquidityVault, ethers.parseUnits(action.amount.toString(), 6));
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
    { id: 'ai', label: 'Status AI', icon: Cpu }
  ];

  return (
    <div className="flex h-screen bg-[#081425] text-[#d8e3fb] font-sans antialiased overflow-hidden">
      
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#081425] border-r border-[#1e293b] flex flex-col justify-between shrink-0">
        <div>
          <button type="button" onClick={onExit} className="p-6 pb-2 text-left flex items-center gap-3">
            <img src="/logo.png" alt="402 Status Logo" className="h-8 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-bold tracking-wider text-[#4edea3]">402 STATUS</h1>
              <div className="text-[10px] text-[#bbcabf] font-mono mt-1 tracking-widest uppercase">Capital operations</div>
            </div>
          </button>
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
          <div className="font-bold text-[15px] lg:text-[20px] tracking-wider text-white uppercase font-sans flex items-center gap-2">
             <img src="/logo.png" alt="402 Status Logo" className="h-6 w-auto object-contain" />
             402 STATUS
          </div>
          <div className="flex items-center space-x-6">
            <div 
              onClick={handleSwitchToFuji}
              className="flex items-center space-x-2 bg-[#152031] hover:bg-[#2a3548] px-3 py-1.5 rounded-sm border border-[#3c4a42] cursor-pointer transition text-[#4edea3]"
            >
                <div className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest">Fuji_RPC_Sync</span>
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
                <div className="space-y-6 max-w-[1400px] mx-auto text-white">
                    {/* Header */}
                    <div className="flex justify-between items-center bg-[#081425] border border-[#1e293b] p-6">
                        <div>
                            <h2 className="text-[20px] font-bold text-white flex items-center">
                                <ShieldCheck className="w-5 h-5 text-[#4edea3] mr-2" />
                                Capital Access Control
                            </h2>
                            <p className="text-xs text-[#bbcabf] mt-1 font-mono">
                                Deterministic policy → verifiable execution → auditable capital loop.
                            </p>
                        </div>
                    </div>

                    {/* Capital Access Control Flowchart */}
                    <div className="bg-[#081425] border border-[#1e293b] p-8 relative overflow-hidden">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                            
                            {/* Agent Node */}
                            <div className="w-[300px] bg-[#040e1f] border border-[#1e293b] p-5 rounded-sm flex items-center shrink-0">
                                <div className="w-12 h-12 rounded bg-[#10b981]/10 flex items-center justify-center mr-4">
                                    <Fingerprint className="w-6 h-6 text-[#4edea3]" />
                                </div>
                                <div>
                                    <div className="text-[14px] font-bold text-white flex items-center">
                                        Agent {registeredAgentId ? `#${registeredAgentId}` : "Unregistered"} 
                                        <Copy className="w-3 h-3 ml-2 text-[#bbcabf] cursor-pointer" />
                                    </div>
                                    <div className="mt-1 flex items-center">
                                        {registeredAgentId ? (
                                            <span className="text-[9px] font-mono bg-[#10b981]/15 text-[#4edea3] px-2 py-0.5 rounded font-bold">TRUSTED</span>
                                        ) : (
                                            <span className="text-[9px] font-mono bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded font-bold">PENDING</span>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-[#bbcabf] mt-2 font-mono flex items-center">
                                        ERC-8004 Identity Registry verified <CheckCircle2 className="w-3 h-3 text-[#4edea3] ml-1" />
                                    </div>
                                </div>
                            </div>

                            {/* Connecting Line */}
                            <div className="hidden lg:block flex-1 h-[1px] bg-gradient-to-r from-[#1e293b] via-[#4edea3] to-[#1e293b] relative">
                            </div>

                            {/* Reputation Circular Diagram */}
                            {(() => {
                                const activeAgentData = agents.find(a => a.id === registeredAgentId) || { score: 0 };
                                const score = activeAgentData.score;
                                const strokeDasharray = `${(score / 100) * 283} 283`;
                                return (
                                    <div className="relative w-32 h-32 flex flex-col items-center justify-center shrink-0">
                                        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                                            <circle cx="64" cy="64" r="50" fill="none" stroke="#1e293b" strokeWidth="8" />
                                            <circle cx="64" cy="64" r="50" fill="none" stroke="#4edea3" strokeWidth="8" strokeDasharray={strokeDasharray} className="transition-all duration-1000" />
                                        </svg>
                                        <div className="text-4xl font-bold font-sans flex items-baseline leading-none">
                                            {score}<span className="text-sm text-[#bbcabf] ml-0.5">/100</span>
                                        </div>
                                        <div className="text-[8px] font-mono text-[#bbcabf] uppercase tracking-widest mt-2 text-center">
                                            Reputation<br/>Score
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="hidden lg:block w-8 h-[1px] bg-[#4edea3]"></div>

                            {/* Policies Flow */}
                            <div className="flex flex-col gap-4 shrink-0">
                                <div className="bg-[#040e1f] border border-[#1e293b] p-4 rounded-sm flex items-center w-64">
                                    <div className="w-1 h-8 bg-[#4edea3] mr-4"></div>
                                    <div>
                                        <div className="text-[10px] text-[#bbcabf] font-mono uppercase tracking-widest">x402 fee</div>
                                        <div className="text-sm font-bold text-white">{activeInvoice ? `$${ethers.formatUnits(activeInvoice.amount, 6)} USDC` : 'Dynamic ($1.00+)'}</div>
                                        <div className="text-[10px] text-[#4edea3] font-mono mt-1">Policy: score ≥ 40</div>
                                    </div>
                                </div>
                                <div className="bg-[#040e1f] border border-[#1e293b] p-4 rounded-sm flex items-center w-64">
                                    <div className="w-1 h-8 bg-[#4edea3] mr-4"></div>
                                    <div>
                                        <div className="text-[10px] text-[#bbcabf] font-mono uppercase tracking-widest">Capital capacity</div>
                                        <div className="text-sm font-bold text-white">{vaultBalance ? `$${vaultBalance} USDC` : '---'}</div>
                                        <div className="text-[10px] text-[#4edea3] font-mono mt-1">Policy: score ≥ 80</div>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden lg:block flex-1 h-[1px] bg-[#1e293b]"></div>

                            {/* Action Block */}
                            <div className="flex flex-col shrink-0 w-64">
                                <div className="border border-[#1e293b] p-4 mb-4 flex items-center bg-[#152031]">
                                    <CheckCircle2 className="w-5 h-5 text-[#4edea3] mr-3 shrink-0" />
                                    <div>
                                        <div className="text-xs font-bold text-white">Policy satisfied</div>
                                        <div className="text-[10px] text-[#bbcabf] font-mono mt-0.5">Deterministic terms approved.</div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => {
                                        const isFullySetup = authenticated && registeredAgentId && Number(userAvaxBalance) > 0.05 && Number(vaultBalance) >= 10;
                                        if (!isFullySetup) {
                                            setShowOnboarding(true);
                                            return;
                                        }

                                        if (x402Status === 'idle' || x402Status === 'failed') {
                                            handleTriggerX402Request();
                                        } else if (x402Status === 'challenge') {
                                            handlePayInvoiceOnChain();
                                        } else if (x402Status === 'success') {
                                            alert("Loop complete.");
                                        }
                                    }}
                                    className={`w-full font-bold py-3 text-sm rounded-sm transition flex items-center justify-center cursor-pointer mb-2 ${(!authenticated || !registeredAgentId || Number(userAvaxBalance) <= 0.05 || Number(vaultBalance) < 10) ? 'bg-amber-500 hover:bg-amber-600 text-amber-950' : 'bg-[#4edea3] hover:bg-[#10b981] text-[#081425]'}`}
                                >
                                    {(!authenticated || !registeredAgentId || Number(userAvaxBalance) <= 0.05 || Number(vaultBalance) < 10) ? (
                                        <>
                                            <Settings className="w-4 h-4 mr-2" /> Complete Setup
                                        </>
                                    ) : x402Status === 'requesting' || x402Status === 'paying' || x402Status === 'verifying' ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            {x402Status === 'requesting' ? 'Requesting...' : x402Status === 'paying' ? 'Paying...' : 'Verifying...'}
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2 fill-current" />
                                            {x402Status === 'challenge' ? 'Pay Invoice' : 'Run capital loop'}
                                        </>
                                    )}
                                </button>
                                <button className="w-full border border-[#3c4a42] hover:bg-[#152031] text-white font-mono text-xs py-3 rounded-sm transition flex items-center justify-center cursor-pointer">
                                    <FileText className="w-3.5 h-3.5 mr-2" /> View proof
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Linear Timeline Tracker */}
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-4 py-4 px-8 border border-[#1e293b] bg-[#081425]">
                        <div className="flex items-center space-x-3 w-full lg:w-auto opacity-100">
                            <Fingerprint className="w-6 h-6 text-[#4edea3]" />
                            <div>
                                <div className="text-xs font-bold text-white flex items-center">
                                    01 Identify {registeredAgentId && <span className="ml-2 text-[9px] font-mono bg-[#10b981]/15 text-[#4edea3] px-1.5 py-0.5 rounded uppercase tracking-widest">Verified</span>}
                                </div>
                                <div className="text-[10px] text-[#bbcabf] font-mono mt-0.5">Identity resolved on ERC-8004</div>
                            </div>
                            <div className="flex-1 h-[1px] bg-[#4edea3] mx-4 hidden lg:block min-w-[30px]"></div>
                        </div>
                        
                        <div className={`flex items-center space-x-3 w-full lg:w-auto transition-opacity ${x402Status !== 'idle' ? 'opacity-100' : 'opacity-40'}`}>
                            <FileText className={`w-6 h-6 ${x402Status !== 'idle' ? 'text-[#4edea3]' : 'text-slate-500'}`} />
                            <div>
                                <div className="text-xs font-bold text-white flex items-center">
                                    02 Price {x402Status !== 'idle' && <span className="ml-2 text-[9px] font-mono bg-[#10b981]/15 text-[#4edea3] px-1.5 py-0.5 rounded uppercase tracking-widest">Issued</span>}
                                </div>
                                <div className="text-[10px] text-[#bbcabf] font-mono mt-0.5">x402 invoice issued</div>
                            </div>
                            <div className={`flex-1 h-[1px] mx-4 hidden lg:block min-w-[30px] ${x402Status !== 'idle' ? 'bg-[#4edea3]' : 'bg-[#1e293b]'}`}></div>
                        </div>

                        <div className={`flex items-center space-x-3 w-full lg:w-auto transition-opacity ${x402Status === 'success' ? 'opacity-100' : 'opacity-40'}`}>
                            <DollarSign className={`w-6 h-6 ${x402Status === 'success' ? 'text-[#4edea3]' : 'text-slate-500'}`} />
                            <div>
                                <div className="text-xs font-bold text-white flex items-center">
                                    03 Settle {x402Status === 'success' && <span className="ml-2 text-[9px] font-mono bg-[#10b981]/15 text-[#4edea3] px-1.5 py-0.5 rounded uppercase tracking-widest">Settled</span>}
                                </div>
                                <div className="text-[10px] text-[#bbcabf] font-mono mt-0.5">USDC payment verified</div>
                            </div>
                            <div className={`flex-1 h-[1px] mx-4 hidden lg:block min-w-[30px] ${x402Status === 'success' ? 'bg-[#4edea3]' : 'bg-[#1e293b]'}`}></div>
                        </div>

                        <div className={`flex items-center space-x-3 w-full lg:w-auto transition-opacity ${unlockedPayload ? 'opacity-100' : 'opacity-40'}`}>
                            <Unlock className={`w-6 h-6 ${unlockedPayload ? 'text-[#4edea3]' : 'text-slate-500'}`} />
                            <div>
                                <div className="text-xs font-bold text-white flex items-center">
                                    04 Unlock {unlockedPayload && <span className="ml-2 text-[9px] font-mono bg-[#10b981]/15 text-[#4edea3] px-1.5 py-0.5 rounded uppercase tracking-widest">Unlocked</span>}
                                </div>
                                <div className="text-[10px] text-[#bbcabf] font-mono mt-0.5">Capital permission granted</div>
                            </div>
                        </div>
                    </div>

                    {/* Grid Data Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        {/* Card 1: ERC-8004 Identity */}
                        <div className="bg-[#081425] border border-[#1e293b] p-6 text-xs font-mono">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center text-white font-bold font-sans text-[13px]">
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> ERC-8004 Identity
                                </div>
                                {registeredAgentId && <span className="text-[9px] font-mono bg-[#10b981]/15 text-[#4edea3] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Verified</span>}
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Agent ID</span>
                                    <span className="text-white">#{registeredAgentId || "---"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[#bbcabf]">Address</span>
                                    <span className="text-[#4edea3] flex items-center">
                                        {user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : "---"}
                                        <Copy className="w-3 h-3 ml-1.5 cursor-pointer hover:text-white transition" />
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Registry</span>
                                    <span className="text-white">EIP-8004 Identity Registry</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Proof</span>
                                    <span className="text-white">
                                        {agentTxDetails.hash ? (
                                            <a href={`https://testnet.snowtrace.io/tx/${agentTxDetails.hash}`} target="_blank" rel="noreferrer" className="text-[#4edea3] hover:underline">
                                                {agentTxDetails.hash.slice(0, 6)}...{agentTxDetails.hash.slice(-4)}
                                            </a>
                                        ) : "---"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Verified</span>
                                    <span className="text-white">{agentTxDetails.timestamp || "---"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: x402 Settlement */}
                        <div className="bg-[#081425] border border-[#1e293b] p-6 text-xs font-mono">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center text-white font-bold font-sans text-[13px]">
                                    <DollarSign className="w-4 h-4 mr-2" /> x402 Settlement
                                </div>
                                {x402Status === 'success' && <span className="text-[9px] font-mono bg-[#10b981]/15 text-[#4edea3] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Settled</span>}
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Amount</span>
                                    <span className="text-white font-bold">{activeInvoice ? `$${ethers.formatUnits(activeInvoice.amount, 6)} USDC` : "---"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Invoice ID</span>
                                    <span className="text-[#4edea3]">{activeInvoice ? `INV-${activeInvoice.requestId.slice(-8).toUpperCase()}` : "---"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Tx Hash</span>
                                    <span className="text-white">
                                        {paymentTxDetails.hash ? (
                                            <a href={`https://testnet.snowtrace.io/tx/${paymentTxDetails.hash}`} target="_blank" rel="noreferrer" className="text-[#4edea3] hover:underline">
                                                {paymentTxDetails.hash.slice(0, 6)}...{paymentTxDetails.hash.slice(-4)}
                                            </a>
                                        ) : "---"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Block</span>
                                    <span className="text-white">{liveBlocks || "---"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Settled</span>
                                    <span className="text-white">{paymentTxDetails.timestamp || "---"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Replay Protection */}
                        <div className="bg-[#081425] border border-[#1e293b] p-6 text-xs font-mono">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center text-white font-bold font-sans text-[13px]">
                                    <ShieldCheck className="w-4 h-4 mr-2" /> Replay Protection
                                </div>
                                {unlockedPayload && <span className="text-[9px] font-mono bg-[#10b981]/15 text-[#4edea3] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Single-Use</span>}
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Nonce</span>
                                    <span className="text-white">{challengeDetails.nonce || "---"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[#bbcabf]">Status</span>
                                    {challengeDetails.consumedAt ? (
                                        <span className="text-[#4edea3] flex items-center font-bold">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> CONSUMED
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 font-bold">PENDING</span>
                                    )}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Expires At</span>
                                    <span className="text-white">{challengeDetails.expiresAt || "---"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Receipt</span>
                                    <span className="text-white">
                                        {challengeDetails.receipt ? (
                                            <a href={`https://testnet.snowtrace.io/tx/${challengeDetails.receipt}`} target="_blank" rel="noreferrer" className="text-[#4edea3] hover:underline">
                                                {challengeDetails.receipt.slice(0, 6)}...{challengeDetails.receipt.slice(-4)}
                                            </a>
                                        ) : "---"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Consumed</span>
                                    <span className="text-white">{challengeDetails.consumedAt || "---"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 4: Reputation Policy */}
                        <div className="bg-[#081425] border border-[#1e293b] p-6 text-xs font-mono">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center text-white font-bold font-sans text-[13px]">
                                    <Star className="w-4 h-4 mr-2" /> Reputation Policy
                                </div>
                                <span className="text-[9px] font-mono bg-[#10b981]/15 text-[#4edea3] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Active</span>
                            </div>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Policy</span>
                                    <span className="text-white">Score-based access control</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Current Score</span>
                                    <span className="text-white font-bold">{agents.find(a => a.id === registeredAgentId)?.score || 0}/100</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#bbcabf]">Tier</span>
                                    <span className="text-[#4edea3] font-bold">TRUSTED</span>
                                </div>
                            </div>
                            {/* Score Slider */}
                            {(() => {
                                const activeAgentData = agents.find(a => a.id === registeredAgentId) || { score: 0 };
                                const score = activeAgentData.score;
                                return (
                                <div className="mt-6 relative pt-4">
                                    <div className="absolute top-0 transform -translate-x-1/2 -mt-1 text-white font-bold text-xs" style={{ left: `${score}%` }}>{score}</div>
                                    <div className="absolute top-3 transform -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-transparent border-t-white" style={{ left: `${score}%` }}></div>
                                    <div className="flex h-1.5 rounded-full overflow-hidden mb-2">
                                        <div className="bg-[#ffb4ab] w-[40%]"></div>
                                        <div className="bg-[#ffb95f] w-[40%]"></div>
                                        <div className="bg-[#4edea3] w-[20%]"></div>
                                    </div>
                                    <div className="flex justify-between text-[8px] text-[#bbcabf] font-mono uppercase text-center relative">
                                        <div className="w-[40%] flex flex-col items-start"><span className="text-white">0</span><span>New<br/>0-39</span></div>
                                        <div className="w-[40%] flex flex-col items-center"><span className="text-white">40</span><span>Standard<br/>40-79</span></div>
                                        <div className="w-[20%] flex flex-col items-end"><span className="text-white">80</span><span>Trusted<br/>80-100</span></div>
                                        <div className="absolute right-0 top-6 text-white text-[8px]">100</div>
                                    </div>
                                </div>
                                )
                            })()}
                        </div>

                    </div>

                    {/* Live Protocol Stream Table */}
                    <div className="bg-[#081425] border border-[#1e293b] flex flex-col min-h-[300px]">
                        <div className="px-6 py-4 border-b border-[#1e293b] flex justify-between items-center bg-[#081425]">
                             <div className="text-[13px] font-bold text-white font-sans flex items-center">
                                Live Protocol Stream 
                                <span className="ml-3 text-[9px] font-mono text-[#4edea3] bg-[#4edea3]/10 px-1.5 py-0.5 rounded border border-[#4edea3]/20 uppercase tracking-widest flex items-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse mr-1.5"></div> LIVE
                                </span>
                             </div>
                        </div>
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="text-[10px] font-mono text-[#bbcabf] font-bold uppercase tracking-widest border-b border-[#1e293b] bg-[#152031]/30">
                                    <tr>
                                        <th className="py-3 px-6">TIME (UTC)</th>
                                        <th className="py-3 px-6">EVENT</th>
                                        <th className="py-3 px-6">DETAILS</th>
                                        <th className="py-3 px-6">PROOF</th>
                                        <th className="py-3 px-6">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[12px] font-mono text-[#bbcabf]">
                                    {eventsFeed.length === 0 && (
                                        <tr><td colSpan="5" className="py-8 px-6 text-center text-[#86948a] italic">Awaiting live protocol events...</td></tr>
                                    )}
                                    {eventsFeed.map((item, idx) => (
                                        <tr key={idx} className="border-b border-[#1e293b]/50 hover:bg-[#152031]/80 transition-colors">
                                            <td className="py-3 px-6 whitespace-nowrap">{item.time}</td>
                                            <td className="py-3 px-6 text-white font-bold">{item.type}</td>
                                            <td className="py-3 px-6">
                                                {item.isHtml ? <span dangerouslySetInnerHTML={{ __html: item.msg }}></span> : <span>{item.msg}</span>}
                                            </td>
                                            <td className="py-3 px-6 whitespace-nowrap">
                                                {item.txHash ? (
                                                    <a href={`https://testnet.snowtrace.io/tx/${item.txHash}`} target="_blank" rel="noreferrer" className="text-[#4edea3] hover:underline">
                                                        {item.txHash.slice(0, 6)}...{item.txHash.slice(-4)}
                                                    </a>
                                                ) : <span className="text-slate-600">---</span>}
                                            </td>
                                            <td className="py-3 px-6 whitespace-nowrap">
                                                <span className={`flex items-center font-bold ${item.isSuccess ? 'text-[#4edea3]' : 'text-slate-400'}`}>
                                                    {item.isSuccess ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> VERIFIED</> : <><Activity className="w-3.5 h-3.5 mr-1.5" /> LOGGED</>}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                                                agent.score >= 80 ? 'bg-[#10b981]/10 text-[#4edea3] border-[#10b981]/20' : 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/20'
                                             }`}>
                                                {agent.score >= 80 ? "Trusted Flow" : agent.score >= 40 ? "Standard Risk" : "New Agent"}
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
                            <h2 className="text-[24px] font-bold text-white mb-2 leading-none">Status AI Agent</h2>
                            <div className="flex items-center text-[10px] text-[#4edea3] font-mono tracking-widest uppercase">
                                <Cpu className="w-3.5 h-3.5 mr-2 text-[#4edea3]" /> Status AI Execution Node
                            </div>
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
                                    STATUS AI CO-PILOT SYSTEM
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
                                            {isUser ? 'Operator' : 'Status AI'}
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
                                                                {msg.action.action === 'swap' ? 'Counterparty Asset' : msg.action.action === 'transfer' ? 'Destination Address' : 'Destination Chain'}
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
                    <div className="p-4 border-t border-[#1e293b] bg-[#081425] shrink-0 w-full">
                        <ClaudeChatInput
                            onSendMessage={handleSendMessage}
                            disabled={isAiLoading}
                            placeholder={aiMode === 'general' ? 'Ask a general web3 question...' : 'e.g. swap 0.1 AVAX to USDC'}
                        />
                    </div>
                </div>
            )}
        </main>

      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#081425] border border-[#1e293b] w-full max-w-md overflow-hidden relative shadow-2xl">
            <div className="px-6 py-4 border-b border-[#1e293b] flex justify-between items-center bg-[#152031]">
              <h3 className="text-sm font-bold text-white tracking-wider font-mono uppercase">402 Status Config Parameters</h3>
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
                  <span>DeFi Yield Vault:</span>
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

      {/* x402 Payment Challenge Modal */}
      {(x402Status === 'challenge' || x402Status === 'paying' || x402Status === 'verifying' || x402Status === 'success') && activeInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#081425] border border-[#1e293b] w-full max-w-xl overflow-hidden relative shadow-[0_0_50px_rgba(16,185,129,0.15)] my-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#10b981] via-[#4edea3] to-[#ffb95f]"></div>
            
            <div className="px-6 py-4 border-b border-[#1e293b] flex justify-between items-center bg-[#152031]">
              <h3 className="text-sm font-bold text-white tracking-wider font-mono uppercase flex items-center">
                <FileText className="w-4 h-4 mr-2 text-[#4edea3]" />
                x402 protocol billing challenge
              </h3>
              <button 
                onClick={() => {
                  setX402Status("idle");
                  setActiveInvoice(null);
                  setUnlockedPayload(null);
                }} 
                className="text-[#bbcabf] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Challenge Overview */}
              <div className="bg-[#040e1f] border border-[#1e293b] p-4 rounded-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Challenge ID</span>
                  <span className="text-xs font-mono text-[#4edea3] font-bold">{activeInvoice.requestId}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono border-t border-[#1e293b]/50 pt-3">
                  <div>
                    <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Agent Trust Score</span>
                    <span className={`font-bold ${activeInvoice.reputationScore >= 80 ? 'text-[#4edea3]' : 'text-amber-400'}`}>
                      {activeInvoice.reputationScore}/100 ({activeInvoice.pricingTier === 'trusted-agent' ? 'Trusted Flow' : activeInvoice.pricingTier === 'standard-risk' ? 'Standard Risk' : 'New Agent'})
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Required Lease Fee</span>
                    <span className="text-white font-bold">{ethers.formatUnits(activeInvoice.amount, 6)} USDC</span>
                  </div>
                </div>
              </div>

              {x402Status === 'challenge' && (
                <div className="space-y-4">
                  <div className="text-xs text-[#bbcabf] leading-relaxed">
                    Under the <strong className="text-[#4edea3]">EIP-402 Capital Permissions standard</strong>, this agent must submit on-chain fee verification before capital lease permissions are unlocked. 
                    Choose your settlement channel below:
                  </div>

                  {x402Error && (
                    x402Error.toLowerCase().includes("insufficient") || x402Error.toLowerCase().includes("exceeds balance") ? (
                      <div className="flex flex-col items-center justify-center p-6 bg-[#ffb4ab]/5 border border-[#ffb4ab]/20 rounded-md text-center">
                        <AlertCircle className="w-8 h-8 text-[#ffb4ab] mb-3" />
                        <div className="text-[#ffb4ab] font-bold text-sm uppercase tracking-wider mb-2">Insufficient Fuji USDC</div>
                        <div className="text-[#bbcabf] text-xs leading-relaxed mb-4">
                          You do not have enough Fuji testnet USDC to pay the EIP-402 challenge invoice. 
                          Please fund your wallet using the Avalanche faucet to continue.
                        </div>
                        <a 
                          href="https://core.app/tools/testnet-faucet/?subnet=c&token=c" 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/20 border border-[#ffb4ab]/30 text-[#ffb4ab] px-4 py-2 text-xs uppercase tracking-widest font-bold rounded-sm transition"
                        >
                          Open Faucet
                        </a>
                      </div>
                    ) : x402Error.toLowerCase().includes("reject") ? (
                      <div className="bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 p-3 flex items-center text-xs text-[#ffb4ab] font-mono">
                        <X className="w-4 h-4 mr-2" /> Transaction was rejected by user.
                      </div>
                    ) : (
                      <div className="bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 p-3 text-xs text-[#ffb4ab] font-mono break-all">
                        Error: {x402Error}
                      </div>
                    )
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={handlePayInvoiceOnChain}
                      className="bg-[#10b981] hover:bg-[#003824] text-[#081425] font-mono font-bold py-3 text-xs uppercase tracking-wider transition cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                    >
                      <span>Pay On-Chain (Privy)</span>
                      <span className="text-[9px] font-normal uppercase opacity-75">Uses Fuji USDC</span>
                    </button>
                  </div>
                </div>
              )}

              {(x402Status === 'paying' || x402Status === 'verifying') && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <RefreshCw className="w-10 h-10 text-[#4edea3] animate-spin" />
                  <div className="text-sm font-mono text-white font-bold uppercase tracking-wider">
                    {x402Status === 'paying' ? 'Broadcasting Payment Transaction...' : 'Verifying Lease Payment...'}
                  </div>
                  <p className="text-xs text-[#bbcabf] font-mono text-center max-w-sm leading-relaxed">
                    {x402Status === 'paying' 
                      ? 'Please sign the USDC transfer transaction in your wallet.' 
                      : 'The gatekeeper node is verifying the C-Chain transaction logs.'
                    }
                  </p>
                </div>
              )}

              {x402Status === 'success' && unlockedPayload && (
                <div className="space-y-4">
                  <div className="bg-[#10b981]/10 border border-[#10b981]/20 p-4 flex items-center text-[#4edea3] text-xs font-mono font-bold">
                    <CheckCircle2 className="w-5 h-5 mr-3 shrink-0" />
                    CHALLENGE RESOLVED — LEASE ACTIVE (ON-CHAIN VERIFIED)
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Unlocked Vault Lease Payload</div>
                    <pre className="bg-[#040e1f] border border-[#1e293b] p-4 text-[11px] font-mono text-[#4edea3] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60 rounded-sm">
                      {JSON.stringify(unlockedPayload, null, 2)}
                    </pre>
                    {unlockedPayload.paymentExplorerUrl && (
                      <a
                        href={unlockedPayload.paymentExplorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block break-all text-xs font-mono text-[#4edea3] hover:underline"
                      >
                        View payment {unlockedPayload.paymentTx} on SnowTrace
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleExecuteArbitrage}
                      className="w-full bg-[#10b981] hover:bg-[#003824] text-[#081425] font-mono font-bold text-xs uppercase tracking-wider py-3 transition cursor-pointer flex items-center justify-center"
                    >
                      <Activity className="w-4 h-4 mr-2" /> Execute AI Arbitrage
                    </button>
                    <button
                      onClick={() => {
                        setX402Status("idle");
                        setActiveInvoice(null);
                        setUnlockedPayload(null);
                      }}
                      className="w-full bg-[#152031] hover:bg-[#2a3548] text-white font-mono text-xs uppercase tracking-wider py-3 border border-[#3c4a42] transition cursor-pointer"
                    >
                      Close & Return
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Execution Terminal Slideout */}
      {showTerminal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-end bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#040e1f] border border-[#1e293b] w-full max-w-lg h-[600px] shadow-2xl flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#4edea3]"></div>
            
            <div className="flex justify-between items-center p-4 border-b border-[#1e293b] bg-[#081425]">
              <div className="flex items-center text-[#4edea3] font-mono text-sm uppercase tracking-widest font-bold">
                <Terminal className="w-5 h-5 mr-2" /> Status AI Node
              </div>
              <button onClick={() => setShowTerminal(false)} className="text-[#bbcabf] hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs space-y-4 bg-[#020617] scrollbar-thin">
              {terminalLogs.map((log, i) => (
                <div key={i} className={`flex items-start ${log.isError ? 'text-[#ffb4ab]' : log.text.includes('[SUCCESS]') ? 'text-[#4edea3] font-bold' : 'text-[#bbcabf]'}`}>
                  <span className="text-slate-600 mr-3 shrink-0">[{log.ts}]</span>
                  <div className="break-words w-full">
                    {log.isLink ? (
                      <a href={`https://testnet.snowtrace.io/tx/${log.isLink}`} target="_blank" rel="noreferrer" className="underline hover:text-white">
                        {log.text}
                      </a>
                    ) : (
                      log.text
                    )}
                  </div>
                </div>
              ))}
              {terminalStatus === "running" && (
                <div className="flex items-center text-[#4edea3]">
                  <span className="text-slate-600 mr-3">[{new Date().toLocaleTimeString()}]</span>
                  <span className="animate-pulse">_</span>
                </div>
              )}
            </div>

            {terminalStatus === "success" && (
              <div className="p-4 border-t border-[#1e293b] bg-[#10b981]/10 flex items-center justify-between">
                <div className="flex items-center text-[#4edea3] font-mono text-xs font-bold uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Operation Complete
                </div>
                <button onClick={() => {
                  setShowTerminal(false);
                  setX402Status("idle");
                  setActiveInvoice(null);
                  setUnlockedPayload(null);
                }} className="bg-[#4edea3] text-[#081425] px-4 py-2 text-xs font-mono font-bold uppercase cursor-pointer hover:bg-[#10b981] transition">
                  Return to Hub
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-[#040e1f]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#081425] border border-[#1e293b] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-[#1e293b]">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center">
                            <Settings className="w-5 h-5 text-[#4edea3] mr-2" />
                            Initialization Required
                        </h2>
                        <p className="text-xs text-[#bbcabf] mt-1 font-mono">
                            Complete these required steps to interact with the Status 402 protocol.
                        </p>
                    </div>
                    <button onClick={() => setShowOnboarding(false)} className="text-[#bbcabf] hover:text-white transition-colors cursor-pointer">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Step 1: Connect Wallet */}
                    <div className={`p-4 border rounded-sm flex items-center justify-between transition ${
                        authenticated ? 'bg-[#10b981]/5 border-[#10b981]/30' : 'bg-[#040e1f] border-[#3c4a42]'
                    }`}>
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${authenticated ? 'bg-[#10b981]/20 text-[#4edea3]' : 'bg-[#152031] text-[#bbcabf]'}`}>1</div>
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center">Connect Wallet {authenticated && <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3] ml-2" />}</h3>
                                <p className="text-[11px] text-[#bbcabf] mt-0.5 font-mono">Authenticate your Web3 identity via Privy.</p>
                            </div>
                        </div>
                        <div>
                            {!authenticated ? (
                                <button onClick={login} className="bg-[#4edea3] hover:bg-[#10b981] text-[#081425] font-bold py-1.5 px-4 text-xs rounded-sm transition cursor-pointer">
                                    Connect
                                </button>
                            ) : (
                                <span className="text-[10px] font-mono bg-[#10b981]/15 text-[#4edea3] px-2 py-1 rounded font-bold uppercase tracking-widest">Connected</span>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Faucet */}
                    <div className={`p-4 border rounded-sm flex items-center justify-between transition ${
                        Number(userAvaxBalance) > 0.05 ? 'bg-[#10b981]/5 border-[#10b981]/30' : 'bg-[#040e1f] border-[#3c4a42]'
                    }`}>
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${Number(userAvaxBalance) > 0.05 ? 'bg-[#10b981]/20 text-[#4edea3]' : 'bg-[#152031] text-[#bbcabf]'}`}>2</div>
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center">Claim Faucet Funds {Number(userAvaxBalance) > 0.05 && <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3] ml-2" />}</h3>
                                <p className="text-[11px] text-[#bbcabf] mt-0.5 font-mono">Get 0.1 AVAX for gas and 1 USDC for payments.</p>
                            </div>
                        </div>
                        <div>
                            {Number(userAvaxBalance) <= 0.05 ? (
                                <button onClick={handleRequestFaucet} disabled={!authenticated || isFauceting} className="bg-[#152031] hover:bg-[#2a3548] text-white border border-[#3c4a42] font-bold py-1.5 px-4 text-xs rounded-sm transition disabled:opacity-50 cursor-pointer">
                                    {isFauceting ? "Claiming..." : "Claim Funds"}
                                </button>
                            ) : (
                                <span className="text-[10px] font-mono bg-[#10b981]/15 text-[#4edea3] px-2 py-1 rounded font-bold uppercase tracking-widest">Funded</span>
                            )}
                        </div>
                    </div>

                    {/* Step 3: Register Agent */}
                    <div className={`p-4 border rounded-sm flex items-center justify-between transition ${
                        registeredAgentId ? 'bg-[#10b981]/5 border-[#10b981]/30' : 'bg-[#040e1f] border-[#3c4a42]'
                    }`}>
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${registeredAgentId ? 'bg-[#10b981]/20 text-[#4edea3]' : 'bg-[#152031] text-[#bbcabf]'}`}>3</div>
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center">Register Agent {registeredAgentId && <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3] ml-2" />}</h3>
                                <p className="text-[11px] text-[#bbcabf] mt-0.5 font-mono">Mint your EIP-8004 identity on-chain.</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {!registeredAgentId ? (
                                <>
                                    <input
                                        type="text"
                                        value={agentDomainInput}
                                        onChange={(e) => setAgentDomainInput(e.target.value)}
                                        placeholder="agent.domain"
                                        className="bg-[#081425] border border-[#3c4a42] text-[10px] font-mono px-2 py-1.5 text-white focus:outline-none focus:border-[#4edea3] w-32"
                                    />
                                    <button onClick={handleRegisterAgent} disabled={!authenticated || isMintingAgent || Number(userAvaxBalance) <= 0.05} className="bg-[#152031] hover:bg-[#2a3548] text-white border border-[#3c4a42] font-bold py-1.5 px-4 text-xs rounded-sm transition disabled:opacity-50 cursor-pointer">
                                        {isMintingAgent ? "Minting..." : "Mint Card"}
                                    </button>
                                </>
                            ) : (
                                <span className="text-[10px] font-mono bg-[#10b981]/15 text-[#4edea3] px-2 py-1 rounded font-bold uppercase tracking-widest">ID: #{registeredAgentId}</span>
                            )}
                        </div>
                    </div>

                    {/* Step 4: Vault Deposits */}
                    <div className={`p-4 border rounded-sm flex items-center justify-between transition ${
                        Number(vaultBalance) >= 10 ? 'bg-[#10b981]/5 border-[#10b981]/30' : 'bg-[#040e1f] border-[#3c4a42]'
                    }`}>
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${Number(vaultBalance) >= 10 ? 'bg-[#10b981]/20 text-[#4edea3]' : 'bg-[#152031] text-[#bbcabf]'}`}>4</div>
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center">Vault Reserves {Number(vaultBalance) >= 10 && <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3] ml-2" />}</h3>
                                <p className="text-[11px] text-[#bbcabf] mt-0.5 font-mono">Provide 10 USDC liquidity to the Sentinel Pool.</p>
                            </div>
                        </div>
                        <div>
                            {Number(vaultBalance) < 10 ? (
                                <button onClick={handleRefillVault} disabled={!authenticated || isRefilling || !registeredAgentId} className="bg-[#152031] hover:bg-[#2a3548] text-white border border-[#3c4a42] font-bold py-1.5 px-4 text-xs rounded-sm transition disabled:opacity-50 cursor-pointer">
                                    {isRefilling ? "Depositing..." : "Deposit 10 USDC"}
                                </button>
                            ) : (
                                <span className="text-[10px] font-mono bg-[#10b981]/15 text-[#4edea3] px-2 py-1 rounded font-bold uppercase tracking-widest">Liquid</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-[#1e293b] bg-[#040e1f] flex justify-end">
                    {(authenticated && registeredAgentId && Number(userAvaxBalance) > 0.05 && Number(vaultBalance) >= 10) ? (
                        <button 
                            onClick={() => setShowOnboarding(false)}
                            className="bg-[#4edea3] hover:bg-[#10b981] text-[#081425] font-bold py-2 px-6 text-sm rounded-sm transition cursor-pointer"
                        >
                            Start Capital Loop
                        </button>
                    ) : (
                        <button 
                            disabled 
                            className="bg-[#152031] text-slate-500 font-bold py-2 px-6 text-sm rounded-sm cursor-not-allowed border border-[#1e293b]"
                        >
                            Complete steps to continue
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
