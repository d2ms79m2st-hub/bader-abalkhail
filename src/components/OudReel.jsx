import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger, reducedMotion } from '../lib/motion'
import { groups, money, fromPrice } from '../lib/catalog'
import { useReveal } from '../lib/useReveal'
import Words from './Words.jsx'

// شريط أفقي يتحرك بالتمرير العمودي، مع Parallax داخل كل بطاقة وميلان خفيف حسب سرعة التمرير
const items = groups.oud

export default function OudReel({ onOpen }) {
  const root = useRef(null)
  const track = useRef(null)
  useReveal(root)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const pin = root.current.querySelector('.reel-pin')
      const distance = () => Math.max(0, track.current.scrollWidth - window.innerWidth)
      const setHeight = () => { pin.style.height = `${distance() + window.innerHeight}px` }
      setHeight()
      ScrollTrigger.addEventListener('refreshInit', setHeight)

      const cards = gsap.utils.toArray('.oud-card')
      const imgs = cards.map((c) => gsap.quickSetter(c.querySelector('img'), 'xPercent'))
      // Parallax داخل البطاقة حسب موقعها الأفقي في الشاشة
      const parallax = () => {
        const vw = window.innerWidth
        cards.forEach((c, i) => {
          const r = c.getBoundingClientRect()
          if (r.right < -50 || r.left > vw + 50) return
          imgs[i](((r.left + r.width / 2) / vw - 0.5) * -18)
        })
      }
      gsap.to(track.current, {
        x: () => distance(), // RTL: الشريط يتحرك يمينًا
        ease: 'none',
        onUpdate: parallax,
        scrollTrigger: {
          trigger: pin, start: 'top top', end: 'bottom bottom', scrub: reducedMotion ? true : 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (reducedMotion) return
            const skew = gsap.utils.clamp(-5, 5, self.getVelocity() / 500)
            gsap.to(cards, { skewX: skew, duration: 0.6, overwrite: 'auto' })
          },
          onScrubComplete: () => gsap.to(cards, { skewX: 0, duration: 0.8, ease: 'power3.out', overwrite: 'auto' }),
        },
      })
      parallax()
      gsap.to('.oud-bigword', {
        xPercent: 30, ease: 'none',
        scrollTrigger: { trigger: pin, start: 'top bottom', end: 'bottom top', scrub: true },
      })
      return () => ScrollTrigger.removeEventListener('refreshInit', setHeight)
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="oud" className="oud" ref={root}>
      <div className="section-intro">
        <p className="eyebrow" data-reveal="up">34 صنفًا</p>
        <h2 className="display" data-reveal="words"><Words text="خشب العود" /></h2>
        <p className="lede" data-reveal="up">اختيارات من خشب العود الطبيعي والمحسّن كما تظهر في المتجر، بأوزان تبدأ من الأوقية حتى الكيلو.</p>
      </div>
      <div className="reel-pin">
        <div className="reel-sticky">
          <span className="oud-bigword" aria-hidden="true">العود</span>
          <div className="reel-track" ref={track}>
            {items.map((p, i) => {
              const f = fromPrice(p)
              return (
                <button className="oud-card" key={p.id} onClick={() => onOpen(p)}>
                  <span className="oud-img"><img src={p.images[0].src} alt={p.name} loading="lazy" decoding="async" /></span>
                  <span className="oud-info">
                    <span className="oud-idx">{String(i + 1).padStart(2, '0')}</span>
                    <span className="oud-name">{p.name}</span>
                    <span className="oud-price">
                      يبدأ من {money(f.price)}{f.unit && <em> / {f.unit}</em>}
                    </span>
                  </span>
                </button>
              )
            })}
            <div className="oud-end">
              <span>34</span>
              <p>صنفًا من خشب العود في المتجر</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
