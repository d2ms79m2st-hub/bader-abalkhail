import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, scrollToTarget } from '../lib/motion'

const LINKS = [
  ['perfumes', 'العطور'],
  ['oud', 'خشب العود'],
  ['oils', 'الدهن والمسك'],
  ['burners', 'المباخر'],
  ['boxes', 'البوكسات'],
]

export default function Header({ visible }) {
  const bar = useRef(null)
  const [menu, setMenu] = useState(false)
  const [active, setActive] = useState(null)
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`
        setSolid(self.scroll() > window.innerHeight * 0.5)
      },
    })
    const sections = LINKS.map(([id]) =>
      ScrollTrigger.create({
        trigger: `#${id}`, start: 'top 55%', end: 'bottom 55%',
        onToggle: (self) => self.isActive && setActive(id),
        onLeaveBack: () => id === 'perfumes' && setActive(null),
      })
    )
    return () => { st.kill(); sections.forEach((s) => s.kill()) }
  }, [])

  useEffect(() => {
    if (!visible) return
    gsap.fromTo('.site-header', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', delay: 0.4 })
  }, [visible])

  const go = (id) => {
    setMenu(false)
    scrollToTarget(document.getElementById(id))
  }

  return (
    <>
      <header className={`site-header ${solid ? 'is-solid' : ''} ${menu ? 'is-open' : ''}`} style={{ opacity: 0 }}>
        <button className="brand" onClick={() => scrollToTarget(0)} aria-label="العودة للبداية">
          <img src="./brand/logo-official.jpg" alt="بدر أبا الخيل" />
          <span className="brand-name">
            بدر أبا الخيل
            <small>للعود والعطور</small>
          </span>
        </button>
        <nav className="nav" aria-label="أقسام الموقع">
          {LINKS.map(([id, label]) => (
            <button key={id} className={active === id ? 'is-active' : ''} onClick={() => go(id)}>{label}</button>
          ))}
        </nav>
        <button className="menu-btn" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="القائمة">
          <span /><span />
        </button>
        <span className="header-progress"><span ref={bar} /></span>
      </header>
      <div className={`menu-sheet ${menu ? 'is-open' : ''}`} aria-hidden={!menu}>
        {LINKS.map(([id, label], i) => (
          <button key={id} onClick={() => go(id)} style={{ transitionDelay: menu ? `${0.08 + i * 0.05}s` : '0s' }}>
            <span className="menu-idx">{String(i + 1).padStart(2, '0')}</span>
            {label}
          </button>
        ))}
      </div>
    </>
  )
}
