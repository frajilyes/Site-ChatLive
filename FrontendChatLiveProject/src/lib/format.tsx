const FR = new Intl.NumberFormat('en-US')

export function formatCount(value: number): string {
  return FR.format(Math.round(value))
}

export function formatMetric(value: number, precision = 0): string {
  if (precision > 0) {
    return value.toFixed(precision)
  }
  return formatCount(value)
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 10_000) {
    return `${Math.round(value / 1000)}k`
  }
  return formatCount(value)
}

export function plural(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural
}
