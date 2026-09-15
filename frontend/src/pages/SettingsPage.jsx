import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Palette, Cpu, Wand, Database, KeyRound, ShieldCheck, Save, Eye, EyeOff,
} from 'lucide-react'
import { api } from '@/services/api'
import toast from '@/services/toast'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/utils/helpers'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'generation', label: 'Generation', icon: Cpu },
  { id: 'providers', label: 'AI Providers', icon: Wand },
  { id: 'storage', label: 'Storage', icon: Database },
]

export default function SettingsPage() {
  const [active, setActive] = useState('profile')
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const push = useAppStore((s) => s.pushNotification)

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">Settings</p>
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">Configure your workspace</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
        <div className="panel h-fit space-y-1 p-2 lg:sticky lg:top-0">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                active === s.id ? 'bg-purple-500/15 text-purple-200 shadow-glow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white',
              )}
            >
              <s.icon size={16} /> {s.label}
            </button>
          ))}
          <div className="divider my-2" />
          <div className="rounded-xl bg-emerald-500/10 p-3 text-[11px] leading-relaxed text-emerald-200/80">
            Free AI Workspace. No credits, coins or paywalls — ever.
          </div>
        </div>

        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {active === 'profile' && <ProfileSection />}
          {active === 'appearance' && <AppearanceSection theme={theme} setTheme={setTheme} />}
          {active === 'generation' && <GenerationSection />}
          {active === 'providers' && <ProvidersSection push={push} />}
          {active === 'storage' && <StorageSection />}
        </motion.div>
      </div>
    </div>
  )
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="panel space-y-5 p-6">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label mb-2">{label}</label>
      {children}
    </div>
  )
}

function ProfileSection() {
  const [name, setName] = useState('Creator')
  const [bio, setBio] = useState('Building with free, open-source AI.')
  return (
    <div className="space-y-5">
      <Panel title="Profile" subtitle="Your creator identity in the workspace.">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-xl font-bold text-white">
            {name[0]?.toUpperCase() || 'C'}
          </div>
          <div className="text-sm text-slate-400">
            <p className="font-medium text-white">{name || 'Creator'}</p>
            <p>Free account · Local workspace · No plan</p>
          </div>
        </div>
        <Field label="Display name">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </Field>
        <Field label="Short bio">
          <input value={bio} onChange={(e) => setBio(e.target.value)} className="input" />
        </Field>
      </Panel>
    </div>
  )
}

function AppearanceSection({ theme, setTheme }) {
  const options = [
    { id: 'dark', label: 'Dark', desc: 'Cinematic dark workspace' },
    { id: 'light', label: 'Light', desc: 'Bright clean theme' },
    { id: 'system', label: 'System', desc: 'Follow your OS' },
  ]
  return (
    <Panel title="Appearance" subtitle="Choose how CREOVA AI looks.">
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => setTheme(o.id)}
            className={cn(
              'rounded-2xl border p-4 text-left transition-all',
              theme === o.id ? 'border-purple-500/60 bg-purple-500/10 shadow-glow-sm' : 'border-white/10 hover:border-purple-500/30',
            )}
          >
            <p className="text-sm font-semibold text-white">{o.label}</p>
            <p className="mt-1 text-xs text-slate-500">{o.desc}</p>
          </button>
        ))}
      </div>
    </Panel>
  )
}

function GenerationSection() {
  const [defaults, setDefaults] = useState({
    imageModel: 'huggingface',
    videoModel: 'demo',
    voice: 'browser',
    resolution: 768,
  })
  return (
    <Panel title="Generation defaults" subtitle="Defaults used across studios (overridable per session).">
      <Field label="Default image model">
        <Select value={defaults.imageModel} onChange={(v) => setDefaults({ ...defaults, imageModel: v })} options={[['huggingface', 'Hugging Face (free tier)'], ['local', 'Local diffusers'], ['local_endpoint', 'Compatible endpoint']]} />
      </Field>
      <Field label="Default video model">
        <Select value={defaults.videoModel} onChange={(v) => setDefaults({ ...defaults, videoModel: v })} options={[['demo', 'Demo / procedural (default)'], ['endpoint', 'Compatible video endpoint']]} />
      </Field>
      <Field label="Default voice">
        <Select value={defaults.voice} onChange={(v) => setDefaults({ ...defaults, voice: v })} options={[['browser', 'Browser Web Speech'], ['endpoint', 'Local TTS / provider'], ['coqui', 'Coqui TTS (if installed)']]} />
      </Field>
      <Field label="Default resolution">
        <Select value={String(defaults.resolution)} onChange={(v) => setDefaults({ ...defaults, resolution: Number(v) })} options={[['512', '512px'], ['768', '768px'], ['1024', '1024px']]} />
      </Field>
    </Panel>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input cursor-pointer">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

function ProvidersSection({ push }) {
  const [hfToken, setHfToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [hfModel, setHfModel] = useState('black-forest-labs/FLUX.1-schnell')
  const [pollinationsKey, setPollinationsKey] = useState('')
  const [showPolli, setShowPolli] = useState(false)
  const [polliModel, setPolliModel] = useState('amazon/nova-reel-v1')
  const [agnesKey, setAgnesKey] = useState('')
  const [showAgnes, setShowAgnes] = useState(false)
  const [agnesModel, setAgnesModel] = useState('agnes-video-v2.0')
  const [agnesImageModel, setAgnesImageModel] = useState('agnes-image-2.5-flash')
  const [videoBackend, setVideoBackend] = useState('auto')
  const [geminiKey, setGeminiKey] = useState('')

  const [imgEndpoint, setImgEndpoint] = useState('')
  const [videoEndpoint, setVideoEndpoint] = useState('')
  const [ttsEndpoint, setTtsEndpoint] = useState('')
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testStatus, setTestStatus] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/api/settings')
        const s = res.settings || {}
        if (s.hf_token) setHfToken(s.hf_token)
        if (s.hf_image_model) setHfModel(s.hf_image_model)
        if (s.pollinations_key) setPollinationsKey(s.pollinations_key)
        if (s.pollinations_video_model) setPolliModel(s.pollinations_video_model)
        if (s.agnes_key) setAgnesKey(s.agnes_key)
        if (s.agnes_video_model) setAgnesModel(s.agnes_video_model)
        if (s.agnes_image_model) setAgnesImageModel(s.agnes_image_model)
        if (s.video_backend) setVideoBackend(s.video_backend)
        if (s.gemini_api_key) setGeminiKey(s.gemini_api_key)
        if (s.img_endpoint) setImgEndpoint(s.img_endpoint)
        if (s.video_endpoint) setVideoEndpoint(s.video_endpoint)
        if (s.tts_endpoint) setTtsEndpoint(s.tts_endpoint)
      } catch (e) { /* offline */ }
    })()
  }, [])

  const apply = async () => {
    await Promise.all([
      api.post('/api/settings', { key: 'hf_token', value: hfToken }),
      api.post('/api/settings', { key: 'hf_image_model', value: hfModel }),
      api.post('/api/settings', { key: 'pollinations_key', value: pollinationsKey }),
      api.post('/api/settings', { key: 'pollinations_video_model', value: polliModel }),
      api.post('/api/settings', { key: 'agnes_key', value: agnesKey }),
      api.post('/api/settings', { key: 'agnes_video_model', value: agnesModel }),
      api.post('/api/settings', { key: 'agnes_image_model', value: agnesImageModel }),
      api.post('/api/settings', { key: 'video_backend', value: videoBackend }),
      api.post('/api/settings', { key: 'gemini_api_key', value: geminiKey }),
      api.post('/api/settings', { key: 'img_endpoint', value: imgEndpoint }),
      api.post('/api/settings', { key: 'video_endpoint', value: videoEndpoint }),
      api.post('/api/settings', { key: 'tts_endpoint', value: ttsEndpoint }),
    ])
  }

  const saveAll = async () => {
    try {
      await apply()
      useAppStore.getState().checkSystem()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      push({ type: 'success', title: 'Providers saved', message: 'Settings stored locally on this device.' })
    } catch (e) {
      toast.error('Save failed', e.message)
    }
  }

  const testAll = async () => {
    setTesting(true)
    setTestStatus(null)
    try {
      await apply()
      useAppStore.getState().checkSystem()
      const res = await api.get('/api/providers/test')
      setTestStatus(res.results)
      const failed = Object.entries(res.results).filter(([, v]) => !(v.ok || v.configured)).map(([k]) => k)
      if (failed.length === 0) {
        push({ type: 'success', title: 'All connections OK', message: 'Every provider is configured and reachable.' })
      } else {
        toast.info('Some connections need attention', failed.join(', '))
      }
    } catch (e) {
      toast.error('Test failed', e.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-5">
      <Panel
        title="AI Providers"
        subtitle="Bring your own open-source models. Values are stored locally only — never hard-coded, never sent anywhere except your configured endpoint."
      >
        <Field label="Hugging Face Inference token (optional, free tier)">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showToken ? 'text' : 'password'}
                value={hfToken}
                onChange={(e) => setHfToken(e.target.value)}
                placeholder="hf_..."
                className="input pr-10"
              />
              <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-600">
            Free token from huggingface.co/settings/tokens (enable "Inference Providers"). FLUX.1-schnell gives the best free image quality.
          </p>
        </Field>

        <Field label="Hugging Face model">
          <Select
            value={hfModel}
            onChange={(v) => setHfModel(v)}
            options={[
              ['black-forest-labs/FLUX.1-schnell', 'FLUX.1-schnell (best free quality)'],
              ['stabilityai/sdxl-turbo', 'SDXL Turbo (fastest)'],
              ['black-forest-labs/FLUX.1-dev', 'FLUX.1-dev (higher quality, slower)'],
            ]}
          />
        </Field>

        <Field label="Agnes AI key — video (genuinely free)">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showAgnes ? 'text' : 'password'}
                value={agnesKey}
                onChange={(e) => setAgnesKey(e.target.value)}
                placeholder="Agnes AI key"
                className="input pr-10"
              />
              <button onClick={() => setShowAgnes(!showAgnes)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                {showAgnes ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-600">
            Free key from platform.agnes-ai.com — no credit card, no billing, just a 20 req/min cap.
            Videos from 2 to 60 seconds (text, image-to-video, and video-to-video from the first frame).
            This is the default free video backend.
          </p>
        </Field>

        <Field label="Agnes video model">
          <Select
            value={agnesModel}
            onChange={(v) => setAgnesModel(v)}
            options={[
              ['agnes-video-v2.0', 'Agnes Video v2.0 (recommended, up to 60s)'],
              ['agnes-video-2.5-flash', 'Agnes Video 2.5 Flash (fast, 4–12s)'],
              ['agnes-video-2.5', 'Agnes Video 2.5 (paid tier, 4–12s)'],
            ]}
          />
        </Field>

        <Field label="Agnes image model (Image Studio, free)">
          <Select
            value={agnesImageModel}
            onChange={(v) => setAgnesImageModel(v)}
            options={[
              ['agnes-image-2.5-flash', 'Agnes Image 2.5 Flash (recommended, free)'],
              ['agnes-image-2.1-flash', 'Agnes Image 2.1 Flash'],
              ['agnes-image-2.0-flash', 'Agnes Image 2.0 Flash'],
            ]}
          />
        </Field>

        <Field label="Video backend">
          <Select
            value={videoBackend}
            onChange={(v) => setVideoBackend(v)}
            options={[
              ['auto', 'Auto: Agnes → Pollinations → Veo → endpoint'],
              ['agnes', 'Agnes AI (free)'],
              ['pollinations', 'Pollinations.ai'],
              ['veo', 'Veo (Google Gemini)'],
              ['endpoint', 'Compatible endpoint'],
            ]}
          />
        </Field>

        <Field label="Pollinations.ai key — video (older option, pollen-based)">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showPolli ? 'text' : 'password'}
                value={pollinationsKey}
                onChange={(e) => setPollinationsKey(e.target.value)}
                placeholder="pk_... or sk_..."
                className="input pr-10"
              />
              <button onClick={() => setShowPolli(!showPolli)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                {showPolli ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-600">
            Key from enter.pollinations.ai/keys. nova-reel costs ~0.08 pollen/sec (6s ≈ 0.48 pollen);
            new accounts get 0.25, so most videos need a top-up.
          </p>
        </Field>

        <Field label="Pollinations video model">
          <Select
            value={polliModel}
            onChange={(v) => setPolliModel(v)}
            options={[
              ['amazon/nova-reel-v1', 'Nova Reel (6–120s)'],
              ['google/veo-3.1-fast', 'Veo 3.1 Fast'],
              ['bytedance/seedance-2.0', 'Seedance 2.0'],
              ['alibaba/wan-2.7', 'Wan 2.7'],
            ]}
          />
        </Field>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-medium text-white">Test connections</p>
              <p className="text-[11px] text-slate-500">Validates your keys and models without generating anything.</p>
            </div>
            <button onClick={testAll} disabled={testing} className="btn-outline !py-2 text-xs">
              {testing ? 'Testing…' : 'Test connections'}
            </button>
          </div>
          {testStatus && (
            <div className="mt-3 space-y-1.5 text-xs">
              {Object.entries(testStatus).map(([k, v]) => {
                const label = { gemini: 'Veo (Google)', huggingface: 'Hugging Face', agnes: 'Agnes AI', pollinations: 'Pollinations.ai', video_backend: 'Video backend', video_endpoint: 'Video endpoint', img_endpoint: 'Image endpoint', tts_endpoint: 'TTS endpoint' }[k] || k
                const ok = v.ok || v.configured
                return (
                  <div key={k} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2">
                    <span className="text-slate-300">{label}</span>
                    <span className={ok ? 'text-emerald-400' : 'text-rose-400'}>
                      {ok ? '✓ ' : '✗ '}{v.error || (v.configured ? 'configured' : 'not set')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Field label="Image endpoint (AUTOMATIC1111 / ComfyUI compatible)">
          <input value={imgEndpoint} onChange={(e) => setImgEndpoint(e.target.value)} placeholder="http://127.0.0.1:7860" className="input" />
        </Field>

        <Field label="Video endpoint">
          <input value={videoEndpoint} onChange={(e) => setVideoEndpoint(e.target.value)} placeholder="http://127.0.0.1:8188" className="input" />
          <p className="mt-1.5 text-[11px] text-slate-600">
            Point to a self-hosted video model service. Leave empty to keep Demo Mode.
          </p>
        </Field>

        <Field label="TTS / voice-cloning endpoint">
          <input value={ttsEndpoint} onChange={(e) => setTtsEndpoint(e.target.value)} placeholder="http://127.0.0.1:8001" className="input" />
        </Field>

        <button onClick={saveAll} className="btn-primary w-full">
          <Save size={16} /> {saved ? 'Saved ✓' : 'Save provider settings'}
        </button>
      </Panel>

      <Panel title="About the free architecture" subtitle="">
        <div className="space-y-3 text-sm text-slate-400">
          <p className="flex items-start gap-2.5"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-400" /> CREOVA AI never shows credits, coins, upgrades or paywalls. Generation runs locally or via the providers you configure.</p>
          <p className="flex items-start gap-2.5"><KeyRound size={16} className="mt-0.5 shrink-0 text-emerald-400" /> API keys you enter are never hard-coded into source and never committed — they live in local settings on this device.</p>
          <p className="flex items-start gap-2.5"><Wand size={16} className="mt-0.5 shrink-0 text-emerald-400" /> If no model is configured, every studio switches to a clearly-labeled Demo Mode instead of pretending to generate.</p>
        </div>
      </Panel>
    </div>
  )
}

function StorageSection() {
  return (
    <Panel title="Storage" subtitle="Where your assets live during development.">
      <div className="grid gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <Database size={18} className="text-purple-300" />
          <div>
            <p className="text-sm font-medium text-white">SQLite database</p>
            <p className="text-xs text-slate-500">Projects, history, settings and voices — stored locally in creova.db</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <Cpu size={18} className="text-purple-300" />
          <div>
            <p className="text-sm font-medium text-white">Local filesystem</p>
            <p className="text-xs text-slate-500">Generated images, videos, audio and cards in ./generated</p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-slate-600">
          The architecture keeps storage behind a small adapter so switching to S3 or another object store later is a one-file change.
        </p>
      </div>
    </Panel>
  )
}