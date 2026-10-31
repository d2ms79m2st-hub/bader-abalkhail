import { useLayoutEffect, useRef } from 'react'
import { gsap, reducedMotion } from '../lib/motion'
import { groups, scenes, money, fromPrice } from '../lib/catalog'
import { useReveal } from '../lib/useReveal'
import Words from './Words.jsx'

// انتقال على طريقة Apple: صورة تتوسع من بطاقة ذات زوايا ناعمة إلى ملء الشاشة، ثم شبكة المباخر
const items = groups.burners

export default function Burners({ onOpen }) {
  const root = useRef(null)
  useReveal(root)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.burn-pin', start: 'top top', end: 'bottom bottom', scrub: reducedMotion ? true : 0.8 },
      })
      tl.fromTo('.burn-media', { clipPath: 'inset(18% 22% 18% 22% round 36px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1, ease: 'power2.inOut' }, 0)
        .fromTo('.burn-media .bm-a', { scale: 1.35 }, { scale: 1, duration: 1.2 }, 0)
        .fromTo('.burn-title .word-in', { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.08, duration: 0.4, ease: 'power3.out' }, 0.55)
        .fromTo('.burn-media .bm-b', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power3.inOut' }, 1.2)
        .fromTo('.burn-media .bm-b img', { scale: 1.3 }, { scale: 1.05, duration: 0.9 }, 1.2)
        .to('.burn-title', { yPercent: -30, opacity: 0, duration: 0.3 }, 1.25)
        .fromTo('.burn-sub', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3 }, 1.5)
        .to({}, { duration: 0.3 })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="burners" className="burners" ref={root}>
      <div className="burn-pin">
        <div className="burn-sticky">
          <div className="burn-media">
            <img className="bm-a" src={scenes['416619431-04'].src} alt="مبخرة خشب الزان النجدية" loading="lazy" decoding="async" />
            <div className="bm-b"><img src={scenes['1117352417-02'].src} alt="مبخرة خشب الزان السليمانية" loading="lazy" decoding="async" /></div>
            <div className="burn-veil" />
          </div>
          <h2 className="display display-xl burn-title"><Words text="المباخر" /></h2>
          <div className="burn-sub">
            <p className="eyebrow">خشب الزان الطبيعي · نحاس صنع يدوي · كهربائية</p>
            <h3 className="display">7 تصاميم في المتجر</h3>
          </div>
        </div>
      </div>

      <div className="burn-grid">
        {items.map((p) => {
          const f = fromPrice(p)
          return (
            <button className="burn-card" key={p.id} onClick={() => onOpen(p)} data-reveal="up">
              {/* آخر صورة: لقطة المنتج المنفردة (أول صورة مشتركة بين مباخر الزان) */}
              <span className="burn-img"><img src={p.images[p.images.length - 1].src} alt={p.name} loading="lazy" decoding="async" /></span>
              <span className="burn-name">{p.name}</span>
              <span className="burn-price">
                {f.unit ? 'يبدأ من ' : ''}{money(f.price)}
                {f.regular && <s>{money(f.regular)}</s>}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
