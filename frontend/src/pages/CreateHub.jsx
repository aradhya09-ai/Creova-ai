import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Image as ImageIcon, Video, Mic, LayoutPanelTop, ArrowRight, Sparkles,
} from 'lucide-react'

const OPTIONS = [
  { icon: ImageIcon, title: 'Image Generator', desc: 'Cinematic, realistic, anime and more. Full prompt control with styles & aspect ratios.', path: '/images', gradient: 'from-purple-500 to-indigo-600' },
  { icon: Video, title: 'Video Generator', desc: 'Text to video, image to video. Duration, camera motion and cinematic styles.', path: '/videos', gradient: 'from-fuchsia-500 to-purple-600' },
  { icon: Mic, title: 'Voice Studio', desc: 'Natural TTS, emotional delivery, cloning and voice design.', path: '/voice', gradient: 'from-indigo-500 to-blue-600' },
  { icon: LayoutPanelTop, title: 'AI Card Studio', desc: 'Motivational, birthday, love and more — with a full canvas editor.', path: '/cards', gradient: 'from-violet-500 to-purple-700' },
]

export default function CreateHub() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-glow">
            <Sparkles size={26} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">What will you create?</h1>
          <p className="mt-2 text-slate-400">Pick a studio. Everything is free and open.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {OPTIONS.map((o, i) => (
            <motion.button
              key={o.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => navigate(o.path)}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-surface p-6 text-left transition-all duration-300 hover:border-purple-500/40 hover:shadow-glow-sm"
            >
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${o.gradient} shadow-glow-sm transition-transform duration-300 group-hover:scale-110`}>
                <o.icon size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">{o.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{o.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-purple-300">
                Open studio <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-100/80"
        >
          <p className="font-medium text-amber-200">Always free, never a paywall.</p>
          <p className="mt-1 text-amber-100/60">
            No credits, no coins, no limits. Runs on open-source models with graceful demo fallbacks.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}