import { useLayoutEffect, useRef } from 'react'
import { gsap, reducedMotion, scrollToTarget } from '../lib/motion'
import { groups, money, splitName, splitDescription } from '../lib/catalog'
import Words from './Words.jsx'

// مسرح العطور: قسم مثبّت، كل عطر يأخذ مقطعًا من التمرير مع انتقال قناع سينمائي بين الصور
const items = groups.perfumes

export default function Perfumes({ onOpen }) {
  const root = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const slides = gsap.utils.toArray('.pf-slide')
      const texts = gsap.utils.toArray('.pf-text')
      const ghosts = gsap.utils.toArray('.pf-ghost')
      const dots = gsap.utils.toArray('.pf-dot')
      gsap.set(slides.slice(1), { clipPath: 'inset(100% 0% 0% 0% round 28px)' })
      gsap.set(texts.slice(1), { autoAlpha: 0 })
      gsap.set(ghosts.slice(1), { autoAlpha: 0 })

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: reducedMotion ? true : 0.8,
          onUpdate: (self) => {
            const i = Math.min(items.length - 1, Math.floor(self.progress * items.length * 0.999))
            dots.forEach((d, k) => d.classList.toggle('is-active', k === i))
          },
        },
      })
      // دخول المسرح: الصورة الأولى تتكبر من بطاقة صغيرة
      tl.fromTo('.pf-frame', { scale: 0.86, borderRadius: 48 }, { scale: 1, borderRadius: 28, duration: 0.5, ease: 'power2.out' }, 0)
      tl.fromTo(slides[0].querySelector('img'), { scale: 1.3 }, { scale: 1.12, duration: 1 }, 0)

      items.forEach((_, i) => {
        const at = i + 0.5
        tl.to(ghosts[i], { xPercent: 12, duration: 1 }, i)
        if (i === 0) return
        tl.to(slides[i], { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 0.5, ease: 'power3.inOut' }, at)
        tl.fromTo(slides[i].querySelector('img'), { scale: 1.4, yPercent: 8 }, { scale: 1.12, yPercent: 0, duration: 0.9, ease: 'power2.out' }, at)
        tl.to(slides[i - 1].querySelector('img'), { yPercent: -8, opacity: 0.3, duration: 0.5, ease: 'power3.inOut' }, at)
        tl.to(texts[i - 1], { autoAlpha: 0, y: -50, filter: 'blur(8px)', duration: 0.25 }, at)
        tl.fromTo(texts[i], { autoAlpha: 0, y: 60, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.3 }, at + 0.2)
        tl.to(ghosts[i - 1], { autoAlpha: 0, duration: 0.3 }, at)
        tl.fromTo(ghosts[i], { autoAlpha: 0, xPercent: -10 }, { autoAlpha: 1, xPercent: 0, duration: 0.4 }, at)
      })
      tl.to({}, { duration: 0.3 })
    }, root)
    return () => ctx.revert()
  }, [])

  const jump = (i) => {
    const el = root.current
    const span = el.offsetHeight - window.innerHeight
    scrollToTarget(el.offsetTop + span * ((i + 0.7) / (items.length + 0.3)))
  }

  return (
    <section id="perfumes" className="perfumes" ref={root} style={{ '--n': items.length }}>
      <div className="pf-stage">
        <div className="pf-ghosts" aria-hidden="true">
          {items.map((p) => <span className="pf-ghost" key={p.id}>{splitName(p.name).title}</span>)}
        </div>

        <div className="pf-head">
          <p className="eyebrow">مجموعة العطور · 75 ملي</p>
        </div>

        <div className="pf-texts">
          {items.map((p, i) => {
            const { title, size } = splitName(p.name)
            const { lead, body } = splitDescription(p.description)
            return (
              <article className="pf-text" key={p.id}>
                <span className="pf-index" dir="ltr">{String(i + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
                <h3 className="pf-name">{title}</h3>
                {lead && <p className="pf-lead">{lead}</p>}
                {body && <p className="pf-body">{body}</p>}
                <div className="pf-meta">
                  <span className="price">{money(p.price)}</span>
                  {p.regular && <s className="price-old">{money(p.regular)}</s>}
                  {size && <span className="chip">{size}</span>}
                </div>
                <button className="btn" onClick={() => onOpen(p)}>تفاصيل العطر</button>
              </article>
            )
          })}
        </div>

        <div className="pf-frame">
          {items.map((p) => (
            <button className="pf-slide" key={p.id} onClick={() => onOpen(p)} aria-label={`عرض ${p.name}`}>
              <img src={p.images[0].src} alt={p.name} loading="lazy" decoding="async" />
            </button>
          ))}
        </div>

        <div className="pf-dots" role="tablist" aria-label="العطور">
          {items.map((p, i) => (
            <button key={p.id} className="pf-dot" onClick={() => jump(i)} aria-label={splitName(p.name).title}>
              <span>{splitName(p.name).title}</span>
            </button>
          ))}
        </div>
      </div>
      <h2 className="sr-only"><Words text="العطور" /></h2>
    </section>
  )
}
