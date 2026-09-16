import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Download, Trash2, Play, Image as ImageIcon, Video, Music, CreditCard as CardIcon,
  HardDrive, FolderOpen, ExternalLink,
} from 'lucide-react'
import { api, mediaUrl } from '@/services/api'
import toast from '@/services/toast'
import downloads from '@/services/downloads'
import PageHeader from '@/components/PageHeader'
import { formatDate } from '@/utils/helpers'
import { useAppStore } from '@/store/appStore'

const TYPE_META = {
  image: { icon: ImageIcon, tint: 'text-purple-300 bg-purple-500/10' },
  video: { icon: Video, tint: 'text-fuchsia-300 bg-fuchsia-500/10' },
  audio: { icon: Music, tint: 'text-indigo-300 bg-indigo-500/10' },
  card: { icon: CardIcon, tint: 'text-violet-300 bg-violet-500/10' },
}

export default function DownloadsPage() {
  const [items, setItems] = useState([])
  const [storage, setStorage] = useState(null)
  const push = useAppStore((s) => s.pushNotification)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/api/history?limit=100')
        setItems(res.items || [])
      } catch (e) { /* offline */ }
      try {
        const res = await api.get('/api/models')
        setStorage(res.storage)
      } catch (e) { /* offline */ }
    })()
  }, [])

  const downloadable = items.filter((i) => i.preview && !(i.type === 'audio'))

  return (
    <div>
      <PageHeader
        eyebrow="Storage"
        title="Downloads"
        subtitle="Every generated file, ready to save in every supported format."
      />

      <div className="panel mb-6 flex flex-wrap items-center gap-3 p-4">
        <HardDrive size={17} className="text-purple-300" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{storage?.backend === 'local' ? 'Local storage' : 'Storage'}</p>
          <p className="text-xs text-slate-500">{storage ? `Files are stored in ${storage.dir}` : 'Local filesystem during development'}</p>
        </div>
      </div>

      {downloadable.length === 0 ? (
        <div className="panel grid place-items-center py-24 text-center">
          <FolderOpen size={30} className="text-purple-400/60" />
          <p className="mt-4 text-sm text-slate-500">Nothing to download yet. Generate something first.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {downloadable.map((item, i) => {
            const m = TYPE_META[item.type] || TYPE_META.image
            const Icon = m.icon
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card-hover overflow-hidden rounded-2xl border border-white/10 bg-surface"
              >
                <div className="relative h-36 overflow-hidden bg-panel">
                  <img src={mediaUrl(item.preview)} alt={item.prompt} className="h-full w-full object-cover" />
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium capitalize text-white backdrop-blur-sm">
                    <Icon size={11} className={m.tint.split(' ')[0]} /> {item.type}
                  </span>
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-white">{item.prompt || item.type}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{formatDate(item.created_at)}</p>
                  <div className="mt-2.5 flex gap-1.5">
                    <button
                      onClick={async () => {
                        const full = mediaUrl(item.preview)
                        const parts = full.split('/')
                        try {
                          await downloads.save(full, parts[parts.length - 1] || item.type)
                          toast.success('Download started', 'File saved.')
                        } catch (e) {
                          toast.error('Download failed', e.message)
                        }
                      }}
                      className="btn-outline flex-1 !py-1.5 text-[11px]"
                    >
                      <Download size={12} /> Original
                    </button>
                    <button onClick={() => toast.info('More formats', 'Available in the generator for the corresponding type.')} className="btn-ghost !px-2.5 !py-1.5 text-[11px]">
                      <ExternalLink size={12} />
                    </button>
                    <button onClick={() => { /* kept minimal; removal is on History */ }} className="btn-ghost !px-2.5 !py-1.5 text-[11px] !text-rose-300">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}