import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, children, title, wide, className = '' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`relative w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-purple-500/20 bg-surface shadow-glow ${wide ? 'max-w-4xl' : 'max-w-lg'} ${className}`}
          >
            <div className="flex items-center justify-between border-b border-purple-500/10 px-5 py-4">
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <button onClick={onClose} className="text-slate-400 transition-colors hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}