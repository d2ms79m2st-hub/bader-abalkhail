import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/motion'
import { capturedAt } from '../lib/catalog'
import Words from './Words.jsx'

export default function Outro() {
  const root = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top 75%', end: 'center center', scrub: 0.8 },
      })
      tl.fromTo('.outro-logo', { scale: 0.7, opacity: 0, filter: 'blur(14px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', ease: 'power2.out' })
        .fromTo('.outro-line .word-in', { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.1 }, '-=0.3')
        .fromTo('.outro-meta', { opacity: 0, y: 30 }, { opacity: 1, y: 0 }, '-=0.2')
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <footer className="outro" ref={root}>
      <img className="outro-logo" src="./brand/logo-official.jpg" alt="شعار بدر أبا الخيل" loading="lazy" />
      <p className="display display-xl outro-line"><Words text="عبق يفوح" /></p>
      <div className="outro-meta">
        <p>بدر أبا الخيل للعود والعطور</p>
        <p dir="ltr">baderabalkhail.com · +966 533 155 202</p>
        <p className="note">معاينة تفاعلية محلية · الأسعار والتوفر من لقطة المتجر بتاريخ {capturedAt} وقد تتغير</p>
      </div>
    </footer>
  )
}
