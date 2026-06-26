import './globals.css'

export const metadata = {
  title: 'MOGI — DROP 0',
  description: 'Limited drop. 20 pieces. No restock.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
