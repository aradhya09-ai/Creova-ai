import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Clapperboard, Film, Upload, RefreshCw, Download, Maximize2, Play, Pause, Save, Wand,
  Type, Image as ImageIcon,
} from 'lucide-react'
import { api } from '@/services/api'
import toast from '@/services/toast'
import downloads from '@/services/downloads'
import { useAppStore } from '@/store/appStore'
import { videoStyles, cameras } from '@/utils/constants'
import GenerationStage from '@/components/GenerationStage'
import ErrorCard from '@/components/ErrorCard'
import { cn } from '@/utils/helpers'

const MODES = [
  { id: 'text', label: 'Text → Video', icon: Type },
  { id: 'image', label: 'Image → Video', icon: ImageIcon },
  { id: 'video', label: 'Video → Video', icon: Film },
]

export default function VideoStudio() {
  const [mode, setMode] = useState('text')
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(5)
  const [aspect, setAspect] = useState('16:9')
  const [style, setStyle] = useState('Cinematic')
  const [camera, setCamera] = useState('Static')
  const [motionStrength, setMotionStrength] = useState(3)
  const [sourceFile, setSourceFile] = useState(null)

  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState(0)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const videoRef = useRef(null)
  const fileRef = useRef(null)

  const push = useAppStore((s) => s.pushNotification)
  const models = useAppStore((s) => s.models)
  const [sourceUrl, setSourceUrl] = useState('')

  const generate = async (opts) => {
    if (!prompt.trim() && !opts?.force) {
      toast.info('Describe the scene', 'Enter a prompt for your video.')
      return
    }
    if (mode !== 'text' && !sourceFile && !opts?.force) {
      toast.info('Upload a source', `Add a ${mode === 'image' ? 'image' : 'video'} to start.`)
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setStage(0)

    const finalize = () => {
      setStage(3)
      setLoading(false)
    }
    const fail = (msg) => {
      setError(msg)
      setLoading(false)
      push({ type: 'error', title: "Generation couldn't be completed.", message: msg })
    }

    try {
      setStage(1)
      await wait(400)
      setStage(2)
      const payload = {
        prompt: prompt.trim(),
        mode,
        duration,
        aspect_ratio: aspect,
        style,
        camera,
        motion_strength: motionStrength,
        image_url: mode === 'image' ? sourceUrl : '',
        video_url: mode === 'video' ? sourceUrl : '',
        force_demo: !!opts?.forceDemo,
      }
      const res = await api.post('/api/video/generate', payload)
      setResult(res.result)
      setStage(3)
      if (res.demo) {
        push({ type: 'demo', title: 'Demo Mode video', message: 'Procedural preview rendered. Add a free Agnes AI key in Settings → AI Providers for real generation.' })
      } else if (res.mode === 'agnes') {
        push({ type: 'success', title: 'Video ready', message: `${duration}s video generated with Agnes AI (${res.model}).` })
      } else if (res.mode === 'pollinations') {
        push({ type: 'success', title: 'Video ready', message: `${duration}s video generated with Pollinations (${res.model}).` })
      } else if (res.mode === 'gemini') {
        push({ type: 'success', title: 'Video ready', message: `${duration}s ${style.toLowerCase()} video generated with Veo 2.` })
      } else {
        push({ type: 'success', title: 'Video ready', message: `${duration}s ${style.toLowerCase()} video generated.` })
      }
      setTimeout(finalize, 600)
    } catch (e) {
      fail(e.message || 'Video model unavailable')
      finalize()
    }
  }

  const handleSource = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setSourceFile(f)
    setError(null)
    try {
      const up = await api.upload('/api/video/upload', f, { usage: 'image_to_video' })
      setSourceUrl(up.url)
      toast.success('Source uploaded', f.name)
    } catch (err) {
      toast.error('Upload failed', err.message)
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">Video Studio</p>
          <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">Cinematic video generation</h1>
        </div>
        {models?.demo_mode && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            Demo Mode active
          </span>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <GenerationStage type="video" stage={stage} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
        <div className="panel h-fit space-y-5 p-5 lg:sticky lg:top-0">
          {/* Mode */}
          <div>
            <label className="label mb-2">Mode</label>
            <div className="grid grid-cols-3 gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[11px] font-medium transition-all',
                    mode === m.id
                      ? 'border-purple-500/60 bg-purple-500/15 text-purple-200'
                      : 'border-white/10 text-slate-400 hover:border-purple-500/30',
                  )}
                >
                  <m.icon size={17} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Source upload (non-text) */}
          {mode !== 'text' && (
            <div>
              <label className="label mb-2">Source {mode === 'image' ? 'image' : 'video'}</label>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-purple-500/30 bg-purple-500/5 px-4 py-7 text-center transition-all hover:border-purple-500/60 hover:bg-purple-500/10"
              >
                <Upload size={20} className="text-purple-400" />
                {sourceFile ? (
                  <>
                    <span className="text-xs font-medium text-purple-200">{sourceFile.name}</span>
                    <span className="text-[11px] text-slate-500">Click to replace</span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">
                    Upload {mode === 'image' ? 'an image' : 'a video'} to animate
                  </span>
                )}
              </button>
              <input ref={fileRef} type="file" accept={mode === 'image' ? 'image/*' : 'video/*'} onChange={handleSource} className="hidden" />
            </div>
          )}

          {/* Prompt */}
          <div>
            <label className="label mb-2">Prompt</label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the scene and motion..."
              className="input resize-none"
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
              Example: "A young woman walks through a futuristic Tokyo street while rain falls,
              cinematic camera movement, shallow depth of field."
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="label mb-2">Duration</label>
            <div className="flex flex-wrap gap-1.5">
              {[5, 10, 15, 30, 45, 60].map((d) => (
                <button key={d} onClick={() => setDuration(d)} className={cn('chip !px-3 !py-1 text-xs', duration === d ? 'chip-active' : 'chip-inactive')}>
                  {d} sec
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="2"
                max="60"
                value={duration}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (v >= 2 && v <= 60) setDuration(v)
                }}
                className="input !py-1.5 text-sm"
              />
              <span className="text-[11px] text-slate-500">sec (2–60, custom)</span>
            </div>
          </div>

          {/* Aspect */}
          <div>
            <label className="label mb-2">Aspect ratio</label>
            <div className="flex flex-wrap gap-1.5">
              {['16:9', '9:16', '1:1'].map((a) => (
                <button key={a} onClick={() => setAspect(a)} className={cn('chip !px-3 !py-1 text-xs', aspect === a ? 'chip-active' : 'chip-inactive')}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="label mb-2">Style</label>
            <div className="flex flex-wrap gap-1.5">
              {videoStyles.map((s) => (
                <button key={s} onClick={() => setStyle(s)} className={cn('chip !px-3 !py-1 text-xs', style === s ? 'chip-active' : 'chip-inactive')}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Camera */}
          <div>
            <label className="label mb-2">Camera</label>
            <div className="flex flex-wrap gap-1.5">
              {cameras.map((c) => (
                <button key={c} onClick={() => setCamera(c)} className={cn('chip !px-3 !py-1 text-xs', camera === c ? 'chip-active' : 'chip-inactive')}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Motion strength */}
          <div>
            <label className="label mb-2">Motion strength · {motionStrength}/5</label>
            <input type="range" min="1" max="5" step="1" value={motionStrength} onChange={(e) => setMotionStrength(Number(e.target.value))} className="range-input" />
          </div>

          <button onClick={() => generate()} disabled={loading} className="btn-primary w-full !py-3 text-base">
            {loading ? <><Clapperboard size={17} className="animate-pulse" /> Rendering…</> : <><Film size={17} /> Generate Video</>}
          </button>
        </div>

        {/* Preview */}
        <div className="space-y-5">
          {error && (
            <ErrorCard
              error={error}
              onRetry={() => generate({ force: true })}
              onFallback={() => generate({ force: true, forceDemo: true })}
            />
          )}

          {!result && !loading && !error && (
            <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-32 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
                <Clapperboard size={28} className="text-purple-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">Your video appears here</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Set a prompt, choose duration and motion, then generate. Demo Mode produces a clearly-labeled preview.
              </p>
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="overflow-hidden rounded-2xl border border-white/10 bg-surface"
            >
              <div className="relative">
                {result.container === 'gif' || /\.gif(\?|$)/.test(result.url || '') ? (
                  <div className="aspect-video w-full bg-black">
                    <img src={result.url} alt={prompt} className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    src={result.url}
                    controls
                    loop
                    className="aspect-video w-full bg-black"
                  />
                )}
                {result.demo && (
                  <span className="absolute left-3 top-3 rounded-full bg-amber-500/25 px-3 py-1 text-[11px] font-semibold text-amber-300 backdrop-blur-sm">
                    Demo Mode preview{result.container === 'gif' ? ' (GIF)' : ''}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 p-3">
                <button onClick={() => (videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause())} className="btn-outline !py-2 text-xs">
                  {videoRef.current?.paused ? <><Play size={14} /> Play</> : <><Pause size={14} /> Pause</>}
                </button>
                <button onClick={async () => {
                  try {
                    const parts = result.url.split('/')
                    await downloads.save(result.url, parts[parts.length - 1] || 'video.mp4')
                    toast.success('Download started', 'MP4 saved.')
                  } catch (e) {
                    toast.error('Download failed', e.message)
                  }
                }} className="btn-primary !py-2 text-xs">
                  <Download size={14} /> {result.container === 'gif' ? 'Download file' : 'Download MP4'}
                </button>
                <button onClick={() => generate({ force: true })} className="btn-outline !py-2 text-xs">
                  <RefreshCw size={14} /> Regenerate
                </button>
                <button onClick={() => {
                  push({ type: 'success', title: 'Variation queued', message: 'Regenerating with the same prompt + new motion seed.' })
                  generate({ force: true })
                }} className="btn-outline !py-2 text-xs">
                  <Wand size={14} /> Variation
                </button>
                <button onClick={() => {
                  push({ type: 'success', title: 'Project saved', message: 'This generation was auto-saved to Projects.' })
                }} className="btn-outline !py-2 text-xs">
                  <Save size={14} /> Save project
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}