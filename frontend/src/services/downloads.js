import { api } from './api'

export const downloads = {
  url: (relPath) => `${import.meta.env.VITE_API_URL || ''}${relPath}`,

  async fetchBlob(url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Download failed')
    return res.blob()
  },

  async save(url, defaultName) {
    const blob = await this.fetchBlob(url)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = defaultName
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  },

  async saveDataUrl(dataUrl, name) {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
  },

  async saveCanvas(canvas, name, type = 'image/png') {
    const dataUrl = canvas.toDataURL(type)
    await this.saveDataUrl(dataUrl, name)
  },

  async saveSvg(svgString, name) {
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  },
}

export default downloads