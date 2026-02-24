'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowPathIcon,
  CalendarIcon,
  UserIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [customers, setCustomers] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })
  
  // Modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const [loadingReceipt, setLoadingReceipt] = useState(false)

  useEffect(() => {
    fetchPayments()
    fetchCustomers()
  }, [pagination.page, methodFilter, customerFilter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      let url = `/payments?page=${pagination.page}&limit=${pagination.limit}`
      
      if (customerFilter !== 'all') {
        url += `&customer=${customerFilter}`
      }

      const response = await api.get(url)
      setPayments(response.data.payments || [])
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0
      }))
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers?limit=1000')
      let customersList = []
      if (Array.isArray(response.data)) {
        customersList = response.data
      } else if (response.data.customers) {
        customersList = response.data.customers
      } else if (response.data.data) {
        customersList = response.data.data
      }
      setCustomers(customersList)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  // View Receipt Modal - Fixed margins
  const handleViewReceipt = async (payment) => {
    try {
      setLoadingReceipt(true)
      setShowReceiptModal(true)
      
      const response = await api.get(`/payments/${payment._id}/receipt`)
      setReceiptData(response.data.data || response.data)
      
    } catch (error) {
      console.error('Error fetching receipt:', error)
      toast.error('Failed to load receipt details')
      setShowReceiptModal(false)
    } finally {
      setLoadingReceipt(false)
    }
  }

  // PDF Download - Different from Print
  const handleDownloadReceipt = async (paymentId, receiptNumber) => {
    const toastId = toast.loading('Generating PDF...')
    
    try {
      const receiptResponse = await api.get(`/payments/${paymentId}/receipt`)
      const receipt = receiptResponse.data.data || receiptResponse.data
      
      // Create a blob from the HTML content
      const htmlContent = generateReceiptHTML(receipt, true)
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      
      // Open in new window and trigger print
      const printWindow = window.open(url, '_blank')
      if (!printWindow) {
        throw new Error('Pop-up blocked. Please allow pop-ups.')
      }
      
      // Wait for content to load then print and close
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          setTimeout(() => {
            printWindow.close()
            window.URL.revokeObjectURL(url)
          }, 100)
        }, 300)
      }
      
      toast.success('PDF generated', { id: toastId })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to generate PDF', { id: toastId })
    }
  }

  // Print Receipt - Different from PDF
  const handlePrintReceipt = async (payment) => {
    const toastId = toast.loading('Preparing receipt...')
    
    try {
      const response = await api.get(`/payments/${payment._id}/receipt`)
      const receipt = response.data.data || response.data
      
      // Create a blob from the HTML content (no PDF flag)
      const htmlContent = generateReceiptHTML(receipt, false)
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      
      const printWindow = window.open(url, '_blank')
      if (!printWindow) {
        throw new Error('Pop-up blocked. Please allow pop-ups.')
      }
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          setTimeout(() => {
            printWindow.close()
            window.URL.revokeObjectURL(url)
          }, 100)
        }, 300)
      }
      
      toast.success('Ready to print', { id: toastId })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to prepare receipt', { id: toastId })
    }
  }

  // Clean Receipt HTML - Fixed margins and padding
  const generateReceiptHTML = (receipt, forPdf = false) => {
    const date = receipt.date ? new Date(receipt.date) : new Date()
    const formattedDate = date.toLocaleDateString('en-PK', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${receipt.receiptNumber}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: ${forPdf ? '#fff' : '#f5f7fb'};
            padding: 40px 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .receipt {
            max-width: 520px;
            width: 100%;
            background: white;
            border-radius: 20px;
            box-shadow: ${forPdf ? 'none' : '0 8px 30px rgba(0,0,0,0.04)'};
            padding: 32px;
            border: ${forPdf ? '1px solid #e2e8f0' : 'none'};
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 28px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eef2f6;
          }
          .logo {
            font-size: 18px;
            font-weight: 600;
            background: linear-gradient(135deg, #2563eb, #4f46e5);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .badge {
            background: #dcfce7;
            color: #166534;
            padding: 6px 14px;
            border-radius: 100px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.3px;
          }
          .receipt-number {
            font-size: 18px;
            font-weight: 600;
            color: #0a0a0a;
            margin-bottom: 16px;
            font-family: monospace;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            background: #fafcfc;
            padding: 20px;
            border-radius: 16px;
            margin-bottom: 24px;
            border: 1px solid #edf2f7;
          }
          .label {
            font-size: 11px;
            color: #6b7a8f;
            letter-spacing: 0.3px;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .value {
            font-size: 14px;
            font-weight: 600;
            color: #1a2634;
          }
          .amount-card {
            background: linear-gradient(145deg, #f0f9ff, #e6f2fe);
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            margin-bottom: 24px;
            border: 1px solid #dbeafe;
          }
          .amount-label {
            font-size: 11px;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }
          .amount {
            font-size: 36px;
            font-weight: 700;
            color: #2563eb;
            line-height: 1.1;
            letter-spacing: -0.5px;
          }
          .divider {
            border-top: 1px solid #eef2f6;
            margin: 20px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          .row:last-child {
            border-bottom: none;
          }
          .row-label {
            color: #64748b;
            font-size: 13px;
          }
          .row-value {
            font-weight: 600;
            color: #0f172a;
            font-size: 13px;
          }
          .footer {
            margin-top: 28px;
            padding-top: 20px;
            border-top: 1px solid #eef2f6;
            text-align: center;
          }
          .footer-text {
            color: #6b7a8f;
            font-size: 11px;
            margin-bottom: 4px;
          }
          .thanks {
            color: #2563eb;
            font-weight: 600;
            font-size: 14px;
            margin-top: 8px;
          }
          .print-btn {
            margin-top: 24px;
            padding: 12px 28px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
          }
          .print-btn:hover {
            background: #1d4ed8;
          }
          @media print {
            body { background: white; padding: 20px; }
            .receipt { box-shadow: none; border: 1px solid #e2e8f0; }
            .print-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <span class="logo">LedgerPro</span>
            <span class="badge">✓ PAID</span>
          </div>
          
          <div class="receipt-number">#${receipt.receiptNumber?.slice(-8) || 'N/A'}</div>
          
          <div class="grid">
            <div>
              <div class="label">Date</div>
              <div class="value">${formattedDate}</div>
            </div>
            <div>
              <div class="label">Method</div>
              <div class="value" style="text-transform: capitalize;">${receipt.method || 'N/A'}</div>
            </div>
            <div>
              <div class="label">Customer</div>
              <div class="value">${receipt.customerName || 'N/A'}</div>
            </div>
            <div>
              <div class="label">Phone</div>
              <div class="value">${receipt.customerPhone || 'N/A'}</div>
            </div>
          </div>
          
          <div class="amount-card">
            <div class="amount-label">Total Amount</div>
            <div class="amount">Rs. ${(receipt.amount || 0).toLocaleString()}</div>
          </div>
          
          <div class="row">
            <span class="row-label">Reference</span>
            <span class="row-value">${receipt.reference || '—'}</span>
          </div>
          <div class="row">
            <span class="row-label">Received By</span>
            <span class="row-value">${receipt.receivedBy || 'System'}</span>
          </div>
          
          <div class="footer">
            <div class="footer-text">This is a computer generated receipt</div>
            <div class="thanks">Thank you for your business!</div>
            ${!forPdf ? `
              <button class="print-btn" onclick="window.print()">
                🖨️ Print Receipt
              </button>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `
  }

  const filteredPayments = payments.filter(payment => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        payment.customer?.name?.toLowerCase().includes(query) ||
        payment.receiptNumber?.toLowerCase().includes(query) ||
        payment.reference?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const getMethodIcon = (method) => {
    switch (method) {
      case 'cash': return <BanknotesIcon className="w-3.5 h-3.5" />
      case 'bank': return <BuildingLibraryIcon className="w-3.5 h-3.5" />
      case 'online': return <CreditCardIcon className="w-3.5 h-3.5" />
      default: return null
    }
  }

  const getMethodColor = (method) => {
    switch (method) {
      case 'cash': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50'
      case 'bank': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50'
      case 'online': return 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/50'
      default: return 'bg-gray-50 text-gray-700 ring-1 ring-gray-200/50'
    }
  }

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      {/* Header - Clean */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer payments and receipts</p>
        </div>
        <Link
          href="/admin/payments/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          New Payment
        </Link>
      </div>

      {/* Stats Grid - Clean Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Payments</p>
          <p className="text-2xl font-semibold text-gray-900">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Amount</p>
          <p className="text-2xl font-semibold text-emerald-600">Rs. {totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Cash Payments</p>
          <p className="text-2xl font-semibold text-gray-900">{payments.filter(p => p.method === 'cash').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Bank/Online</p>
          <p className="text-2xl font-semibold text-gray-900">{payments.filter(p => p.method === 'bank' || p.method === 'online').length}</p>
        </div>
      </div>

      {/* Filters - Compact */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by receipt, customer, reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            />
          </div>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          >
            <option value="all">All Customers</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank Transfer</option>
            <option value="online">Online</option>
          </select>
        </div>
      </div>

      {/* Payments Table - Perfect Borders & Margins */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-5 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center">
                    <div className="text-sm text-gray-500">No payments found</div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded">
                        {payment.receiptNumber?.slice(-8) || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-600">
                        {format(new Date(payment.receivedDate || payment.createdAt), 'dd MMM yyyy')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-white text-[11px] font-medium">
                            {payment.customer?.name?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {payment.customer?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium ${getMethodColor(payment.method)}`}>
                        {getMethodIcon(payment.method)}
                        <span className="capitalize">{payment.method}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-emerald-600">
                        Rs. {payment.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500 font-mono">
                        {payment.reference ? payment.reference.slice(-8) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium ring-1 ring-emerald-200/50">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        Paid
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewReceipt(payment)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Receipt"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadReceipt(payment._id, payment.receiptNumber)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Download PDF"
                        >
                          <DocumentArrowDownIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(payment)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Print Receipt"
                        >
                          <PrinterIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination - Clean */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

           {showReceiptModal && receiptData && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
    {/* Backdrop */}
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      onClick={() => setShowReceiptModal(false)}
      aria-hidden="true"
    />

    {/* Modal Card */}
    <div
      className={`
        relative w-full max-w-lg bg-white rounded-2xl shadow-2xl 
        border border-gray-100 overflow-hidden
        transform transition-all duration-200
        animate-scaleIn
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/70">
        <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
          Payment Receipt
        </h3>

        <button
          type="button"
          onClick={() => setShowReceiptModal(false)}
          className={`
            p-2 rounded-full text-gray-500 
            hover:text-gray-700 hover:bg-gray-100 
            focus:outline-none focus:ring-2 focus:ring-indigo-500/50
            transition-colors duration-150
          `}
          aria-label="Close receipt modal"
        >
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 sm:p-8 overflow-y-auto max-h-[70vh] sm:max-h-[75vh]">
        {loadingReceipt ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm">Preparing receipt...</p>
          </div>
        ) : (
          <div
            className="prose prose-sm sm:prose max-w-none receipt-content"
            dangerouslySetInnerHTML={{ __html: generateReceiptHTML(receiptData, false) }}
          />
        )}
      </div>

      {/* Optional subtle footer - can remove if not needed */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 text-right text-xs text-gray-500">
        Receipt generated on {new Date().toLocaleDateString()}
      </div>
    </div>
  </div>
)}

<style jsx global>{`
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .animate-scaleIn {
    animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  /* Better receipt styling – adjust according to your generateReceiptHTML output */
  .receipt-content {
    font-family: ui-monospace, 'Cascadia Code', 'Segoe UI Mono', monospace;
    color: #1f2937;
  }

  .receipt-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }

  .receipt-content th,
  .receipt-content td {
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
  }

  .receipt-content th {
    font-weight: 600;
    color: #374151;
  }

  .receipt-content .total-row {
    font-weight: 700;
    background-color: #f9fafb;
  }

  .receipt-content .highlight {
    color: #2563eb;
    font-weight: 600;
  }
`}</style>
    </div>
  )
}