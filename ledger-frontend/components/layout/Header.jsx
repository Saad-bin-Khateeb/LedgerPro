'use client'
import { Fragment, useState, useEffect } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bars3Icon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'
import { signOut } from 'next-auth/react'

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getUserInitials = () => {
    if (!session?.user?.name) return 'U'
    return session.user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getDashboardLink = () => {
    if (session?.user?.role === 'admin') return '/admin'
    if (session?.user?.role === 'staff') return '/staff'
    if (session?.user?.role === 'customer') return '/portal'
    return '/'
  }

  const getProfileLink = () => {
    if (session?.user?.role === 'admin' || session?.user?.role === 'staff') return '/admin/profile'
    if (session?.user?.role === 'customer') return '/portal/profile'
    return '/'
  }

  const getSettingsLink = () => {
    if (session?.user?.role === 'admin') return '/admin/settings'
    return null
  }

  const settingsLink = getSettingsLink()
  const dashboardLink = getDashboardLink()
  const profileLink = getProfileLink()

  // Helper to check active link (reactive to pathname changes)
  const isActive = (href) => mounted && pathname === href

  // Navigation items (without pre-computed isActive)
  const navigationItems = [
    {
      name: 'Dashboard',
      href: dashboardLink,
      icon: HomeIcon,
    },
    {
      name: 'Your Profile',
      href: profileLink,
      icon: UserIcon,
    },
    ...(settingsLink
      ? [
          {
            name: 'Settings',
            href: settingsLink,
            icon: Cog6ToothIcon,
          },
        ]
      : []),
  ]

  if (!mounted) return null

  return (
    <header
      className={`
        sticky top-0 z-40 transition-all duration-300
        ${scrolled
          ? 'bg-white/80 backdrop-blur-lg shadow-md border-b border-gray-200/50'
          : 'bg-white border-b border-gray-200'
        }
      `}
    >
      <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
        {/* Left side - Mobile menu & Date */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="lg:hidden relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {new Date().getDate()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                {new Date().toLocaleDateString('en-PK', { weekday: 'long' })}
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {new Date().toLocaleDateString('en-PK', { month: 'long' })}{' '}
                {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          
          <button className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl group">
            <BellIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full ring-2 ring-white animate-pulse"></span>
          </button>

          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
                  <span className="text-white font-semibold text-sm">{getUserInitials()}</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900">{session?.user?.name || 'User'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    {session?.user?.role?.charAt(0).toUpperCase() + session?.user?.role?.slice(1) || 'User'}
                  </span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
                </div>
              </div>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden"
              >
                {/* User info header */}
                <div className="px-4 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-lg">{getUserInitials()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{session?.user?.name || 'User'}</p>
                      <p className="text-sm text-gray-500 truncate">{session?.user?.email || 'user@example.com'}</p>
                    </div>
                  </div>
                </div>

                {/* Navigation items */}
                <div className="py-2">
                  {navigationItems.map((item) => (
                    <Menu.Item key={item.href}>
                      {({ active }) => (
                        <Link
                          href={item.href}
                          className={`
                            group relative flex items-center gap-3 px-4 py-2.5 text-sm transition-all w-full
                            ${active ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : ''}
                            ${isActive(item.href)
                              ? 'text-blue-700 font-semibold bg-blue-50/80'
                              : 'text-gray-700 hover:text-gray-900'
                            }
                          `}
                        >
                          {/* Active indicator bar */}
                          {isActive(item.href) && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r-full"></div>
                          )}

                          {/* Icon */}
                          <div
                            className={`
                            w-8 h-8 rounded-lg flex items-center justify-center transition-all
                            ${isActive(item.href)
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md'
                              : active
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-100 text-gray-600'
                            }
                          `}
                          >
                            <item.icon className="w-4 h-4" />
                          </div>

                          <span className="flex-1 text-left">{item.name}</span>

                          {/* Active dot */}
                          {isActive(item.href) && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                          )}
                        </Link>
                      )}
                    </Menu.Item>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 my-2"></div>

                {/* Sign out */}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all
                        ${active ? 'bg-gradient-to-r from-red-50 to-red-50' : ''}
                        text-red-600 hover:text-red-700
                      `}
                    >
                      <div
                        className={`
                        w-8 h-8 rounded-lg flex items-center justify-center
                        ${active ? 'bg-red-100' : 'bg-red-50'}
                      `}
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      </div>
                      <span className="flex-1 font-medium text-left">Sign out</span>
                    </button>
                  )}
                </Menu.Item>

                {/* Session info */}
                <div className="px-4 py-3 bg-gray-50/50 mt-2">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Signed in as {session?.user?.role}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Last login: Today at {new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  )
}