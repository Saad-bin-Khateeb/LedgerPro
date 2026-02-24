'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  HomeIcon,
  UserGroupIcon,
  BookOpenIcon,
  CreditCardIcon,
  ChartBarIcon,
  BellAlertIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { signOut } from 'next-auth/react'

export default function StaffLayout({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session.user.role !== 'staff') {
      if (session.user.role === 'admin') router.push('/admin')
      else if (session.user.role === 'customer') router.push('/portal')
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader"></div>
      </div>
    )
  }

  if (session?.user?.role !== 'staff') {
    return null
  }

  const navigation = [
    { name: 'Dashboard', href: '/staff', icon: HomeIcon },
    { name: 'Customers', href: '/staff/customers', icon: UserGroupIcon },
    { name: 'Ledger', href: '/staff/ledger', icon: BookOpenIcon },
    { name: 'Payments', href: '/staff/payments', icon: CreditCardIcon },
    { name: 'Reports', href: '/staff/reports', icon: ChartBarIcon },
    { name: 'SMS Logs', href: '/staff/sms-logs', icon: BellAlertIcon },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Staff Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Staff Portal</span>
              <span className="ml-4 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Staff Access
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session.user.name} 
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const isActive = typeof window !== 'undefined' && 
                window.location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    inline-flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition
                    ${isActive
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}