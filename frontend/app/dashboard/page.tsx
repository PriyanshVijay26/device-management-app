'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiClient, UserProfile, Device } from '@/lib/api'
import { DeviceManager } from '@/lib/deviceManager'
import DeviceLoginModal from '@/components/DeviceLoginModal'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [showDeviceModal, setShowDeviceModal] = useState(false)
  const [pendingDevices, setPendingDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [deviceManager] = useState(() => DeviceManager.getInstance())

  // Clean up URL after OAuth redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.has('code') || url.searchParams.has('state')) {
        window.history.replaceState({}, document.title, '/dashboard')
      }
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
      return
    }

    if (user) {
      initializeDashboard()
    }
  }, [user, isLoading, router])

  const initializeDashboard = async () => {
    try {
      setLoading(true)
      
      // Get user profile from Auth0 user object and API
      let profile;
      try {
        profile = await apiClient.getUserProfile()
      } catch (error) {
        // Fallback to user object from Auth0 session
        profile = {
          sub: user?.sub || '',
          name: user?.name || user?.nickname || '',
          email: user?.email || '',
          phone_number: (typeof user?.phone_number === 'string' ? user.phone_number : '') || '',
          picture: user?.picture || ''
        }
      }
      
      // Merge Auth0 session data with API data for complete profile
      const mergedProfile = {
        sub: profile.sub || user?.sub || '',
        name: profile.name || user?.name || user?.nickname || '',
        email: profile.email || user?.email || '',
        phone_number: profile.phone_number || (typeof user?.phone_number === 'string' ? user.phone_number : '') || '',
        picture: profile.picture || user?.picture || ''
      }
      
      setUserProfile(mergedProfile)

      // Attempt device login
      const deviceInfo = deviceManager.getDeviceInfo()
      const deviceId = deviceManager.getDeviceId()
      
      const loginResult = await apiClient.loginDevice(deviceInfo, deviceId)
      
      if (!loginResult.success && loginResult.devices) {
        // Show device selection modal
        setPendingDevices(loginResult.devices)
        setShowDeviceModal(true)
      } else if (loginResult.success) {
        // Login successful, load active devices
        await loadActiveDevices()
        
        // Connect WebSocket for real-time notifications
        const tokenResponse = await fetch('/api/auth/token')
        const tokenData = await tokenResponse.json()
        deviceManager.connectWebSocket(tokenData.accessToken, handleForceLogout)
      } else {
        // Handle login failure case
        console.error('Device login failed:', loginResult)
        toast.error('Failed to register device')
        // Still try to load devices in case there are existing ones
        await loadActiveDevices()
      }
    } catch (error) {
      console.error('Error initializing dashboard:', error)
      toast.error('Failed to load dashboard')
      // Try to load devices even if there's an error
      try {
        await loadActiveDevices()
      } catch (loadError) {
        console.error('Error loading devices:', loadError)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadActiveDevices = async () => {
    try {
      const result = await apiClient.getActiveDevices()
      setDevices(result.devices)
    } catch (error) {
      console.error('Error loading devices:', error)
    }
  }

  const handleForceLogout = () => {
    toast.error('You have been logged out from another device', {
      duration: 5000,
    })
  }

  const handleForceLogoutDevice = async (targetDeviceId: string) => {
    try {
      const currentDeviceId = deviceManager.getDeviceId()
      await apiClient.forceLogoutDevice(targetDeviceId, currentDeviceId)
      
      // Refresh devices list and allow current login
      await loadActiveDevices()
      setShowDeviceModal(false)
      
      // Connect WebSocket
      const accessToken = await fetch('/api/auth/token').then(res => res.json())
      deviceManager.connectWebSocket(accessToken.accessToken, handleForceLogout)
    } catch (error) {
      console.error('Error forcing logout:', error)
      throw error
    }
  }

  const handleCancelLogin = () => {
    setShowDeviceModal(false)
    router.push('/api/auth/logout')
  }

  const handleLogout = async () => {
    try {
      const deviceId = deviceManager.getDeviceId()
      await apiClient.logoutDevice(deviceId)
      deviceManager.disconnectWebSocket()
      router.push('/api/auth/logout')
    } catch (error) {
      console.error('Error logging out:', error)
      router.push('/api/auth/logout')
    }
  }

  const formatDate = (dateString: string) => {
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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">DeviceGuard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userProfile.name || 'User'}!
          </h2>
          <p className="text-gray-600">
            Manage your devices and monitor your account security.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="text-center mb-6">
                {userProfile.picture ? (
                  <img
                    src={userProfile.picture}
                    alt="Profile"
                    className="w-20 h-20 rounded-full mx-auto mb-4"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <UserIcon className="h-10 w-10 text-primary-600" />
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-900">User Profile</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-semibold text-gray-900">
                      {userProfile.name || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900">
                      {userProfile.email || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-semibold text-gray-900">
                      {userProfile.phone_number || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Devices */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Active Devices</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <DevicePhoneMobileIcon className="h-4 w-4" />
                  <span>{devices.length}/3 devices</span>
                </div>
              </div>

              {devices.length === 0 ? (
                <div className="text-center py-8">
                  <DevicePhoneMobileIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active devices found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {devices.map((device, index) => {
                    const isCurrentDevice = device.device_id === deviceManager.getDeviceId()
                    return (
                      <div
                        key={device.device_id}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          isCurrentDevice
                            ? 'border-primary-200 bg-primary-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg ${
                              isCurrentDevice ? 'bg-primary-100' : 'bg-gray-200'
                            }`}>
                              <DevicePhoneMobileIcon className={`h-6 w-6 ${
                                isCurrentDevice ? 'text-primary-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                                <span>{device.device_info}</span>
                                {isCurrentDevice && (
                                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                                    Current Device
                                  </span>
                                )}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <div className="flex items-center space-x-1">
                                  <ClockIcon className="h-4 w-4" />
                                  <span>Logged in: {formatDate(device.login_time)}</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                Last active: {formatDate(device.last_activity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Device Login Modal */}
      <DeviceLoginModal
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        devices={pendingDevices}
        onForceLogout={handleForceLogoutDevice}
        onCancelLogin={handleCancelLogin}
      />
    </div>
  )
}
