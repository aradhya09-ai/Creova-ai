import { useAppStore } from '@/store/appStore'

export default function SystemStatusBadge() {
  const status = useAppStore((s) => s.systemStatus)

  const palette = {
    demo: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    live: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    offline: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    checking: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  }

  const dot = {
    demo: 'bg-amber-400',
    live: 'bg-emerald-400',
    offline: 'bg-rose-400',
    checking: 'animate-pulse bg-sky-400',
  }

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${palette[status.mode] || palette.checking}`}>
      <span className={`h-2 w-2 rounded-full ${dot[status.mode] || dot.checking}`} />
      <span className="hidden min-[480px]:inline">{status.label}</span>
      <span className="min-[480px]:hidden">{status.mode.toUpperCase()}</span>
    </div>
  )
}