import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { api } from '@/services/api'
import AppLayout from '@/layouts/AppLayout'
import ToastHost from '@/components/ToastHost'
import Landing from '@/pages/Landing'
import Home from '@/pages/Home'
import CreateHub from '@/pages/CreateHub'
import ImageGenerator from '@/pages/ImageGenerator'
import VideoStudio from '@/pages/VideoStudio'
import VoiceStudio from '@/pages/VoiceStudio'
import CardStudio from '@/pages/CardStudio'
import Projects from '@/pages/Projects'
import ProjectDetail from '@/pages/ProjectDetail'
import HistoryPage from '@/pages/HistoryPage'
import DownloadsPage from '@/pages/DownloadsPage'
import SettingsPage from '@/pages/SettingsPage'

export default function App() {
  const entered = useAppStore((s) => s.entered)
  const initTheme = useAppStore((s) => s.initTheme)
  const checkSystem = useAppStore((s) => s.checkSystem)

  useEffect(() => {
    initTheme()
    checkSystem()
  }, [initTheme, checkSystem])

  useEffect(() => {
    if (!entered) return
    const id = setInterval(async () => {
      try {
        await api.get('/api/health')
      } catch (e) {
        /* backend waking up */
      }
    }, 4 * 60 * 1000)
    return () => clearInterval(id)
  }, [entered])

  if (!entered) {
    return (
      <>
        <Landing />
        <ToastHost />
      </>
    )
  }

  return (
    <>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/create" element={<CreateHub />} />
          <Route path="/images" element={<ImageGenerator />} />
          <Route path="/videos" element={<VideoStudio />} />
          <Route path="/voice" element={<VoiceStudio />} />
          <Route path="/cards" element={<CardStudio />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/downloads" element={<DownloadsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AppLayout>
      <ToastHost />
    </>
  )
}