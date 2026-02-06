// app/orders/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react'

// Type Definition
interface Order {
  id: string
  created_at: string
  ref_number: string
  total_price: number
  status: string
  item_count: number // เราจะ count เอา
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    // ดึงข้อมูล Orders พร้อมนับจำนวนสินค้า (แบบบ้านๆ)
    // ของจริงอาจจะ join table แต่เพื่อความง่ายเราดึง orders มาก่อน
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    else setOrders(data || [])
    
    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="h-3 w-3"/> รอตรวจสอบ</span>
      case 'processing': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Package className="h-3 w-3"/> กำลังจัดของ</span>
      case 'delivered': return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="h-3 w-3"/> จัดส่งแล้ว</span>
      default: return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">Unknown</span>
    }
  }

  const formatTHB = (amount: number) => 
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount)

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-slate-900 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-slate-800 rounded-full transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">ประวัติการสั่งซื้อ (My Orders)</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        {loading ? (
           <div className="text-center py-10 text-slate-400">Loading orders...</div>
        ) : orders.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
              <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">ยังไม่มีรายการสั่งซื้อ</h3>
              <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">กลับไปเลือกสินค้า</Link>
           </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-lg font-bold text-slate-800">{order.ref_number}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-slate-500">
                      สั่งเมื่อ: {new Date(order.created_at).toLocaleDateString('th-TH', { 
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">ยอดสุทธิ</p>
                    <p className="text-xl font-bold text-blue-600">{formatTHB(order.total_price)}</p>
                  </div>
                </div>
                
                <div className="border-t border-slate-100 pt-4 flex justify-end gap-3">
                   <button className="text-sm text-slate-500 hover:text-slate-800 font-medium">ดูรายละเอียด</button>
                   <button className="bg-slate-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-800 transition">
                      สั่งซื้อซ้ำ (Re-order)
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}