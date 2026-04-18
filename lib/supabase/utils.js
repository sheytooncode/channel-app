export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export const GOAL_COLORS = [
  '#00C2FF', '#7C6FFF', '#FF6B9D', '#FFB347', '#4CAF50', '#FF6B6B',
  '#00D4B8', '#FF8C42', '#A855F7', '#F59E0B',
]

export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  // Monday = 0, so shift: Sun(0)->-6, Mon(1)->0, Tue(2)->-1...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
