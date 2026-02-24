'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import api from '@/lib/api'
import Link from 'next/link'
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  CreditCardIcon,
  BellAlertIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'

export default function StaffDashboard() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalDue: 0,
    totalOverdue: 0,
    recentPayments: [],
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [customersRes, dueRes, paymentsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/due/totals'),
        api.get('/payments?limit=5'),
      ])

      setStats({
        totalCustomers: customersRes.data.customers?.length || customersRes.data.length || 0,
        totalDue: dueRes.data.totalDue || 0,
        totalOverdue: dueRes.data.overdueAmount || 0,
        recentPayments: paymentsRes.data.payments || [],
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: UserGroupIcon,
      color: 'from-blue-500 to-blue-600',
      href: '/staff/customers',
    },
    {
      title: 'Total Due',
      value: `Rs. ${stats.totalDue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'from-yellow-500 to-yellow-600',
      href: '/staff/reports',
    },
    {
      title: 'Overdue Amount',
      value: `Rs. ${stats.totalOverdue.toLocaleString()}`,
      icon: BellAlertIcon,
      color: 'from-red-500 to-red-600',
      href: '/staff/reports',
    },
    {
      title: 'Today\'s Payments',
      value: stats.recentPayments.length,
      icon: CreditCardIcon,
      color: 'from-green-500 to-green-600',
      href: '/staff/payments',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {session?.user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's your daily overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Link
            key={index}
            href={card.href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
          <Link href="/staff/payments" className="text-sm text-green-600 hover:text-green-700">
            View All
          </Link>
        </div>

        <div className="space-y-4">
          {stats.recentPayments.length > 0 ? (
            stats.recentPayments.map((payment) => (
              <div key={payment._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{payment.customer?.name}</p>
                    <p className="text-xs text-gray-500">
                      {payment.method} • {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold text-green-600">
                  +Rs. {payment.amount?.toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent payments</p>
          )}
        </div>
      </div>
    </div>
  )
}