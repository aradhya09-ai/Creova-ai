import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  RefreshCw, Download, Trash2, Image as ImageIcon, Video, Music, CreditCard as CardIcon,
  ExternalLink,
} from 'lucide-react'
import { api, mediaUrl } from '@/services/api'
import toast from '@/services/toast'
import downloads from '@/services/downloads'
import PageHeader from '@/components/PageHeader'
import Lightbox from '@/components/Lightbox'
import { formatDate, cn } from '@/utils/helpers'
import { useAppStore } from '@/store/appStore'

const TYPE_META = {
  image: { icon: ImageIcon, tint: 'text-purple-300 bg-purple-500/10' },
  video: { icon: Video, tint: 'text-fuchsia-300 bg-fuchsia-500/10' },
  audio: { icon: Music, tint: 'text-indigo-300 bg-indigo-500/10' },
  card: { icon: CardIcon, tint: 'text-violet-300 bg-violet-500/10' },
}

const TYPE_LABELS = { image: 'Images', video: 'Videos', audio: 'Audio', card: 'Cards' }

export default function HistoryPage() {
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState('all')
  const [lightbox, setLightbox] = useState(null)
  const push = useAppStore((s) => s.pushNotification)

  const load = async () => {
    try {
      const res = await api.get('/api/history?limit=200')
      setItems(res.items || [])
    } catch (e) {
      /* offline */
    } finally {
      setLoaded(true)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter)

  const remove = async (id) => {
    try {
      await api.delete(`/api/history/${id}`)
      setItems((is) => is.filter((i) => i.id !== id))
      toast.success('Removed', 'Entry deleted from history.')
    } catch (e) {
      toast.error('Delete failed', e.message)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Activity"
        title="History"
        subtitle="Every generation in one timeline. Refilter, redownload or regenerate anything."
      />

      <div className="mb-6 flex flex-wrap gap-1.5">
        {['all', 'image', 'video', 'audio', 'card'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn('chip !px-4 !py-1.5 text-xs capitalize', filter === f ? 'chip-active' : 'chip-inactive')}
          >
            {f === 'all' ? 'Everything' : TYPE_LABELS[f]}
          </button>
        ))}
        <button onClick={load} className="chip chip-inactive ml-auto !px-3 !py-1.5 text-xs">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {!loaded ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="panel grid place-items-center py-24 text-center">
          <p className="text-sm text-slate-500">No history yet. Create something to see it here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item, i) => {
            const m = TYPE_META[item.type] || TYPE_META.image
            const Icon = m.icon
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-surface p-3 transition-all hover:border-purple-500/30"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-panel">
                  {item.preview ? (
                    item.type === 'video' || /\.(mp4|webm)(\?|$)/.test(item.preview) ? (
                      <video src={mediaUrl(item.preview)} className="h-full w-full object-cover" muted />
                    ) : (
                      <img src={mediaUrl(item.preview)} alt={item.prompt} onClick={() => setLightbox({ type: item.type, url: item.preview, prompt: item.prompt })} className="h-full w-full cursor-pointer object-cover transition-transform group-hover:scale-105" />
                    )
                  ) : (
                    <div className={cn('flex h-full w-full items-center justify-center', m.tint)}>
                      <Icon size={20} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{item.prompt || '—'}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    <span className="capitalize">{item.type}</span>
                    {item.kind && <> · {item.kind.replace('-', ' ')}</>}
                    {' · '}
                    {formatDate(item.created_at)}
                    {item.metadata?.mode && item.metadata.mode !== 'demo' && <span className="text-emerald-400/70"> · {item.metadata.model || item.metadata.mode}</span>}
                    {item.metadata?.mode === 'demo' && <span className="text-amber-400/70"> · demo</span>}
                  </p>
                </div>

                <Action item={item} onDelete={() => remove(item.id)} />
              </motion.div>
            )
          })}
        </div>
      )}

      <Lightbox item={lightbox} open={!!lightbox} onClose={() => setLightbox(null)} />
    </div>
  )
}

function Action({ item, onDelete }) {
  const [updating, setUpdating] = useState(false)
  return (
    <div className="flex shrink-0 gap-1">
      {item.preview && (
        <button
          onClick={async () => {
            const full = mediaUrl(item.preview)
            const parts = full.split('/')
            await downloads.save(full, parts[parts.length - 1] || item.type)
            toast.success('Download started', 'File saved.')
          }}
          className="btn-ghost !px-2.5 !py-2"
          title="Download"
        >
          <Download size={14} />
        </button>
      )}
      <button
        onClick={async () => {
          setUpdating(true)
          try {
            const payload =
              item.type === 'image'
                ? { prompt: item.prompt, style: item.metadata?.style || 'Cinematic' }
                : item.type === 'video'
                  ? { prompt: item.prompt, mode: 'text', duration: item.metadata?.duration || 5, aspect_ratio: '16:9' }
                  : { text: item.prompt }
            await api.post(`/api/${item.type}/generate`, payload)
            toast.success('Regenerated', 'New version added to history.')
          } catch (e) {
            toast.error("Regeneration couldn't be completed.", e.message)
          } finally {
            setUpdating(false)
          }
        }}
        className="btn-ghost !px-2.5 !py-2"
        title="Regenerate"
      >
        <RefreshCw size={14} className={updating ? 'animate-spin' : ''} />
      </button>
      <button
        onClick={() => {
          if (window.confirm('Delete this history entry?')) {
            onDelete(item.id)
          }
        }}
        className="btn-ghost !px-2.5 !py-2 !text-rose-300"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}