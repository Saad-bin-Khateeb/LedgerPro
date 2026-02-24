'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export default function StaffSMSLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    fetchLogs()
    fetchCustomers()
  }, [typeFilter])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      let url = '/sms?limit=100'
      if (typeFilter !== 'all') {
        url += `&type=${typeFilter}`
      }
      const response = await api.get(url)
      setLogs(response.data.logs || [])
    } catch (error) {
      console.error('Error fetching SMS logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers?limit=1000')
      setCustomers(response.data.customers || response.data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c._id === customerId)
    return customer?.name || 'Unknown Customer'
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'payment': return <CheckCircleIcon className="w-4 h-4" />
      case 'due_reminder': return <ClockIcon className="w-4 h-4" />
      case 'overdue': return <XCircleIcon className="w-4 h-4" />
      default: return <ChatBubbleLeftRightIcon className="w-4 h-4" />
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'payment': return 'bg-green-100 text-green-700'
      case 'due_reminder': return 'bg-yellow-100 text-yellow-700'
      case 'overdue': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700'
      case 'sent': return 'bg-blue-100 text-blue-700'
      case 'failed': return 'bg-red-100 text-red-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredLogs = logs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        getCustomerName(log.customer)?.toLowerCase().includes(query) ||
        log.message?.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SMS Logs</h1>
        <p className="text-gray-600 mt-1">View message history • Read Only</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
          >
            <option value="all">All Message Types</option>
            <option value="payment">Payment Confirmation</option>
            <option value="due_reminder">Due Reminder</option>
            <option value="overdue">Overdue Notice</option>
          </select>

          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg">
            <EnvelopeIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              Total: {filteredLogs.length} messages
            </span>
          </div>
        </div>
      </div>

      {/* SMS Logs List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="loader"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No SMS logs found</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        {format(new Date(log.sentAt || log.createdAt), 'dd MMM yyyy, hh:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {getCustomerName(log.customer)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="text-sm text-gray-700 line-clamp-2">{log.message}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium ${getTypeColor(log.type)}`}>
                        {getTypeIcon(log.type)}
                        <span className="capitalize">{log.type?.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {log.status === 'delivered' && <CheckCircleIcon className="w-3 h-3" />}
                        {log.status === 'sent' && <EnvelopeIcon className="w-3 h-3" />}
                        {log.status === 'failed' && <XCircleIcon className="w-3 h-3" />}
                        {log.status === 'pending' && <ClockIcon className="w-3 h-3" />}
                        <span className="capitalize">{log.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium ${
                        log.via === 'whatsapp' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {log.via === 'whatsapp' ? (
                          <ChatBubbleLeftRightIcon className="w-3 h-3" />
                        ) : (
                          <EnvelopeIcon className="w-3 h-3" />
                        )}
                        <span className="capitalize">{log.via || 'sms'}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compose SMS - Restricted */}
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">SMS Sending Restricted</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Staff can view SMS logs but cannot send messages.
          Please contact an administrator to send SMS messages.
        </p>
      </div>
    </div>
  )
}