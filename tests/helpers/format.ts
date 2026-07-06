/**
 * currency.store.ts의 formatNumber()가 1,000 이상은 "1.2K"/"1.5M"로 축약하므로,
 * 화면 텍스트만으로 골드 증감을 비교하려면 역파싱이 필요하다.
 */
export function parseFormattedNumber(text: string): number {
  const trimmed = text.trim()
  const match = /^([\d.,]+)([KM]?)$/.exec(trimmed)
  if (!match) return Number(trimmed.replace(/,/g, '')) || 0

  const [, numPart, suffix] = match
  const value = Number(numPart.replace(/,/g, ''))

  if (suffix === 'K') return value * 1_000
  if (suffix === 'M') return value * 1_000_000
  return value
}
