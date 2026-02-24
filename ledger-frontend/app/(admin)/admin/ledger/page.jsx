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
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  BanknotesIcon,
  EllipsisHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function LedgerPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [customers, setCustomers] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchLedgerEntries()
    fetchCustomers()
  }, [pagination.page, typeFilter, customerFilter, dateRange])

  const fetchLedgerEntries = async () => {
    try {
      setLoading(true)
      let url = `/ledger?page=${pagination.page}&limit=${pagination.limit}`
      
      if (customerFilter !== 'all') {
        url += `&customer=${customerFilter}`
      }
      
      if (dateRange.start) {
        url += `&startDate=${dateRange.start}`
      }
      
      if (dateRange.end) {
        url += `&endDate=${dateRange.end}`
      }

      const response = await api.get(url)
      setEntries(response.data.entries || [])
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0
      }))
    } catch (error) {
      console.error('Error fetching ledger:', error)
      toast.error('Failed to load ledger entries')
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

  const clearDateRange = () => {
    setDateRange({ start: '', end: '' })
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setCustomerFilter('all')
    setTypeFilter('all')
    setDateRange({ start: '', end: '' })
  }

  const filteredEntries = entries.filter(entry => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        entry.description?.toLowerCase().includes(query) ||
        entry.customer?.name?.toLowerCase().includes(query) ||
        entry.reference?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const getMethodIcon = (method) => {
    switch (method) {
      case 'cash': return <BanknotesIcon className="w-3 h-3" />
      case 'bank': return <BuildingLibraryIcon className="w-3 h-3" />
      case 'online': return <CreditCardIcon className="w-3 h-3" />
      default: return <EllipsisHorizontalIcon className="w-3 h-3" />
    }
  }

  const getTypeBadge = (entry) => {
    if (entry.debit > 0) {
      return 'bg-red-50 text-red-700 border border-red-200'
    }
    return 'bg-green-50 text-green-700 border border-green-200'
  }

  const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0)
  const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0)

  const hasActiveFilters = searchQuery || customerFilter !== 'all' || typeFilter !== 'all' || dateRange.start || dateRange.end

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ledger Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            View and manage all debit/credit transactions
          </p>
        </div>
        <Link
          href="/admin/ledger/new"
          className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg text-sm sm:text-base whitespace-nowrap"
        >
          <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>New Entry</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Debits</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600 mt-1 sm:mt-2">
                Rs. {totalDebit.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <ArrowTrendingDownIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Credits</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1 sm:mt-2">
                Rs. {totalCredit.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Net Balance</p>
              <p className={`text-lg sm:text-2xl font-bold mt-1 sm:mt-2 ${
                totalCredit - totalDebit > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                Rs. {(totalCredit - totalDebit).toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <CurrencyDollarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar - Compact and Beautiful */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Quick Filter Row */}
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Left side - Search and Filter Toggle */}
            <div className="flex-1 flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${showFilters 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }
                `}
              >
                <FunnelIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">
                    {(searchQuery ? 1 : 0) + 
                     (customerFilter !== 'all' ? 1 : 0) + 
                     (typeFilter !== 'all' ? 1 : 0) + 
                     (dateRange.start || dateRange.end ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Right side - Customer & Type quick filters */}
            <div className="flex items-center gap-3">
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white min-w-[160px]"
              >
                <option value="all">All Customers</option>
                {customers.slice(0, 50).map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white min-w-[140px]"
              >
                <option value="all">All Types</option>
                <option value="debit">Debits Only</option>
                <option value="credit">Credits Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* 🔥 BEAUTIFUL DATE RANGE PICKER - FLOATING CARD DESIGN */}
        {showFilters && (
          <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 animate-slideDown">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
              {/* Date Range Title */}
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                  <CalendarIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Date Range</p>
                  <p className="text-xs text-gray-500">Filter by transaction date</p>
                </div>
              </div>

              {/* Dual Date Pickers - Side by Side with Icons */}
              <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Start Date */}
                <div className="relative w-full sm:w-48">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                    placeholder="Start date"
                  />
                  {dateRange.start && (
                    <button
                      onClick={() => setDateRange({ ...dateRange, start: '' })}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center"
                    >
                      <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                  <span className="absolute -top-2 left-3 px-1 bg-white text-xs text-gray-500">
                    From
                  </span>
                </div>

                {/* Separator - Arrow or Line */}
                <div className="hidden sm:flex items-center justify-center w-8">
                  <div className="w-6 h-px bg-gradient-to-r from-gray-300 to-gray-400"></div>
                </div>
                <span className="sm:hidden text-xs text-gray-500 ml-1">to</span>

                {/* End Date */}
                <div className="relative w-full sm:w-48">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                    placeholder="End date"
                    min={dateRange.start || undefined}
                  />
                  {dateRange.end && (
                    <button
                      onClick={() => setDateRange({ ...dateRange, end: '' })}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center"
                    >
                      <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                  <span className="absolute -top-2 left-3 px-1 bg-white text-xs text-gray-500">
                    To
                  </span>
                </div>

                {/* Quick Date Range Selectors */}
                <div className="flex items-center gap-2 ml-auto">
                  {(dateRange.start || dateRange.end) && (
                    <button
                      onClick={clearDateRange}
                      className="px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition flex items-center gap-1"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const today = new Date()
                      const weekAgo = new Date()
                      weekAgo.setDate(today.getDate() - 7)
                      setDateRange({
                        start: format(weekAgo, 'yyyy-MM-dd'),
                        end: format(today, 'yyyy-MM-dd')
                      })
                    }}
                    className="px-3 py-2 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                  >
                    Last 7 days
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date()
                      const monthAgo = new Date()
                      monthAgo.setMonth(today.getMonth() - 1)
                      setDateRange({
                        start: format(monthAgo, 'yyyy-MM-dd'),
                        end: format(today, 'yyyy-MM-dd')
                      })
                    }}
                    className="px-3 py-2 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                  >
                    Last 30 days
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters & Actions */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {hasActiveFilters ? (
              <>
                <span className="text-xs text-gray-500">Active filters:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                      Search: {searchQuery}
                      <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {customerFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                      Customer: {customers.find(c => c._id === customerFilter)?.name}
                      <button onClick={() => setCustomerFilter('all')} className="hover:text-blue-900">
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {typeFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                      Type: {typeFilter}
                      <button onClick={() => setTypeFilter('all')} className="hover:text-blue-900">
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {(dateRange.start || dateRange.end) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                      Date: {dateRange.start || '...'} → {dateRange.end || '...'}
                      <button onClick={clearDateRange} className="hover:text-blue-900">
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-400">No active filters</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 hover:bg-gray-200 rounded-lg transition flex items-center gap-1"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
                Clear all
              </button>
            )}
            <button
              onClick={fetchLedgerEntries}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-medium shadow-sm"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              Apply
            </button>
          </div>
        </div>
      </div>

           {/* Ledger Table - Responsive with No Horizontal Scroll */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Date
                    </th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Customer
                    </th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Description
                    </th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Type
                    </th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Debit
                    </th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Credit
                    </th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Balance
                    </th>
                    <th scope="col" className="hidden xl:table-cell px-3 sm:px-4 py-3 sm:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Due Date
                    </th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="px-3 sm:px-4 py-8 sm:py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="loader w-8 h-8 sm:w-10 sm:h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                          <p className="text-sm text-gray-500">Loading ledger entries...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-3 sm:px-4 py-8 sm:py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No entries found</h3>
                          <p className="text-sm text-gray-600 max-w-md mx-auto">
                            {searchQuery || customerFilter !== 'all' || typeFilter !== 'all' || dateRange.start || dateRange.end
                              ? 'No transactions match your current filters. Try adjusting your search criteria.'
                              : 'No ledger entries have been created yet. Click "New Entry" to add your first transaction.'}
                          </p>
                          {(searchQuery || customerFilter !== 'all' || typeFilter !== 'all' || dateRange.start || dateRange.end) && (
                            <button
                              onClick={clearAllFilters}
                              className="mt-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
                            >
                              <XMarkIcon className="w-4 h-4" />
                              Clear all filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => (
                      <tr key={entry._id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-700">
                            <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            <span className="font-medium">{format(new Date(entry.date || entry.createdAt), 'dd MMM yyyy')}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 sm:hidden">
                            {format(new Date(entry.date || entry.createdAt), 'hh:mm a')}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                              <span className="text-white text-xs font-semibold">
                                {entry.customer?.name?.charAt(0) || 'C'}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs sm:text-sm font-medium text-gray-900 block">
                                {entry.customer?.name || 'Unknown'}
                              </span>
                              {entry.customer?.phone && (
                                <span className="text-xs text-gray-500 hidden sm:block">
                                  {entry.customer.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 max-w-[150px] sm:max-w-[200px]">
                          <p className="text-xs sm:text-sm text-gray-900 font-medium truncate group-hover:text-gray-900 transition-colors">
                            {entry.description}
                          </p>
                          {entry.reference && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              Ref: {entry.reference}
                            </p>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-xs font-medium border ${getTypeBadge(entry)}`}>
                              {entry.debit > 0 ? (
                                <ArrowTrendingDownIcon className="w-3 h-3" />
                              ) : (
                                <ArrowTrendingUpIcon className="w-3 h-3" />
                              )}
                              <span className="hidden sm:inline">{entry.debit > 0 ? 'Debit' : 'Credit'}</span>
                              <span className="sm:hidden">{entry.debit > 0 ? 'D' : 'C'}</span>
                            </span>
                            {entry.paymentMethod && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                                {getMethodIcon(entry.paymentMethod)}
                                <span className="hidden sm:inline capitalize">{entry.paymentMethod}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-right">
                          {entry.debit > 0 ? (
                            <span className="text-xs sm:text-sm font-semibold text-red-600">
                              Rs. {entry.debit.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-xs sm:text-sm text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-right">
                          {entry.credit > 0 ? (
                            <span className="text-xs sm:text-sm font-semibold text-green-600">
                              Rs. {entry.credit.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-xs sm:text-sm text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-right">
                          <span className={`text-xs sm:text-sm font-bold ${
                            entry.balance > 0 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            Rs. {entry.balance.toLocaleString()}
                          </span>
                        </td>
                        <td className="hidden xl:table-cell px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-center">
                          {entry.dueDate ? (
                            <div className="flex flex-col items-center">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                new Date(entry.dueDate) < new Date() && entry.balance > 0
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {format(new Date(entry.dueDate), 'dd MMM yyyy')}
                              </span>
                              {new Date(entry.dueDate) < new Date() && entry.balance > 0 && (
                                <span className="text-xs text-red-600 mt-1 font-medium flex items-center gap-0.5">
                                  <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                                  Overdue
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs sm:text-sm">—</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-right">
                          <Link
                            href={`/admin/ledger/${entry._id}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium hover:underline transition-all"
                          >
                            View
                            <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform">→</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                    let pageNum
                    if (pagination.pages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i
                    } else {
                      pageNum = pagination.page - 2 + i
                    }
                    
                    return (
                      <button
                        key={i}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium transition ${
                          pagination.page === pageNum
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}