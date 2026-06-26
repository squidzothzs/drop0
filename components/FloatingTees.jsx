'use client'

const TEE_POSITIONS = [
  { top: '5%',  left: '3%',  dur: '16s', delay: '0s' },
  { top: '8%',  left: '22%', dur: '21s', delay: '-4s' },
  { top: '3%',  left: '45%', dur: '18s', delay: '-2s' },
  { top: '6%',  left: '65%', dur: '24s', delay: '-7s' },
  { top: '4%',  left: '82%', dur: '17s', delay: '-1s' },
  { top: '28%', left: '1%',  dur: '22s', delay: '-9s' },
  { top: '30%', left: '30%', dur: '19s', delay: '-3s' },
  { top: '25%', left: '55%', dur: '26s', delay: '-5s' },
  { top: '32%', left: '78%', dur: '20s', delay: '-8s' },
  { top: '52%', left: '8%',  dur: '23s', delay: '-6s' },
  { top: '55%', left: '28%', dur: '18s', delay: '-2s' },
  { top: '50%', left: '48%', dur: '25s', delay: '-10s' },
  { top: '58%', left: '70%', dur: '21s', delay: '-4s' },
  { top: '54%', left: '88%', dur: '16s', delay: '-1s' },
  { top: '75%', left: '5%',  dur: '20s', delay: '-7s' },
  { top: '78%', left: '25%', dur: '24s', delay: '-3s' },
  { top: '72%', left: '50%', dur: '19s', delay: '-9s' },
  { top: '80%', left: '72%', dur: '22s', delay: '-5s' },
  { top: '76%', left: '90%', dur: '17s', delay: '-2s' },
  { top: '90%', left: '40%', dur: '23s', delay: '-6s' },
]

export default function FloatingTees() {
  return (
    <div className="tee-bg" aria-hidden="true">
      {TEE_POSITIONS.map((pos, i) => (
        <div
          key={i}
          className="tee-float"
          data-num={String(i + 1).padStart(2, '0')}
          style={{
            top: pos.top,
            left: pos.left,
            '--dur': pos.dur,
            '--delay': pos.delay,
          }}
        />
      ))}
    </div>
  )
}
