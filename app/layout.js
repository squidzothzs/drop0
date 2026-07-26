import './globals.css'

export const metadata = {
  title: 'MOGI — DROP 0',
  description: 'Limited drop. 20 pieces. No restock.',
  icons: { icon: '/pics/weblogo.png' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* the hand-drawn wobble on the rarity frames. Turbulence pushes the edge
            pixels around, which is what gives the ridged, marker-drawn outline. */}
        <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
          {/* sRGB interpolation, or the displaced edge samples premultiplied
              transparent-black and fringes grey */}
          <filter id="tier-ridge" color-interpolation-filters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="1" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        {children}
      </body>
    </html>
  )
}
