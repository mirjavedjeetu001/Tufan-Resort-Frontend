import './globals.css'
import type { Metadata } from 'next'
import { Playfair_Display, Roboto } from 'next/font/google'

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const roboto = Roboto({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tufan Resort - Luxury & Tranquility',
  description: 'Discover luxury at Tufan Resort with premium rooms and convention hall facilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${roboto.variable}`}>
      <body>{children}</body>
    </html>
  )
}
