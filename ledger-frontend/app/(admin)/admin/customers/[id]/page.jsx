'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BellAlertIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [transactions, setTransactions] = useState([])
  const [dueSummary, setDueSummary] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPortalModal, setShowPortalModal] = useState(false)
  const [portalForm, setPortalForm] = useState({
    email: '',
    password: '',
  })

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
        api.get(`/ledger/${params.id}?limit=10`),
        api.get(`/due/${params.id}`),
      ])

      setCustomer(customerRes.data)
      setTransactions(ledgerRes.data.entries || [])
      setDueSummary(dueRes.data)
    } catch (error) {
      console.error('Error fetching customer data:', error)
      toast.error('Failed to load customer data')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/customers/${params.id}`)
      toast.success('Customer deleted successfully')
      router.push('/admin/customers')
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('Failed to delete customer')
    }
  }

  const handleCreatePortalAccess = async (e) => {
    e.preventDefault()
    try {
      await api.post('/customers/portal-access', {
        customerId: params.id,
        email: portalForm.email,
        password: portalForm.password,
      })
      toast.success('Portal access created successfully')
      setShowPortalModal(false)
      fetchCustomerData()
    } catch (error) {
      console.error('Error creating portal access:', error)
      toast.error(error.response?.data?.message || 'Failed to create portal access')
    }
  }

  const handleRevokePortalAccess = async () => {
    if (!confirm('Are you sure you want to revoke portal access?')) return
    
    try {
      await api.delete(`/customers/${params.id}/portal-access`)
      toast.success('Portal access revoked successfully')
      fetchCustomerData()
    } catch (error) {
      console.error('Error revoking portal access:', error)
      toast.error('Failed to revoke portal access')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="loader"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">Customer not found</h3>
        <p className="text-gray-600 mb-6">The customer you're looking for doesn't exist.</p>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Customers
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600 mt-1">Customer ID: {customer._id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!customer.portalUser ? (
            <button
              onClick={() => setShowPortalModal(true)}
              className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center gap-2"
            >
              <UserPlusIcon className="w-5 h-5" />
              Create Portal Access
            </button>
          ) : (
            <button
              onClick={handleRevokePortalAccess}
              className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2"
            >
              <XCircleIcon className="w-5 h-5" />
              Revoke Portal Access
            </button>
          )}
          <Link
            href={`/admin/customers/${params.id}/edit`}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
          >
            <PencilSquareIcon className="w-5 h-5" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2"
          >
            <TrashIcon className="w-5 h-5" />
            Delete
          </button>
        </div>
      </div>

      {/* Customer Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Current Balance</p>
            <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className={`text-3xl font-bold ${
            customer.currentBalance > 0 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            Rs. {customer.currentBalance?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {customer.currentBalance > 0 ? 'Outstanding balance' : 'No due'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Credit Limit</p>
            <CheckCircleIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            Rs. {customer.creditLimit?.toLocaleString() || 0}
          </p>
          {customer.creditLimit > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Available: Rs. {Math.max(0, customer.creditLimit - (customer.currentBalance || 0)).toLocaleString()}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Total Purchases</p>
            <ArrowTrendingDownIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            Rs. {customer.totalPurchases?.toLocaleString() || 0}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">Total Payments</p>
            <ArrowTrendingUpIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            Rs. {customer.totalPayments?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Customer Info & Due Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <PhoneIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone Number</p>
                <p className="text-gray-900 font-medium">{customer.phone}</p>
              </div>
            </div>

            {customer.email && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <EnvelopeIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email Address</p>
                  <p className="text-gray-900 font-medium">{customer.email}</p>
                </div>
              </div>
            )}

            {customer.address && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPinIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-gray-900 font-medium">{customer.address}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Default Due Period</p>
                <p className="text-gray-900 font-medium">{customer.defaultDuePeriod || 30} days</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                {customer.smsEnabled ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">SMS Notifications</p>
                <p className="text-gray-900 font-medium">
                  {customer.smsEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created By</p>
                <p className="text-gray-900 font-medium">{customer.createdBy?.name || 'System'}</p>
                <p className="text-sm text-gray-500">
                  {new Date(customer.createdAt).toLocaleDateString('en-PK', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Due Summary */}
        {dueSummary && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BellAlertIcon className="w-5 h-5 text-gray-500" />
              Due Summary
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Total Due</span>
                  <span className="text-2xl font-bold text-yellow-600">
                    Rs. {dueSummary.totalDue?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((dueSummary.totalDue || 0) / (customer.creditLimit || 1)) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                  <span className="text-sm font-medium text-red-700">Overdue</span>
                  <span className="font-bold text-red-700">
                    Rs. {dueSummary.overdueAmount?.toLocaleString() || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-xl">
                  <span className="text-sm font-medium text-yellow-700">Due Today</span>
                  <span className="font-bold text-yellow-700">
                    Rs. {dueSummary.dueToday?.toLocaleString() || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                  <span className="text-sm font-medium text-blue-700">Due This Week</span>
                  <span className="font-bold text-blue-700">
                    Rs. {dueSummary.dueThisWeek?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Aging Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">0-30 Days</span>
                    <span className="font-medium text-gray-900">
                      Rs. {dueSummary.aging?.['0-30']?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">31-60 Days</span>
                    <span className="font-medium text-gray-900">
                      Rs. {dueSummary.aging?.['31-60']?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">61-90 Days</span>
                    <span className="font-medium text-gray-900">
                      Rs. {dueSummary.aging?.['61-90']?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">90+ Days</span>
                    <span className="font-medium text-gray-900">
                      Rs. {dueSummary.aging?.['90+']?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`
                py-4 px-6 text-sm font-medium border-b-2 transition
                ${activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`
                py-4 px-6 text-sm font-medium border-b-2 transition
                ${activeTab === 'ledger'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Ledger History
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`
                py-4 px-6 text-sm font-medium border-b-2 transition
                ${activeTab === 'payments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Payments
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'ledger' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
                <Link
                  href={`/admin/ledger?customer=${params.id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${transaction.debit > 0 ? 'bg-red-100' : 'bg-green-100'}
                      `}>
                        {transaction.debit > 0 ? (
                          <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />
                        ) : (
                          <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('en-PK', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`
                        text-lg font-bold
                        ${transaction.debit > 0 ? 'text-red-600' : 'text-green-600'}
                      `}>
                        {transaction.debit > 0 ? '-' : '+'}
                        Rs. {(transaction.debit || transaction.credit).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Balance: Rs. {transaction.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}

                {transactions.length === 0 && (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No transactions found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Recent Payments</h3>
                <Link
                  href={`/admin/payments/new?customer=${params.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Record Payment
                </Link>
              </div>
              {/* Payment history will be implemented next */}
              <p className="text-gray-600 text-center py-8">Payment history coming soon</p>
            </div>
          )}

          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Account Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Member Since</p>
                  <p className="font-medium text-gray-900">
                    {new Date(customer.createdAt).toLocaleDateString('en-PK', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Last Activity</p>
                  <p className="font-medium text-gray-900">
                    {customer.lastActivity
                      ? new Date(customer.lastActivity).toLocaleDateString('en-PK', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'No activity'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <TrashIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Delete Customer</h3>
                <p className="text-gray-600">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <span className="font-semibold">{customer.name}</span>?
              All associated ledger entries, payments, and SMS logs will also be permanently removed.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium"
              >
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Portal Access Modal */}
      {showPortalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <UserPlusIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Create Portal Access</h3>
                <p className="text-gray-600">Set up customer login credentials</p>
              </div>
            </div>

            <form onSubmit={handleCreatePortalAccess}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={portalForm.email}
                    onChange={(e) => setPortalForm({ ...portalForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                    placeholder="customer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={portalForm.password}
                    onChange={(e) => setPortalForm({ ...portalForm, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowPortalModal(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
                >
                  Create Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}