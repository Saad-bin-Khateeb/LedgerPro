'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import {
  CalendarIcon,
  CreditCardIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/portal/payments')
      setPayments(response.data.payments || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMethodIcon = (method) => {
    switch (method) {
      case 'cash': return <BanknotesIcon className="w-4 h-4" />
      case 'bank': return <BuildingLibraryIcon className="w-4 h-4" />
      case 'online': return <CreditCardIcon className="w-4 h-4" />
      default: return <CreditCardIcon className="w-4 h-4" />
    }
  }

  const getMethodColor = (method) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-700'
      case 'bank': return 'bg-blue-100 text-blue-700'
      case 'online': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredPayments = payments.filter(payment => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        payment.receiptNumber?.toLowerCase().includes(query) ||
        payment.reference?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
        <p className="text-gray-600 mt-1">View your payment history</p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 mb-1">Total Payments Made</p>
            <p className="text-3xl font-bold">Rs. {totalPayments.toLocaleString()}</p>
            <p className="text-green-100 mt-2">{payments.length} transactions</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <CreditCardIcon className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by receipt or reference number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loader"></div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCardIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
            <p className="text-gray-600">Your payment history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPayments.map((payment) => (
              <div key={payment._id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${getMethodColor(payment.method)} rounded-full flex items-center justify-center`}>
                      {getMethodIcon(payment.method)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {payment.receiptNumber || 'N/A'}
                        </span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircleIcon className="w-3 h-3" />
                          Completed
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {format(new Date(payment.receivedDate || payment.createdAt), 'dd MMM yyyy')}
                        </span>
                        <span className="capitalize">
                          via {payment.method}
                        </span>
                        {payment.reference && (
                          <span className="text-gray-500">
                            Ref: {payment.reference}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-green-600">
                      Rs. {payment.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => window.open(`/api/payments/${payment._id}/receipt`)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Download Receipt"
                    >
                      <DocumentArrowDownIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}