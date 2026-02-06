// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/lib/cart-context' // Import Context
import CartDrawer from '@/components/cart-drawer' // Import Drawer

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ALU-TECH B2B Portal',
  description: 'Smart Aluminum Distribution System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        {/* Wrap ทั้งแอปด้วย CartProvider */}
        <CartProvider>
          {children}
          <CartDrawer /> {/* ใส่ Drawer ไว้ตรงนี้ */}
        </CartProvider>
      </body>
    </html>
  )
}