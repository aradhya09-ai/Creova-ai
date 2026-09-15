import { useNavigate } from 'react-router-dom'
import { TriangleAlert, RefreshCw, FlaskConical, Settings } from 'lucide-react'
import fireToast from '@/services/toast'

export const GENERATION_ERROR = (message) => ({
  title: "Generation couldn't be completed.",
  message,
})

export function RetryOptions({ onRetry, onFallback, compact = false }) {
  const navigate = useNavigate()
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : 'mt-4'}`}>
      <button onClick={onRetry} className="btn-primary !py-2 text-xs">
        <RefreshCw size={14} /> Retry
      </button>
      {onFallback && (
        <button onClick={onFallback} className="btn-outline !py-2 text-xs">
          <FlaskConical size={14} /> Try fallback model
        </button>
      )}
      <button
        onClick={() => navigate('/settings')}
        className="btn-outline !py-2 text-xs"
      >
        <Settings size={14} /> Check model configuration
      </button>
    </div>
  )
}

export default function ErrorCard({ error, onRetry, onFallback }) {
  const navigate = useNavigate()
  if (!error) return null
  const message = typeof error === 'string' ? error : error?.message || 'Something went wrong.'
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20">
        <TriangleAlert size={22} className="text-rose-400" />
      </div>
      <h3 className="text-base font-semibold text-white">
        Generation couldn't be completed.
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{message}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button onClick={onRetry} className="btn-primary !py-2 text-xs">
          <RefreshCw size={14} /> Retry
        </button>
        {onFallback && (
          <button onClick={onFallback} className="btn-outline !py-2 text-xs">
            <FlaskConical size={14} /> Try fallback model
          </button>
        )}
        <button onClick={() => navigate('/settings')} className="btn-outline !py-2 text-xs">
          <Settings size={14} /> Check model configuration
        </button>
      </div>
    </div>
  )
}