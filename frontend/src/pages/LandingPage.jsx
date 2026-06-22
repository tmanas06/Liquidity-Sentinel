import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Blocks,
  Bot,
  Check,
  ChevronRight,
  CircleDollarSign,
  Code2,
  ExternalLink,
  Fingerprint,
  Gauge,
  LockKeyhole,
  Menu,
  Network,
  Play,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  WalletCards,
  X,
} from 'lucide-react';
import terminalPreview from '../assets/images/terminal.png';
import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";

const features = [
  {
    icon: Gauge,
    eyebrow: 'Risk-aware pricing',
    title: 'Reputation becomes an economic primitive.',
    copy: 'The API reads an agent score before issuing the invoice. Stronger reputation receives better terms automatically.',
    className: 'lg:col-span-2',
  },
  {
    icon: Fingerprint,
    eyebrow: 'ERC-8004 identity',
    title: 'One identity. Verifiable history.',
    copy: 'Agent identity and reputation remain portable, inspectable and grounded in on-chain state.',
  },
  {
    icon: LockKeyhole,
    eyebrow: 'x402 settlement',
    title: 'Pay before access, without API keys.',
    copy: 'Invoices are settled through an ERC-20 transfer and verified before capital permission is unlocked.',
  },
  {
    icon: Activity,
    eyebrow: 'Replay protection',
    title: 'Every receipt is single-use.',
    copy: 'Expiring invoices and consumed transaction hashes protect the gateway from duplicate settlement attempts.',
  },
  {
    icon: Network,
    eyebrow: 'Live telemetry',
    title: 'See every protocol transition.',
    copy: 'Follow identity, invoice, payment and reputation events in one operational stream.',
    className: 'lg:col-span-2',
  },
];

const flow = [
  { number: '01', icon: Fingerprint, title: 'Identify', copy: 'Resolve the agent identity and reputation score.' },
  { number: '02', icon: Gauge, title: 'Price', copy: 'Issue a fee based on the agent’s risk tier.' },
  { number: '03', icon: CircleDollarSign, title: 'Settle', copy: 'Pay the invoice through an ERC-20 transfer.' },
  { number: '04', icon: BadgeCheck, title: 'Unlock', copy: 'Verify once, then release capital permission.' },
];

function SentinelMark() {
  return (
    <img src="/logo.png" alt="402 Status Logo" className="h-9 w-auto object-contain" />
  );
}

function SectionLabel({ children }) {
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#9aa9a2]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3] shadow-[0_0_10px_#4edea3]" />
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-xl bg-[#4edea3] px-5 py-3 text-sm font-bold text-[#07110d] transition hover:-translate-y-0.5 hover:bg-[#72efbb] hover:shadow-[0_12px_40px_rgba(78,222,163,0.22)] ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

export default function LandingPage({ onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [score, setScore] = useState(86);

  const pricing = useMemo(() => {
    if (score >= 80) return { tier: 'Trusted flow', fee: '$0.01', color: '#4edea3', width: '100%' };
    if (score >= 40) return { tier: 'Standard risk', fee: '$0.10', color: '#ffbf69', width: '58%' };
    return { tier: 'New agent', fee: '$0.50', color: '#ff8f87', width: '26%' };
  }, [score]);

  const launch = (path = '/app/get-started') => onNavigate(path);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070b12] text-[#f4f7f2] selection:bg-[#4edea3] selection:text-[#07110d]">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'linear-gradient(rgba(148,163,184,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.08) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'linear-gradient(to bottom, black, transparent 88%)',
        }}
      />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#070b12]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3">
            <SentinelMark />
            <div className="text-left">
              <div className="text-sm font-bold tracking-[0.16em]">402 STATUS</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#7d8d86]">Autonomous capital access</div>
            </div>
          </button>

          <nav className="hidden items-center gap-8 text-sm text-[#a9b5af] lg:flex">
            <a href="#product" className="transition hover:text-white">Product</a>
            <a href="#protocol" className="transition hover:text-white">Protocol</a>
            <a href="#reputation" className="transition hover:text-white">Reputation</a>
            <a href="#architecture" className="transition hover:text-white">Architecture</a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button type="button" onClick={() => launch('/app')} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#b8c4be] transition hover:bg-white/5 hover:text-white">
              Open console
            </button>
            <PrimaryButton onClick={() => launch()}>Enter App</PrimaryButton>
          </div>

          <button type="button" onClick={() => setMobileOpen((value) => !value)} className="rounded-lg border border-white/10 p-2 text-white lg:hidden" aria-label="Toggle navigation">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/[0.06] bg-[#070b12] px-5 py-5 lg:hidden">
            <div className="flex flex-col gap-4 text-sm text-[#b8c4be]">
              {['product', 'protocol', 'reputation', 'architecture'].map((item) => (
                <a key={item} href={`#${item}`} onClick={() => setMobileOpen(false)} className="capitalize">{item}</a>
              ))}
              <PrimaryButton onClick={() => launch()} className="mt-2 w-full">Enter App</PrimaryButton>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">
        <section className="relative mx-auto flex min-h-[calc(100vh-100px)] max-w-7xl items-center px-5 pb-16 pt-28 lg:px-8 lg:pt-24">
          <Card className="w-full min-h-[600px] bg-black/[0.96] relative overflow-hidden rounded-[32px] border-white/[0.06] shadow-2xl shadow-black/50 p-2 lg:p-4">
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#4edea3" />
            <div className="flex h-full flex-col lg:flex-row bg-[#081425]/40 rounded-[24px] overflow-hidden border border-white/[0.02]">
              {/* Left content */}
              <div className="flex-1 p-8 lg:p-14 relative z-10 flex flex-col justify-center">
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#4edea3]/20 bg-[#4edea3]/[0.07] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#75eebd] w-max">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4edea3] opacity-50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4edea3]" />
                  </span>
                  Live on Avalanche Fuji
                </div>
                <h1 className="max-w-4xl text-5xl font-semibold leading-[0.96] tracking-[-0.055em] sm:text-6xl lg:text-[64px]">
                  Decentralized capital for
                  <span className="mt-2 block bg-gradient-to-r from-[#f4f7f2] via-[#a9f5d2] to-[#4edea3] bg-clip-text text-transparent">autonomous AI agents.</span>
                </h1>
                <p className="mt-7 max-w-xl text-lg leading-8 text-[#9eaca5]">
                  402 Status gives AI agents verifiable identity, risk-aware x402 pricing and programmable access to capital—without trusting a black box.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <PrimaryButton onClick={() => launch()} className="sm:min-w-44">Connect to Fuji Testnet</PrimaryButton>
                  <a href="#protocol" className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-bold text-white transition hover:border-white/20 hover:bg-white/[0.06]">
                    <Play className="h-4 w-4 fill-white transition group-hover:text-[#4edea3]" /> See the protocol
                  </a>
                </div>
                <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#74827c]">
                  <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#4edea3]" /> Powered by Avalanche Fuji & ERC-8004</span>
                  <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#4edea3]" /> Verifiable Fuji settlement</span>
                </div>
              </div>

              {/* Right content */}
              <div className="flex-1 relative min-h-[400px] lg:min-h-auto flex items-center justify-center">
                <SplineScene 
                  scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                  className="w-full h-full scale-[1.2] origin-center translate-x-4"
                />
              </div>
            </div>
          </Card>
        </section>

        <section className="border-y border-white/[0.06] bg-white/[0.015]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-white/[0.06] px-5 sm:grid-cols-4 sm:divide-y-0 lg:px-8">
            {[['3', 'Pricing tiers'], ['1×', 'Single-use receipt'], ['6', 'USDC decimals'], ['2s', 'Fuji block time']].map(([value, label]) => (
              <div key={label} className="px-4 py-7 text-center"><div className="text-2xl font-semibold text-white">{value}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#74827c]">{label}</div></div>
            ))}
          </div>
        </section>

        <section id="product" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <SectionLabel>Product system</SectionLabel>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Infrastructure agents can prove, pay and build on.</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#93a099]">Every surface answers a real operational question—from who the agent is to why it received a specific price.</p>
          </div>
          <div className="mt-12 grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, eyebrow, title, copy, className = '' }) => (
              <article key={title} className={`group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b111b] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#4edea3]/25 ${className}`}>
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#4edea3]/0 blur-3xl transition group-hover:bg-[#4edea3]/10" />
                <div className="relative"><div className="mb-10 grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035]"><Icon className="h-5 w-5 text-[#4edea3]" /></div><div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#74827c]">{eyebrow}</div><h3 className="mt-3 max-w-md text-xl font-semibold tracking-[-0.025em]">{title}</h3><p className="mt-3 max-w-lg text-sm leading-6 text-[#8d9b94]">{copy}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section id="protocol" className="border-y border-white/[0.06] bg-[#090f18] py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-3xl"><SectionLabel>Protocol walkthrough</SectionLabel><h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Four transitions. One auditable capital loop.</h2></div>
              <button type="button" onClick={() => launch()} className="group flex items-center gap-2 text-sm font-bold text-[#4edea3]">Run the walkthrough <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></button>
            </div>
            <div className="relative mt-14 grid gap-4 lg:grid-cols-4">
              <div className="absolute left-[12%] right-[12%] top-10 hidden h-px bg-gradient-to-r from-transparent via-[#4edea3]/35 to-transparent lg:block" />
              {flow.map(({ number, icon: Icon, title, copy }) => (
                <article key={number} className="relative rounded-2xl border border-white/[0.07] bg-[#0c131e] p-6">
                  <div className="mb-8 flex items-center justify-between"><div className="relative z-10 grid h-12 w-12 place-items-center rounded-2xl border border-[#4edea3]/20 bg-[#0a1a15]"><Icon className="h-5 w-5 text-[#4edea3]" /></div><span className="font-mono text-xs text-[#526059]">{number}</span></div>
                  <h3 className="text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-[#8d9b94]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="reputation" className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
          <div>
            <SectionLabel>Reputation economics</SectionLabel>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Better behavior earns better access.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#93a099]">Pricing is deterministic, visible and tied to the score read when the invoice is created. Move the score to see the policy respond.</p>
            <div className="mt-8 space-y-3 text-sm text-[#aab6b0]">
              {['80–100 · trusted flow', '40–79 · standard risk', '0–39 · new agent'].map((item) => <div key={item} className="flex items-center gap-3"><Check className="h-4 w-4 text-[#4edea3]" /> {item}</div>)}
            </div>
          </div>
          <div className="rounded-3xl border border-white/[0.08] bg-[#0b121d] p-6 shadow-2xl shadow-black/30 sm:p-8">
            <div className="flex items-start justify-between"><div><div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#74827c]">Agent reputation</div><div className="mt-2 text-5xl font-semibold tracking-[-0.05em]">{score}<span className="text-xl text-[#697770]">/100</span></div></div><div className="rounded-full border px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em]" style={{ borderColor: `${pricing.color}44`, color: pricing.color, backgroundColor: `${pricing.color}0f` }}>{pricing.tier}</div></div>
            <input aria-label="Agent reputation score" type="range" min="0" max="100" value={score} onChange={(event) => setScore(Number(event.target.value))} className="mt-9 w-full accent-[#4edea3]" />
            <div className="mt-3 flex justify-between font-mono text-[8px] text-[#5f6c66]"><span>NEW</span><span>STANDARD</span><span>TRUSTED</span></div>
            <div className="mt-8 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#74827c]">x402 fee</div><div className="mt-2 text-2xl font-semibold" style={{ color: pricing.color }}>{pricing.fee} <span className="text-xs text-[#74827c]">USDC</span></div></div><div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#74827c]">Capital access</div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full transition-all duration-500" style={{ width: pricing.width, backgroundColor: pricing.color }} /></div><div className="mt-2 text-xs text-[#9ba8a2]">Policy capacity</div></div></div>
          </div>
        </section>

        <section id="architecture" className="border-y border-white/[0.06] bg-[#090f18] py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid items-center gap-14 lg:grid-cols-[.8fr_1.2fr]">
              <div><SectionLabel>Operator console</SectionLabel><h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Proof, not promises.</h2><p className="mt-5 text-lg leading-8 text-[#93a099]">The console exposes the exact evidence behind each decision: identity, score, tier, invoice, transfer hash and unlocked permission.</p><button type="button" onClick={() => launch('/app/payments')} className="group mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#4edea3]">Open billing terminal <ExternalLink className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button></div>
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#07101b] p-2 shadow-2xl shadow-black/40"><img src={terminalPreview} alt="402 Status billing terminal showing x402 settlement events" className="w-full rounded-2xl border border-white/[0.06]" /></div>
            </div>
            <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[['Agent', Bot], ['API gateway', Code2], ['USDC', CircleDollarSign], ['Fuji RPC', Blocks], ['Registry', ShieldCheck]].map(([label, Icon], index) => (
                <div key={label} className="relative flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0c131e] px-4 py-4"><Icon className="h-4 w-4 text-[#4edea3]" /><span className="text-sm font-semibold">{label}</span>{index < 4 && <ChevronRight className="absolute -right-3 z-10 hidden h-4 w-4 text-[#46524c] lg:block" />}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <div className="relative overflow-hidden rounded-[32px] border border-[#4edea3]/15 bg-[#0a1713] px-6 py-14 text-center sm:px-12 lg:py-20">
            <div className="absolute left-1/2 top-0 h-64 w-2/3 -translate-x-1/2 rounded-full bg-[#4edea3]/10 blur-[100px]" />
            <Sparkles className="relative mx-auto h-7 w-7 text-[#4edea3]" />
            <h2 className="relative mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Watch reputation change the price of capital.</h2>
            <p className="relative mx-auto mt-5 max-w-xl text-base leading-7 text-[#92a098]">Run the complete local loop without testnet funds, then graduate to verifiable Fuji settlement when you are ready.</p>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row"><PrimaryButton onClick={() => launch()}>Start guided demo</PrimaryButton><button type="button" onClick={() => launch('/app')} className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-bold transition hover:bg-white/[0.06]">Open console</button></div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] px-5 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><SentinelMark /><div><div className="text-sm font-bold tracking-[0.12em]">402 STATUS</div><div className="mt-1 font-mono text-[8px] uppercase tracking-[0.16em] text-[#64716b]">Built for autonomous capital markets</div></div></div><div className="flex items-center gap-5 font-mono text-[9px] uppercase tracking-[0.16em] text-[#718079]"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#4edea3]" /> Fuji testnet</span><span>ERC-8004</span><span>x402</span></div></div>
      </footer>
    </div>
  );
}
