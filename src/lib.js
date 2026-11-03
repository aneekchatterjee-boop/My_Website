export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const finePointer =
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

let lenisInstance = null
export const setLenis = (l) => (lenisInstance = l)
export const getLenis = () => lenisInstance

export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenisInstance) lenisInstance.scrollTo(el, { offset: id === 'top' ? 0 : -10, duration: 1.4 })
  else el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
}
