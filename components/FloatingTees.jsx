'use client'

// fewer, depth-varied shirts = refined, not cluttered. size doubles as depth cue.
const TEES = [
  { top: '4%',  left: '2%',  size: 200, spin: '7s',  dur: '18s', delay: '0s'   },
  { top: '9%',  left: '38%', size: 140, spin: '9s',  dur: '22s', delay: '-4s'  },
  { top: '3%',  left: '70%', size: 230, spin: '6s',  dur: '17s', delay: '-2s'  },
  { top: '30%', left: '14%', size: 160, spin: '8s',  dur: '24s', delay: '-9s'  },
  { top: '34%', left: '56%', size: 190, spin: '7.5s',dur: '20s', delay: '-3s'  },
  { top: '26%', left: '84%', size: 130, spin: '10s', dur: '26s', delay: '-6s'  },
  { top: '56%', left: '4%',  size: 175, spin: '8.5s',dur: '21s', delay: '-5s'  },
  { top: '60%', left: '42%', size: 220, spin: '6.5s',dur: '19s', delay: '-8s'  },
  { top: '54%', left: '76%', size: 150, spin: '9.5s',dur: '23s', delay: '-1s'  },
  { top: '80%', left: '20%', size: 165, spin: '8s',  dur: '20s', delay: '-7s'  },
  { top: '83%', left: '58%', size: 200, spin: '7s',  dur: '18s', delay: '-3s'  },
  { top: '78%', left: '88%', size: 120, spin: '11s', dur: '25s', delay: '-5s'  },
]

export default function FloatingTees() {
  return (
    <div className="tee-bg" aria-hidden="true">
      {TEES.map((t, i) => (
        <div
          key={i}
          className="tee-float"
          style={{
            top: t.top,
            left: t.left,
            width: t.size,
            height: t.size,
            '--dur': t.dur,
            '--delay': t.delay,
          }}
        >
          <div className="tee-float-3d" style={{ '--spin': t.spin }}>
            <div className="tee-float-face">
              <img src="/pics/shirtfront-Photoroom.png" alt="" draggable="false" />
            </div>
            <div className="tee-float-face tee-float-back">
              <img src="/pics/shirtback-Photoroom2.png" alt="" draggable="false" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
