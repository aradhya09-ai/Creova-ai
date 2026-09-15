import { AnimatePresence, motion } from 'framer-motion'
import { Loader, Check } from 'lucide-react'

const STAGES = {
  video: [
    'Preparing prompt...',
    'Submitting to provider...',
    'Generating frames...',
    'Finalizing...',
  ],
  image: ['Analyzing prompt...', 'Generating image...', 'Rendering...'],
  voice: ['Preparing voice...', 'Synthesizing speech...', 'Polishing audio...'],
  card: ['Structuring content...', 'Designing layout...', 'Rendering card...'],
}

/** progress: {percent, phase} */
export default function GenerationStage({ type, stage, progress }) {
  const pct = Math.max(2, Math.min(99, Math.round(progress?.percent ?? ((stage + 1) / (STAGES[type]?.length || 1)) * 100)))
  const phase = progress?.phase
  const stepFromPct = pct < 12 ? 0 : pct < 20 ? 1 : pct < 60 ? 2 : 3
  const activeStep = progress ? stepFromPct : (stage ?? 0)
  const stages = STAGES[type] || STAGES.image

  return (
    <div className="panel mx-auto w-full max-w-md p-6">
      <div className="mb-5 flex items-center gap-3">
        <Loader size={22} className="animate-spin text-purple-400" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {phase || stages[activeStep] || 'Working...'}
          </p>
          <p className="text-xs text-slate-500">
            {pct}% {pct < 90 ? '— may take 1–3 minutes' : ''}
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {stages.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            {i < activeStep ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                <Check size={12} className="text-emerald-400" />
              </span>
            ) : i === activeStep ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20">
                <Loader size={12} className="animate-spin text-purple-400" />
              </span>
            ) : (
              <span className="h-5 w-5 rounded-full border border-white/10" />
            )}
            <span
              className={`text-sm ${
                i < activeStep ? 'text-slate-500 line-through' : i === activeStep ? 'text-slate-200' : 'text-slate-600'
              }`}
            >
              {s}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
          initial={{ width: '8%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}