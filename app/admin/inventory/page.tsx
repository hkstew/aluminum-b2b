'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  ArrowLeft, Package, Search, Save, Plus, Trash2, 
  LayoutDashboard, FileText, Settings, LogOut, RefreshCw 
} from 'lucide-react'

// Type
interface Product {
  id: string; sku: string; name: string; category: string;
  stock_quantity: number; unit_price: number;
}

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // State สำหรับเก็บค่าที่กำลังแก้
  const [tempData, setTempData] = useState<Partial<Product>>({})

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sku', { ascending: true })
    if (!error) setProducts(data || [])
    setLoading(false)
  }

  // เริ่มแก้ไข
  const startEdit = (product: Product) => {
    setEditingId(product.id)
    setTempData({ stock_quantity: product.stock_quantity, unit_price: product.unit_price })
  }

  // ยกเลิกแก้ไข
  const cancelEdit = () => {
    setEditingId(null)
    setTempData({})
  }

  // บันทึกข้อมูลลง Database
  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .update(tempData)
      .eq('id', id)

    if (error) {
      alert('บันทึกไม่สำเร็จ: ' + error.message)
    } else {
      // Update UI
      setProducts(products.map(p => p.id === id ? { ...p, ...tempData } : p))
      setEditingId(null)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex">
      
      {/* SIDEBAR (Copy มาจากหน้า Orders เพื่อความเนียน) */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-white tracking-wider">ERP ADMIN</h1>
          <p className="text-xs text-slate-500 mt-1">Alu-Tech Distribution</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/orders" className="hover:bg-slate-800 p-3 rounded-lg flex items-center gap-3 transition text-slate-400 hover:text-white">
            <LayoutDashboard size={20} /> Orders & Sales
          </Link>
          <div className="bg-blue-600 text-white p-3 rounded-lg flex items-center gap-3 cursor-pointer shadow-lg">
            <Package size={20} /> Inventory (Stock)
          </div>
          <div className="hover:bg-slate-800 p-3 rounded-lg flex items-center gap-3 cursor-pointer transition text-slate-400">
            <FileText size={20} /> Reports
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <Link href="/" className="flex items-center gap-3 text-red-400 hover:text-red-300 transition">
            <LogOut size={18} /> Logout to Store
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
            <p className="text-slate-500 text-sm">จัดการสต็อกและราคาสินค้า</p>
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition">
            <Plus size={20} /> เพิ่มสินค้าใหม่
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4">
           <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400 h-5 w-5" />
            <input 
              type="text" 
              placeholder="ค้นหา SKU หรือ ชื่อสินค้า..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchProducts} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600">
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th className="p-4">Product Info</th>
                <th className="p-4 w-32 text-center">Stock</th>
                <th className="p-4 w-40 text-right">Price (THB)</th>
                <th className="p-4 w-32 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center text-slate-400">Loading Stock...</td></tr>
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{product.name}</div>
                    <div className="text-xs text-slate-400 font-mono flex gap-2">
                       <span className="bg-slate-100 px-1 rounded">{product.sku}</span>
                       <span>{product.category}</span>
                    </div>
                  </td>

                  {/* Stock Column (Editable) */}
                  <td className="p-4 text-center">
                    {editingId === product.id ? (
                      <input 
                        type="number" 
                        className="w-20 p-1 border border-blue-400 rounded text-center font-bold text-slate-800 focus:outline-none"
                        value={tempData.stock_quantity}
                        onChange={(e) => setTempData({...tempData, stock_quantity: Number(e.target.value)})}
                      />
                    ) : (
                      <span className={`font-bold ${product.stock_quantity < 100 ? 'text-orange-500' : 'text-green-600'}`}>
                        {product.stock_quantity}
                      </span>
                    )}
                  </td>

                  {/* Price Column (Editable) */}
                  <td className="p-4 text-right">
                    {editingId === product.id ? (
                      <input 
                        type="number" 
                        className="w-24 p-1 border border-blue-400 rounded text-right font-mono text-slate-800 focus:outline-none"
                        value={tempData.unit_price}
                        onChange={(e) => setTempData({...tempData, unit_price: Number(e.target.value)})}
                      />
                    ) : (
                      <span className="font-mono text-slate-700">
                        {new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(product.unit_price)}
                      </span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="p-4 text-center">
                    {editingId === product.id ? (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => saveEdit(product.id)} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200">
                          <Save size={16} />
                        </button>
                        <button onClick={cancelEdit} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => startEdit(product)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

// ต้อง import X ด้วย (ผมเพิ่มไว้ข้างบนแล้ว แต่ย้ำอีกที)
function X(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  )
}