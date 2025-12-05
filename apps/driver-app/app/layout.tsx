import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { RootProvider } from 'fumadocs-ui/provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Volteryde Driver App',
  description: 'Real-time driver map with routing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} flex flex-col min-h-screen font-sans`}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
