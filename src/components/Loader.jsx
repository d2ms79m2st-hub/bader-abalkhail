import { useEffect, useRef, useState } from 'react'
import { gsap, reducedMotion } from '../lib/motion'

// شاشة افتتاحية: الشعار الرسمي + تقدم تحميل الطبقة الأولى من إطارات المشهد
export default function Loader({ progress, ready, onDone }) {
  const root = useRef(null)
  const [gone, setGone] = useState(false)
  const shown = Math.min(100, Math.round(progress * 100 * 5)) // الطبقة الأولى ≈ خُمس الإطارات

  useEffect(() => {
    if (!ready || !root.current) return
    const el = root.current
    const tl = gsap.timeline({ delay: reducedMotion ? 0 : 0.5, onComplete: () => setGone(true) })
    tl.to(el.querySelector('.loader-meter'), { opacity: 0, duration: 0.4 })
      .to(el.querySelector('.loader-logo'), { scale: 0.92, opacity: 0, filter: 'blur(10px)', duration: 0.9, ease: 'power3.in' }, '<')
      .add(onDone, '-=0.3')
      .to(el, { clipPath: 'inset(0 0 100% 0 round 0 0 40px 40px)', duration: 1.1, ease: 'expo.inOut' }, '-=0.35')
    return () => tl.kill()
  }, [ready, onDone])

  if (gone) return null
  return (
    <div className="loader" ref={root} aria-live="polite">
      <img className="loader-logo" src="./brand/logo-official.jpg" alt="شعار بدر أبا الخيل" />
      <div className="loader-meter">
        <span className="loader-bar" style={{ transform: `scaleX(${ready ? 1 : shown / 100})` }} />
        <span className="loader-num">{ready ? 100 : shown}</span>
      </div>
    </div>
  )
}
