'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'

// ✅ CRITICAL: This MUST be a default export of a React component
export default function SMSLogsPage() {
  const [logs] = useState([])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SMS Logs</h1>
          <p className="text-gray-600 mt-2">View all SMS and WhatsApp messages</p>
        </div>
        <Link
          href="/admin/sms/compose"
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
          Compose SMS
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center gap-2">
            <FunnelIcon className="w-5 h-5" />
            Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">No SMS logs yet</h3>
        <p className="text-gray-600 mb-6">Messages will appear here once you send them</p>
        <Link
          href="/admin/sms/compose"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
          Send Your First Message
        </Link>
      </div>
    </div>
  )
}