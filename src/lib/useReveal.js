import { useLayoutEffect } from 'react'
import { gsap, ScrollTrigger, reducedMotion } from './motion'

// يُظهر الكلمات والعناصر المعلّمة بـ data-reveal عند دخولها الشاشة
export function useReveal(ref) {
  useLayoutEffect(() => {
    if (reducedMotion || !ref.current) return
    const ctx = gsap.context(() => {
      ref.current.querySelectorAll('[data-reveal="words"]').forEach((el) => {
        gsap.from(el.querySelectorAll('.word-in'), {
          yPercent: 110, opacity: 0, filter: 'blur(8px)', duration: 1.2, ease: 'expo.out', stagger: 0.07,
          scrollTrigger: { trigger: el, start: 'top 88%' },
        })
      })
      ref.current.querySelectorAll('[data-reveal="up"]').forEach((el) => {
        gsap.from(el, {
          y: 40, opacity: 0, duration: 1.2, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 92%' },
        })
      })
    }, ref)
    return () => ctx.revert()
  }, [ref])
}

export { ScrollTrigger }
