import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles, Image as ImageIcon, Video, Mic, LayoutPanelTop, ArrowRight, Wand,
  TrendingUp, Clock, Folder, Flame,
} from 'lucide-react'
import { api, mediaUrl } from '@/services/api'
import toast from '@/services/toast'
import { useAppStore } from '@/store/appStore'
import GenerationStage from '@/components/GenerationStage'
import Lightbox from '@/components/Lightbox'

const EXAMPLES = [
  'Create a cinematic futuristic city at sunset with a girl walking through neon streets.',
  'A serene snowy mountain cabin with warm lights glowing at dusk.',
  'An astronaut floating in a garden of glowing flowers in deep space.',
  'A vintage travel poster of a mysterious coastal village.',
]

const QUICK_CREATE = [
  { icon: ImageIcon, title: 'Image', desc: 'Turn your ideas into images', path: '/images', gradient: 'from-purple-500/25 to-indigo-600/25', tint: 'text-purple-300' },
  { icon: Video, title: 'Video', desc: 'Generate cinematic videos', path: '/videos', gradient: 'from-fuchsia-500/25 to-purple-600/25', tint: 'text-fuchsia-300' },
  { icon: Mic, title: 'Voice', desc: 'Create natural AI voices', path: '/voice', gradient: 'from-indigo-500/25 to-blue-600/25', tint: 'text-indigo-300' },
  { icon: LayoutPanelTop, title: 'AI Cards', desc: 'Create beautiful downloadable cards', path: '/cards', gradient: 'from-violet-500/25 to-purple-700/25', tint: 'text-violet-300' },
]

export default function Home() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState(0)
  const [history, setHistory] = useState([])
  const [chosen, setChosen] = useState(null)
  const [projects, setProjects] = useState([])
  const push = useAppStore((s) => s.pushNotification)
  const models = useAppStore((s) => s.models)
  useLoadData({ setHistory, setProjects })

  const smartGenerate = async (mode) => {
    if (!prompt.trim()) {
      toast.info('Add a prompt', 'Describe what you want to create first.')
      return
    }
    setLoading(true)
    setStage(0)
    try {
      setStage(1)
      if (mode === 'image') {
        const res = await api.post('/api/image/generate', {
          prompt,
          style: 'Cinematic',
          aspect_ratio: '16:9',
          resolution: 768,
          num_images: 1,
        })
        push({ type: 'success', title: 'Image generated', message: 'Your image is ready.' })
        setChosen({ type: 'image', url: res.results[0].url, prompt, mode: res.mode })
      } else if (mode === 'video') {
        const res = await api.post('/api/video/generate', {
          prompt, mode: 'text', duration: 5, aspect_ratio: '16:9', style: 'Cinematic', camera: 'Dolly in',
        })
        push({ type: 'success', title: 'Video generated', message: 'Your cinematic video is ready.' })
        setChosen({ type: 'video', url: res.result.url, prompt, mode: res.mode })
      } else if (mode === 'voice') {
        navigate('/voice', { state: { prompt } })
        return
      } else if (mode === 'card') {
        navigate('/cards', { state: { prompt } })
        return
      }
    } catch (e) {
      push({ type: 'error', title: "Generation couldn't be completed.", message: e.message || 'Try again or check model configuration.' })
    } finally {
      setStage(2)
      setTimeout(() => setLoading(false), 400)
    }
  }

  const recent = history.slice(0, 4)
  const projectCount = projects.length

  return (
    <div className="mx-auto max-w-5xl">
      {loading && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <GenerationStage type="image" stage={stage} />
        </div>
      )}

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-border relative overflow-hidden rounded-3xl p-6 sm:p-10"
      >
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-600/20 blur-[90px]" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
            {models?.demo_mode ? 'Demo Mode active' : 'Free AI Workspace'}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Create anything with <span className="text-gradient">AI.</span>
          </h1>
          <p className="mt-2 text-slate-400">
            Images, videos, voices, cards and creative assets — all in one workspace.
          </p>

          <div className="relative mt-7">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) smartGenerate('image')
              }}
              rows={3}
              placeholder="What do you want to create?"
              className="input resize-none !rounded-2xl !py-4 !text-base"
            />
            <Wand
              size={18}
              className={`absolute bottom-4 right-4 transition-colors ${prompt ? 'text-purple-400' : 'text-slate-600'}`}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition-all hover:border-purple-500/40 hover:text-purple-300"
              >
                {ex.length > 52 ? ex.slice(0, 52) + '…' : ex}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => smartGenerate('image')} disabled={loading} className="btn-primary">
              <ImageIcon size={17} /> Generate Image
            </button>
            <button onClick={() => smartGenerate('video')} disabled={loading} className="btn-outline">
              <Video size={17} /> Generate Video
            </button>
            <button onClick={() => smartGenerate('voice')} disabled={loading} className="btn-outline">
              <Mic size={17} /> Create Voice
            </button>
            <button onClick={() => smartGenerate('card')} disabled={loading} className="btn-outline">
              <LayoutPanelTop size={17} /> Create Card
            </button>
          </div>

          {models?.demo_mode && (
            <p className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200/90">
              Demo Mode — connect a local/open-source model to enable live generation. (Settings → AI Providers)
            </p>
          )}
        </div>
      </motion.div>

      {/* Quick create */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {QUICK_CREATE.map((q, i) => (
          <motion.button
            key={q.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -4 }}
            onClick={() => navigate(q.path)}
            className={`card-hover rounded-2xl border border-white/10 bg-gradient-to-br ${q.gradient} p-5 text-left`}
          >
            <q.icon size={24} className={q.tint} />
            <h3 className="mt-3 font-semibold text-white">{q.title}</h3>
            <p className="mt-1 text-xs leading-snug text-slate-400">{q.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-purple-300">
              Open <ArrowRight size={12} />
            </span>
          </motion.button>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Flame, label: 'Generations', value: history.length },
          { icon: Folder, label: 'Projects', value: projectCount },
          { icon: Clock, label: 'Media types', value: new Set(history.map((h) => h.type)).size || 0 },
          { icon: TrendingUp, label: 'Workspace', value: 'Free' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="panel flex items-center gap-3 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <s.icon size={18} className="text-purple-300" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent creations */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent creations</h2>
          <button onClick={() => navigate('/history')} className="btn-ghost !py-1.5 text-xs">
            View all <ArrowRight size={13} />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="panel p-10 text-center">
            <Sparkles size={28} className="mx-auto text-purple-400/60" />
            <p className="mt-3 text-sm text-slate-400">
              Nothing here yet. Generate your first image, video or voice.
            </p>
            <button onClick={() => navigate('/images')} className="btn-primary mt-4">
              Start creating
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((r, i) => (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setChosen({ type: r.type, url: r.preview, prompt: r.prompt, mode: r.metadata?.mode })}
                className="card-hover group overflow-hidden rounded-2xl border border-white/10 text-left"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                  {r.preview ? (
                    <img src={mediaUrl(r.preview)} alt={r.prompt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-600">
                      <Folder size={24} />
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-purple-300 backdrop-blur-sm">
                    {r.type}
                  </span>
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-xs text-slate-300">{r.prompt}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <Lightbox
        item={chosen}
        open={!!chosen}
        onClose={() => setChosen(null)}
        title={chosen?.prompt}
      />
    </div>
  )
}

function useLoadData({ setHistory, setProjects }) {
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/history?limit=20')
        setHistory(res.items || [])
      } catch (e) { /* backend offline */ }
      try {
        const res = await api.get('/api/projects')
        setProjects(res.projects || [])
      } catch (e) { /* backend offline */ }
    })()
  }, [])
  return null
}