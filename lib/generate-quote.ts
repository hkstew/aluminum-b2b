// lib/generate-quote.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { CartItem } from './cart-context'

// Format เงินบาท
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

export const generateQuote = (items: CartItem[]) => {
  // 1. ตั้งค่าหน้ากระดาษ A4
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  
  // --- HEADER SECTION ---
  
  // Company Logo (Simulated with a Blue Box)
  doc.setFillColor(41, 128, 185) // Blue color
  doc.rect(14, 15, 15, 15, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text("ALU", 16, 24) // Logo Text

  // Company Info (Right Side)
  doc.setTextColor(44, 62, 80)
  doc.setFontSize(18)
  doc.text("ALU-TECH DISTRIBUTION", 195, 20, { align: 'right' })
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text("888 Bang Na-Trat Road, Bang Phli, Samut Prakan 10540", 195, 26, { align: 'right' })
  doc.text("Tax ID: 0-1055-99999-99-9 | Tel: 02-777-8888", 195, 31, { align: 'right' })
  doc.text("Email: sales@alu-tech.co.th", 195, 36, { align: 'right' })

  // Line Separator
  doc.setDrawColor(200, 200, 200)
  doc.line(14, 45, 196, 45)

  // --- CUSTOMER & DOC INFO ---
  
  doc.setFontSize(11)
  doc.setTextColor(44, 62, 80)
  
  // Left: Bill To
  doc.text("BILL TO:", 14, 55)
  doc.setFontSize(10)
  doc.text("ABC Construction Co., Ltd.", 14, 62)
  doc.text("123 Sukhumvit Road, Praksa,", 14, 67)
  doc.text("Mueang Samut Prakan, 10280", 14, 72)
  doc.text("Tax ID: 0-1234-56789-00-1", 14, 77)

  // Right: Document Details
  doc.setFontSize(11)
  doc.text("QUOTATION", 195, 55, { align: 'right' })
  doc.setFontSize(10)
  doc.text("No: QT-2026-0001", 195, 62, { align: 'right' })
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 195, 67, { align: 'right' })
  doc.text("Valid Until: 30 Days", 195, 72, { align: 'right' })

  // --- ITEM TABLE ---
  
  // Prepare data for table
  const tableRows = items.map((item, index) => [
    index + 1,
    `${item.name}\nSKU: ${item.sku} (${item.grade})`, // Description with newline
    item.isCustom ? `${item.customLength}mm` : '6.00m', // Length
    item.quantity,
    formatCurrency(item.price / item.quantity), // Unit Price
    formatCurrency(item.price) // Total
  ])

  // Calculate Totals
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)
  const vat = subtotal * 0.07
  const grandTotal = subtotal + vat

  // Generate Table
  autoTable(doc, {
    startY: 85,
    head: [['#', 'Description', 'Length', 'Qty', 'Unit Price', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' }, // Description gets auto width
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' }
    },
    styles: { fontSize: 9, cellPadding: 3 },
    foot: [
      ['', '', '', '', 'Subtotal', formatCurrency(subtotal)],
      ['', '', '', '', 'VAT 7%', formatCurrency(vat)],
      ['', '', '', '', 'Grand Total', formatCurrency(grandTotal)]
    ],
    footStyles: { fillColor: [241, 245, 249], textColor: [44, 62, 80], fontStyle: 'bold', halign: 'right' }
  })

  // --- FOOTER / SIGNATURE ---
  
  // Get Y position after table
  const finalY = (doc as any).lastAutoTable.finalY + 20

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  
  // Signature Lines
  doc.text("__________________________", 30, finalY)
  doc.text("Customer Acceptance", 38, finalY + 5)
  
  doc.text("__________________________", 140, finalY)
  doc.text("Authorized Signature", 148, finalY + 5)

  // Save File
  doc.save('Quotation-ALU-TECH.pdf')
}