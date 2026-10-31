import { useLayoutEffect, useRef, useState } from 'react'
import { gsap, isTouch, reducedMotion } from '../lib/motion'
import { groups, scenes, money, fromPrice } from '../lib/catalog'
import { useReveal } from '../lib/useReveal'
import Words from './Words.jsx'

// طبقات صور بعمق مختلف (Parallax) + قائمة الدهون مع معاينة صورة تتبع المؤشر على الكمبيوتر
const items = groups.oils
const LAYERS = [
  { key: '838230676-01', cls: 'layer-a', speed: -18 },
  { key: '2038105664-01', cls: 'layer-b', speed: 14 },
  { key: '844513955-01', cls: 'layer-c', speed: -32 },
]

export default function Oils({ onOpen }) {
  const root = useRef(null)
  const preview = useRef(null)
  const [hover, setHover] = useState(null)
  useReveal(root)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      LAYERS.forEach((l) => {
        gsap.fromTo(`.${l.cls}`, { yPercent: -l.speed / 2 }, {
          yPercent: l.speed, ease: 'none',
          scrollTrigger: { trigger: '.oils-depth', start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
      gsap.fromTo('.oils-depth .layer img', { scale: 1.25 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.oils-depth', start: 'top bottom', end: 'center center', scrub: true },
      })
      if (!reducedMotion) {
        gsap.from('.oil-row', {
          y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.06,
          scrollTrigger: { trigger: '.oil-list', start: 'top 85%' },
        })
      }
    }, root)
    return () => ctx.revert()
  }, [])

  useLayoutEffect(() => {
    if (isTouch || !preview.current) return
    const xTo = gsap.quickTo(preview.current, 'x', { duration: 0.6, ease: 'power3' })
    const yTo = gsap.quickTo(preview.current, 'y', { duration: 0.6, ease: 'power3' })
    const move = (e) => { xTo(e.clientX); yTo(e.clientY) }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  return (
    <section id="oils" className="oils" ref={root}>
      <div className="oils-grid">
        <div className="oils-copy">
          <p className="eyebrow" data-reveal="up">9 أصناف</p>
          <h2 className="display" data-reveal="words"><Words text="دهن العود والمسك" /></h2>
          <p className="lede" data-reveal="up">دهون العود والمسك بأحجام ربع تولة ونصف تولة وتولة، كما هي في المتجر.</p>
        </div>
        <div className="oils-depth" aria-hidden="true">
          {LAYERS.map((l) => (
            <div className={`layer ${l.cls}`} key={l.key}>
              <img src={scenes[l.key].src} alt="" loading="lazy" decoding="async" />
            </div>
          ))}
        </div>
      </div>

      <ul className="oil-list" onPointerLeave={() => setHover(null)}>
        {items.map((p, i) => {
          const f = fromPrice(p)
          return (
            <li key={p.id}>
              <button className="oil-row" onClick={() => onOpen(p)} onPointerEnter={() => setHover(p)}>
                <span className="oil-idx">{String(i + 1).padStart(2, '0')}</span>
                <span className="oil-name">{p.name}</span>
                <span className="oil-unit">{f.unit}</span>
                <span className="oil-price">{money(f.price)}</span>
                {/* سهم SVG: رمز ← غير موجود في خط ثمانية فيظهر بخط بديل */}
                <svg className="oil-arrow" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </li>
          )
        })}
      </ul>

      {!isTouch && (
        <div className={`cursor-preview ${hover ? 'is-on' : ''}`} ref={preview} aria-hidden="true">
          {items.map((p) => (
            <img key={p.id} src={p.images[0].src} alt="" className={hover?.id === p.id ? 'is-on' : ''} loading="lazy" />
          ))}
        </div>
      )}
    </section>
  )
}
