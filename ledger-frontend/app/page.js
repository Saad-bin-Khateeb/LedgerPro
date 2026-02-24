'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  ArrowRightIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  BellAlertIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  StarIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  ClockIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (status === 'authenticated') {
      if (session.user.role === 'admin') router.push('/admin')
      else if (session.user.role === 'staff') router.push('/staff')
      else if (session.user.role === 'customer') router.push('/portal')
    }
  }, [session, status, router])

  if (!mounted) return null

  const features = [
    {
      icon: CurrencyDollarIcon,
      title: 'Smart Ledger',
      description: 'Real-time balance calculation with automatic due date tracking and credit limit management.',
      color: 'from-blue-600 to-blue-700',
      lightColor: 'from-blue-50 to-blue-100',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: BellAlertIcon,
      title: 'Automated SMS Alerts',
      description: 'Instant payment confirmations and intelligent due reminders via SMS & WhatsApp.',
      color: 'from-green-600 to-green-700',
      lightColor: 'from-green-50 to-green-100',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Analytics',
      description: 'Comprehensive aging reports, payment summaries, and real-time business insights.',
      color: 'from-purple-600 to-purple-700',
      lightColor: 'from-purple-50 to-purple-100',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Customer Portal',
      description: '24/7 self-service access for customers to view ledger, payments, and download statements.',
      color: 'from-orange-600 to-orange-700',
      lightColor: 'from-orange-50 to-orange-100',
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: UserGroupIcon,
      title: 'Multi-User Access',
      description: 'Role-based access for admin, staff, and customers with granular permissions.',
      color: 'from-red-600 to-red-700',
      lightColor: 'from-red-50 to-red-100',
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Enterprise Security',
      description: 'Encrypted data, secure authentication, JWT tokens, and complete audit logs.',
      color: 'from-indigo-600 to-indigo-700',
      lightColor: 'from-indigo-50 to-indigo-100',
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ]

  const stats = [
    { label: 'Active Businesses', value: '10,000+', icon: BuildingOfficeIcon },
    { label: 'Transactions Processed', value: '₹2.5Cr+', icon: ArrowTrendingUpIcon },
    { label: 'SMS Sent', value: '500K+', icon: BellAlertIcon },
    { label: 'Uptime SLA', value: '99.9%', icon: CheckCircleIcon },
  ]

  const testimonials = [
    {
      name: 'Ahmed Raza',
      role: 'CEO, Retail Solutions',
      content: 'LedgerPro transformed how we manage customer credit. SMS reminders reduced overdue payments by 60% in just 3 months.',
      avatar: 'AR',
      rating: 5,
    },
    {
      name: 'Sara Khan',
      role: 'Finance Director, Distributors Ltd',
      content: 'The customer portal is a game-changer. Our clients love checking their balance anytime. Best investment this year.',
      avatar: 'SK',
      rating: 5,
    },
    {
      name: 'Usman Ali',
      role: 'Owner, Service Pro',
      content: 'Professional, reliable, and incredibly feature-rich. Support team is exceptional. Highly recommended!',
      avatar: 'UA',
      rating: 5,
    },
  ]

  const pricingPlans = [
    {
      name: 'Starter',
      price: 'Free',
      period: 'forever',
      description: 'Perfect for small businesses testing the waters',
      features: [
        'Up to 50 customers',
        'Basic ledger management',
        'Email support',
        'Single user',
        'Manual SMS (pay as you go)',
      ],
      highlighted: false,
      buttonText: 'Start Free',
      buttonColor: 'bg-gray-900 hover:bg-gray-800',
    },
    {
      name: 'Professional',
      price: 'RS-2,999',
      period: 'per month',
      description: 'Ideal for growing businesses',
      features: [
        'Unlimited customers',
        'Advanced ledger with due dates',
        'Priority support',
        'Up to 5 staff users',
        '500 free SMS/month',
        'WhatsApp integration',
        'Customer portal',
        'API access',
      ],
      highlighted: true,
      buttonText: 'Start 14-Day Trial',
      buttonColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For large organizations with custom needs',
      features: [
        'Everything in Professional',
        'Unlimited staff users',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantee',
        'On-premise option',
        '24/7 phone support',
      ],
      highlighted: false,
      buttonText: 'Contact Sales',
      buttonColor: 'bg-gray-900 hover:bg-gray-800',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Navbar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo with animated gradient */}
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <span className="text-white font-bold text-xl">L</span>
                </div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition"></div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Ledger<span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text">Pro</span>
                </span>
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  v2.0
                </span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                Pricing
              </a>
              <a href="#testimonials" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                Testimonials
              </a>
              <Link 
                href="/login" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="relative group px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Modern & Clean */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-1/4 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100 mb-8 animate-fade-in">
              <SparklesIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Trusted by 10,000+ businesses worldwide
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in-up">
              Transform Your{' '}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Ledger Management
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 8C66.5 1.5 153.5 -0.5 298 4" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <br />with Intelligent Automation
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Replace spreadsheets with a powerful digital ledger. Track credit, send automated SMS reminders, 
              and give customers 24/7 access to their account. <span className="font-semibold text-gray-900">Cut overdue payments by 60%.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up animation-delay-400">
              <Link
                href="/register"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-2 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Trial
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              
              <button className="group px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 inline-flex items-center gap-2 shadow-sm hover:shadow-md">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M5 3L19 12L5 21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Watch Demo
              </button>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex items-center justify-center gap-8 animate-fade-in-up animation-delay-600">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-0.5 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-gray-900">4.9</span>
                </div>
                <p className="text-sm text-gray-600">from 2,500+ reviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex p-3 bg-white rounded-2xl shadow-sm border border-gray-100 group-hover:shadow-md transition-all mb-4">
                  <stat.icon className="w-6 h-6 text-gray-700" />
                </div>
                <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                manage customer credit
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features that automate your workflow and improve cash flow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.lightColor} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative z-10">
                  <div className={`w-14 h-14 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6">
              Trusted by business owners
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers have to say about LedgerPro
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 italic">&ldquo;{testimonial.content}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-3xl p-8 ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-white to-gray-50 border-2 border-blue-600 shadow-xl scale-105'
                    : 'bg-white border border-gray-200 shadow-sm hover:shadow-xl'
                } transition-all`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 text-sm mb-1.5">/{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.highlighted ? '/register' : '#'}
                  className={`block w-full py-3 px-6 ${plan.buttonColor} text-white font-semibold rounded-xl text-center transition-all`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to transform your business?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join 10,000+ businesses already using LedgerPro
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            Start Your Free Trial
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
          <p className="text-sm text-blue-200 mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">L</span>
                </div>
                <span className="text-xl font-bold">LedgerPro</span>
              </div>
              <p className="text-gray-400 text-sm">
                Smart ledger management with automated SMS alerts for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">API</a></li>
                <li><a href="#" className="hover:text-white transition">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
                <li><a href="#" className="hover:text-white transition">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} LedgerPro. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        .animation-delay-600 {
          animation-delay: 600ms;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        .animate-fade-in {
          animation: fade-in-up 0.8s ease-out;
        }
      `}</style>
    </div>
  )
}