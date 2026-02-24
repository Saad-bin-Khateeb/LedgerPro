'use client'

import { useState } from 'react'
import {
  BuildingOfficeIcon,
  BellAlertIcon,
  ClockIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('business')
  const [loading, setLoading] = useState(false)
  
  // Local state only - no API calls
  const [businessInfo, setBusinessInfo] = useState({
    name: 'LedgerPro',
    email: 'info@ledgerpro.com',
    phone: '+92 300 1234567',
    address: '123 Business Avenue, Karachi',
    taxNumber: '1234567-8',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
  })

  const [smsSettings, setSmsSettings] = useState({
    enabled: true,
    provider: 'twilio',
    accountSid: 'AC••••••••••••••••••••••••••',
    fromNumber: '+14155238886',
    whatsappEnabled: true,
  })

  // Save handlers - just show success message (no API yet)
  const handleSaveBusinessInfo = (e) => {
    e.preventDefault()
    toast.success('Business information saved (demo mode)')
  }

  const handleSaveSmsSettings = (e) => {
    e.preventDefault()
    toast.success('SMS settings saved (demo mode)')
  }

  const settingsTabs = [
    { id: 'business', name: 'Business', icon: BuildingOfficeIcon },
    { id: 'sms', name: 'SMS Gateway', icon: BellAlertIcon },
    { id: 'templates', name: 'SMS Templates', icon: DocumentTextIcon },
    { id: 'reminders', name: 'Reminders', icon: ClockIcon },
    { id: 'notifications', name: 'Notifications', icon: EnvelopeIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-2">Configure your business settings (demo mode)</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-80">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="flex-1 text-left">{tab.name}</span>
                {activeTab === tab.id && <CheckCircleIcon className="w-5 h-5 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            
            {/* Business Information */}
            {activeTab === 'business' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Business Information</h2>
                    <p className="text-sm text-gray-600 mt-1">Configure your business details</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>

                <form onSubmit={handleSaveBusinessInfo} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                      <input type="text" value={businessInfo.name} onChange={(e) => setBusinessInfo({...businessInfo, name: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input type="email" value={businessInfo.email} onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input type="text" value={businessInfo.phone} onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tax Number</label>
                      <input type="text" value={businessInfo.taxNumber} onChange={(e) => setBusinessInfo({...businessInfo, taxNumber: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <textarea rows="3" value={businessInfo.address} onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                    </div>
                  </div>
                  <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {/* SMS Gateway */}
            {activeTab === 'sms' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">SMS Gateway</h2>
                    <p className="text-sm text-gray-600 mt-1">Configure Twilio integration</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <BellAlertIcon className="w-6 h-6 text-green-600" />
                  </div>
                </div>

                <form onSubmit={handleSaveSmsSettings} className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <button type="button" onClick={() => setSmsSettings({...smsSettings, enabled: !smsSettings.enabled})} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${smsSettings.enabled ? 'bg-green-600' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${smsSettings.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <div>
                      <p className="font-medium text-gray-900">Enable SMS Service</p>
                      <p className="text-sm text-gray-600">Send payment confirmations and reminders</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account SID</label>
                      <input type="text" value={smsSettings.accountSid} onChange={(e) => setSmsSettings({...smsSettings, accountSid: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Number</label>
                      <input type="text" value={smsSettings.fromNumber} onChange={(e) => setSmsSettings({...smsSettings, fromNumber: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                    </div>
                  </div>

                  <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                    Save Settings
                  </button>
                </form>
              </div>
            )}

            {/* Other tabs - placeholder */}
            {activeTab !== 'business' && activeTab !== 'sms' && (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Coming Soon</h3>
                <p className="text-gray-600 mt-2">This section is under development</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}