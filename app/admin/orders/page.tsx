'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle, Search, Save } from 'lucide-react'

// Type Definition
interface OrderItem {
  product_name: string
  quantity: number
  custom_length: number
}

interface Order {
  id: string
  created_at: string
  ref_number: string
  customer_name: string
  total_price: number
  status: string
  order_items: OrderItem[]
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('All')

  // Stats
  const totalRevenue = orders.reduce((sum, order) => sum + (order.status !== 'cancelled' ? order.total_price : 0), 0)
  const pendingCount = orders.filter(o => o.status === 'pending').length

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    // ดึงข้อมูล Orders พร้อมรายการสินค้าข้างใน (Join Table)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          product_name,
          quantity,
          custom_length
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error:', error)
      alert('ดึงข้อมูลล้มเหลว')
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }

  // ฟังก์ชันเปลี่ยนสถานะออเดอร์
  async function updateStatus(orderId: string, newStatus: string) {
    const confirmUpdate = window.confirm(`ยืนยันการเปลี่ยนสถานะเป็น "${newStatus}"?`)
    if (!confirmUpdate) return

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (error) {
      alert('อัปเดตไม่สำเร็จ: ' + error.message)
    } else {
      // อัปเดตข้อมูลในหน้าจอโดยไม่ต้องโหลดใหม่ (Optimistic Update)
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      // alert('อัปเดตสถานะเรียบร้อย!')
    }
  }

  const formatTHB = (amount: number) => 
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount)

  const filteredOrders = filterStatus === 'All' ? orders : orders.filter(o => o.status === filterStatus)

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">
      {/* Admin Navbar */}
      <nav className="bg-slate-800 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-slate-700 rounded-full transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-xs text-slate-400">Order Management System</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-xs text-slate-400">Total Revenue</p>
             <p className="text-xl font-bold text-green-400">{formatTHB(totalRevenue)}</p>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
            {['All', 'pending', 'processing', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition whitespace-nowrap ${
                  filterStatus === status 
                    ? 'bg-slate-800 text-white shadow-lg' 
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="text-slate-500 text-sm font-medium">
             Wait Action: <span className="text-red-500 font-bold">{pendingCount}</span> Orders
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
           <div className="text-center py-20 text-slate-400">Loading Admin Data...</div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header ของแต่ละการ์ด */}
                <div className="bg-slate-50 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100">
                   <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-lg text-slate-700">{order.ref_number}</span>
                        <span className="text-sm text-slate-500">| {order.customer_name}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(order.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                      </p>
                   </div>

                   {/* Status Changer (Dropdown) */}
                   <div className="flex items-center gap-3">
                      <select 
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`p-2 rounded-lg text-sm font-bold border-2 cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 transition ${
                            order.status === 'pending' ? 'border-yellow-200 bg-yellow-50 text-yellow-700 focus:ring-yellow-400' :
                            order.status === 'processing' ? 'border-blue-200 bg-blue-50 text-blue-700 focus:ring-blue-400' :
                            order.status === 'delivered' ? 'border-green-200 bg-green-50 text-green-700 focus:ring-green-400' :
                            'border-slate-200 bg-slate-50 text-slate-500'
                        }`}
                      >
                        <option value="pending">⏳ รอตรวจสอบ</option>
                        <option value="processing">📦 กำลังจัดของ</option>
                        <option value="delivered">✅ จัดส่งแล้ว</option>
                        <option value="cancelled">❌ ยกเลิก</option>
                      </select>
                      <div className="text-xl font-bold text-slate-800 min-w-[120px] text-right">
                        {formatTHB(order.total_price)}
                      </div>
                   </div>
                </div>

                {/* Body รายการสินค้า */}
                <div className="p-4 bg-white">
                  <div className="space-y-2">
                    {order.order_items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-slate-600 border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                         <div>
                            <span className="font-medium text-slate-800">{item.product_name}</span>
                            {item.custom_length !== 6000 && (
                                <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                                  ตัด {item.custom_length}mm
                                </span>
                            )}
                         </div>
                         <div className="font-mono">x {item.quantity}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}

            {filteredOrders.length === 0 && (
               <div className="text-center py-20 text-slate-400">ไม่พบออเดอร์ในสถานะนี้</div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}