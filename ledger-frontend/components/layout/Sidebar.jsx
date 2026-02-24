'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  HomeIcon,
  UserGroupIcon,
  BookOpenIcon,
  CreditCardIcon,
  ChartBarIcon,
  BellAlertIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { signOut } from 'next-auth/react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Customers', href: '/admin/customers', icon: UserGroupIcon },
  { name: 'Ledger', href: '/admin/ledger', icon: BookOpenIcon },
  { name: 'Payments', href: '/admin/payments', icon: CreditCardIcon },
  { name: 'Due Reports', href: '/admin/reports', icon: ChartBarIcon },
  { name: 'SMS Logs', href: '/admin/sms-logs', icon: BellAlertIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
]

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 🔴 FIX: Precise active state detection
  const isActiveRoute = (itemHref) => {
    // Exact match for dashboard
    if (itemHref === '/admin' && pathname === '/admin') {
      return true
    }
    // For other routes, check if pathname starts with href AND is not just '/admin'
    if (itemHref !== '/admin' && pathname?.startsWith(itemHref)) {
      return true
    }
    return false
  }

  if (!mounted) return null

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-20 flex items-center gap-2 px-6 border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">L</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">Ledger<span className="text-blue-600">Pro</span></span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = isActiveRoute(item.href)
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  group flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all relative
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {/* Active indicator bar - LEFT SIDE */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r-full"></div>
                )}
                
                {/* Icon */}
                <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                
                <span className="flex-1">{item.name}</span>
                
                {/* Active dot indicator */}
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-100 w-full transition-all group"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
            <span className="flex-1 text-left">Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}