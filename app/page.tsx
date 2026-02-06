'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/lib/cart-context' // เรียกใช้ Context
import Link from 'next/link' // อย่าลืม import Link
import { Search, Package, ShoppingCart, Truck, AlertCircle, ArrowRight } from 'lucide-react'

// กำหนด Type ของข้อมูลสินค้า
interface Product {
  id: string
  sku: string
  name: string
  category: string
  grade: string
  dimensions: string
  stock_quantity: number
  stock_location: string
  unit_price: number
}

export default function B2BPortal() {
  const { toggleCart, itemCount } = useCart() // ดึงฟังก์ชันตะกร้ามาใช้
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

  // State สำหรับ Dashboard Stats (ตัวเลขจริง)
  const [stats, setStats] = useState({
    activeOrders: 0,
    lowStockItems: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    // 1. ดึงข้อมูลสินค้าทั้งหมด
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('sku', { ascending: true })
    
    if (productsError) console.error('Error fetching products:', productsError)
    else setProducts(productsData || [])

    // 2. ดึงตัวเลข Active Orders (สถานะที่ไม่ใช่ delivered หรือ cancelled)
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true }) // count อย่างเดียว ไม่เอา data
      .neq('status', 'delivered') // นับเฉพาะที่ยังไม่ส่ง
      .neq('status', 'cancelled')

    // 3. นับจำนวนสินค้าที่ใกล้หมด (สมมติว่าต่ำกว่า 100 คือน้อย)
    // เราคำนวณจาก productsData ที่ดึงมาแล้วได้เลย ไม่ต้องยิง query ใหม่
    const lowStockCount = (productsData || []).filter(p => p.stock_quantity < 100).length

    setStats({
      activeOrders: orderCount || 0,
      lowStockItems: lowStockCount
    })

    setLoading(false)
  }

  // Logic การกรองข้อมูล
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'All' || product.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const formatTHB = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* Navbar */}
      <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">ALU-TECH B2B</h1>
              <p className="text-xs text-slate-400">Samut Prakan Distribution Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/orders" className="text-sm text-slate-300 hover:text-white transition hidden md:block">
              ประวัติการสั่งซื้อ
            </Link>
            <div className="hidden md:flex flex-col text-right text-sm">
              <span className="text-slate-400">Welcome, ABC Construction</span>
              <span className="text-green-400 font-semibold">Credit: ฿500,000</span>
            </div>
            
            {/* ปุ่มตะกร้าที่ใช้งานได้จริง */}
            <button 
              onClick={toggleCart} 
              className="p-2 bg-orange-600 rounded-lg hover:bg-orange-700 transition relative shadow-lg hover:shadow-orange-500/50"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        
        {/* Dashboard Stats (Real Data) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          {/* Card 1: Active Orders */}
          <Link href="/orders" className="block group">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex items-center justify-between hover:shadow-md transition">
              <div>
                <p className="text-sm text-slate-500 group-hover:text-blue-600 transition">Active Orders</p>
                <p className="text-3xl font-bold text-slate-800">{stats.activeOrders}</p>
                <p className="text-xs text-slate-400 mt-1">กำลังดำเนินการ</p>
              </div>
              <Truck className="h-10 w-10 text-blue-100 group-hover:text-blue-500 transition" />
            </div>
          </Link>

          {/* Card 2: Low Stock Items (เปลี่ยนจาก Pending Quotes) */}
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500 flex items-center justify-between">
             <div>
              <p className="text-sm text-slate-500">สินค้าใกล้หมด (Low Stock)</p>
              <p className="text-3xl font-bold text-slate-800">{stats.lowStockItems}</p>
              <p className="text-xs text-slate-400 mt-1">คงเหลือต่ำกว่า 100 หน่วย</p>
            </div>
            <AlertCircle className="h-10 w-10 text-orange-100" />
          </div>

        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input 
              type="text"
              placeholder="ค้นหาด้วยชื่อ, SKU, หรือขนาด (เช่น 6063, ฉาก)..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="p-2 border border-slate-200 rounded-lg bg-slate-50 min-w-[200px]"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">ทุกหมวดหมู่ (All Categories)</option>
            <option value="Profile">อะลูมิเนียมเส้น (Profile)</option>
            <option value="Sheet">แผ่นเรียบ/ลาย (Sheet)</option>
            <option value="Solar/EV">Solar Mounting & EV</option>
          </select>
        </div>

        {/* Product Table */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            Loading Inventory Data...
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold">
                <tr>
                  <th className="p-4">สินค้า (Product Info)</th>
                  <th className="p-4 hidden md:table-cell">สเปก (Grade/Dim)</th>
                  <th className="p-4">สถานะสต็อก (Stock)</th>
                  <th className="p-4 text-right">ราคา (Price)</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition group">
                    <td className="p-4">
                      <div className="font-bold text-slate-800 group-hover:text-blue-600 transition">{product.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{product.sku}</div>
                      <span className="inline-block px-2 py-0.5 mt-1 text-[10px] rounded-full bg-slate-100 text-slate-600 border">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell text-sm text-slate-600">
                      <div><span className="font-semibold">Grade:</span> {product.grade}</div>
                      <div><span className="font-semibold">Dim:</span> {product.dimensions}</div>
                    </td>
                    <td className="p-4">
                      {product.stock_quantity > 100 ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                          <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
                          มีสินค้า ({product.stock_quantity})
                        </div>
                      ) : product.stock_quantity > 0 ? (
                        <div className="flex items-center gap-2 text-orange-500 text-sm font-medium">
                          <span className="h-2.5 w-2.5 rounded-full bg-orange-500"></span>
                          เหลือน้อย ({product.stock_quantity})
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                          สินค้าหมด
                        </div>
                      )}
                      <div className="text-xs text-slate-400 mt-1">{product.stock_location}</div>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-700">
                      {formatTHB(product.unit_price)}
                      <div className="text-xs text-slate-400 font-normal">ต่อหน่วย</div>
                    </td>
                    <td className="p-4 text-center">
                      <Link 
                        href={`/product/${product.id}`}
                        className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white text-sm px-4 py-2 rounded-md transition font-medium border border-blue-100 hover:border-blue-600"
                      >
                        รายละเอียด <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && (
              <div className="p-12 text-center">
                 <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                 <p className="text-slate-500">ไม่พบสินค้าที่คุณค้นหา</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}