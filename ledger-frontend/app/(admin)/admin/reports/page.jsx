'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import Select from 'react-select'
import {
  DocumentTextIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BellAlertIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  ChartPieIcon,
  TableCellsIcon,
  BanknotesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { format, subDays, subMonths } from 'date-fns'

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  })
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [customers, setCustomers] = useState([])
  const [reportType, setReportType] = useState('aging')
  const [reportFormat, setReportFormat] = useState('excel')

  useEffect(() => {
    fetchCustomers()
  }, [])

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

  const handleDownloadReport = async (type) => {
    setLoading(true)
    try {
      let url = ''
      let filename = ''

      switch (type) {
        case 'aging':
          url = '/reports/aging'
          filename = `aging-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
          break
        case 'payments':
          if (!dateRange.startDate || !dateRange.endDate) {
            toast.error('Please select start and end dates')
            setLoading(false)
            return
          }
          url = `/reports/payments?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
          filename = `payment-report-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`
          break
        case 'customers':
          url = '/reports/customers'
          filename = `customer-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
          break
        case 'ledger':
          if (!selectedCustomer) {
            toast.error('Please select a customer')
            setLoading(false)
            return
          }
          const customer = customers.find(c => c._id === selectedCustomer)
          // ✅ FORCE PDF FOR LEDGER STATEMENTS - IGNORE reportFormat
          url = `/reports/ledger/${selectedCustomer}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
          filename = `ledger-${customer?.name?.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
          break
        case 'due':
          url = '/reports/aging'
          filename = `due-summary-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
          break
      }

      console.log('📡 Downloading report:', url)
      console.log('📁 Filename:', filename)
      
      const response = await api.get(url, {
        responseType: 'blob',
        timeout: 30000
      })

      console.log('📦 Response headers:', response.headers)
      console.log('📦 Response size:', response.data.size)
      console.log('📦 Response type:', response.data.type)

      // Create blob with correct type
      const blob = new Blob([response.data], { 
        type: type === 'ledger' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
      }, 100)

      toast.success(`${type === 'ledger' ? 'Ledger statement' : type.charAt(0).toUpperCase() + type.slice(1)} downloaded successfully`)
    } catch (error) {
      console.error('❌ Error downloading report:', error)
      
      // Better error handling
      if (error.response?.data instanceof Blob) {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result)
            toast.error(errorData.message || 'Failed to download report')
          } catch {
            toast.error('Failed to download report - server error')
          }
        }
        reader.readAsText(error.response.data)
      } else {
        toast.error(error.response?.data?.message || 'Failed to download report')
      }
    } finally {
      setLoading(false)
    }
  }

  const customerOptions = customers.map(c => ({
    value: c._id,
    label: `${c.name} - ${c.phone}`
  }))

  const reportCards = [
    {
      id: 'aging',
      title: 'Aging Report',
      description: 'Detailed aging analysis of outstanding receivables',
      icon: ChartPieIcon,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      stats: '0-30, 31-60, 61-90, 90+ days',
      requiresDate: false,
      requiresCustomer: false,
      format: 'excel',
    },
    {
      id: 'payments',
      title: 'Payment Summary',
      description: 'Complete record of all payments within date range',
      icon: BanknotesIcon,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      stats: 'Total payments, method breakdown',
      requiresDate: true,
      requiresCustomer: false,
      format: 'excel',
    },
    {
      id: 'customers',
      title: 'Customer Summary',
      description: 'Comprehensive customer list with balances and activity',
      icon: UserGroupIcon,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      stats: `${customers.length} active customers`,
      requiresDate: false,
      requiresCustomer: false,
      format: 'excel',
    },
    {
      id: 'ledger',
      title: 'Ledger Statement',
      description: 'Complete transaction history for selected customer',
      icon: DocumentTextIcon,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      stats: 'All transactions with running balance',
      requiresDate: true,
      requiresCustomer: true,
      format: 'pdf', // ✅ Force PDF for ledger
    },
    {
      id: 'due',
      title: 'Due Summary',
      description: 'All customers with outstanding balances',
      icon: BellAlertIcon,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      stats: 'Overdue, due today, due this week',
      requiresDate: false,
      requiresCustomer: false,
      format: 'excel',
    },
  ]

  // Set format automatically when report type changes
  useEffect(() => {
    const report = reportCards.find(r => r.id === reportType)
    if (report) {
      setReportFormat(report.format)
    }
  }, [reportType])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">
          Generate detailed reports and export data for analysis
        </p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Generate Custom Report</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            >
              <option value="aging">Aging Report</option>
              <option value="payments">Payment Summary</option>
              <option value="customers">Customer Summary</option>
              <option value="ledger">Ledger Statement</option>
              <option value="due">Due Summary</option>
            </select>
          </div>

          {/* Date Range - Conditional */}
          {reportCards.find(r => r.id === reportType)?.requiresDate && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>
            </>
          )}

          {/* Customer Selection - Conditional */}
          {reportCards.find(r => r.id === reportType)?.requiresCustomer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Customer
              </label>
              <Select
                options={customerOptions}
                value={customerOptions.find(opt => opt.value === selectedCustomer)}
                onChange={(option) => setSelectedCustomer(option?.value || '')}
                placeholder="Choose a customer..."
                isClearable
                isSearchable
                className="react-select"
                classNamePrefix="select"
              />
            </div>
          )}

          {/* Format Selection - SHOW BUT DISABLE for Ledger */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setReportFormat('pdf')}
                disabled={reportType !== 'ledger'}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 rounded-xl transition
                  ${reportFormat === 'pdf'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }
                  ${reportType !== 'ledger' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <DocumentTextIcon className="w-5 h-5" />
                PDF
              </button>
              <button
                type="button"
                onClick={() => setReportFormat('excel')}
                disabled={reportType === 'ledger'} // ✅ Disable Excel for Ledger
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 rounded-xl transition
                  ${reportFormat === 'excel'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }
                  ${reportType === 'ledger' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <TableCellsIcon className="w-5 h-5" />
                Excel
              </button>
            </div>
            {reportType === 'ledger' && (
              <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                <DocumentTextIcon className="w-3 h-3" />
                Ledger statements are only available in PDF format
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => handleDownloadReport(reportType)}
            disabled={loading || (reportCards.find(r => r.id === reportType)?.requiresCustomer && !selectedCustomer)}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="w-5 h-5" />
                Generate {reportType === 'ledger' ? 'PDF' : 'Report'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer"
            onClick={() => setReportType(report.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${report.bgColor} rounded-xl flex items-center justify-center`}>
                <report.icon className={`w-6 h-6 ${report.textColor}`} />
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {report.format === 'pdf' ? 'PDF' : 'Excel'}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Available
                </span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">{report.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{report.description}</p>
            
            <div className="border-t border-gray-100 pt-4 mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Summary:</span>
                <span className="font-medium text-gray-900">{report.stats}</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setReportType(report.id)
                if (!report.requiresDate && !report.requiresCustomer) {
                  handleDownloadReport(report.id)
                }
              }}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2 text-sm font-medium"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Download {report.format === 'pdf' ? 'PDF' : 'Report'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}