// محرك تسلسل الإطارات (تقنية صفحات Apple): الفيديو مُحوّل إلى إطارات WebP تُرسم على Canvas
// حسب تقدم التمرير. أدق وأنعم من تحريك currentTime لعنصر <video> خصوصًا على iPhone.
//
// التحميل الذكي: الإطارات تُحمّل بطبقات متتالية (كل 16 ثم 8 ثم 4 ثم 2 ثم 1)
// فيعمل التمرير فورًا بإطارات متباعدة ثم تمتلئ الفجوات في الخلفية.

const PASSES = [16, 8, 4, 2, 1]
const CONCURRENCY = 6

export class FrameSequence {
  constructor(base, manifest, { onProgress, onFirstPass } = {}) {
    this.base = base
    this.count = manifest.count
    this.ext = manifest.ext
    this.frames = new Array(this.count).fill(null)
    this.loaded = 0
    this.onProgress = onProgress
    this.onFirstPass = onFirstPass
    this.destroyed = false
    this.queue = []
    const seen = new Set()
    PASSES.forEach((step, pass) => {
      for (let i = 0; i < this.count; i += step) {
        if (!seen.has(i)) { seen.add(i); this.queue.push({ i, pass }) }
      }
      if (!seen.has(this.count - 1)) { seen.add(this.count - 1); this.queue.push({ i: this.count - 1, pass }) }
    })
    this.firstPassSize = this.queue.filter((q) => q.pass === 0).length
    this.firstPassDone = 0
    this.active = 0
  }

  start() {
    for (let k = 0; k < CONCURRENCY; k++) this.next()
  }

  next() {
    if (this.destroyed || !this.queue.length) return
    const { i, pass } = this.queue.shift()
    this.active++
    const img = new Image()
    img.decoding = 'async'
    img.src = `${this.base}/${String(i).padStart(3, '0')}.${this.ext}`
    const done = (ok) => {
      this.active--
      if (ok && !this.destroyed) this.frames[i] = img
      this.loaded++
      this.onProgress?.(this.loaded / this.count)
      if (pass === 0 && ++this.firstPassDone === this.firstPassSize) this.onFirstPass?.()
      this.next()
    }
    img.decode ? img.decode().then(() => done(true), () => done(img.complete)) : (img.onload = () => done(true))
  }

  // أقرب إطار محمّل للمؤشر المطلوب
  nearest(index) {
    const i = Math.round(index)
    if (this.frames[i]) return this.frames[i]
    for (let d = 1; d < this.count; d++) {
      if (this.frames[i - d]) return this.frames[i - d]
      if (this.frames[i + d]) return this.frames[i + d]
    }
    return null
  }

  destroy() {
    this.destroyed = true
    this.queue = []
    this.frames = []
  }
}

export function drawCover(ctx, img, w, h) {
  const r = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const dw = img.naturalWidth * r
  const dh = img.naturalHeight * r
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
}
