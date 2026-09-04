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
        {/* /drop0 is reached from the main site — leave a way back */}
        <a href="/" style={{position:'fixed',left:10,top:10,zIndex:9999,fontFamily:'monospace',fontSize:11,
             color:'#111',background:'#fff',border:'1px solid #e2e2e2',padding:'4px 8px',
             textDecoration:'none'}}>&larr; MOGI</a>
        {children}
      </body>
    </html>
  )
}
