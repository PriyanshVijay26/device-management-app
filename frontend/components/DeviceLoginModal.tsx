'use client'

import React, { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'
import { Device } from '@/lib/api'
import toast from 'react-hot-toast'

interface DeviceLoginModalProps { 
  isOpen: boolean
  onClose: () => void
  devices: Device[]
  onForceLogout: (deviceId: string) => Promise<void>
  onCancelLogin: () => void
}

export default function DeviceLoginModal({
  isOpen,
  onClose,
  devices,
  onForceLogout,
  onCancelLogin
}: DeviceLoginModalProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleForceLogout = async (deviceId: string) => {
    setLoading(deviceId)
    try {
      await onForceLogout(deviceId)
      toast.success('Device logged out successfully. You are now logged in on this device.')
      onClose()
    } catch (error) {
      toast.error('Failed to logout device')
    } finally {
      setLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    // Format consistently with dashboard using Indian timezone
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    // If within last 24 hours, show time only
    if (diffInHours < 24) {
      return date.toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      })
    }
    
    // If within last week, show day and time
    if (diffInHours < 168) { // 7 days * 24 hours
      return date.toLocaleString('en-IN', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      })
    }
    
    // Otherwise show full date and time
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    })
  }

  const getTimeSince = (dateString: string) => {
    // Use Indian timezone for consistency with dashboard
    const now = new Date()
    const past = new Date(dateString)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMins > 0) return `${diffMins}m ago`
    return 'Just now'
  }

  return (
    <Dialog open={isOpen} onClose={onCancelLogin} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-2xl font-bold text-gray-900">
                Device Limit Reached
              </Dialog.Title>
              <p className="text-gray-600 mt-1">
                You can only be logged in on 3 devices at once. Choose a device to log out.
              </p>
            </div>
            <button
              onClick={onCancelLogin}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {devices.map((device, index) => (
                <div
                  key={device.device_id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <DevicePhoneMobileIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {device.device_info}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Logged in: {formatDate(device.login_time)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Last active: {getTimeSince(device.last_activity)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleForceLogout(device.device_id)}
                    disabled={loading === device.device_id}
                    className="btn-danger text-sm"
                  >
                    {loading === device.device_id ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Logging out...</span>
                      </div>
                    ) : (
                      'Force Logout'
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={onCancelLogin}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
              >
                Cancel Login
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
