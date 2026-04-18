export const metadata = {
  title: 'Channel — Carve your channel.',
  description: 'The weekly operating system for ambitious people.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { height: 100%; background: #0A0E1A; color: #EDF0F7; }
          body { font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; -webkit-font-smoothing: antialiased; }
          button { font-family: inherit; cursor: pointer; }
          input, textarea { font-family: inherit; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-thumb { background: #1E2840; border-radius: 2px; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
