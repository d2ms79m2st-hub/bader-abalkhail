import { Fragment } from 'react'

// تقسيم النص إلى كلمات (لا حروف) حتى يبقى اتصال الحروف العربية سليمًا أثناء الحركة
// المسافة خارج الكتلة المتحركة حتى لا تنطوي
export default function Words({ text, className = '' }) {
  const words = text.split(' ')
  return (
    <span className={`words ${className}`} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="word" aria-hidden="true"><span className="word-in">{w}</span></span>
          {i < words.length - 1 && ' '}
        </Fragment>
      ))}
    </span>
  )
}
