import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Mic, AudioLines, UserCog, Play, Pause, Download, Volume2, Upload,
  Trash2, ShieldCheck, FileAudio, Sparkles,
} from 'lucide-react'
import { api, mediaUrl } from '@/services/api'
import toast from '@/services/toast'
import downloads from '@/services/downloads'
import { useAppStore } from '@/store/appStore'
import { voiceStyles, emotions, genders } from '@/utils/constants'
import { cn, formatDate } from '@/utils/helpers'

const TABS = [
  { id: 'tts', label: 'Text → Speech', icon: AudioLines },
  { id: 'clone', label: 'Voice Cloning', icon: UserCog },
  { id: 'design', label: 'Voice Design', icon: Mic },
]

let voiceCache = []

export default function VoiceStudio() {
  const [tab, setTab] = useState('tts')
  const push = useAppStore((s) => s.pushNotification)
  const models = useAppStore((s) => s.models)

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">Voice Studio</p>
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">Professional AI voice studio</h1>
      </div>

      <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              tab === t.id ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/20 text-white shadow-glow-sm' : 'text-slate-400 hover:text-white',
            )}
          >
            <t.icon size={15} /> <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {models?.demo_mode && tab !== 'design' && (
        <div className="panel mb-5 flex items-start gap-3 border-amber-500/20 px-4 py-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="text-sm text-amber-100/80">
            Using the browser Web Speech API for on-device speech. Configure a local/open-source
            TTS or a compatible endpoint in Settings → AI Providers for higher-fidelity voices.
          </p>
        </div>
      )}

      {tab === 'tts' && <TTSView push={push} />}
      {tab === 'clone' && <CloneView push={push} />}
      {tab === 'design' && <DesignView push={push} />}
    </div>
  )
}

/* ---------------- TTS ---------------- */

function TTSView({ push }) {
  const [text, setText] = useState("Welcome to CREOVA AI. Create anything, no credits, just create.")
  const [gender, setGender] = useState('Female')
  const [style, setStyle] = useState('Natural')
  const [emotion, setEmotion] = useState('Calm')
  const [speed, setSpeed] = useState(1)
  const [pitch, setPitch] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [waveform, setWaveform] = useState([])
  const audioRef = useRef(null)

  const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    if (synthSupported) voiceCache = window.speechSynthesis.getVoices()
  }, [synthSupported])

  const pickVoice = () => {
    const vs = voiceCache.length ? voiceCache : window.speechSynthesis?.getVoices() || []
    if (!vs.length) return null
    const preferred = gender === 'Female' ? ['Google UK English Female', 'Samantha', 'Microsoft Zira'] : gender === 'Male' ? ['Google UK English Male', 'Microsoft David', 'Daniel'] : []
    const genderMatch = gender === 'Neutral'
      ? vs.find((v) => v.name.includes('Natural')) || vs[0]
      : vs.find((v) => preferred.some((p) => v.name.includes(p))) || vs.find((v) => gender === 'Male' ? ['male', 'david', 'daniel', 'guy'].some((k) => v.name.toLowerCase().includes(k)) : ['female', 'samantha', 'zira', 'woman'].some((k) => v.name.toLowerCase().includes(k))) || vs[Math.floor(Math.random() * vs.length)]
    return genderMatch || vs[0]
  }

  const speak = (t, opts) => {
    if (!synthSupported) {
      toast.error('Browser speech unavailable', 'Use a Chromium/Safari browser for Web Speech.')
      return
    }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(t)
    const v = pickVoice()
    if (v) u.voice = v
    u.rate = opts?.speed ?? speed
    u.pitch = (opts?.pitch ?? pitch) + 1
    u.volume = 1
    window.speechSynthesis.speak(u)
    return u
  }

  const generate = async () => {
    if (!text.trim()) {
      toast.info('Add text', 'Enter text to speak first.')
      return
    }
    setGenerating(true)
    const payload = { text, voice: gender.toLowerCase(), style, emotion, speed, pitch_shift: pitch }
    try {
      const res = await api.post('/api/audio/generate', payload)
      const r = res.result
      if (r.mode === 'browser-tts' || res.demo || r.mode === 'placeholder') {
        // Use browser speech for real audio
        await new Promise((r2) => {
          const u = speak(text, { speed, pitch })
          if (u) u.onend = () => r2()
          else r2()
        })
        setPreviewUrl({ browser: true, text, config: payload })
        push({ type: 'demo', title: 'Browser voice', message: 'Speech synthesized on-device via the Web Speech API.' })
      } else {
        setPreviewUrl({ url: r.url, browser: false })
        push({ type: 'success', title: 'Voice ready', message: 'Audio generated and available to download.' })
      }
    } catch (e) {
      toast.generateError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
      <div className="space-y-5">
        <div className="panel p-5">
          <label className="label mb-2">Script</label>
          <textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type the words you want spoken…"
            className="input resize-none !text-base"
          />
        </div>
      </div>

      <div className="space-y-5">
        <div className="panel space-y-5 p-5">
          <div>
            <label className="label mb-2">Voice gender</label>
            <div className="flex flex-wrap gap-1.5">
              {genders.map((g) => (
                <button key={g} onClick={() => setGender(g)} className={cn('chip !px-3 !py-1 text-xs', gender === g ? 'chip-active' : 'chip-inactive')}>{g}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label mb-2">Style</label>
            <div className="flex flex-wrap gap-1.5">
              {voiceStyles.map((s) => (
                <button key={s} onClick={() => setStyle(s)} className={cn('chip !px-3 !py-1 text-xs', style === s ? 'chip-active' : 'chip-inactive')}>{s}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label mb-2">Emotion</label>
            <div className="flex flex-wrap gap-1.5">
              {emotions.map((e) => (
                <button key={e} onClick={() => setEmotion(e)} className={cn('chip !px-3 !py-1 text-xs', emotion === e ? 'chip-active' : 'chip-inactive')}>{e}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label mb-2">Speed · {speed.toFixed(1)}x</label>
            <input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="range-input" />
          </div>

          <div>
            <label className="label mb-2">Pitch · {pitch > 0 ? '+' : ''}{pitch}</label>
            <input type="range" min="-1" max="1" step="0.1" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="range-input" />
          </div>

          <button onClick={generate} disabled={generating} className="btn-primary w-full !py-3">
            {generating ? <><Sparkles size={17} className="animate-pulse" /> Generating voice…</> : <><Mic size={17} /> Generate Voice</>}
          </button>
        </div>

        {/* Playback */}
        <div className="panel p-5">
          <label className="label mb-3">Playback</label>
          {previewUrl ? (
            previewUrl.browser ? (
              <div className="space-y-3">
                <WaveformBars active />
                <div className="flex gap-2">
                  <button onClick={() => speak(previewUrl.text, previewUrl.config)} className="btn-primary !py-2 text-xs flex-1">
                    <Play size={14} /> Play
                  </button>
                  <button onClick={() => toast.info('On-device voice', 'Browser TTS has no offline file. Configure a TTS engine for MP3/WAV downloads.')} className="btn-outline !py-2 text-xs flex-1">
                    <Download size={14} /> Download MP3
                  </button>
                  <button onClick={() => toast.info('On-device voice', 'Browser TTS has no offline file. Configure a TTS engine for MP3/WAV downloads.')} className="btn-outline !py-2 text-xs flex-1">
                    <Download size={14} /> Download WAV
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <audio ref={audioRef} src={mediaUrl(previewUrl.url)} controls className="w-full" />
                <div className="flex gap-2">
                  <button onClick={async () => {
                    try { await downloads.save(mediaUrl(previewUrl.url), 'voice.mp3'); toast.success('Download started', 'MP3 saved.') } catch (e) { toast.error('Download failed', e.message) }
                  }} className="btn-outline !py-2 text-xs flex-1"><Download size={14} /> MP3</button>
                  <button onClick={async () => {
                    try { await downloads.save(mediaUrl(previewUrl.url), 'voice.wav'); toast.success('Download started', 'WAV saved.') } catch (e) { toast.error('Download failed', e.message) }
                  }} className="btn-outline !py-2 text-xs flex-1"><Download size={14} /> WAV</button>
                </div>
              </div>
            )
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
              <Volume2 size={20} className="mx-auto text-slate-600" />
              <p className="mt-2 text-xs text-slate-500">Preview appears after generating.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Clone ---------------- */

function CloneView({ push }) {
  const [file, setFile] = useState(null)
  const [name, setName] = useState('My Voice')
  const [gender, setGender] = useState('Neutral')
  const [consent, setConsent] = useState(false)
  const [text, setText] = useState('Hello, this is my cloned voice speaking.')
  const [cloning, setCloning] = useState(false)
  const [voices, setVoices] = useState([])

  const fileRef = useRef(null)
  const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const load = async () => {
    try {
      const res = await api.get('/api/voice/list')
      setVoices(res.voices || [])
    } catch (e) { /* offline */ }
  }

  useEffect(() => { load() }, [])

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/ogg'].includes(f.type)) {
      toast.error('Unsupported format', 'Use MP3, WAV or M4A.')
      return
    }
    setFile(f)
    setName(f.name.replace(/\.[^.]+$/, '') || 'My Voice')
  }

  const clone = async () => {
    if (!file) { toast.info('Upload audio', 'Upload a voice sample first.'); return }
    if (!consent) { toast.error('Consent required', 'Confirm you own the voice or have permission.'); return }
    setCloning(true)
    try {
      const res = await api.upload('/api/voice/clone', file, {
        voice_name: name,
        voice_gender: gender.toLowerCase(),
        consent: 'true',
        text,
        speed: '1.0',
      })
      push({ type: 'success', title: 'Voice cloned', message: `${name} added to your voices.` })
      await load()
      if (res.result?.mode === 'browser-tts-fallback' || !res.result?.url?.includes('.wav')) {
        toast.demo('Browser fallback', 'No cloning model configured. Playback uses browser speech; add a Coqui XTTS/OpenVoice endpoint for real cloning.')
      }
    } catch (e) {
      toast.error('Cloning failed', e.message || 'Check server configuration.')
    } finally {
      setCloning(false)
    }
  }

  const deleteVoice = async (id) => {
    try { await api.delete(`/api/voice/${id}`); setVoices((v) => v.filter((x) => x.id !== id)); toast.success('Deleted', 'Voice removed.') } catch (e) { toast.error('Delete failed', e.message) }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        <div className="panel p-5">
          <label className="label mb-2">Reference audio</label>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-purple-500/30 bg-purple-500/5 px-4 py-8 text-center transition-all hover:border-purple-500/60 hover:bg-purple-500/10"
          >
            <Upload size={22} className="text-purple-400" />
            {file ? (
              <>
                <FileAudio size={16} className="text-purple-300" />
                <span className="text-sm font-medium text-purple-200">{file.name}</span>
                <span className="text-[11px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB · click to replace</span>
              </>
            ) : (
              <>
                <span className="text-sm text-slate-400">Upload MP3 / WAV / M4A</span>
                <span className="text-[11px] text-slate-600">5 seconds or more of clear speech is best</span>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept=".mp3,.wav,.m4a,.ogg" onChange={handleFile} className="hidden" />
        </div>

        <div className="panel space-y-4 p-5">
          <div>
            <label className="label mb-2">Voice name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Voice" className="input" />
          </div>
          <div>
            <label className="label mb-2">Voice gender</label>
            <div className="flex flex-wrap gap-1.5">
              {genders.map((g) => (
                <button key={g} onClick={() => setGender(g)} className={cn('chip !px-3 !py-1 text-xs', gender === g ? 'chip-active' : 'chip-inactive')}>{g}</button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-amber-100/90">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-purple-500" />
            <span>
              <strong>Voice consent required.</strong> I confirm that I own this voice or have permission to clone it.
              CREOVA AI will not impersonate celebrities, public figures or others without consent.
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-5">
        <div className="panel p-5">
          <label className="label mb-2">Text to speak</label>
          <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} className="input resize-none" placeholder="Enter text to speak..." />
          <button onClick={clone} disabled={cloning} className="btn-primary mt-4 w-full !py-3">
            {cloning ? <><Sparkles size={17} className="animate-pulse" /> Cloning…</> : <><UserCog size={17} /> Generate cloned voice</>}
          </button>
        </div>

        <div className="panel p-5">
          <label className="label mb-3">Your voices</label>
          {voices.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-slate-500">
              No cloned voices yet.
            </p>
          ) : (
            <div className="space-y-2">
              {voices.map((v) => (
                <div key={v.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-600/30">
                    <Mic size={15} className="text-purple-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{v.name}</p>
                    <p className="text-[11px] capitalize text-slate-500">{v.gender} · {formatDate(v.created_at)}</p>
                  </div>
                  <button className="btn-ghost !px-2 !py-1.5" onClick={() => toast.info('Playback', synthSupported ? 'Browser speech preview.' : 'Speech synthesis not available.')}>
                    <Play size={14} />
                  </button>
                  <button className="btn-ghost !px-2 !py-1.5 text-rose-400/70 hover:!text-rose-400" onClick={() => deleteVoice(v.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Design ---------------- */

const PRESETS = [
  { name: 'Warm Studio', gender: 'Female', style: 'Friendly', emotion: 'Happy', seed: 42 },
  { name: 'Deep Narrator', gender: 'Male', style: 'Storytelling', emotion: 'Dramatic', seed: 7 },
  { name: 'Calm Guide', gender: 'Neutral', style: 'Calm', emotion: 'Calm', seed: 13 },
  { name: 'Cinematic Trailer', gender: 'Male', style: 'Cinematic', emotion: 'Excited', seed: 21 },
  { name: 'Soft Voice', gender: 'Female', style: 'Natural', emotion: 'Calm', seed: 99 },
]

function DesignView({ push }) {
  const [text, setText] = useState('This is my designed voice. Perfect for presentations and stories.')
  const [gender, setGender] = useState('Female')
  const [style, setStyle] = useState('Natural')
  const [emotion, setEmotion] = useState('Calm')
  const [speed, setSpeed] = useState(1)
  const [pitch, setPitch] = useState(0)
  const [energy, setEnergy] = useState(50)

  const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const applyPreset = (p) => { setGender(p.gender); setStyle(p.style); setEmotion(p.emotion) }

  const speakDesigned = () => {
    if (!synthSupported) { toast.error('Browser speech unavailable', 'Use Chromium/Safari.'); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = speed
    u.pitch = pitch + 1
    window.speechSynthesis.speak(u)
    push({ type: 'success', title: 'Design applied', message: 'Previewing designed voice on-device.' })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="panel space-y-5 p-5">
        <div>
          <label className="label mb-2">Presets</label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.name} onClick={() => { applyPreset(p) }} className="chip chip-inactive !px-3 !py-1 text-xs">
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label mb-2">Gender</label>
          <div className="flex flex-wrap gap-1.5">
            {genders.map((g) => <button key={g} onClick={() => setGender(g)} className={cn('chip !px-3 !py-1 text-xs', gender === g ? 'chip-active' : 'chip-inactive')}>{g}</button>)}
          </div>
        </div>
        <div>
          <label className="label mb-2">Style</label>
          <div className="flex flex-wrap gap-1.5">
            {voiceStyles.map((s) => <button key={s} onClick={() => setStyle(s)} className={cn('chip !px-3 !py-1 text-xs', style === s ? 'chip-active' : 'chip-inactive')}>{s}</button>)}
          </div>
        </div>
        <div>
          <label className="label mb-2">Emotion</label>
          <div className="flex flex-wrap gap-1.5">
            {emotions.map((e) => <button key={e} onClick={() => setEmotion(e)} className={cn('chip !px-3 !py-1 text-xs', emotion === e ? 'chip-active' : 'chip-inactive')}>{e}</button>)}
          </div>
        </div>
        <div>
          <label className="label mb-2">Speed · {speed.toFixed(1)}x</label>
          <input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="range-input" />
        </div>
        <div>
          <label className="label mb-2">Pitch · {pitch > 0 ? '+' : ''}{pitch}</label>
          <input type="range" min="-1" max="1" step="0.1" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="range-input" />
        </div>
        <div>
          <label className="label mb-2">Energy · {energy}</label>
          <input type="range" min="0" max="100" value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="range-input" />
        </div>
      </div>

      <div className="space-y-5">
        <div className="panel p-5">
          <label className="label mb-2">Sample text</label>
          <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} className="input resize-none" />
          <button onClick={speakDesigned} className="btn-primary mt-4 w-full !py-3">
            <Play size={17} /> Preview designed voice
          </button>
        </div>
        <div className="panel flex items-center gap-3 p-5">
          <Volume2 size={18} className="text-purple-400" />
          <p className="text-sm text-slate-400">
            Voice design settings map to the browser speech engine and any configured open-source TTS endpoint.
          </p>
        </div>
      </div>
    </div>
  )
}

function WaveformBars({ active }) {
  const bars = Array.from({ length: 24 })
  return (
    <div className="flex h-12 items-center gap-[3px]">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-full bg-purple-400/70"
          animate={active ? { height: [8, 32, 16, 42, 10, 26] } : { height: 8 }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.05, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}