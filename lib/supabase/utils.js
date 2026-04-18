export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export const GOAL_COLORS = [
  '#00C2FF', '#7C6FFF', '#FF6B9D', '#FFB347', '#4CAF50', '#FF6B6B',
  '#00D4B8', '#FF8C42', '#A855F7', '#F59E0B',
]

export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export function getDayIndex(date = new Date()) {
  const day = date.getDay()
  if (day === 0 || day === 6) return 4 // weekend → Friday
  return day - 1 // Mon=0, Tue=1, ..., Fri=4
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
