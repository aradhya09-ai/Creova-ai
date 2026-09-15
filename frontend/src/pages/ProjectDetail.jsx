import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Download, Trash2, Plus, Image as ImageIcon, Video, Music, CreditCard as CardIcon,
  Copy, Save,
} from 'lucide-react'
import { api, mediaUrl } from '@/services/api'
import toast from '@/services/toast'
import downloads from '@/services/downloads'
import Lightbox from '@/components/Lightbox'
import { formatDate, cn } from '@/utils/helpers'
import { useAppStore } from '@/store/appStore'

const TYPE_ICONS = { image: ImageIcon, video: Video, audio: Music, card: CardIcon }
const TYPE_COLORS = { image: 'text-purple-300', video: 'text-fuchsia-300', audio: 'text-indigo-300', card: 'text-violet-300' }

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const push = useAppStore((s) => s.pushNotification)
  const [project, setProject] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/projects/${id}`)
        setProject(res.project)
      } catch (e) {
        push({ type: 'error', title: 'Project not found', message: e.message })
      }
    })()
  }, [id])

  const update = (patch) => {
    setProject((p) => {
      const next = { ...p, ...patch }
      save(next)
      return next
    })
  }

  const save = async (p) => {
    setSaving(true)
    try {
      await api.patch(`/api/projects/${id}`, { name: p.name, assets: p.assets })
    } catch (e) {
      /* offline */
    } finally {
      setTimeout(() => setSaving(false), 300)
    }
  }

  const downloadAll = async () => {
    for (const a of project.assets || []) {
      if (!a.url) continue
      const full = mediaUrl(a.url)
      const parts = full.split('/')
      await downloads.save(full, parts[parts.length - 1] || a.type)
    }
    toast.success('Downloading assets', 'All project files are being saved.')
  }

  const exportProject = async () => {
    try {
      const res = await api.get(`/api/projects/${id}/export`)
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name || 'project'}.json`
      a.click()
      a.remove()
      toast.success('Exported', 'Project metadata saved as JSON.')
    } catch (e) {
      toast.error('Export failed', e.message)
    }
  }

  if (!project) {
    return (
      <div className="grid gap-4">
        <div className="skeleton h-24" />
        <div className="skeleton h-72" />
      </div>
    )
  }

  const assets = project.assets || []

  return (
    <div className="mx-auto max-w-6xl">
      <button onClick={() => navigate('/projects')} className="btn-ghost mb-4 !px-2 text-xs">
        <ArrowLeft size={14} /> All projects
      </button>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <input
            value={project.name}
            onChange={(e) => update({ name: e.target.value })}
            className="w-full max-w-md bg-transparent text-2xl font-bold text-white focus:outline-none focus:ring-0"
          />
          <p className="mt-1 text-xs text-slate-500">
            Updated {formatDate(project.updated_at)} · {assets.length} assets {saving && '· saving…'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadAll} className="btn-outline !py-2 text-xs"><Download size={14} /> Download all</button>
          <button onClick={exportProject} className="btn-outline !py-2 text-xs"><Save size={14} /> Export project</button>
          <button onClick={() => {
            if (window.confirm('Delete this project permanently?')) {
              api.delete(`/api/projects/${id}`).then(() => {
                push({ type: 'info', title: 'Project deleted', message: 'Removed from workspace.' })
                navigate('/projects')
              }).catch(() => toast.error('Delete failed'))
            }
          }} className="btn-outline !border-rose-500/40 !py-2 text-xs !text-rose-300"><Trash2 size={14} /> Delete</button>
        </div>
      </div>

      {/* Timeline-like asset list */}
      {assets.length === 0 ? (
        <div className="panel grid place-items-center py-20 text-center">
          <p className="text-sm text-slate-400">No assets yet. Generate something to add it here.</p>
          <button onClick={() => navigate('/create')} className="btn-primary mt-4"><Plus size={16} /> Create</button>
        </div>
      ) : (
        <div className="space-y-2">
          {assets.map((a, i) => {
            const Icon = TYPE_ICONS[a.type] || Folder
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-surface p-3 transition-all hover:border-purple-500/30"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-base">
                  {a.url ? (
                    a.type === 'video' ? (
                      <video src={mediaUrl(a.url)} className="h-full w-full object-cover" muted />
                    ) : (
                      <img src={mediaUrl(a.url)} alt={a.prompt || ''} onClick={() => setLightbox({ type: a.type, url: a.url, prompt: a.prompt })} className="h-full w-full cursor-pointer object-cover" />
                    )
                  ) : (
                    <Icon size={20} className={TYPE_COLORS[a.type] || 'text-slate-500'} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{a.prompt || a.type}</p>
                  <p className="mt-0.5 text-xs text-slate-500 capitalize">{a.type} asset</p>
                </div>
                {a.url && (
                  <button
                    onClick={async () => {
                      const full = mediaUrl(a.url)
                      const parts = full.split('/')
                      await downloads.save(full, parts[parts.length - 1] || a.type)
                      toast.success('Downloading', 'Asset saved.')
                    }}
                    className="btn-ghost !px-2.5 !py-2"
                  >
                    <Download size={15} />
                  </button>
                )}
                {a.url && (
                  <button
                    onClick={() => setLightbox({ type: a.type, url: a.url, prompt: a.prompt })}
                    className="btn-ghost !px-2.5 !py-2"
                    title="Preview"
                  >
                    <ImageIcon size={15} />
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      <Lightbox item={lightbox} open={!!lightbox} onClose={() => setLightbox(null)} />
    </div>
  )
}