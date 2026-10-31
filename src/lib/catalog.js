import catalog from '../data/catalog.json'

export const groups = catalog.groups

// اسم القسم الظاهر (تصنيف المتجر قد يكون تصنيف عروض مثل "عروض اليوم الوطني")
const LABELS = {
  perfumes: 'العطور', oud: 'خشب العود', oils: 'دهن العود والمسك',
  burners: 'المباخر', incense: 'البخور', boxes: 'بوكسات',
}
for (const [g, items] of Object.entries(groups)) items.forEach((p) => { p.group = g; p.label = LABELS[g] })
export const scenes = catalog.scenes
export const capturedAt = catalog.captured_at.slice(0, 10)

const nf = new Intl.NumberFormat('ar-SA-u-nu-latn', { maximumFractionDigits: 2 })
export const money = (n) => (n == null ? '' : `${nf.format(n)} ر.س`)

// أقل سعر متاح بين الخيارات (أو سعر المنتج إن لم توجد خيارات)
export function fromPrice(p) {
  const vals = p.options.flatMap((o) => o.values).filter((v) => !v.out && v.price != null)
  if (!vals.length) return { price: p.price, regular: p.regular, unit: null }
  const min = vals.reduce((a, b) => (b.price < a.price ? b : a))
  return { price: min.price, regular: min.regular, unit: min.name }
}

// "نجد 75 ملي" → { title: "نجد", size: "75 ملي" }
export function splitName(name) {
  const m = name.match(/^(.*?)\s*(\d+\s*ملي)$/)
  return m ? { title: m[1], size: m[2] } : { title: name, size: null }
}

// السطر الأول من وصف المتجر يمثل عائلة العطر، والباقي هو الوصف
export function splitDescription(text) {
  if (!text) return { lead: '', body: '' }
  const [lead, ...rest] = text.split('\n').map((s) => s.trim()).filter(Boolean)
  return { lead, body: rest.join(' ') }
}

// محتويات البوكس من الوصف الرسمي (الأسطر المرقمة فقط)
export function boxContents(text) {
  const lines = text.split('\n').map((s) => s.trim())
  const items = []
  for (const line of lines) {
    if (/^\d+\s*-/.test(line)) items.push(line.replace(/^\d+\s*-\s*/, ''))
    else if (items.length && line && !/السعر|:/.test(line)) items[items.length - 1] += ' ' + line
  }
  return items
}
