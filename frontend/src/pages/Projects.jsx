import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Folder, Plus, Trash2, EllipsisVertical, Download, Image as ImageIcon, Video, Music, CreditCard as CardIcon,
  FolderPlus,
} from 'lucide-react'
import { api, mediaUrl } from '@/services/api'
import toast from '@/services/toast'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import { formatDate, cn } from '@/utils/helpers'
import { useAppStore } from '@/store/appStore'

const TYPE_ICONS = { image: ImageIcon, video: Video, audio: Music, card: CardIcon }

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [menuId, setMenuId] = useState(null)
  const push = useAppStore((s) => s.pushNotification)

  const load = async () => {
    try {
      const res = await api.get('/api/projects')
      setProjects(res.projects || [])
    } catch (e) {
      /* offline */
    } finally {
      setLoaded(true)
    }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!name.trim()) { toast.info('Name required', 'Give your project a name.'); return }
    try {
      const res = await api.post('/api/projects', { name: name.trim(), assets: [] })
      setProjects((p) => [res.project, ...p])
      setCreateOpen(false)
      setName('')
      push({ type: 'success', title: 'Project created', message: res.project.name })
    } catch (e) {
      toast.error('Create failed', e.message)
    }
  }

  const remove = async (id) => {
    try {
      await api.delete(`/api/projects/${id}`)
      setProjects((p) => p.filter((x) => x.id !== id))
      push({ type: 'info', title: 'Project deleted', message: 'Removed from your workspace.' })
    } catch (e) {
      toast.error('Delete failed', e.message)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        subtitle="Every creation becomes a project. Explore, duplicate, export and download everything."
        actions={
          <button onClick={() => setCreateOpen(true)} className="btn-primary !py-2 text-sm">
            <Plus size={16} /> New project
          </button>
        }
      />

      {!loaded ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-40" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="panel grid place-items-center py-24 text-center">
          <FolderPlus size={32} className="text-purple-400/60" />
          <h3 className="mt-4 text-lg font-semibold text-white">No projects yet</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Generate an image, video, voice or card and it will automatically appear here.
          </p>
          <button onClick={() => setCreateOpen(true)} className="btn-primary mt-5">
            Create a project
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => {
            const assets = p.assets || []
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-hover group relative overflow-hidden rounded-2xl border border-white/10 bg-surface"
              >
                <button onClick={() => navigate(`/projects/${p.id}`)} className="block w-full text-left">
                  {/* Preview wall */}
                  <div className="flex h-36 gap-1.5 overflow-hidden bg-panel p-1.5">
                    {assets.length === 0 ? (
                      <div className="flex w-full items-center justify-center gap-2 text-slate-600">
                        <Folder size={22} />
                        <span className="text-xs">Empty project</span>
                      </div>
                    ) : (
                      assets.slice(0, 4).map((a, j) => (
                        <div key={j} className="relative flex-1 overflow-hidden rounded-lg bg-white/5">
                          {a.url ? (
                            <img src={mediaUrl(a.url)} alt={a.prompt || ''} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-600">
                              {(() => { const I = TYPE_ICONS[a.type] || Folder; return <I size={16} /> })()}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-white">{p.name}</h3>
                      <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-300">
                        {assets.length} asset{assets.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Updated {formatDate(p.updated_at)}</p>
                  </div>
                </button>

                <div className="absolute right-2 top-2">
                  <button
                    onClick={() => setMenuId(menuId === p.id ? null : p.id)}
                    className="rounded-lg bg-black/40 p-1.5 text-slate-300 backdrop-blur-sm hover:text-white"
                  >
                    <EllipsisVertical size={14} />
                  </button>
                  {menuId === p.id && (
                    <div className="absolute right-0 top-8 z-10 w-40 rounded-xl border border-white/10 bg-surface p-1 shadow-glow">
                      <button onClick={() => {
                        setMenuId(null)
                        navigate(`/projects/${p.id}`)
                      }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/5">
                        <Folder size={13} /> Open
                      </button>
                      <button onClick={() => {
                        setProjects((ps) => [...ps, { ...p, id: `copy-${Date.now()}`, name: `${p.name} (copy)`, updated_at: new Date().toISOString() }])
                        setMenuId(null)
                        push({ type: 'success', title: 'Project duplicated', message: p.name })
                      }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/5">
                        <Plus size={13} /> Duplicate
                      </button>
                      <button onClick={() => {
                        setMenuId(null)
                        remove(p.id)
                      }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New project">
        <label className="label mb-2">Project name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder="My creative project"
          className="input mb-4"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setCreateOpen(false)} className="btn-outline">Cancel</button>
          <button onClick={create} className="btn-primary">Create project</button>
        </div>
      </Modal>
    </div>
  )
}