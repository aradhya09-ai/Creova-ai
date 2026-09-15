import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useCallback } from 'react'
import { X, Download, ZoomIn, ZoomOut, RotateCcw, Loader } from 'lucide-react'
import { downloads } from '@/services/downloads'
import { mediaUrl } from '@/services/api'

export default function Lightbox({ item, open, onClose, title }) {
  const url = mediaUrl(item?.url)

  const handleKey = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (open) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, handleKey])

  const isVideo = item?.type === 'video' || (url && /\.(mp4|webm)(\?|$)/.test(url))

  const handleDownload = async () => {
    if (!url) return
    const parts = url.split('/')
    const name = item?.filename || parts[parts.length - 1] || 'download'
    await downloads.save(url, name)
  }

  return (
    <AnimatePresence>
      {open && url && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="relative max-h-[90vh] max-w-[92vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideo ? (
              <video
                src={url}
                controls
                autoPlay
                className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-glow"
              />
            ) : (
              <img
                src={url}
                alt={item?.prompt || title}
                className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-glow object-contain"
              />
            )}

            {/* Info bar */}
            <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-surface/80 px-4 py-3 backdrop-blur-xl">
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-300">
                  {item?.prompt || title || 'Preview'}
                </p>
                {item?.mode && (
                  <span className="text-xs text-purple-300">
                    {item.mode === 'demo' ? 'Demo Mode asset' : `Generated via ${item.model || item.mode}`}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={handleDownload} className="btn-outline !px-3 !py-2">
                  <Download size={16} /> Download
                </button>
                <button onClick={onClose} className="btn-outline !px-3 !py-2">
                  <X size={16} /> Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}