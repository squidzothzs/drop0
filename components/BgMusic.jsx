'use client'
import { useEffect } from 'react'

// Loops the drop soundtrack. Autoplay with sound is blocked by browsers
// until the first user gesture, so we try immediately and retry on the
// first pointer/key interaction.
export default function BgMusic() {
  useEffect(() => {
    const audio = new Audio('/pics/music.mp3')
    audio.loop = true
    audio.volume = 0.35

    const tryPlay = () => audio.play().catch(() => {})
    tryPlay()

    const onFirst = () => { tryPlay(); remove() }
    const remove = () => {
      window.removeEventListener('pointerdown', onFirst)
      window.removeEventListener('keydown', onFirst)
    }
    window.addEventListener('pointerdown', onFirst)
    window.addEventListener('keydown', onFirst)

    return () => { remove(); audio.pause() }
  }, [])

  return null
}
