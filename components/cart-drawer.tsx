// components/cart-drawer.tsx
'use client'

import { useCart } from '@/lib/cart-context'
import { X, Trash2, FileText, ArrowRight } from 'lucide-react'
import { generateQuote } from '@/lib/generate-quote'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation' // ใช้สำหรับเปลี่ยนหน้า
import { CheckCircle } from 'lucide-react'

export default function CartDrawer() {
  const { isCartOpen, toggleCart, items, clearCart, totalPrice, removeFromCart } = useCart() // อย่าลืมเพิ่ม clearCart ใน useCart
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePlaceOrder = async () => {
    setIsSubmitting(true)

    // A. สร้างเลข PO จำลอง (ของจริงต้องรันเลขจาก DB)
    const poNumber = `PO-${Date.now().toString().slice(-6)}`

    // B. บันทึกหัวบิล (Orders)
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: 'ABC Construction Co., Ltd.', // Hardcode ไว้ก่อน
        total_price: totalPrice,
        status: 'pending',
        ref_number: poNumber
      })
      .select()
      .single()

    if (orderError) {
      alert('เกิดข้อผิดพลาดในการสั่งซื้อ: ' + orderError.message)
      setIsSubmitting(false)
      return
    }

    // C. บันทึกรายการสินค้า (Order Items)
    const orderItems = items.map(item => ({
      order_id: orderData.id,
      product_id: item.productId,
      product_name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      custom_length: item.customLength,
      price: item.price
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      alert('บันทึกรายการสินค้าไม่สำเร็จ')
    } else {
      // D. สำเร็จ! เคลียร์ตะกร้า -> ปิด Drawer -> ไปหน้าประวัติ
      alert(`สั่งซื้อสำเร็จ! เลขที่ใบสั่งซื้อ: ${poNumber}`)
      clearCart()
      toggleCart()
      router.push('/orders') // เด้งไปหน้าประวัติการสั่งซื้อ
    }

    setIsSubmitting(false)
  }

  const handleGenerateQuote = () => {
    generateQuote(items)
  }

  if (!isCartOpen) return null

  const formatTHB = (amount: number) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount)

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop (กดพื้นหลังเพื่อปิด) */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={toggleCart}
      />

      {/* Drawer Content */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
          <h2 className="font-bold text-lg flex items-center gap-2">
            ตะกร้าสินค้า ({items.length})
          </h2>
          <button onClick={toggleCart} className="p-2 hover:bg-slate-800 rounded-full transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
          {items.length === 0 ? (
            <div className="text-center text-slate-400 mt-20">
              <p>ยังไม่มีสินค้าในตะกร้า</p>
              <button onClick={toggleCart} className="text-blue-600 underline text-sm mt-2">กลับไปเลือกสินค้า</button>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-slate-500 font-mono">{item.sku} | {item.grade}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(index)}
                    className="text-slate-300 hover:text-red-500 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex justify-between items-end text-sm">
                  <div className="text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-xs border">
                        {item.customLength} mm
                      </span>
                      x {item.quantity} ท่อน
                    </div>
                    {item.isCustom && <span className="text-[10px] text-orange-500">*งานสั่งตัด</span>}
                  </div>
                  <div className="font-bold text-blue-600">
                    {formatTHB(item.price)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout */}
        <div className="p-5 border-t border-slate-100 bg-white space-y-4">
          <div className="flex justify-between items-center text-lg font-bold text-slate-800">
            <span>ยอดรวมสุทธิ</span>
            <span>{formatTHB(totalPrice)}</span>
          </div>

          {/* ปุ่ม Action ต่างๆ (วางซ้อนกันเพื่อให้กดง่ายบนมือถือ) */}
          <div className="flex flex-col gap-3">

            {/* 1. ปุ่มสร้างใบเสนอราคา (สีน้ำเงิน) */}
            <button
              onClick={handleGenerateQuote}
              disabled={items.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg shadow transition flex items-center justify-center gap-2"
            >
              <FileText className="h-5 w-5" />
              สร้างใบเสนอราคา (PDF)
            </button>

            {/* 2. ปุ่มเปิด PO (สีเขียว) */}
            <button
              onClick={handlePlaceOrder}
              disabled={items.length === 0 || isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg shadow transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="animate-pulse">กำลังบันทึก...</span>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  เปิด PO สั่งซื้อ
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}