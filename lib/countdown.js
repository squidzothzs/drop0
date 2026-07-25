// Seconds until a reservation lapses. null = nothing to count down (available or
// paid), which is what tells a card to render no timer at all.
// Clamped at 0: the cron only sweeps once a minute, so a card can sit past its
// deadline for a moment and must not show negative time.
export function secsLeft(expiresAt, now = Date.now()) {
  if (!expiresAt) return null
  const s = Math.floor((Date.parse(expiresAt) - now) / 1000)
  return s > 0 ? s : 0
}

export function fmt(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
