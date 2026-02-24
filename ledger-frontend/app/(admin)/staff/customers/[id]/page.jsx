'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import {
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'

export default function StaffCustomerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [dueSummary, setDueSummary] = useState(null)

  useEffect(() => {
    if (params.id) {
      fetchCustomerData()
    }
  }, [params.id])

  const fetchCustomerData = async () => {
    try {
      setLoading(true)
      const [customerRes, ledgerRes, dueRes] = await Promise.all([
        api.get(`/customers/${params.id}`),
        api.get(`/ledger/${params.id}?limit=5`),
        api.get(`/due/${params.id}`),
      ])

      setCustomer(customerRes.data)
      setTransactions(ledgerRes.data.entries || [])
      setDueSummary(dueRes.data)
    } catch (error) {
      console.error('Error fetching customer data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loader"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Customer not found</h3>
        <Link href="/staff/customers" className="mt-4 inline-flex items-center gap-2 text-green-600 hover:text-green-700">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Customers
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/staff/customers"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-gray-600">Customer Profile • View Only</p>
        </div>
        <span className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
          Read Only
        </span>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Current Balance</p>
            <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className={`text-2xl font-bold ${customer.currentBalance > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
            Rs. {customer.currentBalance?.toLocaleString() || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Credit Limit</p>
            <CheckCircleIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            Rs. {customer.creditLimit?.toLocaleString() || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Purchases</p>
            <ArrowTrendingDownIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            Rs. {customer.totalPurchases?.toLocaleString() || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Payments</p>
            <ArrowTrendingUpIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            Rs. {customer.totalPayments?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="text-gray-900">{customer.phone}</p>
              </div>
            </div>
            {customer.email && (
              <div className="flex items-start gap-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="text-gray-900">{customer.email}</p>
                </div>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-900">{customer.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Due Summary */}
        {dueSummary && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Due Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-yellow-700">Total Due</span>
                <span className="font-bold text-yellow-700">
                  Rs. {dueSummary.totalDue?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-red-700">Overdue</span>
                <span className="font-bold text-red-700">
                  Rs. {dueSummary.overdueAmount?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-700">Due Today</span>
                <span className="font-bold text-blue-700">
                  Rs. {dueSummary.dueToday?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <Link
            href={`/staff/ledger?customer=${customer._id}`}
            className="text-sm text-green-600 hover:text-green-700"
          >
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.debit > 0 ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {tx.debit > 0 ? (
                      <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
                    ) : (
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.date || tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.debit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {tx.debit > 0 ? '-' : '+'}Rs. {(tx.debit || tx.credit).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No transactions found</p>
          )}
        </div>
      </div>
    </div>
  )
}