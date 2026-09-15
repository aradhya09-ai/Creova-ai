import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck, TriangleAlert, Info, X, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

const ICONS = {
  success: CircleCheck,
  error: TriangleAlert,
  info: Info,
  demo: Sparkles,
}

const COLORS = {
  success: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  error: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  info: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  demo: 'text-purple-300 border-purple-500/40 bg-purple-500/10',
}

export default function ToastHost() {
  const notifications = useAppStore((s) => s.notifications)
  const dismiss = useAppStore((s) => s.dismissNotification)

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 md:max-w-sm">
      <AnimatePresence>
        {notifications.map((n) => {
          const Icon = ICONS[n.type] || Info
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl shadow-lg ${COLORS[n.type] || COLORS.info}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                {n.title && <p className="text-sm font-semibold text-white">{n.title}</p>}
                {n.message && <p className="text-sm text-slate-300">{n.message}</p>}
              </div>
              <button onClick={() => dismiss(n.id)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}