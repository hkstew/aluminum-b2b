// lib/cart-context.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

// กำหนดหน้าตาของของในตะกร้า (รองรับการสั่งตัด)
export interface CartItem {
  productId: string
  sku: string
  name: string
  grade: string
  quantity: number
  customLength: number // ความยาวที่สั่งตัด (mm)
  price: number // ราคารวมของ item นี้
  isCustom: boolean // เป็นงานสั่งตัดหรือไม่
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (index: number) => void
  clearCart: () => void
  totalPrice: number
  itemCount: number
  isCartOpen: boolean
  toggleCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Load cart from localStorage (เพื่อให้ Refresh หน้าแล้วของไม่หาย)
  useEffect(() => {
    const savedCart = localStorage.getItem('alu-cart')
    if (savedCart) setItems(JSON.parse(savedCart))
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('alu-cart', JSON.stringify(items))
  }, [items])

  const addToCart = (newItem: CartItem) => {
    setItems(prev => [...prev, newItem])
    setIsCartOpen(true) // เปิดตะกร้าโชว์ทันทีที่กดเพิ่ม
  }

  const removeFromCart = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const clearCart = () => setItems([])
  const toggleCart = () => setIsCartOpen(!isCartOpen)

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, totalPrice, itemCount, isCartOpen, toggleCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}