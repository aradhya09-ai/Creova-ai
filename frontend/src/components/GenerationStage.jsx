import { AnimatePresence, motion } from 'framer-motion'
import { Loader, Check } from 'lucide-react'

const STAGES = {
  video: [
    'Preparing prompt...',
    'Generating frames...',
    'Rendering video...',
    'Finalizing...',
  ],
  image: ['Analyzing prompt...', 'Generating image...', 'Rendering...'],
  voice: ['Preparing voice...', 'Synthesizing speech...', 'Polishing audio...'],
  card: ['Structuring content...', 'Designing layout...', 'Rendering card...'],
}

export default function GenerationStage({ type, stage }) {
  const stages = STAGES[type] || STAGES.image
  const total = stage + 1

  return (
    <div className="panel mx-auto w-full max-w-md p-6">
      <div className="mb-5 flex items-center gap-3">
        <Loader size={22} className="animate-spin text-purple-400" />
        <div>
          <p className="text-sm font-semibold text-white">
            {stages[stage] || 'Working...'}
          </p>
          <p className="text-xs text-slate-500">
            {Math.min(100, Math.round((total / stages.length) * 100))}%
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {stages.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            {i < stage ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                <Check size={12} className="text-emerald-400" />
              </span>
            ) : i === stage ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20">
                <Loader size={12} className="animate-spin text-purple-400" />
              </span>
            ) : (
              <span className="h-5 w-5 rounded-full border border-white/10" />
            )}
            <span
              className={`text-sm ${
                i < stage ? 'text-slate-500 line-through' : i === stage ? 'text-slate-200' : 'text-slate-600'
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
          initial={{ width: '10%' }}
          animate={{ width: `${Math.min(98, (total / stages.length) * 100)}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </div>
  )
}