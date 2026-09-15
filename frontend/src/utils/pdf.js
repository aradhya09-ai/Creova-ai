// Minimal single-image JPEG -> PDF encoder (no dependencies).

function makePdfFromJpeg(jpegBytes, widthPx, heightPx, dpi = 144) {
  const ptsW = Math.round((widthPx / dpi) * 72 * 100) / 100
  const ptsH = Math.round((heightPx / dpi) * 72 * 100) / 100

  const content = `q\n${ptsW} 0 0 ${ptsH} 0 0 cm\n/Im0 Do\nQ\n`

  const objects = {
    1: '<< /Type /Catalog /Pages 2 0 R >>',
    2: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    3:
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptsW} ${ptsH}] ` +
      `/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
    4:
      `<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>`,
    5: `<< /Length ${content.length} >>`,
  }

  const parts = []
  parts.push('%PDF-1.4\n')
  const offsets = []
  for (let i = 1; i <= 5; i++) {
    offsets[i] = byteLen(parts)
    parts.push(`${i} 0 obj\n${objects[i]}\n`)
    if (i === 4) {
      parts.push('stream\n')
      parts.push(jpegBytes)
      parts.push('\nendstream\n')
    } else if (i === 5) {
      parts.push('stream\n')
      parts.push(content)
      parts.push('endstream\n')
    }
    parts.push('\n')
  }

  const xrefOffset = byteLen(parts)
  parts.push('xref\n0 6\n')
  parts.push('0000000000 65535 f \n')
  for (let i = 1; i <= 5; i++) {
    parts.push(String(offsets[i]).padStart(10, '0') + ' 00000 n \n')
  }
  parts.push('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n')
  parts.push(String(xrefOffset))
  parts.push('\n%%EOF')

  return concatBytes(parts)
}

function byteLen(parts) {
  let n = 0
  for (const p of parts) n += typeof p === 'string' ? new TextEncoder().encode(p).length : p.length
  return n
}

function concatBytes(chunks) {
  const parts = chunks.map((c) =>
    typeof c === 'string' ? new TextEncoder().encode(c) : new Uint8Array(c),
  )
  const total = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}

export async function downloadJpegPdf(jpegDataUrl, name) {
  const res = await fetch(jpegDataUrl)
  const buf = new Uint8Array(await res.arrayBuffer())
  const img = new Image()
  await new Promise((r, j) => {
    img.onload = r
    img.onerror = j
    img.src = jpegDataUrl
  })
  const pdf = makePdfFromJpeg(buf, img.naturalWidth || img.width, img.naturalHeight || img.height)
  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name.replace(/\.(jpe?g|png)$/i, '.pdf')
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}