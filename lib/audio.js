'use client'

function ctx() {
  if (typeof window === 'undefined') return null
  return new (window.AudioContext || window.webkitAudioContext)()
}

export function playDeny() {
  const ac = ctx(); if (!ac) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain); gain.connect(ac.destination)
  osc.type = 'square'
  osc.frequency.setValueAtTime(180, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.35)
  gain.gain.setValueAtTime(0.25, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35)
  osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.36)
}

export function playClick() {
  const ac = ctx(); if (!ac) return
  const buf = ac.createBuffer(1, ac.sampleRate * 0.05, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  const src = ac.createBufferSource()
  const gain = ac.createGain()
  src.buffer = buf; src.connect(gain); gain.connect(ac.destination)
  gain.gain.setValueAtTime(0.15, ac.currentTime)
  src.start(ac.currentTime)
}

export function playSuccess() {
  const ac = ctx(); if (!ac) return
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'triangle'
    const t = ac.currentTime + i * 0.12
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.18, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    osc.start(t); osc.stop(t + 0.36)
  })
}

export function playOpen() {
  const ac = ctx(); if (!ac) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain); gain.connect(ac.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(440, ac.currentTime)
  osc.frequency.linearRampToValueAtTime(880, ac.currentTime + 0.15)
  gain.gain.setValueAtTime(0.12, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25)
  osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.26)
}
