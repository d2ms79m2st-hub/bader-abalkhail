import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, lockScroll, reducedMotion } from '../lib/motion'
import { money, splitDescription } from '../lib/catalog'

// نافذة المنتج: معرض صور + اختيار الحجم/الوزن يحدّث السعر (لا سلة ولا دفع — معاينة فقط)
export default function ProductSheet({ product, onClose }) {
  const root = useRef(null)
  const [shown, setShown] = useState(null)
  const [choice, setChoice] = useState(0)
  const [img, setImg] = useState(0)

  useEffect(() => {
    if (product) { setShown(product); setChoice(product.options[0]?.values.findIndex((v) => !v.out) ?? 0); setImg(0) }
  }, [product])

  useLayoutEffect(() => {
    if (!root.current || !shown) return
    const el = root.current
    if (product) {
      lockScroll(true)
      gsap.timeline()
        .fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: reducedMotion ? 0 : 0.35 })
        .fromTo(el.querySelector('.sheet'), { y: 60, scale: 0.97, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.8, ease: 'expo.out' }, 0)
        .fromTo(el.querySelectorAll('.sheet-info > *'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.05, ease: 'expo.out' }, 0.15)
    } else {
      gsap.to(el, {
        autoAlpha: 0, duration: 0.3,
        onComplete: () => { setShown(null); lockScroll(false) },
      })
    }
  }, [product, shown])

  useEffect(() => {
    const key = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onClose])

  if (!shown) return null
  const p = shown
  const opt = p.options[0]
  const v = opt?.values[choice]
  const price = v ? v.price : p.price
  const regular = v ? v.regular : p.regular
  const { lead, body } = splitDescription(p.description)
  const isBox = p.group === 'boxes'

  return (
    <div className="sheet-wrap" ref={root} role="dialog" aria-modal="true" aria-label={p.name} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" data-lenis-prevent>
        <button className="sheet-close" onClick={onClose} aria-label="إغلاق"><span /><span /></button>
        <div className="sheet-media">
          <div className="sheet-slides" onScroll={(e) => {
            const s = e.currentTarget
            setImg(Math.round(Math.abs(s.scrollLeft) / s.clientWidth))
          }}>
            {p.images.map((im, i) => (
              <img key={i} src={im.src} alt={`${p.name} — صورة ${i + 1}`} />
            ))}
          </div>
          {p.images.length > 1 && (
            <div className="sheet-dots">
              {p.images.map((_, i) => <span key={i} className={i === img ? 'is-on' : ''} />)}
            </div>
          )}
        </div>
        <div className="sheet-info">
          <p className="eyebrow">{p.label}</p>
          <h3 className="sheet-name">{p.name}</h3>
          {!isBox && lead && <p className="sheet-lead">{lead}</p>}
          {!isBox && body && <p className="sheet-body">{body}</p>}
          {isBox && <pre className="sheet-pre">{p.description.split('\n').filter((l) => !/السعر/.test(l)).join('\n')}</pre>}
          {opt && (
            <div className="sheet-opts" role="radiogroup" aria-label={opt.name}>
              <span className="opts-label">{opt.name}</span>
              <div className="opts">
                {opt.values.map((val, i) => (
                  <button key={i} role="radio" aria-checked={i === choice} disabled={val.out}
                    className={i === choice ? 'is-on' : ''} onClick={() => setChoice(i)}>
                    {val.name}{val.out && <small>نفد</small>}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="sheet-price">
            <span className="price" key={price}>{money(price)}</span>
            {regular && <s className="price-old">{money(regular)}</s>}
          </div>
          <p className={`stock ${p.available ? '' : 'is-out'}`}>{p.available ? 'متوفر وقت آخر تحديث' : 'نفد وقت آخر تحديث'}</p>
        </div>
      </div>
    </div>
  )
}
