import en from '../locales/en/common.json'
import ar from '../locales/ar/common.json'

export type Lang = 'en' | 'ar'
export const dicts = { en, ar } as const
export type Dict = typeof en

export function getText(dict: Dict, key: string): string {
  const parts = key.split('.')
  let cur: unknown = dict
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      return key
    }
  }
  return typeof cur === 'string' ? cur : key
}

export function loadLang(storageKey: string): Lang {
  try {
    const v = localStorage.getItem(storageKey)
    return v === 'ar' ? 'ar' : 'en'
  } catch {
    return 'en'
  }
}

export function saveLang(storageKey: string, lang: Lang): void {
  try {
    localStorage.setItem(storageKey, lang)
  } catch {
    /* storage unavailable */
  }
}
