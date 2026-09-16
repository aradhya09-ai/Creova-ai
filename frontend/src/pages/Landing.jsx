import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Sparkle, Image as ImageIcon, Video, Mic, LayoutPanelTop, Folder, ArrowRight,
  Github, ShieldCheck, Cpu, ChevronDown, Play, Palette, Wand,
} from 'lucide-react'
import { useRef } from 'react'
import { useAppStore } from '@/store/appStore'

export default function Landing() {
  const enter = useAppStore((s) => s.enter)
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -60])
  const y2 = useTransform(scrollYProgress, [0, 1], [120, -120])

  const features = [
    {
      icon: ImageIcon,
      title: 'AI Image Generation',
      desc: 'Cinematic, realistic, anime and more — multi-style image synthesis with full control.',
      tag: 'SDXL · Flux compatible',
    },
    {
      icon: Video,
      title: 'AI Video Generation',
      desc: 'Text-to-video, image-to-video and style-guided motion in one cinematic studio.',
      tag: 'Open video models',
    },
    {
      icon: Mic,
      title: 'Voice Studio',
      desc: 'Natural AI voices, emotional synthesis, cloning and voice design — all local-friendly.',
      tag: 'Web Speech · Coqui',
    },
    {
      icon: LayoutPanelTop,
      title: 'AI Card Creator',
      desc: 'Beautiful downloadable cards for every occasion with a full canvas editor.',
      tag: 'PNG · JPG · PDF · SVG',
    },
    {
      icon: Folder,
      title: 'Project Workspace',
      desc: 'Every creation becomes a project. Timeline view, duplication, export and more.',
      tag: '100% local storage',
    },
    {
      icon: ShieldCheck,
      title: 'Free & Open Architecture',
      desc: 'No credits. No paywalls. Open-source models with graceful demo fallbacks.',
      tag: 'Browser-first AI',
    },
  ]

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-void">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-purple-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-200px] top-1/3 h-[400px] w-[400px] rounded-full bg-indigo-600/15 blur-[100px]" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-5 py-4 md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-glow-sm">
            <Sparkle size={18} className="text-white" />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-white">
              CREOVA<span className="text-purple-400"> AI</span>
            </p>
            <p className="text-[10px] text-slate-500">Free AI Workspace</p>
          </div>
        </div>
        <div className="hidden items-center gap-6 text-sm text-slate-400 sm:flex">
          <a href="#features" className="transition-colors hover:text-white">Features</a>
          <a href="#architecture" className="transition-colors hover:text-white">Architecture</a>
        </div>
        <button onClick={enter} className="btn-primary !py-2">
          Open App <ArrowRight size={15} />
        </button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-5 pb-20 pt-16 text-center md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl"
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-medium text-purple-300">
            <Cpu size={13} /> Open-source AI · Free workspace · No credits
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
            Your AI Creative <span className="text-gradient">Studio.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-slate-400 sm:text-lg">
            Generate images, videos, voices and beautiful designs from one workspace.
            Built for creators who refuse limits.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <button onClick={enter} className="btn-primary !px-7 !py-3 text-base">
              Start Creating — Free <ArrowRight size={18} />
            </button>
            <a href="#features" className="btn-outline !px-7 !py-3 text-base">
              <Play size={16} /> Explore Demo
            </a>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            "Create anything. No credits. Just create."
          </p>
        </motion.div>

        {/* Mock window */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7 }}
          className="gradient-border mx-auto mt-14 max-w-4xl rounded-2xl shadow-glow"
        >
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-rose-500/70" />
            <span className="h-3 w-3 rounded-full bg-amber-500/70" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
            <div className="ml-4 flex-1 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-left text-xs text-slate-500">
              Create a cinematic futuristic city at sunset…
            </div>
            <Wand size={16} className="text-purple-400" />
          </div>
          <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-5">
            {[
              'from-purple-500/60 to-indigo-600/60',
              'from-fuchsia-500/50 to-purple-700/60',
              'from-indigo-500/60 to-blue-700/60',
              'from-violet-600/60 to-purple-900/60',
              'from-indigo-400/60 to-violet-600/60',
            ].map((g, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.04 }}
                className={`aspect-square rounded-xl bg-gradient-to-br ${g}`}
                style={{ opacity: 0.9 - i * 0.08 }}
              />
            ))}
            <div className="col-span-3 flex items-center gap-4 rounded-xl bg-white/5 p-4 sm:col-span-1">
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-white">Cyberpunk Street</p>
                <p className="text-[10px] text-slate-500">768px · 1:1 · Demo</p>
              </div>
            </div>
          </div>
        </motion.div>

        <ChevronDown className="mx-auto mt-12 animate-bounce text-slate-600" size={22} />
      </section>

      {/* Features */}
      <section id="features" ref={sectionRef} className="relative z-10 px-5 pb-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <motion.div
            style={{ y: y1 }}
            className="pointer-events-none absolute left-[-150px] top-1/4 h-[300px] w-[300px] rounded-full bg-purple-600/10 blur-[100px]"
          />
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">One workspace · Every medium</p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">Everything you create, in one place</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="gradient-border group rounded-2xl p-6 transition-all duration-300 hover:shadow-glow-sm"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600/25 to-indigo-600/25 transition-transform duration-300 group-hover:scale-110">
                  <f.icon size={22} className="text-purple-300" />
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
                <span className="mt-4 inline-block rounded-full border border-purple-500/20 bg-purple-500/5 px-3 py-1 text-[11px] font-medium text-purple-300">
                  {f.tag}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="relative z-10 border-t border-white/5 px-5 py-20 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">Open-source first</p>
            <h2 className="mt-3 text-3xl font-bold text-white">Your data. Your models. Zero lock-in.</h2>
            <p className="mt-4 text-slate-400">
              CREOVA AI runs locally-first. Connect any Hugging Face model, a self-hosted
              Stable Diffusion endpoint, or a compatible TTS engine. When no model is
              configured, the workspace gracefully switches to a clearly-labeled Demo Mode
              — never a fake spinner.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'No credits, coins, subscribers or paywalls — ever',
                'Browser Web Speech API voice fallback',
                'SQLite + local filesystem, switchable to cloud storage',
                'Service adapters let you swap models without touching the UI',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-slate-300">
                  <ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-400" /> {t}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{ y: y2 }}
            className="flex-1"
          >
            <div className="gradient-border rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Palette size={15} className="text-purple-300" /> Provider status
                </p>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  Free models
                </span>
              </div>
              <div className="space-y-2.5">
                {[
                  ['Image', 'SDXL · Flux · Local'],
                  ['Video', 'Local endpoint · Demo fallback'],
                  ['Voice', 'Web Speech · Coqui'],
                  ['Voice Clone', 'XTTS / OpenVoice adapter'],
                  ['Storage', 'Local + cloud-ready'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {k}
                    </span>
                    <span className="text-xs text-slate-500">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-5 pb-24 pt-8 text-center md:px-10">
        <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl border border-purple-500/25 bg-gradient-to-br from-purple-600/20 via-panel to-indigo-600/20 px-8 py-14">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
          <h2 className="relative text-3xl font-bold text-white">Start creating — it's free.</h2>
          <p className="relative mt-3 text-slate-400">Everything works out of the box. Demo Mode included.</p>
          <button onClick={enter} className="btn-primary relative mt-8 !px-8 !py-3.5 text-base">
            Launch CREOVA AI <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-5 py-10 text-center md:px-10">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
              <Sparkle size={14} className="text-white" />
            </div>
            <span className="font-bold text-white">CREOVA AI</span>
          </div>
          <p className="text-sm text-slate-500">Built for creators. Powered by open-source AI.</p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>Free</span>·
            <span>Local-first</span>·
            <span>No paywalls</span>·
            <span>Your data stays yours</span>
          </div>
        </div>
      </footer>
    </div>
  )
}