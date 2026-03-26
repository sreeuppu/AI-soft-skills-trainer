// app/layout.js
export const metadata = {
  title: 'Prioritization Lab',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
