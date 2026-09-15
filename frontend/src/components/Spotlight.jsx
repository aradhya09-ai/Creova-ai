import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, mediaUrl } from '@/services/api'
import { useAppStore } from '@/store/appStore'

export default function Spotlight({ open, onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])

  const push = useAppStore((s) => s.pushNotification)

  useEffect(() => {
    if (!open) return
    const load = async () => {
      try {
        const res = await api.get('/api/history?limit=50')
        setItems(res.items || [])
      } catch (e) {
        setItems([])
      }
    }
    load()
    setQuery('')
  }, [open])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const filtered = items.filter(
    (i) =>
      !query ||
      (i.prompt || '').toLowerCase().includes(query.toLowerCase()) ||
      (i.type || '').toLowerCase().includes(query.toLowerCase()),
  )

  const go = (i) => {
    if (i.type === 'image') navigate('/images')
    else if (i.type === 'video') navigate('/videos')
    else if (i.type === 'audio') navigate('/voice')
    else if (i.type === 'card') navigate('/cards')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-start justify-center bg-black/70 p-4 pt-[15vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-purple-500/20 bg-surface shadow-glow"
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-purple-500/10 px-4 py-3">
              <Search size={16} className="text-slate-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your creations and prompts…"
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-slate-500">
                  No creations yet. Generate something first.
                </p>
              )}
              {filtered.slice(0, 20).map((i) => (
                <button
                  key={i.id}
                  onClick={() => go(i)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/5"
                >
                  {i.preview ? (
                    <img
                      src={mediaUrl(i.preview)}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-lg border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-white/5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-200">
                      {i.prompt || i.type}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{i.type}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}