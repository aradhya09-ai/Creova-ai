import { FlaskConical, X } from 'lucide-react'
import { useState } from 'react'

export default function DemoBanner({ text }) {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 backdrop-blur-sm">
      <FlaskConical size={18} className="mt-0.5 shrink-0 text-amber-300" />
      <p className="flex-1 text-sm text-amber-100/90">
        {text || 'Demo Mode — connect a local/open-source model to enable live generation.'}
      </p>
      <button onClick={() => setHidden(true)} className="text-amber-300/70 hover:text-amber-100">
        <X size={16} />
      </button>
    </div>
  )
}