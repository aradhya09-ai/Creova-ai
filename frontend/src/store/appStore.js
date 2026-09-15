import { create } from 'zustand'
import { api } from '@/services/api'

export const useAppStore = create((set, get) => ({
  entered: sessionStorage.getItem('creova-entered') === '1',
  theme: localStorage.getItem('creova-theme') || 'dark',
  systemStatus: { mode: 'checking', label: 'Checking system...' },
  models: null,
  notifications: [],

  enter: () => {
    sessionStorage.setItem('creova-entered', '1')
    set({ entered: true })
  },

  setTheme: (theme) => {
    const root = document.documentElement
    if (theme === 'system') {
      const sys = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
      root.classList.toggle('light', sys === 'light')
    } else {
      root.classList.toggle('light', theme === 'light')
    }
    localStorage.setItem('creova-theme', theme)
    set({ theme })
  },

  initTheme: () => {
    const theme = localStorage.getItem('creova-theme') || 'dark'
    get().setTheme(theme)
    return theme
  },

  checkSystem: async () => {
    try {
      const [models, health] = await Promise.all([
        api.get('/api/models'),
        api.get('/api/health'),
      ])
      const demo = models?.demo_mode
      set({ models })
      if (demo) {
        set({
          systemStatus: {
            mode: 'demo',
            label: 'Demo Mode — connect a local/open-source model to enable live generation.',
          },
        })
      } else {
        set({ systemStatus: { mode: 'live', label: 'Live models connected' } })
      }
    } catch (e) {
      set({
        systemStatus: { mode: 'offline', label: 'Backend offline — install & start backend for generation' },
      })
    }
  },

  pushNotification: (n) => {
    const id = Date.now()
    set((s) => ({ notifications: [...s.notifications, { id, ...n }] }))
    setTimeout(() => {
      get().dismissNotification(id)
    }, 5000)
  },

  dismissNotification: (id) => {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }))
  },
}))