'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  UserIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

// ✅ CRITICAL: This MUST be a default export
export default function ComposeSMSPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    phone: '',
    message: '',
    via: 'sms',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    toast.success('Demo mode: SMS would be sent')
    router.push('/admin/sms-logs')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/sms-logs" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compose Message</h1>
          <p className="text-gray-600 mt-2">Send SMS or WhatsApp message (demo mode)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="+923001234567"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">E.164 format: +92xxxxxxxxxx</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows="6"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Type your message here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Send via</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="via" 
                  value="sms" 
                  checked={formData.via === 'sms'} 
                  onChange={(e) => setFormData({...formData, via: e.target.value})}
                  className="w-4 h-4 text-blue-600"
                />
                <EnvelopeIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">SMS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="via" 
                  value="whatsapp" 
                  checked={formData.via === 'whatsapp'} 
                  onChange={(e) => setFormData({...formData, via: e.target.value})}
                  className="w-4 h-4 text-blue-600"
                />
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">WhatsApp</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Link
              href="/admin/sms-logs"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium flex items-center gap-2"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              Send Message (Demo)
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}