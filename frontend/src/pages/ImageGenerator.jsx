import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, Download, Copy, RefreshCw, Trash2, Maximize2, Wand,
  Zap, SlidersHorizontal, Shield,
} from 'lucide-react'
import { api, mediaUrl } from '@/services/api'
import toast from '@/services/toast'
import downloads from '@/services/downloads'
import { useAppStore } from '@/store/appStore'
import { imageStyles, aspectRatios, resolutions } from '@/utils/constants'
import Lightbox from '@/components/Lightbox'
import { GridSkeleton } from '@/components/Skeletons'
import ErrorCard from '@/components/ErrorCard'
import { cn, randomSeed } from '@/utils/helpers'

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [style, setStyle] = useState('Cinematic')
  const [aspect, setAspect] = useState('1:1')
  const [resolution, setResolution] = useState(768)
  const [count, setCount] = useState(1)
  const [seed, setSeed] = useState(null)
  const [guidance, setGuidance] = useState(7.5)
  const [steps, setSteps] = useState(30)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState([])
  const [lightbox, setLightbox] = useState(null)
  const lastErrorRef = useRef(null)

  const models = useAppStore((s) => s.models)
  const push = useAppStore((s) => s.pushNotification)

  const generate = async (opts) => {
    if (!prompt.trim() && !(opts && opts.prompt)) {
      toast.info('Describe your image', 'Enter a prompt to start generating.')
      return
    }
    setLoading(true)
    setError(null)
    const useSeed = !opts?.forceRandom ? seed : (opts?.variation ? (seed ?? 1) + 1 : null)
    const payload = {
      prompt: opts?.prompt ?? prompt.trim(),
      negative_prompt: negativePrompt.trim(),
      style,
      aspect_ratio: aspect,
      resolution,
      num_images: count,
      seed: useSeed ?? undefined,
      guidance_scale: guidance,
      steps,
    }
    try {
      const res = await api.post('/api/image/generate', payload)
      setResults(res.results || [])
      lastErrorRef.current = null
      if (res.demo) {
        push({ type: 'demo', title: 'Demo Mode', message: 'Showing procedural preview. Add a model in Settings → AI Providers for live generation.' })
      } else {
        push({ type: 'success', title: 'Image generated', message: `${res.results.length} image(s) ready.` })
      }
    } catch (e) {
      const err = e.message || 'Model unavailable'
      setError(err)
      lastErrorRef.current = err
      push({ type: 'error', title: "Generation couldn't be completed.", message: err })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (img, format) => {
    try {
      let url = mediaUrl(img.url)
      let name = img.filename || 'image'
      if (format === 'jpg') {
        const conv = await api.post('/api/image/convert', { filename: img.filename, format: 'jpg' })
        url = mediaUrl(conv.result.url)
        name = conv.result.filename
      } else if (format === 'png' && !/\.png(\?|$)/.test(url)) {
        const conv = await api.post('/api/image/convert', { filename: img.filename, format: 'png' })
        url = mediaUrl(conv.result.url)
        name = conv.result.filename
      }
      await downloads.save(url, name)
      toast.success('Download started', `${name} saved.`)
    } catch (e) {
      toast.error('Download failed', e.message)
    }
  }

  const copyPrompt = async (p) => {
    try {
      await navigator.clipboard.writeText(p)
      toast.success('Copied', 'Prompt copied to clipboard.')
    } catch (e) {
      toast.error('Could not copy', 'Clipboard unavailable.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">Image Generator</p>
          <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">Turn prompts into images</h1>
        </div>
        {models?.demo_mode && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            Demo Mode active
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        {/* Control panel */}
        <div className="panel h-fit space-y-5 p-5 lg:sticky lg:top-0">
          <div>
            <label className="label mb-2">Prompt</label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your image..."
              className="input resize-none"
            />
          </div>

          <div>
            <label className="label mb-2">Negative prompt</label>
            <input
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="blurry, low quality..."
              className="input"
            />
          </div>

          <div>
            <label className="label mb-2">Style</label>
            <div className="flex flex-wrap gap-1.5">
              {imageStyles.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={cn('chip !px-3 !py-1 text-xs', style === s ? 'chip-active' : 'chip-inactive')}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label mb-2">Aspect ratio</label>
            <div className="flex flex-wrap gap-1.5">
              {aspectRatios.map((a) => (
                <button
                  key={a}
                  onClick={() => setAspect(a)}
                  className={cn('chip !px-3 !py-1 text-xs', aspect === a ? 'chip-active' : 'chip-inactive')}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label mb-2">Resolution</label>
            <div className="flex flex-wrap gap-1.5">
              {resolutions.map((r) => (
                <button
                  key={r}
                  onClick={() => setResolution(r)}
                  className={cn('chip !px-3 !py-1 text-xs', resolution === r ? 'chip-active' : 'chip-inactive')}
                >
                  {r}px
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label mb-2">Number of images</label>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={cn('chip !px-3 !py-1 text-xs', count === n ? 'chip-active' : 'chip-inactive')}
                >
                  {n} {n === 1 ? 'image' : 'images'}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-medium text-purple-300 hover:text-purple-200"
            >
              <SlidersHorizontal size={13} /> Advanced
            </button>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 overflow-hidden pt-3"
              >
                <div>
                  <label className="label mb-2">Seed</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={seed ?? ''}
                      onChange={(e) => setSeed(e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="Random"
                      className="input"
                    />
                    <button
                      onClick={() => setSeed(randomSeed())}
                      className="btn-outline shrink-0"
                      title="Random seed"
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label mb-2">Guidance scale · {guidance}</label>
                  <input type="range" min="1" max="15" step="0.5" value={guidance} onChange={(e) => setGuidance(Number(e.target.value))} className="range-input" />
                </div>
                <div>
                  <label className="label mb-2">Steps · {steps}</label>
                  <input type="range" min="10" max="60" step="1" value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="range-input" />
                </div>
              </motion.div>
            )}
          </div>

          <button
            onClick={() => generate()}
            disabled={loading || !prompt.trim()}
            className="btn-primary w-full !py-3 text-base"
          >
            {loading ? (
              <><Sparkles size={18} className="animate-pulse" /> Generating…</>
            ) : (
              <><Zap size={18} /> Generate</>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-5">
          {error && (
            <ErrorCard
              error={error}
              onRetry={() => generate()}
              onFallback={() => generate({ prompt: prompt.trim(), forceRandom: true })}
            />
          )}

          {loading && <GridSkeleton count={count} />}

          {!loading && !error && results.length === 0 && (
            <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
                <Sparkles size={28} className="text-purple-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">Your images appear here</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Describe an image, pick a style and hit Generate. No credits, no limits.
              </p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className={cn('grid gap-4', count > 1 ? 'grid-cols-2' : 'grid-cols-1', count === 4 && 'lg:grid-cols-2')}>
              {results.map((img, i) => (
                <motion.div
                  key={img.filename}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-surface"
                >
                  <div className="relative cursor-pointer" onClick={() => setLightbox(img)}>
                    <img src={mediaUrl(img.url)} alt={img.prompt} className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                    {img.demo && (
                      <span className="absolute left-2 top-2 rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-300 backdrop-blur-sm">
                        Demo asset
                      </span>
                    )}
                    {img.mode && img.mode !== 'demo' && (
                      <span className="absolute left-2 top-2 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300 backdrop-blur-sm">
                        {img.model || img.mode}
                      </span>
                    )}
                    <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                      <Maximize2 size={15} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-2.5">
                    <ActionBtn icon={Download} label="PNG" onClick={() => handleDownload(img, 'png')} />
                    <ActionBtn icon={Download} label="JPG" onClick={() => handleDownload(img, 'jpg')} />
                    <ActionBtn icon={Copy} label="Prompt" onClick={() => copyPrompt(img.prompt)} />
                    <ActionBtn icon={RefreshCw} label="Re" onClick={() => {
                      setSeed(randomSeed())
                      generate({ forceRandom: true })
                    }} />
                    <ActionBtn icon={Wand} label="Upscale" onClick={async () => {
                      try {
                        const res = await api.post('/api/image/upscale', { filename: img.filename })
                        setResults((rs) => [...rs, res.result])
                        toast.success('Upscaled', '2x upscale added to gallery.')
                      } catch (e) {
                        toast.generateError(e.message)
                      }
                    }} />
                    <ActionBtn danger icon={Trash2} label="" onClick={() => setResults((rs) => rs.filter((r) => r.filename !== img.filename))} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="flex justify-center gap-3">
              <button onClick={() => generate({ forceRandom: true })} className="btn-outline">
                <RefreshCw size={15} /> Regenerate variations
              </button>
            </div>
          )}
        </div>
      </div>

      <Lightbox item={lightbox} open={!!lightbox} onClose={() => setLightbox(null)} />
    </div>
  )
}

function ActionBtn({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors',
        danger ? 'text-slate-500 hover:bg-rose-500/10 hover:text-rose-400' : 'text-slate-400 hover:bg-white/5 hover:text-white',
      )}
    >
      <Icon size={13} /> {label}
    </button>
  )
}