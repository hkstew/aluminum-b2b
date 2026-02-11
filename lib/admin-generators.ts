// lib/admin-generators.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ฟอร์แมตเงินบาท
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)

// 1. ฟังก์ชันสร้างใบเสร็จรับเงิน / ใบกำกับภาษี
export const generateReceipt = (order: any) => {
  const doc = new jsPDF()
  
  // --- HEADER ---
  doc.setFillColor(46, 204, 113) // สีเขียว (Receipt Color)
  doc.rect(0, 0, 210, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text("RECEIPT / TAX INVOICE", 14, 13)
  doc.setFontSize(10)
  doc.text("ORIGINAL (ต้นฉบับ)", 195, 13, { align: 'right' })

  // --- INFO ---
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  
  // Company Info (Left)
  doc.text("ALU-TECH DISTRIBUTION CO., LTD.", 14, 30)
  doc.setFontSize(9)
  doc.text("888 Bang Na-Trat Road, Bang Phli, Samut Prakan 10540", 14, 35)
  doc.text("Tax ID: 0115555000222", 14, 40)

  // Customer & Bill Info (Right)
  doc.text(`Ref No: ${order.ref_number}`, 150, 30)
  doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('en-GB')}`, 150, 35)
  doc.text(`Customer: ${order.customer_name}`, 150, 40)

  // --- TABLE ---
  const tableRows = order.order_items.map((item: any, index: number) => [
    index + 1,
    item.product_name + (item.custom_length !== 6000 ? ` (Cut ${item.custom_length}mm)` : ''),
    item.quantity,
    formatCurrency(item.price / item.quantity),
    formatCurrency(item.price)
  ])

  const subtotal = order.total_price / 1.07
  const vat = order.total_price - subtotal

  autoTable(doc, {
    startY: 50,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [46, 204, 113], textColor: 255 }, // Green Header
    columnStyles: { 0: { cellWidth: 10 }, 4: { halign: 'right' }, 3: { halign: 'right' } },
    foot: [
      ['', '', '', 'Subtotal', formatCurrency(subtotal)],
      ['', '', '', 'VAT 7%', formatCurrency(vat)],
      ['', '', '', 'Grand Total', formatCurrency(order.total_price)]
    ]
  })

  // Save
  doc.save(`Receipt-${order.ref_number}.pdf`)
}

// 2. ฟังก์ชันสร้างใบส่งของ (Delivery Note)
export const generateDeliveryNote = (order: any) => {
  const doc = new jsPDF()
  
  // --- HEADER ---
  doc.setFillColor(52, 152, 219) // สีฟ้า (Delivery Color)
  doc.rect(0, 0, 210, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text("DELIVERY NOTE (ใบส่งของ)", 14, 13)

  // --- INFO ---
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.text(`Order Ref: ${order.ref_number}`, 14, 35)
  doc.text(`Customer: ${order.customer_name}`, 14, 42)
  doc.text(`Ship To: Site 1, Bang Pu Industrial Estate`, 14, 49) // Mock Address

  // --- TABLE (No Prices) ---
  const tableRows = order.order_items.map((item: any, index: number) => [
    index + 1,
    item.sku,
    item.product_name,
    item.custom_length !== 6000 ? `${item.custom_length}mm` : '6.00m',
    item.quantity,
    '[   ] Checked' // ช่องให้ติ๊ก
  ])

  autoTable(doc, {
    startY: 60,
    head: [['#', 'SKU', 'Description', 'Length', 'Qty', 'Check']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [52, 152, 219] }, // Blue Header
  })

  // Signatures
  const finalY = (doc as any).lastAutoTable.finalY + 30
  doc.text("___________________", 20, finalY)
  doc.text("Driver / Sender", 25, finalY + 7)
  
  doc.text("___________________", 140, finalY)
  doc.text("Receiver / Customer", 145, finalY + 7)

  doc.save(`Delivery-${order.ref_number}.pdf`)
}