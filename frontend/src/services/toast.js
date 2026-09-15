import { useAppStore } from '@/store/appStore'

export default function fireToast(type, title, message) {
  useAppStore.getState().pushNotification({ type, title, message })
}

export const toast = {
  success: (title, message) => fireToast('success', title, message),
  error: (title, message) => fireToast('error', title, message),
  info: (title, message) => fireToast('info', title, message),
  demo: (title, message) => fireToast('demo', title, message),
  generateError: (message) =>
    fireToast(
      'error',
      "Generation couldn't be completed.",
      message || 'Check your model configuration or try the fallback model.',
    ),
}