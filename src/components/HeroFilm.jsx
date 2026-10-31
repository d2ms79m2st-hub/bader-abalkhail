import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger, reducedMotion, isTouch } from '../lib/motion'
import { FrameSequence, drawCover } from '../lib/FrameSequence'
import Words from './Words.jsx'

// مشهد افتتاحي بفيديو يتقدم مع التمرير (تسلسل إطارات على Canvas)
// + نصوص تظهر بتوقيت متزامن مع اللقطات + طبقة جزيئات دخان للعمق.

const CAPTIONS = [
  // [بداية الظهور، نهاية الاختفاء]
  { at: [0, 0.12], cls: 'cap-intro' },
  { at: [0.25, 0.43], cls: 'cap-mid' },
  { at: [0.5, 0.69], cls: 'cap-side' },
  { at: [0.75, 0.92], cls: 'cap-side cap-end' },
]

export default function HeroFilm({ entered, onProgress, onReady }) {
  const section = useRef(null)
  const canvas = useRef(null)
  const dust = useRef(null)
  const seqRef = useRef(null)
  const state = useRef({ frame: 0, drawn: -1 })
  const cb = useRef({})
  cb.current = { onProgress, onReady }

  // ---------------------------------------------------- تحميل الإطارات ورسمها
  useEffect(() => {
    const onProgress = (p) => cb.current.onProgress(p)
    const onReady = () => cb.current.onReady()
    const portrait = window.innerWidth / window.innerHeight < 0.9
    const base = `./media/hero/${portrait ? 'mobile' : 'desktop'}`
    const cvs = canvas.current
    const ctx = cvs.getContext('2d', { alpha: false })
    let seq

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cvs.width = Math.round(cvs.clientWidth * dpr)
      cvs.height = Math.round(cvs.clientHeight * dpr)
      state.current.drawn = -1
      render()
    }
    const render = () => {
      if (!seq) return
      const img = seq.nearest(state.current.frame)
      if (!img || img === state.current.drawn) return
      state.current.drawn = img
      drawCover(ctx, img, cvs.width, cvs.height)
    }
    state.current.render = render

    fetch(`${base}/manifest.json`)
      .then((r) => r.json())
      .then((manifest) => {
        seq = new FrameSequence(base, manifest, {
          onProgress: (p) => { onProgress(p); render() },
          onFirstPass: () => { render(); onReady() },
        })
        seqRef.current = seq
        state.current.count = manifest.count
        seq.start()
        size()
        ScrollTrigger.refresh()
      })
      .catch(() => onReady())

    window.addEventListener('resize', size)
    return () => { window.removeEventListener('resize', size); seq?.destroy() }
  }, [])

  // ---------------------------------------------------- خط زمني مربوط بالتمرير
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: section.current, start: 'top top', end: 'bottom bottom', scrub: reducedMotion ? true : 0.7 },
      })
      tl.to(state.current, {
        frame: () => (state.current.count || 160) - 1,
        duration: 1,
        onUpdate: () => state.current.render?.(),
      }, 0)
      tl.to('.hero-progress span', { scaleX: 1, duration: 1 }, 0)
      tl.to('.hero-hint', { opacity: 0, duration: 0.03 }, 0.01)

      const caps = gsap.utils.toArray('.hero-cap')
      caps.forEach((cap, i) => {
        const [a, b] = CAPTIONS[i].at
        const words = cap.querySelectorAll('.word-in')
        if (i > 0) {
          tl.fromTo(words, { yPercent: 105, opacity: 0, filter: 'blur(10px)' },
            { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.06, stagger: 0.012, ease: 'power3.out' }, a)
          const fades = cap.querySelectorAll('.cap-fade')
          if (fades.length) tl.fromTo(fades, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.05 }, a + 0.04)
        }
        tl.fromTo(cap, { y: i ? 40 : 0 }, { y: -40, duration: b - a }, a)
        tl.to(cap, { opacity: 0, filter: 'blur(12px)', duration: 0.05, ease: 'power2.in' }, b - 0.05)
      })
      // تقريب بسيط للكانفس يمنح إحساس حركة كاميرا إضافية
      tl.fromTo(canvas.current, { scale: 1.02 }, { scale: 1.12, duration: 1 }, 0)
    }, section)
    return () => ctx.revert()
  }, [])

  // ---------------------------------------------------- دخول المشهد بعد الشاشة الافتتاحية
  useEffect(() => {
    if (!entered) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.cap-intro .word-in', { yPercent: 110, opacity: 0, filter: 'blur(10px)' },
        { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1.6, ease: 'expo.out', stagger: 0.1, delay: 0.25 })
      gsap.fromTo('.cap-intro .cap-fade, .hero-hint', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.4, delay: 0.9, stagger: 0.15 })
    }, section)
    return () => ctx.revert()
  }, [entered])

  // ---------------------------------------------------- جزيئات الدخان (عمق بصري)
  useEffect(() => {
    if (reducedMotion) return
    const cvs = dust.current
    const ctx = cvs.getContext('2d')
    const N = isTouch ? 26 : 54
    let w, h, parts
    const seed = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = cvs.width = cvs.clientWidth * dpr
      h = cvs.height = cvs.clientHeight * dpr
      parts = Array.from({ length: N }, () => ({
        x: Math.random() * w, y: Math.random() * h, z: 0.3 + Math.random() * 0.7,
        r: (1 + Math.random() * 2.6) * dpr, s: 0.15 + Math.random() * 0.4, ph: Math.random() * 6.28,
      }))
    }
    seed()
    let scrollY = 0
    const st = ScrollTrigger.create({
      trigger: section.current, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => { scrollY = self.progress },
      onToggle: (self) => (self.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
    })
    function tick(t) {
      ctx.clearRect(0, 0, w, h)
      for (const p of parts) {
        p.y -= p.s * p.z
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w }
        const x = p.x + Math.sin(t * 0.4 + p.ph) * 14 * p.z
        const y = (p.y - scrollY * h * 0.6 * p.z + h * 2) % (h + 20)
        ctx.globalAlpha = 0.12 + p.z * 0.3
        ctx.beginPath()
        ctx.arc(x, y, p.r * p.z, 0, 6.283)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()
      }
    }
    gsap.ticker.add(tick)
    window.addEventListener('resize', seed)
    return () => { gsap.ticker.remove(tick); st.kill(); window.removeEventListener('resize', seed) }
  }, [])

  return (
    <section className="hero" ref={section} aria-label="المشهد الافتتاحي">
      <div className="hero-stage">
        <canvas className="hero-canvas" ref={canvas} aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />
        <canvas className="hero-dust" ref={dust} aria-hidden="true" />

        <div className={`hero-cap ${CAPTIONS[0].cls}`}>
          <p className="eyebrow cap-fade">للعود والعطور</p>
          <h1 className="display"><Words text="بدر أبا الخيل" /></h1>
        </div>
        <div className={`hero-cap ${CAPTIONS[1].cls}`}>
          <h2 className="display display-xl"><Words text="عبق يفوح" /></h2>
        </div>
        <div className={`hero-cap ${CAPTIONS[2].cls}`}>
          <p className="eyebrow cap-fade">9 أصناف</p>
          <h2 className="display"><Words text="دهن العود والمسك" /></h2>
        </div>
        <div className={`hero-cap ${CAPTIONS[3].cls}`}>
          <p className="eyebrow cap-fade">34 صنفًا · طبيعي ومحسّن</p>
          <h2 className="display"><Words text="خشب العود" /></h2>
        </div>

        <div className="hero-hint" aria-hidden="true">
          <span className="hint-line" />
          مرّر للأسفل
        </div>
        <div className="hero-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  )
}
