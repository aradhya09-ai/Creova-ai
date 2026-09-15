const BASE = import.meta.env.VITE_API_URL || ''

/** Resolve a backend-relative media path (/generated/... or /uploads/...)
 *  against VITE_API_URL so it works from any host (Vercel -> Render).
 *  Locally BASE is '' and the Vite dev proxy resolves it. */
export const mediaUrl = (path) => `${BASE}${path || ''}`
export const downloadUrl = mediaUrl

async function request(path, options = {}) {
  const url = `${BASE}${path}`
  const opts = {
    method: options.method || 'GET',
    headers: { ...(options.headers || {}) },
    body: options.body,
  }
  if (options.json !== false && options.body && typeof options.body !== 'string') {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(options.body)
  }
  const res = await fetch(url, opts)
  if (!res.ok) {
    let detail = res.statusText
    try {
      const data = await res.json()
      detail = data.detail || detail
    } catch (e) {
      /* ignore */
    }
    throw new Error(detail)
  }
  if (res.status === 204) return null
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return res
}

export const api = {
  get: (p) => request(p),
  post: (p, body, opts) => request(p, { method: 'POST', body, ...opts }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  delete: (p) => request(p, { method: 'DELETE' }),
  upload: async (p, file, extra = {}) => {
    const fd = new FormData()
    fd.append('file', file)
    Object.entries(extra).forEach(([k, v]) => fd.append(k, v))
    return request(p, { method: 'POST', body: fd, json: false })
  },
  _request: request,
}