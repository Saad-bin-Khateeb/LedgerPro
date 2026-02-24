'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import api from '@/lib/api'
// import DashboardStats from '@/components/ui/DashboardStats' // ❌ Temporarily remove
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  CreditCardIcon,
  BellAlertIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalDue: 0,
    totalOverdue: 0,
    totalPayments: 0,
    recentTransactions: [],
    dueChartData: [],
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
        totalCustomers: customersRes.data.length || 0,
        totalDue: dueRes.data.totalDue || 0,
        totalOverdue: dueRes.data.overdueAmount || 0,
        totalPayments: paymentsRes.data.payments?.length || 0,
        recentTransactions: paymentsRes.data.payments || [],
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: UserGroupIcon,
      change: '+12%',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Total Due',
      value: `Rs. ${stats.totalDue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      change: '+5%',
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      title: 'Overdue Amount',
      value: `Rs. ${stats.totalOverdue.toLocaleString()}`,
      icon: BellAlertIcon,
      change: '-8%',
      color: 'from-red-500 to-red-600',
    },
    {
      title: 'Today\'s Payments',
      value: stats.totalPayments,
      icon: CreditCardIcon,
      change: '+23%',
      color: 'from-green-500 to-green-600',
    },
  ]

  // ✅ RENDER STATS DIRECTLY (without DashboardStats component)
  const renderStats = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-sm text-green-600 mt-1">{stat.change}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Admin'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Grid - Direct rendering */}
      {renderStats()}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Payments</h2>
          <div className="space-y-4">
            {stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.customer?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.method} • {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    +Rs. {transaction.amount?.toLocaleString() || 0}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent payments</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Due Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <CurrencyDollarIcon className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Current Due</p>
                  <p className="text-sm text-gray-600">Total outstanding balance</p>
                </div>
              </div>
              <div className="text-lg font-bold text-yellow-600">
                Rs. {stats.totalDue.toLocaleString()}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <BellAlertIcon className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Overdue</p>
                  <p className="text-sm text-gray-600">Past due date</p>
                </div>
              </div>
              <div className="text-lg font-bold text-red-600">
                Rs. {stats.totalOverdue.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}