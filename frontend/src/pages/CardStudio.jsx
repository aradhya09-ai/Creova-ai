import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, Type, Image as ImageIcon, Shapes, Circle as CircleIcon, Square as SquareIcon,
  Download, Plus, Trash2, MousePointer2, Move, Copy, Palette, Layers, Maximize,
  Wand, PenLine, Star, Heart, Award, ThumbsUp, GraduationCap, Briefcase, Rocket, Leaf,
} from 'lucide-react'
import toast from '@/services/toast'
import downloads from '@/services/downloads'
import { cardTemplates } from '@/utils/constants'
import { downloadJpegPdf } from '@/utils/pdf'
import { cn } from '@/utils/helpers'
import { useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'

const ICONS_LIB = {
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  award: 'M9 12l2 2 4-4m-3 8v3-3m-8 4h16a2 2 0 0 0 0-4H4a2 2 0 0 0 0 4zm1-8l2 2 6-8',
  thumbs: 'M14 9V4a2 2 0 0 0-2-2l-4 9v11h9l4.5-7a4 4 0 0 0 .5-2V9h-8zm-9 11H3V11h2v9z',
  grad: 'M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.66 3.58 3 6 3s6-1.34 6-3v-5',
  brief: 'M20 7h-3V4H7v3H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zM9 6h6v2H9V6zm3 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  rocket: 'M4.5 16.5c-1.5 1.5-2 4-2 4s2.5-.5 4-2c1-1 1-2.5 0-3.5s-2.5-1-2 1.5zm3 3c-1 1-2.5 1.5-2.5 1.5s.5-1.5 1.5-2.5m2.5-3.5a6 6 0 0 1 7-7c1-1.5 1.5-3 1.5-3s-1.5.5-3 1.5a6 6 0 0 1-7 7l-1 3.5a1 1 0 0 0 1 1l3.5-1zM21 3l-1 2.5M17 3l-1.5 2',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10zM2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
}

const FONTS = [
  'Inter, sans-serif',
  'Georgia, serif',
  'Courier New, monospace',
  'Arial Black, sans-serif',
  'Trebuchet MS, sans-serif',
  'Times New Roman, serif',
]

const BACKGROUNDS = [
  { id: 'void', label: 'Void', from: '#0f0f23', to: '#05050c' },
  { id: 'sunset', label: 'Sunset', from: '#2d1b69', to: '#7c2d12' },
  { id: 'ocean', label: 'Ocean', from: '#0c1445', to: '#0e4d64' },
  { id: 'forest', label: 'Forest', from: '#052e16', to: '#14532d' },
  { id: 'rose', label: 'Rose', from: '#4a044e', to: '#831843' },
  { id: 'gold', label: 'Gold', from: '#451a03', to: '#92400e' },
  { id: 'graphite', label: 'Graphite', from: '#1f2937', to: '#030712' },
  { id: 'midnight', label: 'Midnight', from: '#172554', to: '#0f172a' },
]

const TEMPLATE_META = {
  Motivation: { accent: '#8b5cf6', icon: 'star' },
  Birthday: { accent: '#f59e0b', icon: 'award' },
  Love: { accent: '#ec4899', icon: 'heart' },
  Friendship: { accent: '#10b981', icon: 'thumbs' },
  Study: { accent: '#0ea5e9', icon: 'grad' },
  Career: { accent: '#14b8a6', icon: 'brief' },
  Startup: { accent: '#a3e635', icon: 'rocket' },
  Productivity: { accent: '#facc15', icon: 'star' },
  'Instagram Post': { accent: '#f472b6', icon: 'heart' },
  Pinterest: { accent: '#ef4444', icon: 'leaf' },
  'Quote Card': { accent: '#a78bfa', icon: 'star' },
  Certificate: { accent: '#d4af37', icon: 'award' },
  'Thank You': { accent: '#64748b', icon: 'thumbs' },
}

const THEME_BANK = {
  consistency: { title: 'Keep Going', quote: 'Small steps every day build mountains over time.', author: 'CREOVA Studio' },
  success: { title: 'Success', quote: 'Success is the sum of small efforts repeated daily.', author: 'Robert Collier' },
  love: { title: 'Love', quote: 'Where there is love there is life.', author: 'Mahatma Gandhi' },
  birthday: { title: 'Happy Birthday', quote: 'Another year of being awesome. Keep glowing.', author: 'CREOVA Studio' },
  happiness: { title: 'Be Happy', quote: 'Happiness is not by chance, but by choice.', author: 'Jim Rohn' },
  courage: { title: 'Stay Brave', quote: 'Courage is resistance to fear, mastery of fear — not absence of fear.', author: 'Mark Twain' },
  focus: { title: 'Stay Focused', quote: 'Concentrate all your thoughts upon the work in hand.', author: 'Alexander Graham Bell' },
  dream: { title: 'Dream Big', quote: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  learn: { title: 'Keep Learning', quote: 'Live as if you were to die tomorrow. Learn as if you were to live forever.', author: 'Mahatma Gandhi' },
  gratitude: { title: 'Thank You', quote: 'Gratitude turns what we have into enough.', author: 'Anonymous' },
}

const DEFAULT_META = { title: 'Untitled Card', quote: 'Make something beautiful today.', author: 'CREOVA Studio' }

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export default function CardStudio() {
  const location = useLocation()
  const push = useAppStore((s) => s.pushNotification)
  const [prompt, setPrompt] = useState(location.state?.prompt || '')
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quote, setQuote] = useState('')
  const [author, setAuthor] = useState('')
  const [template, setTemplate] = useState('Motivation')

  const generateContent = async () => {
    setGenerating(true)
    await wait(300)
    const meta = deriveContent(prompt, template)
    setTitle(meta.title)
    setDescription(meta.desc)
    setQuote(meta.quote)
    setAuthor(meta.author)
    setGenerated(true)
    setGenerating(false)
    push({ type: 'success', title: 'Card content generated', message: 'Edit anything with the canvas editor.' })
  }

  // When template changes after generation, regenerate meta-lite
  const changeTemplate = (t) => {
    setTemplate(t)
    if (generated) {
      refreshContent(t)
    }
  }

  const refreshContent = (t) => {
    const meta = deriveContent(prompt, t)
    setTitle(meta.title)
    setDescription(meta.desc)
    setQuote(meta.quote)
    setAuthor(meta.author)
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">AI Card Creator</p>
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">Beautiful cards, generated & editable</h1>
      </div>

      {/* Prompt bar */}
      <div className="panel mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generateContent()}
          placeholder='Example: "Create a motivational card about consistency."'
          className="input flex-1"
        />
        <button onClick={generateContent} disabled={generating || !prompt.trim()} className="btn-primary shrink-0">
          {generating ? <><Sparkles size={16} className="animate-pulse" /> Creating…</> : <><Wand size={16} /> Generate card</>}
        </button>
      </div>

      {/* Templates */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {cardTemplates.map((t) => (
          <button
            key={t}
            onClick={() => changeTemplate(t)}
            className={cn('chip !px-3 !py-1 text-xs', template === t ? 'chip-active' : 'chip-inactive')}
          >
            {t}
          </button>
        ))}
      </div>

      {!generated ? (
        <div className="panel grid place-items-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
            <Sparkles size={28} className="text-purple-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">Your card appears here</h3>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            Type a card idea (or pick a template), then open the canvas editor to redesign everything.
          </p>
        </div>
      ) : (
        <CardEditor
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          quote={quote}
          setQuote={setQuote}
          author={author}
          setAuthor={setAuthor}
          template={template}
          icon={TEMPLATE_META[template]?.icon || 'star'}
          accent={TEMPLATE_META[template]?.accent || '#8b5cf6'}
          push={push}
        />
      )}
    </div>
  )
}

function deriveContent(p, t) {
  const lower = (p || '').toLowerCase()
  const words = lower.split(/\s+/)
  const themeWord = ['about', 'for', 'on', 'of', 'featuring'].reduce((found, kw) => {
    if (found) return found
    const idx = words.indexOf(kw)
    if (idx >= 0 && idx + 1 < words.length) return words[idx + 1]
    return ''
  }, '')
  const meta =
    (themeWord && THEME_BANK[themeWord]) ||
    THEME_BANK.consistency ||
    DEFAULT_META

  const perTemplate = {
    Birthdays: 'Celebrate another year of you.',
  }
  const tname = t.toLowerCase()
  let desc = perTemplate[tname] || ''
  const descBank = {
    motivation: 'Progress is quiet. Consistency is loud. Keep showing up.',
    birthday: "Celebrate another year of you. May it be filled with joy.",
    love: 'Because some feelings deserve more than words.',
    friendship: 'Some friends are family you get to choose.',
    study: 'Focus brings the results that discipline promises.',
    career: 'Every expert was once a beginner who never quit.',
    startup: 'Launch early. Learn fast. Build boldly.',
    productivity: 'Deep work done daily outperforms genius used rarely.',
    quote: 'Words that stay with you, long after you close the page.',
    certificate: 'Recognizing excellence, commitment and growth.',
    'thank you': 'A little note to say you make a difference.',
  }
  desc = descBank[tname] || descBank.motivation || 'Made with CREOVA AI.'

  const authorMap = {
    motivation: 'CREOVA Studio',
    love: 'CREOVA Studio',
    friendship: 'CREOVA Studio',
    quote: 'Anonymous',
    birthday: 'CREOVA Studio',
  }
  const realAuthors = ['Robert Frost', 'Maya Angelou', 'Jim Rohn', 'Eleanor Roosevelt', 'Confucius']
  return {
    title: t === 'Certificate' ? 'Certificate of Excellence' : t === 'Thank You' ? 'Thank You' : t === 'Quote Card' ? meta.quote.split(' ').slice(0, 4).join(' ') : meta.title || t,
    desc,
    quote: meta.quote,
    author: authorMap[tname] || meta.author || realAuthors[Math.floor(Math.random() * realAuthors.length)],
  }
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/* ------------------------ CANVAS EDITOR ------------------------ */

function CardEditor({ title, setTitle, description, setDescription, quote, setQuote, author, setAuthor, template, icon, accent, push }) {
  const [elements, setElements] = useState([])
  const [selected, setSelected] = useState(null)
  const [bgId, setBgId] = useState('void')
  const [label, setLabel] = useState(template)

  const [textColor, setTextColor] = useState('#ffffff')
  const [fontFamily, setFontFamily] = useState(FONTS[0])
  const [border, setBorder] = useState(false)
  const [shadow, setShadow] = useState(true)
  const [radius, setRadius] = useState(28)
  const [exporting, setExporting] = useState(null)

  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const fileRef = useRef(null)
  const [imageSrc, setImageSrc] = useState(null)

  const selectedEl = elements.find((e) => e.id === selected) || null

  const onDuplicateElem = () => {
    if (!selectedEl) return
    duplicateEl(selectedEl.id)
  }

  const addElement = (type) => {
    const w = type === 'shape' ? 90 : 160
    const el = {
      id: `el-${Date.now()}`,
      type,
      x: 40 + Math.random() * 60,
      y: 40 + Math.random() * 120,
      w: type === 'text' ? 260 : w,
      h: type === 'text' ? 60 : type === 'image' ? 140 : 90,
      color: accent,
      fontSize: type === 'text' ? 20 : 26,
      shape: 'circle',
      iconKey: 'spark',
      text: 'New text',
      image: null,
    }
    setElements((es) => [...es, el])
    setSelected(el.id)
  }

  const updateEl = (id, patch) => {
    setElements((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  const removeEl = (id) => {
    setElements((es) => es.filter((e) => e.id !== id))
    setSelected(null)
  }

  const duplicateEl = (id) => {
    setElements((es) => {
      const src = es.find((e) => e.id === id)
      if (!src) return es
      return [...es, { ...src, id: `el-${Date.now()}`, x: src.x + 16, y: src.y + 16 }]
    })
  }

  // Drag logic (pointer-based, applies to any element)
  const dragStart = useCallback((e, id) => {
    e.preventDefault()
    e.stopPropagation()
    setSelected(id)
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const el = elements.find((x) => x.id === id)
    if (!el) return
    const startClientX = e.clientX
    const startClientY = e.clientY
    const origX = el.x
    const origY = el.y

    const onMove = (ev) => {
      const dxPct = ((ev.clientX - startClientX) / rect.width) * 100
      const dyPct = ((ev.clientY - startClientY) / rect.height) * 100
      updateEl(id, {
        x: clamp(origX + dxPct, 0, 100),
        y: clamp(origY + dyPct, 0, 150),
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [elements])

  const serializeSvg = () => {
    const svg = svgRef.current
    if (!svg) return ''
    const clone = svg.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', '1080')
    clone.setAttribute('height', '1620')
    return new XMLSerializer().serializeToString(clone)
  }

  const svgToCanvas = (svgStr, w = 1080, h = 1620) =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr)
      img.onload = () => {
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(c)
      }
      img.onerror = reject
      img.src = url
    })

  const exportCard = async (format) => {
    setExporting(format)
    try {
      const svgStr = serializeSvg()
      if (format === 'svg') {
        await downloads.saveSvg(svgStr, `${title || 'card'}.svg`)
        push({ type: 'success', title: 'SVG exported', message: 'Card saved as SVG.' })
        return
      }
      const canvas = await svgToCanvas(svgStr, 1080, 1620)
      if (format === 'png') {
        await downloads.saveCanvas(canvas, `${title || 'card'}.png`, 'image/png')
      } else if (format === 'jpg') {
        const url = canvas.toDataURL('image/jpeg', 0.92)
        await downloads.saveDataUrl(url, `${title || 'card'}.jpg`)
      } else if (format === 'pdf') {
        const url = canvas.toDataURL('image/jpeg', 0.92)
        await downloadJpegPdf(url, `${title || 'card'}.jpg`)
      }
      push({ type: 'success', title: 'Export complete', message: `${format.toUpperCase()} downloaded.` })
    } catch (e) {
      toast.error('Export failed', e.message || 'Could not render the card.')
    } finally {
      setExporting(null)
    }
  }

  const handleImageUpload = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result)
      const el = {
        id: `el-${Date.now()}`,
        type: 'image',
        x: 30, y: 30, w: 220, h: 220,
        image: reader.result,
        color: accent,
        shape: 'rect',
      }
      setElements((es) => [...es, el])
      setSelected(el.id)
    }
    reader.readAsDataURL(f)
  }

  const Background = BACKGROUNDS.find((b) => b.id === bgId) || BACKGROUNDS[0]

  return (
    <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
      {/* Toolbar */}
      <div className="panel h-fit space-y-5 p-5 lg:sticky lg:top-0">
        <div>
          <label className="label mb-2">Card background</label>
          <div className="grid grid-cols-4 gap-2">
            {BACKGROUNDS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBgId(b.id)}
                title={b.label}
                className={cn('h-10 rounded-lg border-2 transition-all', bgId === b.id ? 'border-purple-400' : 'border-transparent hover:border-purple-500/40')}
                style={{ background: b.value }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="label mb-2">Add elements</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => addElement('text')} className="btn-outline !py-2 text-xs"><Type size={14} /> Text</button>
            <button onClick={() => addElement('shape')} className="btn-outline !py-2 text-xs"><Shapes size={14} /> Shape</button>
            <button onClick={() => addElement('icon')} className="btn-outline !py-2 text-xs"><Star size={14} /> Icon</button>
            <button onClick={() => fileRef.current?.click()} className="btn-outline !py-2 text-xs"><ImageIcon size={14} /> Image</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>

        <div>
          <label className="label mb-2">Content</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="input mb-2 !py-2 text-sm" />
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="input mb-2 resize-none !py-2 text-sm" />
          <textarea rows={2} value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Quote" className="input mb-2 resize-none !py-2 text-sm" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" className="input !py-2 text-sm" />
        </div>

        <div className="divider" />

        <div>
          <label className="label mb-2">Selected element</label>
          {selectedEl ? (
            <div className="space-y-2">
              <p className="text-xs font-medium capitalize text-purple-300">{selectedEl.type}</p>
              {selectedEl.type === 'text' && (
                <input
                  value={selectedEl.text}
                  onChange={(e) => updateEl(selectedEl.id, { text: e.target.value })}
                  placeholder="Element text"
                  className="input !py-2 text-sm"
                />
              )}
              {selectedEl.type === 'shape' && (
                <div className="flex gap-2">
                  <button onClick={() => updateEl(selectedEl.id, { shape: 'circle' })} className={cn('flex-1 rounded-lg border px-2 py-1.5 text-xs', selectedEl.shape === 'circle' ? 'border-purple-500/60 bg-purple-500/15 text-purple-200' : 'border-white/10 text-slate-400')}>
                    <CircleIcon size={13} className="mx-auto" /> Circle
                  </button>
                  <button onClick={() => updateEl(selectedEl.id, { shape: 'rect' })} className={cn('flex-1 rounded-lg border px-2 py-1.5 text-xs', selectedEl.shape === 'rect' ? 'border-purple-500/60 bg-purple-500/15 text-purple-200' : 'border-white/10 text-slate-400')}>
                    <SquareIcon size={13} className="mx-auto" /> Square
                  </button>
                </div>
              )}
              {selectedEl.type === 'icon' && (
                <div className="flex flex-wrap gap-1">
                  {Object.keys(ICONS_LIB).map((k) => (
                    <button key={k} onClick={() => updateEl(selectedEl.id, { iconKey: k })} className={cn('rounded-md border p-1.5', selectedEl.iconKey === k ? 'border-purple-500/60 bg-purple-500/20' : 'border-white/10 hover:border-purple-500/40')}>
                      <svg width="14" height="14" viewBox="0 0 24 24"><path d={ICONS_LIB[k]} fill="currentColor" /></svg>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Size</span>
                <input
                  type="range"
                  min="10"
                  max="70"
                  value={selectedEl.fontSize || 30}
                  onChange={(e) => updateEl(selectedEl.id, { fontSize: Number(e.target.value) })}
                  className="range-input"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedEl.color || textColor}
                  onChange={(e) => updateEl(selectedEl.id, { color: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                />
                <span className="text-xs text-slate-500">Element color</span>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => onDuplicateElem()} className="btn-outline flex-1 !py-1.5 text-xs"><Copy size={12} /> Duplicate</button>
                <button onClick={() => removeEl(selectedEl.id)} className="btn-outline flex-1 !border-rose-500/40 !py-1.5 text-xs !text-rose-300"><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs text-slate-500">
              Click an element on the canvas to edit it.
            </p>
          )}
        </div>

        <div className="divider" />

        <div>
          <label className="label mb-2">Text properties</label>
          <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="input mb-2 !py-2 text-sm">
            {FONTS.map((f) => <option key={f} value={f}>{f.split(',')[0]}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-9 w-10 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
            <span className="text-xs text-slate-500">Text color applies to selected element</span>
          </div>
        </div>

        <div>
          <label className="label mb-2">Card settings</label>
          <div className="flex flex-wrap gap-2">
            <Toggle label="Border" on={border} set={(v) => setBorder(v)} />
            <Toggle label="Shadow" on={shadow} set={(v) => setShadow(v)} />
          </div>
          <label className="label mb-1 mt-3">Corner radius · {radius}px</label>
          <input type="range" min="0" max="80" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="range-input" />
        </div>

        <div>
          <label className="label mb-2">Export</label>
          <div className="grid grid-cols-2 gap-2">
            {['png', 'jpg', 'svg', 'pdf'].map((f) => (
              <button key={f} onClick={() => exportCard(f)} disabled={exporting === f} className="btn-primary !py-2 text-xs uppercase">
                <Download size={13} /> {exporting === f ? '…' : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-white/5 px-2 py-1 text-[11px] font-medium capitalize text-purple-300">{template}</span>
            <span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
              <Move size={12} /> Drag elements · click to select
            </span>
          </div>
          <button onClick={() => setElements([])} className="btn-ghost !py-1.5 text-xs text-rose-300/80">
            Reset canvas
          </button>
        </div>

        <div className="flex justify-center">
          <div
            ref={containerRef}
            className="relative w-full max-w-[340px] overflow-hidden transition-all duration-300"
            style={{ borderRadius: radius, boxShadow: shadow ? '0 24px 60px rgba(139,92,246,0.35)' : undefined }}
          >
            {/* interactive elements on top of a light transparent svg that doubles as export source */}
            <svg
              ref={svgRef}
              viewBox="0 0 100 150"
              className="relative w-full select-none"
              style={{ minHeight: 480 }}
            >
              <defs>
                <linearGradient id="card-bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={Background.from} />
                  <stop offset="100%" stopColor={Background.to} />
                </linearGradient>
                <radialGradient id="card-glow" cx="0.5" cy="0.3" r="0.6">
                  <stop offset="0%" stopColor={accent} stopOpacity="0.45" />
                  <stop offset="100%" stopColor={accent} stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* base rect (used for exports) */}
              <rect width="100" height="150" fill="url(#card-bg)" />
              <rect width="100" height="150" fill="url(#card-glow)" />
              {border && (
                <rect x="1" y="1" width="98" height="148" fill="none" stroke="rgba(139,92,246,0.65)" strokeWidth="0.9" rx={radius / 10} />
              )}

              {/* standard text content */}
              <TextEl x={50} y={12} size={5.2} bold color={textColor} family={fontFamily} align="middle" w={80}>
                {(title || template).toUpperCase()}
              </TextEl>
              <TextEl x={50} y={20} size={2.2} color="rgba(230,230,255,0.85)" family={fontFamily} align="middle" w={86}>
                {description}
              </TextEl>

              <line x1="35" y1="26" x2="65" y2="26" stroke={accent} strokeWidth="0.6" />

              <TextEl x={50} y={40} size={4.6} italic color="#ffffff" family={fontFamily} align="middle" w={80}>
                {`"${quote}"`}
              </TextEl>
              <TextEl x={50} y={48} size={2} color={accent} family={fontFamily} align="middle">
                {author ? `— ${author}` : ''}
              </TextEl>

              {/* user-added elements */}
              {elements.map((el) => (
                <EditableEl
                  key={el.id}
                  el={el}
                  selected={selected === el.id}
                  onDragStart={(e) => dragStart(e, el.id)}
                  onRemove={() => removeEl(el.id)}
                  onDuplicate={() => duplicateEl(el.id)}
                  onChange={(p) => updateEl(el.id, p)}
                  textColor={textColor}
                  fontFamily={fontFamily}
                />
              ))}

              <TextEl x={74} y={145.5} size={1.4} color="rgba(200,200,230,0.5)" family="Inter, sans-serif" align="end">CREOVA AI</TextEl>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function TextEl({ x, y, size = 3, bold, italic, color, family, align, w, children, tspan }) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={bold ? 800 : 400}
      fontStyle={italic ? 'italic' : 'normal'}
      fill={color}
      fontFamily={family}
      textAnchor={align}
      style={{ userSelect: 'none' }}
    >{children}</text>
  )
}

function EditableEl({ el, selected, onDragStart, onRemove, onDuplicate, onChange, textColor, fontFamily }) {
  const IconPath = ICONS_LIB[el.iconKey]
  const common = {
    onPointerDown: (e) => { e.stopPropagation(); onDragStart(e, el.id) },
  }

  let node = null
  if (el.type === 'text') {
    node = (
      <text
        {...common}
        x={el.x + el.w / 2}
        y={el.y + el.h / 2}
        fontSize={el.fontSize / 6}
        fill={el.color || textColor}
        fontFamily={fontFamily}
        textAnchor="middle"
        style={{ userSelect: 'none' }}
      >{el.text}</text>
    )
  } else if (el.type === 'shape') {
    node = el.shape === 'circle' ? (
      <circle {...common} cx={el.x + el.w / 2} cy={el.y + el.h / 2} r={Math.min(el.w, el.h) / 2} fill={el.color} opacity="0.75" />
    ) : (
      <rect {...common} x={el.x} y={el.y} width={el.w} height={el.h} rx="3" fill={el.color} opacity="0.75" />
    )
  } else if (el.type === 'icon' && IconPath) {
    node = (
      <path
        {...common}
        d={IconPath}
        transform={`translate(${el.x}, ${el.y}) scale(${Math.min(el.w, el.h) / 24})`}
        fill={el.color}
      />
    )
  } else if (el.type === 'image' && el.image) {
    node = <image {...common} href={el.image} x={el.x} y={el.y} width={el.w} height={el.h} preserveAspectRatio="xMidYMid slice" />
  }

  return (
    <g pointerEvents="all">
      {node}
      {selected && (
        <g pointerEvents="none">
          <rect x={el.x - 1.2} y={el.y - 1.2} width={el.w + 2.4} height={el.h + 2.4} fill="none" stroke="#a78bfa" strokeWidth="0.4" strokeDasharray="1.5,1.5" rx="1" />
          <rect x={el.x + el.w - 1.5} y={el.y + el.h - 1.5} width="3" height="3" fill="#a78bfa" />
        </g>
      )}
    </g>
  )
}

function Toggle({ label, on, set }) {
  return (
    <button
      onClick={() => set(!on)}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
        on ? 'bg-purple-500/20 text-purple-200' : 'bg-white/5 text-slate-400',
      )}
    >
      <span className={cn('relative h-3.5 w-6 rounded-full transition-colors', on ? 'bg-purple-500' : 'bg-white/15')}>
        <span className={cn('absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all', on ? 'left-3' : 'left-0.5')} />
      </span>
      {label}
    </button>
  )
}