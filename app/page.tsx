'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/lib/cart-context'
import Link from 'next/link'
import { Search, Package, ShoppingCart, Truck, AlertCircle, ArrowRight, Menu } from 'lucide-react' // เพิ่ม Icon Menu

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
  const { toggleCart, itemCount } = useCart()
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [stats, setStats] = useState({ activeOrders: 0, lowStockItems: 0 })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('sku', { ascending: true })
    
    if (productsError) console.error(productsError)
    else setProducts(productsData || [])

    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'delivered')
      .neq('status', 'cancelled')

    const lowStockCount = (productsData || []).filter(p => p.stock_quantity < 100).length

    setStats({
      activeOrders: orderCount || 0,
      lowStockItems: lowStockCount
    })
    setLoading(false)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'All' || product.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const formatTHB = (amount: number) => 
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20"> {/* เพิ่ม pb-20 เผื่อพื้นที่ด้านล่างในมือถือ */}
      
      {/* 1. Navbar: ปรับให้ User Info หายไปในมือถือ เพื่อประหยัดที่ */}
      <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* Logo ย่อลงเล็กน้อยในมือถือ */}
            <Package className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight">ALU-TECH B2B</h1>
              <p className="text-[10px] md:text-xs text-slate-400 hidden sm:block">Samut Prakan Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            {/* ซ่อนลิงก์ประวัติในมือถือ (อาจย้ายไปใส่ Hamburger Menu ทีหลังได้) */}
            <Link href="/orders" className="text-sm text-slate-300 hover:text-white transition hidden md:block">
              ประวัติการสั่งซื้อ
            </Link>
            
            {/* ซ่อนข้อมูล User/Credit ในมือถือ */}
            <div className="hidden md:flex flex-col text-right text-sm">
              <span className="text-slate-400">Welcome, ABC Construction</span>
              <span className="text-green-400 font-semibold">Credit: ฿500,000</span>
            </div>
            
            <button 
              onClick={toggleCart} 
              className="p-2 bg-orange-600 rounded-lg hover:bg-orange-700 transition relative shadow-lg"
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

      <main className="max-w-7xl mx-auto p-4 md:p-6"> {/* ลด Padding ในมือถือเหลือ p-4 */}
        
        {/* 2. Dashboard Stats: ปรับเป็น Grid 1 แถวในมือถือ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          <Link href="/orders" className="block group">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex items-center justify-between hover:shadow-md transition">
              <div>
                <p className="text-sm text-slate-500">Active Orders</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-800">{stats.activeOrders}</p>
              </div>
              <Truck className="h-8 w-8 md:h-10 md:w-10 text-blue-100 group-hover:text-blue-500 transition" />
            </div>
          </Link>

          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500 flex items-center justify-between">
             <div>
              <p className="text-sm text-slate-500">Low Stock</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-800">{stats.lowStockItems}</p>
            </div>
            <AlertCircle className="h-8 w-8 md:h-10 md:w-10 text-orange-100" />
          </div>
        </div>

        {/* 3. Search Bar: เรียงแนวตั้งในมือถือ (flex-col) */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input 
              type="text"
              placeholder="ค้นหาสินค้า..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="p-2 border border-slate-200 rounded-lg bg-slate-50 w-full md:w-auto md:min-w-[200px]"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">ทุกหมวดหมู่</option>
            <option value="Profile">อะลูมิเนียมเส้น</option>
            <option value="Sheet">แผ่นเรียบ/ลาย</option>
            <option value="Solar/EV">Solar/EV</option>
          </select>
        </div>

        {/* 4. Responsive Table: หัวใจสำคัญของการแก้ปัญหา */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading Inventory...</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-100">
            {/* overflow-x-auto ช่วยให้ตารางเลื่อนได้ถ้ายาวเกิน แต่เราจะซ่อนคอลัมน์แทนเพื่อให้ดูง่าย */}
            <div className="overflow-x-auto"> 
              <table className="w-full text-left border-collapse min-w-[350px]">
                <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold">
                  <tr>
                    <th className="p-3 md:p-4 w-1/2 md:w-auto">สินค้า</th>
                    {/* ซ่อนคอลัมน์ สเปก และ สต็อก ในมือถือ (hidden md:table-cell) */}
                    <th className="p-4 hidden md:table-cell">สเปก</th>
                    <th className="p-4 hidden md:table-cell">สถานะ</th>
                    <th className="p-3 md:p-4 text-right">ราคา</th>
                    <th className="p-3 md:p-4 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition group">
                      <td className="p-3 md:p-4">
                        <div className="font-bold text-slate-800 text-sm md:text-base">{product.name}</div>
                        <div className="text-xs text-slate-400 font-mono mb-1">{product.sku}</div>
                        <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 border">
                          {product.category}
                        </span>

                        {/* Mobile Only Info: แสดงสเปกและสต็อกแบบย่อ ในมือถือเท่านั้น */}
                        <div className="md:hidden mt-2 text-xs text-slate-500 space-y-1">
                            <div>Grade: {product.grade}</div>
                            {product.stock_quantity > 0 ? (
                                <div className="text-green-600 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> 
                                    มีของ ({product.stock_quantity})
                                </div>
                            ) : (
                                <div className="text-red-500">หมด</div>
                            )}
                        </div>
                      </td>

                      {/* Desktop Only Columns */}
                      <td className="p-4 hidden md:table-cell text-sm text-slate-600 align-top">
                        <div><span className="font-semibold">Grade:</span> {product.grade}</div>
                        <div><span className="font-semibold">Dim:</span> {product.dimensions}</div>
                      </td>
                      <td className="p-4 hidden md:table-cell align-top">
                         {/* Logic แสดงสต็อกแบบ Desktop (คงเดิม) */}
                         {product.stock_quantity > 100 ? (
                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                              <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span> มีสินค้า ({product.stock_quantity})
                            </div>
                          ) : product.stock_quantity > 0 ? (
                            <div className="flex items-center gap-2 text-orange-500 text-sm font-medium">
                              <span className="h-2.5 w-2.5 rounded-full bg-orange-500"></span> เหลือน้อย ({product.stock_quantity})
                            </div>
                          ) : (
                            <div className="text-red-500 text-sm font-medium">สินค้าหมด</div>
                          )}
                          <div className="text-xs text-slate-400 mt-1">{product.stock_location}</div>
                      </td>

                      <td className="p-3 md:p-4 text-right font-mono font-bold text-slate-700 align-top">
                        <div className="text-sm md:text-base">{formatTHB(product.unit_price)}</div>
                        <div className="text-[10px] md:text-xs text-slate-400 font-normal">/หน่วย</div>
                      </td>
                      
                      <td className="p-3 md:p-4 text-center align-top">
                        <Link 
                          href={`/product/${product.id}`}
                          className="inline-flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white text-xs md:text-sm px-3 py-2 rounded-md transition font-medium border border-blue-100 hover:border-blue-600"
                        >
                          <span className="hidden md:inline mr-1">รายละเอียด</span> <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="p-12 text-center text-slate-500">ไม่พบสินค้า</div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}