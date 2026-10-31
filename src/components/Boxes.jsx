import { useLayoutEffect, useRef, useState } from 'react'
import { gsap, reducedMotion, isTouch } from '../lib/motion'
import { groups, money, boxContents } from '../lib/catalog'
import { useReveal } from '../lib/useReveal'
import Words from './Words.jsx'

// البوكسات: بطاقات بعمق ثلاثي الأبعاد تميل مع المؤشر، والضغط يكشف محتويات البوكس من وصفه الرسمي
const items = groups.boxes

function BoxCard({ p, i, onOpen }) {
  const card = useRef(null)
  const [open, setOpen] = useState(false)
  const contents = boxContents(p.description)

  const tilt = (e) => {
    if (isTouch || reducedMotion) return
    const r = card.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    gsap.to(card.current, { rotateY: x * 10, rotateX: -y * 10, duration: 0.6, ease: 'power3.out' })
    gsap.to(card.current.querySelector('.box-img img'), { x: x * -18, y: y * -18, duration: 0.6, ease: 'power3.out' })
  }
  const reset = () => {
    gsap.to(card.current, { rotateY: 0, rotateX: 0, duration: 0.9, ease: 'elastic.out(1, 0.6)' })
    gsap.to(card.current.querySelector('.box-img img'), { x: 0, y: 0, duration: 0.9 })
  }

  return (
    <article className={`box-card ${open ? 'is-open' : ''}`} ref={card} onPointerMove={tilt} onPointerLeave={reset} data-reveal="up">
      <button className="box-img" onClick={() => onOpen(p)} aria-label={`عرض ${p.name}`}>
        <img src={p.images[0].src} alt={p.name} loading="lazy" decoding="async" />
      </button>
      <div className="box-body">
        <span className="box-idx">{String(i + 1).padStart(2, '0')}</span>
        <h3 className="box-name">{p.name}</h3>
        <div className="box-price">
          <span className="price">{money(p.price)}</span>
          {p.regular && <s className="price-old">{money(p.regular)}</s>}
        </div>
        <button className="box-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? 'إخفاء المحتويات' : `المحتويات (${contents.length})`}
          <span className="plus" aria-hidden="true" />
        </button>
        <ol className="box-list">
          {contents.map((c, k) => <li key={k}>{c}</li>)}
        </ol>
      </div>
    </article>
  )
}

export default function Boxes({ onOpen }) {
  const root = useRef(null)
  useReveal(root)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.boxes-bg', { yPercent: -10 }, {
        yPercent: 10, ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="boxes" className="boxes" ref={root}>
      <span className="boxes-bg" aria-hidden="true">بوكسات</span>
      <div className="section-intro">
        <p className="eyebrow" data-reveal="up">4 بوكسات</p>
        <h2 className="display" data-reveal="words"><Words text="البوكسات" /></h2>
        <p className="lede" data-reveal="up">كل بوكس يجمع عودًا مع عطر أو فواحة أو مرش، والمحتويات كما وردت في وصف المتجر.</p>
      </div>
      <div className="box-grid">
        {items.map((p, i) => <BoxCard key={p.id} p={p} i={i} onOpen={onOpen} />)}
      </div>
    </section>
  )
}
