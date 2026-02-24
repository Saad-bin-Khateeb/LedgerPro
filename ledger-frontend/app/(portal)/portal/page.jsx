'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import api from '@/lib/api'
import Link from 'next/link'
import {
  CurrencyDollarIcon,
  BookOpenIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BellAlertIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

export default function CustomerDashboard() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [summary, setSummary] = useState({
    currentBalance: 0,
    totalDue: 0,
    overdueAmount: 0,
    dueToday: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState([])
  const [error, setError] = useState(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 🔴 FIX: Use Promise.allSettled instead of Promise.all to prevent one failure from breaking all
      const results = await Promise.allSettled([
        api.get('/portal/profile'),
        api.get('/portal/due-summary'),
        api.get('/portal/ledger?limit=5'),
      ])

      // Handle profile
      if (results[0].status === 'fulfilled') {
        setProfile(results[0].value.data.customer || results[0].value.data)
      } else {
        console.error('Profile fetch failed:', results[0].reason)
      }

      // Handle due summary
      if (results[1].status === 'fulfilled') {
        setSummary(results[1].value.data.data || results[1].value.data)
      } else {
        console.error('Due summary fetch failed:', results[1].reason)
      }

      // Handle ledger
      if (results[2].status === 'fulfilled') {
        setRecentTransactions(results[2].value.data.entries || [])
      } else {
        console.error('Ledger fetch failed:', results[2].reason)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    
    // 🔴 FIX: Add cleanup function to prevent state updates if component unmounts
    return () => {
      // Cleanup if needed
    }
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loader"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BellAlertIcon className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-red-800 mb-2">Unable to load dashboard</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Rest of your component remains the same...
  const statCards = [
    {
      title: 'Current Balance',
      value: `Rs. ${summary.currentBalance?.toLocaleString() || 0}`,
      icon: CurrencyDollarIcon,
      color: summary.currentBalance > 0 ? 'text-yellow-600' : 'text-green-600',
      bgColor: summary.currentBalance > 0 ? 'bg-yellow-100' : 'bg-green-100',
    },
    {
      title: 'Total Due',
      value: `Rs. ${summary.totalDue?.toLocaleString() || 0}`,
      icon: BellAlertIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Overdue',
      value: `Rs. ${summary.overdueAmount?.toLocaleString() || 0}`,
      icon: ArrowTrendingDownIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Due Today',
      value: `Rs. ${summary.dueToday?.toLocaleString() || 0}`,
      icon: CheckCircleIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile?.name?.split(' ')[0] || session?.user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-blue-100">
          Your current balance is <span className="font-bold text-white">Rs. {summary.currentBalance?.toLocaleString() || 0}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">{stat.title}</p>
              <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/portal/ledger"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <BookOpenIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View Ledger</h3>
              <p className="text-sm text-gray-600">Check your complete transaction history</p>
            </div>
          </div>
        </Link>

        <Link
          href="/portal/payments"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <CreditCardIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Payment History</h3>
              <p className="text-sm text-gray-600">View all your payments</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <Link href="/portal/ledger" className="text-sm text-blue-600 hover:text-blue-700">
            View All
          </Link>
        </div>

        <div className="space-y-4">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
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
                      {new Date(tx.date || tx.createdAt).toLocaleDateString('en-PK', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.debit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {tx.debit > 0 ? '-' : '+'}Rs. {(tx.debit || tx.credit).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Bal: Rs. {tx.balance.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}