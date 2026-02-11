'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
    LayoutDashboard, Package, FileText, Settings, LogOut,
    Search, Filter, Printer, Truck, CheckCircle, AlertTriangle, X
} from 'lucide-react'
import { generateReceipt, generateDeliveryNote } from '@/lib/admin-generators'

// Type Definition (เหมือนเดิม)
interface OrderItem {
    product_name: string; sku: string; quantity: number; custom_length: number; price: number;
}
interface Order {
    id: string; created_at: string; ref_number: string; customer_name: string;
    total_price: number; status: string; order_items: OrderItem[];
}

export default function AdminDashboard() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')

    // Stats Counters
    const pendingCount = orders.filter(o => o.status === 'pending').length
    const revenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total_price, 0)

    useEffect(() => {
        fetchOrders()
    }, [])

    async function fetchOrders() {
        setLoading(true)
        const { data, error } = await supabase
            .from('orders')
            .select(`*, order_items (*)`)
            .order('created_at', { ascending: false })

        if (!error) setOrders(data || [])
        setLoading(false)
    }

    async function updateStatus(orderId: string, newStatus: string) {
        // Optimistic UI Update (เปลี่ยนหน้าจอก่อนยิง API เพื่อความลื่น)
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))

        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    }

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        const matchSearch = order.ref_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchStatus = statusFilter === 'All' || order.status === statusFilter
        return matchSearch && matchStatus
    })

    const formatTHB = (n: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n)

    return (
        <div className="min-h-screen bg-slate-100 font-sans flex">

            {/* 1. SIDEBAR (จำลองเมนู ERP) */}
            <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col h-screen sticky top-0">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-2xl font-bold text-white tracking-wider">ERP ADMIN</h1>
                    <p className="text-xs text-slate-500 mt-1">Alu-Tech Distribution</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <div className="bg-blue-600 text-white p-3 rounded-lg flex items-center gap-3 cursor-pointer shadow-lg shadow-blue-900/20">
                        <LayoutDashboard size={20} /> Orders & Sales
                    </div>
                    <Link
                        href="/admin/inventory"
                        className="hover:bg-slate-800 p-3 rounded-lg flex items-center gap-3 cursor-pointer transition text-slate-400 hover:text-white"
                    >
                        <Package size={20} /> Inventory (Stock)
                    </Link>
                    <div className="hover:bg-slate-800 p-3 rounded-lg flex items-center gap-3 cursor-pointer transition">
                        <FileText size={20} /> Reports
                    </div>
                    <div className="hover:bg-slate-800 p-3 rounded-lg flex items-center gap-3 cursor-pointer transition">
                        <Settings size={20} /> Settings
                    </div>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <Link href="/" className="flex items-center gap-3 text-red-400 hover:text-red-300 transition">
                        <LogOut size={18} /> Logout to Store
                    </Link>
                </div>
            </aside>

            {/* 2. MAIN CONTENT */}
            <main className="flex-1 p-8 overflow-y-auto">

                {/* Top Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Order Management</h2>
                        <p className="text-slate-500 text-sm">จัดการคำสั่งซื้อ ออกใบเสร็จ และเปลี่ยนสถานะ</p>
                    </div>
                    <div className="flex gap-4">
                        {/* Stats Card Mini */}
                        <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-slate-200 flex flex-col items-end">
                            <span className="text-xs text-slate-400 uppercase font-bold">Total Revenue</span>
                            <span className="text-xl font-bold text-green-600">{formatTHB(revenue)}</span>
                        </div>
                        <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-slate-200 flex flex-col items-end">
                            <span className="text-xs text-slate-400 uppercase font-bold">Pending Actions</span>
                            <span className="text-xl font-bold text-orange-500">{pendingCount} Tasks</span>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 text-slate-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="ค้นหาเลข PO หรือ ชื่อลูกค้า..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {['All', 'pending', 'processing', 'delivered'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition whitespace-nowrap ${statusFilter === status ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                            <tr>
                                <th className="p-4">Reference / Date</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Items</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions (Print)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-10 text-center text-slate-400">Loading...</td></tr>
                            ) : filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 align-top">
                                        <div className="font-mono font-bold text-slate-800">{order.ref_number}</div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(order.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="p-4 align-top text-sm font-medium text-slate-700">
                                        {order.customer_name}
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="text-sm text-slate-600 space-y-1">
                                            {order.order_items.slice(0, 2).map((item, i) => (
                                                <div key={i}>• {item.product_name} x {item.quantity}</div>
                                            ))}
                                            {order.order_items.length > 2 && <div className="text-xs text-slate-400 italic">+ more items...</div>}
                                        </div>
                                    </td>
                                    <td className="p-4 align-top text-right font-bold text-slate-800">
                                        {formatTHB(order.total_price)}
                                    </td>
                                    <td className="p-4 align-top">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                            className={`text-xs font-bold px-2 py-1 rounded-full border-2 cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 ${order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    order.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            'bg-red-50 text-red-700 border-red-200'
                                                }`}
                                        >
                                            <option value="pending">⏳ Pending</option>
                                            <option value="processing">📦 Packing</option>
                                            <option value="delivered">✅ Delivered</option>
                                            <option value="cancelled">❌ Cancel</option>
                                        </select>
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => generateReceipt(order)}
                                                title="Print Receipt"
                                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 hover:scale-105 transition border border-green-200"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            <button
                                                onClick={() => generateDeliveryNote(order)}
                                                title="Print Delivery Note"
                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 hover:scale-105 transition border border-blue-200"
                                            >
                                                <Truck size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredOrders.length === 0 && !loading && (
                        <div className="p-10 text-center text-slate-400">
                            <Filter size={40} className="mx-auto mb-2 opacity-20" />
                            <p>ไม่พบรายการที่ค้นหา</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}