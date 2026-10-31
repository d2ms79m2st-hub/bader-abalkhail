import { useCallback, useEffect, useState } from 'react'
import { startSmoothScroll, ScrollTrigger, lockScroll } from './lib/motion'
import Loader from './components/Loader.jsx'
import Header from './components/Header.jsx'
import HeroFilm from './components/HeroFilm.jsx'
import Perfumes from './components/Perfumes.jsx'
import OudReel from './components/OudReel.jsx'
import Oils from './components/Oils.jsx'
import Burners from './components/Burners.jsx'
import Boxes from './components/Boxes.jsx'
import Outro from './components/Outro.jsx'
import ProductSheet from './components/ProductSheet.jsx'

export default function App() {
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [entered, setEntered] = useState(false)
  const [product, setProduct] = useState(null)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    lockScroll(true)
    // شبكة بطيئة: لا ننتظر أكثر من ٩ ثوانٍ، والإطارات تكمل التحميل في الخلفية
    const t = setTimeout(() => setReady(true), 9000)
    return () => clearTimeout(t)
  }, [])

  // لا نرفع الستارة قبل اكتمال الخطوط حتى لا تظهر النصوص بخط بديل ثم تقفز
  const onReady = useCallback(() => {
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve()
    Promise.race([fonts, new Promise((r) => setTimeout(r, 2500))]).then(() => setReady(true))
  }, [])

  const onEnter = useCallback(() => {
    setEntered(true)
    startSmoothScroll()
    lockScroll(false)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }, [])

  const open = useCallback((p) => setProduct(p), [])

  return (
    <>
      <Loader progress={progress} ready={ready} onDone={onEnter} />
      <Header visible={entered} />
      <main>
        <HeroFilm entered={entered} onProgress={setProgress} onReady={onReady} />
        <Perfumes onOpen={open} />
        <OudReel onOpen={open} />
        <Oils onOpen={open} />
        <Burners onOpen={open} />
        <Boxes onOpen={open} />
        <Outro />
      </main>
      <ProductSheet product={product} onClose={() => setProduct(null)} />
    </>
  )
}
