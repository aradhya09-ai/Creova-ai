import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  House, Sparkles, Image as ImageIcon, Video, Mic, LayoutPanelTop, Folder,
  Clock, Download, Settings, Search, Bell, Plus, Sun, Moon,
  Sparkle, Cpu, Tag,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { systemRoutes } from '@/utils/constants'
import Spotlight from '@/components/Spotlight'
import SystemStatusBadge from '@/components/SystemStatusBadge'

const ICONS = {
  House, Sparkles, Image: ImageIcon, Video, Mic, LayoutPanelTop, Folder,
  Clock, Download, Settings,
}

export default function AppLayout({ children }) {
  const navigate = useNavigate()
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const notifications = useAppStore((s) => s.notifications)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [spotlightOpen, setSpotlightOpen] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSpotlightOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const navItems = systemRoutes

  return (
    <div className="flex h-screen overflow-hidden bg-void">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-purple-500/10 bg-panel/95 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2.5 px-5 py-5 text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-glow-sm">
            <Sparkle size={18} className="text-white" />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-white">
              CREOVA<span className="text-purple-400"> AI</span>
            </p>
            <p className="text-[10px] font-medium text-slate-500">Free AI Workspace</p>
          </div>
        </button>

        <div className="divider mx-5" />

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = ICONS[item.icon] || Sparkles
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/10 text-white shadow-glow-sm'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon size={18} className="transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-purple-500/10 px-4 py-4">
          <div className="mb-3 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-600/10 to-transparent p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
              <Cpu size={13} /> Open AI Workspace
            </p>
            <p className="mt-1 text-[11px] leading-snug text-slate-400">
              No credits. No limits. Free for creators.
            </p>
          </div>

          <div className="mb-3">
            <SystemStatusBadge />
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-xs font-bold text-white">
              C
            </div>
            <span>Creator</span>
          </button>
        </div>
      </aside>

      {/* Main col */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center gap-3 border-b border-purple-500/10 bg-panel/70 px-4 py-3 backdrop-blur-xl lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-purple-500/20 p-2 text-slate-300 lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>

          <button
            onClick={() => setSpotlightOpen(true)}
            className="hidden flex-1 items-center gap-2 rounded-xl border border-purple-500/15 bg-surface px-4 py-2 text-sm text-slate-500 transition-colors hover:border-purple-500/40 hover:text-slate-400 min-[520px]:flex lg:max-w-md"
          >
            <Search size={15} />
            <span className="flex-1 text-left">Search creations, prompts…</span>
            <kbd className="rounded-md border border-purple-500/20 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
              ⌘K
            </kbd>
          </button>

          <div className="flex-1 min-[520px]:hidden" />

          <button
            onClick={() => navigate('/create')}
            className="btn-primary !px-3 !py-2 text-xs sm:!px-4"
          >
            <Plus size={16} /> <span className="hidden sm:inline">New Creation</span>
          </button>

          <button
            onClick={() => navigate('/history')}
            className="relative rounded-xl border border-purple-500/20 p-2 text-slate-300 transition-colors hover:border-purple-500/40 hover:text-white"
          >
            <Bell size={17} />
            {notifications.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-purple-500" />
              </span>
            )}
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-auto max-w-[1400px] p-4 lg:p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>

      <Spotlight open={spotlightOpen} onClose={() => setSpotlightOpen(false)} />

      {/* Corner branding */}
      <a
        href="https://github.com/aradhya09-ai"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-3 right-4 z-[60] rounded-full border border-purple-500/25 bg-panel/80 px-3 py-1.5 text-xs font-semibold text-slate-400 backdrop-blur-md transition-colors hover:text-purple-400 sm:text-[13px]"
      >
        @aradhya_codes
      </a>
    </div>
  )
}