'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { 
  ShieldCheckIcon, 
  DevicePhoneMobileIcon, 
  UserGroupIcon,
  LockClosedIcon 
} from '@heroicons/react/24/outline'

export default function Home() {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-white text-2xl font-bold">
            DeviceGuard
          </div>
          <Link href="/api/auth/login" className="btn-secondary bg-white/10 border-white text-white hover:bg-white hover:text-primary-600">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            Secure Device
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
              Management
            </span>
          </h1>
          <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto">
            Control concurrent device access with precision. Manage N-device login limits, 
            force logout capabilities, and real-time session monitoring.
          </p>
          <div className="space-x-4">
            <Link href="/api/auth/login" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
              Get Started
            </Link>
            <button className="btn-secondary border-white text-white hover:bg-white hover:text-primary-600">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="glass-effect rounded-xl p-8 text-center">
            <ShieldCheckIcon className="h-12 w-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Secure Auth</h3>
            <p className="text-white/70">Auth0 integration with JWT tokens for maximum security</p>
          </div>
          
          <div className="glass-effect rounded-xl p-8 text-center">
            <DevicePhoneMobileIcon className="h-12 w-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Device Limits</h3>
            <p className="text-white/70">Configure maximum concurrent devices per user account</p>
          </div>
          
          <div className="glass-effect rounded-xl p-8 text-center">
            <LockClosedIcon className="h-12 w-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Force Logout</h3>
            <p className="text-white/70">Remote device logout with real-time notifications</p>
          </div>
          
          <div className="glass-effect rounded-xl p-8 text-center">
            <UserGroupIcon className="h-12 w-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">User Management</h3>
            <p className="text-white/70">Comprehensive user profile and session management</p>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>
    </div>
  )
}
