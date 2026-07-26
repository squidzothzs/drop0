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
        {/* ponytail: static markup in the layout, so it rides on every screen —
            closed, live gate, shop, terms — without a flag or a client component.
            z-index sits under the claim modal (100) so it can't cover the form. */}
        <div className="site-notice" role="status">
          <strong>Instagram issues?</strong> DM{' '}
          <a href="https://www.instagram.com/k4iyin/" target="_blank" rel="noopener noreferrer">@k4iyin</a>,{' '}
          <a href="https://www.instagram.com/mogi.exists/" target="_blank" rel="noopener noreferrer">@mogi.exists</a>{' '}
          or <a href="https://www.instagram.com/jyztang/" target="_blank" rel="noopener noreferrer">@jyztang</a>
        </div>
        {children}
      </body>
    </html>
  )
}
