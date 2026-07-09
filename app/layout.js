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
      <body>{children}</body>
    </html>
  )
}
