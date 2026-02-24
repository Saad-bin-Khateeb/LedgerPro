'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BellAlertIcon,
  DocumentTextIcon,
  ClockIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'

export default function StaffReportsPage() {
  const [selectedReport, setSelectedReport] = useState(null)

  const reports = [
    {
      id: 'aging',
      title: 'Aging Report',
      description: 'View outstanding receivables by age',
      icon: ChartBarIcon,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      id: 'due',
      title: 'Due Summary',
      description: 'View all customers with outstanding balances',
      icon: BellAlertIcon,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      id: 'customers',
      title: 'Customer Summary',
      description: 'View customer list with balances',
      icon: UserGroupIcon,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      id: 'payments',
      title: 'Payment Summary',
      description: 'View payment history',
      icon: CurrencyDollarIcon,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
  ]

  // Sample data for preview (static)
  const sampleData = {
    aging: [
      { range: '0-30 Days', amount: 125000 },
      { range: '31-60 Days', amount: 75000 },
      { range: '61-90 Days', amount: 45000 },
      { range: '90+ Days', amount: 25000 },
    ],
    due: [
      { name: 'John Doe', amount: 25000, days: 15 },
      { name: 'Jane Smith', amount: 15000, days: 32 },
      { name: 'Ahmed Khan', amount: 45000, days: 5 },
    ],
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">View reports • Read Only</p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
            className={`
              bg-white rounded-xl shadow-sm border border-gray-200 p-6 
              hover:shadow-md transition-all cursor-pointer
              ${selectedReport === report.id ? 'ring-2 ring-green-500' : ''}
            `}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${report.bgColor} rounded-lg flex items-center justify-center`}>
                <report.icon className={`w-6 h-6 ${report.textColor}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{report.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                
                {/* Preview Data */}
                {selectedReport === report.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {report.id === 'aging' && (
                      <div className="space-y-2">
                        {sampleData.aging.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{item.range}</span>
                            <span className="font-medium text-gray-900">
                              Rs. {item.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {report.id === 'due' && (
                      <div className="space-y-2">
                        {sampleData.due.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <div>
                              <span className="font-medium text-gray-900">{item.name}</span>
                              <span className="text-gray-500 ml-2">{item.days} days</span>
                            </div>
                            <span className="font-medium text-yellow-600">
                              Rs. {item.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {report.id === 'customers' && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        Total Customers: 156 • Total Due: Rs. 450,000
                      </p>
                    )}
                    {report.id === 'payments' && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        Today: Rs. 45,000 • This Week: Rs. 215,000
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full flex items-center gap-1">
                  <EyeIcon className="w-3 h-3" />
                  Preview
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Access Restriction Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <EyeIcon className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-medium text-yellow-800">View-Only Access</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Staff can preview reports but cannot download or export data. 
              Please contact an administrator if you need to export reports.
            </p>
          </div>
        </div>
      </div>

      {/* Export Restricted Notice */}
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Export Disabled for Staff</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Report export functionality is restricted to administrators only.
          Please request the admin to export reports for you.
        </p>
      </div>
    </div>
  )
}