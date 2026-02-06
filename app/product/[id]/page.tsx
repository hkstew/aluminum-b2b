// app/product/[id]/page.tsx
'use client'

import { useEffect, useState, use } from 'react' // แก้ไข import เพื่อรองรับ next.js params
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Ruler, Scale, Info, CheckCircle, Calculator } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'

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
    weight_per_meter?: number // เพิ่มฟิลด์สมมติเพื่อคำนวณน้ำหนัก
}

// จำลองน้ำหนักต่อเมตร (ใน DB จริงควรมี column นี้)
const MOCK_WEIGHT_PER_METER = 1.25 // kg/m

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
    // Unwrapping params for Next.js 15+ (หรือใช้แบบปกติถ้าเป็น version เก่า)
    const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(null)

    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)

    // State สำหรับ Calculator
    const [customLength, setCustomLength] = useState<number>(6000) // mm
    const [quantity, setQuantity] = useState<number>(1)
    const [calculatedWeight, setCalculatedWeight] = useState<number>(0)
    const [totalPrice, setTotalPrice] = useState<number>(0)

    const { addToCart } = useCart()
    const handleAddToCart = () => {
        if (!product) return

        addToCart({
            productId: product.id,
            sku: product.sku,
            name: product.name,
            grade: product.grade,
            quantity: quantity,
            customLength: customLength,
            price: totalPrice,
            isCustom: customLength !== 6000 // ถ้าไม่ใช่ 6000 ถือเป็นสั่งตัด
        })
    }


    useEffect(() => {
        // Resolve params promise
        params.then((res) => {
            setUnwrappedParams(res)
            fetchProduct(res.id)
        })
    }, [params])

    // คำนวณราคาและน้ำหนักแบบ Real-time
    useEffect(() => {
        if (product) {
            // สูตร: (น้ำหนักต่อเมตร * ความยาวเป็นเมตร) * จำนวน
            const weight = (MOCK_WEIGHT_PER_METER * (customLength / 1000)) * quantity
            setCalculatedWeight(weight)

            // สูตรราคา: (สมมติคิดตามเส้นก่อน เพื่อความง่ายใน MVP)
            // ถ้าตัดสั้นกว่ามาตรฐาน ให้คิดราคาตามสัดส่วน + ค่าบริการตัด 10%
            const ratio = customLength / 6000
            let price = (product.unit_price * ratio) * quantity
            if (customLength < 6000) price *= 1.1 // ค่าตัด

            setTotalPrice(price)
        }
    }, [customLength, quantity, product])

    async function fetchProduct(id: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single()

        if (error) console.error('Error:', error)
        else setProduct(data)
        setLoading(false)
    }

    const formatTHB = (amount: number) =>
        new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount)

    if (loading) return <div className="p-10 text-center">Loading Specs...</div>
    if (!product) return <div className="p-10 text-center">Product not found</div>

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">

            {/* Navbar (ย่อ) */}
            <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-slate-800 rounded-full transition">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="font-bold truncate">{product.name}</h1>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* LEFT COLUMN: รูปภาพและสเปก */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center h-64 bg-slate-100">
                            {/* Placeholder รูปสินค้า (ของจริงใช้ <img>) */}
                            <div className="text-center">
                                <div className="w-32 h-32 bg-slate-300 mx-auto rounded-lg mb-4 flex items-center justify-center text-4xl text-slate-500 font-bold">Al</div>
                                <p className="text-slate-500 text-sm">Cross-Section Preview</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Info className="h-5 w-5 text-blue-600" />
                                Technical Specifications
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">SKU Ref.</span>
                                    <span className="font-mono font-medium">{product.sku}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Grade / Temper</span>
                                    <span className="font-medium">{product.grade}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Dimensions</span>
                                    <span className="font-medium">{product.dimensions}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Stock Location</span>
                                    <span className="text-green-600 font-medium flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> {product.stock_location}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: เครื่องคิดเลขและสั่งซื้อ (The CTO Feature) */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-orange-500">
                            <h2 className="text-xl font-bold text-slate-800 mb-1">สั่งซื้อ / คำนวณราคา</h2>
                            <p className="text-xs text-slate-400 mb-6">คำนวณน้ำหนักและราคาประเมินเรียลไทม์</p>

                            {/* Calculator Inputs */}
                            <div className="space-y-4">

                                {/* 1. ความยาว */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                                        <span>ความยาว (mm)</span>
                                        <span className="text-xs text-blue-600 cursor-pointer hover:underline" onClick={() => setCustomLength(6000)}>
                                            ใช้ความยาวมาตรฐาน (6000mm)
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <Ruler className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                        <input
                                            type="number"
                                            value={customLength}
                                            onChange={(e) => setCustomLength(Number(e.target.value))}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                    </div>
                                    {customLength !== 6000 && (
                                        <p className="text-xs text-orange-600 mt-1">* คิดค่าบริการตัดเพิ่ม 10%</p>
                                    )}
                                </div>

                                {/* 2. จำนวน */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">จำนวน (ท่อน/เส้น)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                {/* Live Calculation Result */}
                                <div className="bg-slate-50 p-4 rounded-lg space-y-2 mt-4 border border-slate-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 flex items-center gap-1"><Scale className="h-4 w-4" /> น้ำหนักรวม (Est.)</span>
                                        <span className="font-bold text-slate-700">{calculatedWeight.toFixed(2)} kg</span>
                                    </div>
                                    <div className="flex justify-between text-lg pt-2 border-t border-slate-200">
                                        <span className="font-bold text-slate-800">ราคารวม (Est.)</span>
                                        <span className="font-bold text-blue-600">{formatTHB(totalPrice)}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-2 flex gap-3">
                                    <button className="flex-1 bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-50 transition">
                                        ขอใบเสนอราคา
                                    </button>
                                    <button
                                        onClick={handleAddToCart} // เพิ่มตรงนี้
                                        className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                    >
                                        <Calculator className="h-5 w-5" />
                                        เพิ่มในรายการ
                                    </button>
                                </div>

                            </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3">
                            <Truck className="h-6 w-6 text-blue-600 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-blue-800">ส่งด่วนในสมุทรปราการ</h4>
                                <p className="text-xs text-blue-600 mt-1">
                                    สั่งซื้อก่อน 14:00 น. จัดส่งได้ภายในพรุ่งนี้ (พื้นที่บางพลี, บางปู, แพรกษา)
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    )
}

function Truck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
            <path d="M5 18h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z" />
            <path d="M15 18H9" />
            <path d="M19 18v2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-2" />
            <circle cx="9" cy="18" r="2" />
            <circle cx="15" cy="18" r="2" />
        </svg>
    )
}