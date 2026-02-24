'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import {
  ArrowLeftIcon,
  UserIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  DocumentTextIcon,
  PhoneIcon,
  CheckCircleIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import Select from 'react-select'

export default function NewPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerId = searchParams.get('customer')

  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerBalance, setCustomerBalance] = useState(0)
  const [formData, setFormData] = useState({
    customer: customerId || '',
    amount: '',
    method: 'cash',
    reference: '',
    notes: '',
    via: 'sms',
    sendSms: true,
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (customerId && customers.length > 0) {
      // Find and set the selected customer from the customers list
      const customer = customers.find(c => c._id === customerId)
      if (customer) {
        setSelectedCustomer(customer)
        fetchCustomerBalance(customerId)
        setFormData(prev => ({ ...prev, customer: customerId }))
      }
    }
  }, [customerId, customers])

  // 🔴 FIX: Complete fetchCustomers function with proper response handling
  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true)
      const response = await api.get('/customers?limit=1000')
      
      console.log('📦 Customers API Response:', response.data)
      
      // Handle multiple response formats
      let customersList = []
      
      if (Array.isArray(response.data)) {
        // Direct array response
        customersList = response.data
      } else if (response.data.customers && Array.isArray(response.data.customers)) {
        // { customers: [...] } format
        customersList = response.data.customers
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // { data: [...] } format
        customersList = response.data.data
      } else if (response.data.data?.customers && Array.isArray(response.data.data.customers)) {
        // { data: { customers: [...] } } format
        customersList = response.data.data.customers
      }
      
      console.log('📋 Processed customers list:', customersList.length)
      setCustomers(customersList)
      
      if (customersList.length === 0) {
        toast.error('No customers found. Please add customers first.')
      }
    } catch (error) {
      console.error('❌ Error fetching customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setCustomersLoading(false)
    }
  }

  const fetchCustomerBalance = async (id) => {
    try {
      const response = await api.get(`/ledger/${id}/balance`)
      console.log('💰 Balance response:', response.data)
      
      // Handle multiple response formats
      let balance = 0
      if (response.data.data?.currentBalance !== undefined) {
        balance = response.data.data.currentBalance
      } else if (response.data.currentBalance !== undefined) {
        balance = response.data.currentBalance
      } else if (response.data.balance !== undefined) {
        balance = response.data.balance
      }
      
      setCustomerBalance(balance)
    } catch (error) {
      console.error('❌ Error fetching balance:', error)
      toast.error('Failed to fetch customer balance')
    }
  }

  const handleCustomerChange = (option) => {
    if (!option) {
      setSelectedCustomer(null)
      setFormData(prev => ({ ...prev, customer: '' }))
      setCustomerBalance(0)
      return
    }
    
    // Find the full customer object
    const customer = customers.find(c => c._id === option.value)
    setSelectedCustomer(customer)
    setFormData(prev => ({ ...prev, customer: customer._id }))
    
    if (customer?._id) {
      fetchCustomerBalance(customer._id)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.customer) {
      toast.error('Please select a customer')
      return
    }

    const amount = parseFloat(formData.amount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/payments', {
        ...formData,
        amount,
      })

      toast.success('Payment recorded successfully!')
      
      if (response.data.smsStatus?.success) {
        toast.success('SMS notification sent')
      }

      router.push(`/admin/payments?customer=${formData.customer}`)
    } catch (error) {
      console.error('❌ Error recording payment:', error)
      toast.error(error.response?.data?.message || 'Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  // 🔴 FIX: Transform customers to react-select options with null checks
  const customerOptions = customers?.filter(c => c && c._id && c.name)?.map(c => ({
    value: c._id,
    label: `${c.name} - ${c.phone || 'No phone'}`,
    ...c
  })) || []

  // Find the currently selected option
  const selectedOption = customerOptions.find(opt => opt.value === formData.customer)

  const newBalance = customerBalance - (parseFloat(formData.amount) || 0)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/payments"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Record Payment</h1>
          <p className="text-gray-600 mt-2">
            Record a payment received from customer
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Customer Selection */}
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-gray-500" />
              Customer Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Customer <span className="text-red-500">*</span>
                </label>
                {customersLoading ? (
                  <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                ) : (
                  <>
                    <Select
                      options={customerOptions}
                      value={selectedOption}
                      onChange={handleCustomerChange}
                      className="react-select"
                      classNamePrefix="select"
                      placeholder={customerOptions.length === 0 ? "No customers found" : "Search by name or phone..."}
                      isClearable
                      isSearchable
                      isDisabled={customerOptions.length === 0}
                      noOptionsMessage={() => "No customers available"}
                    />
                    {customerOptions.length === 0 && !customersLoading && (
                      <p className="text-xs text-red-500 mt-2">
                        No customers found. Please add customers first.
                      </p>
                    )}
                  </>
                )}
              </div>

              {selectedCustomer && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700">Current Balance</p>
                      <p className={`text-2xl font-bold ${
                        customerBalance > 0 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        Rs. {customerBalance.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-700">Phone</p>
                      <p className="text-lg font-medium text-blue-700 flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4" />
                        {selectedCustomer.phone || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details - Rest of your form remains the same */}
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-gray-500" />
              Payment Details
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    Rs.
                  </span>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 text-2xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, method: 'cash' })}
                    className={`
                      flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition
                      ${formData.method === 'cash'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <BanknotesIcon className={`w-6 h-6 ${
                      formData.method === 'cash' ? 'text-green-600' : 'text-gray-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      formData.method === 'cash' ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      Cash
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, method: 'bank' })}
                    className={`
                      flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition
                      ${formData.method === 'bank'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <BuildingLibraryIcon className={`w-6 h-6 ${
                      formData.method === 'bank' ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      formData.method === 'bank' ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      Bank
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, method: 'online' })}
                    className={`
                      flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition
                      ${formData.method === 'online'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <CreditCardIcon className={`w-6 h-6 ${
                      formData.method === 'online' ? 'text-purple-600' : 'text-gray-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      formData.method === 'online' ? 'text-purple-700' : 'text-gray-700'
                    }`}>
                      Online
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Cheque #, Transaction ID, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Additional notes about this payment..."
                />
              </div>
            </div>
          </div>

          {/* SMS Settings */}
          {selectedCustomer?.smsEnabled && (
            <div className="p-8 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BellAlertIcon className="w-5 h-5 text-gray-500" />
                SMS Notification
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sendSms: !formData.sendSms })}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition
                      ${formData.sendSms ? 'bg-green-600' : 'bg-gray-300'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition
                        ${formData.sendSms ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                  <div>
                    <p className="font-medium text-gray-900">Send Payment Confirmation</p>
                    <p className="text-sm text-gray-600">
                      Customer will receive SMS with payment details
                    </p>
                  </div>
                </div>

                {formData.sendSms && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send via
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="via"
                          value="sms"
                          checked={formData.via === 'sms'}
                          onChange={(e) => setFormData({ ...formData, via: e.target.value })}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-sm text-gray-700">SMS</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="via"
                          value="whatsapp"
                          checked={formData.via === 'whatsapp'}
                          onChange={(e) => setFormData({ ...formData, via: e.target.value })}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-sm text-gray-700">WhatsApp</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          {selectedCustomer && formData.amount && (
            <div className="p-8 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Preview</h2>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {selectedCustomer.name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedCustomer.name}</p>
                      <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Receipt #</p>
                    <p className="font-mono font-medium text-gray-900">
                      {`RCP-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-medium text-gray-900 mt-1 capitalize">
                        {formData.method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="text-3xl font-bold text-green-600">
                        Rs. {parseFloat(formData.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 mt-4 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-900">New Balance</p>
                    <p className={`text-2xl font-bold ${
                      newBalance > 0 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      Rs. {newBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="p-8 bg-gray-50 flex items-center justify-end gap-4">
            <Link
              href="/admin/payments"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.customer || !formData.amount || customersLoading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                'Record Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}