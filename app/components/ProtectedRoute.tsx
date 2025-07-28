"use client"

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Redirect to login if not authenticated and not already on login page
    if (!isLoading && !isAuthenticated && pathname !== '/') {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router, pathname])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Checking authentication...</span>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated (will redirect via useEffect)
  if (!isAuthenticated) {
    return null
  }

  // Render the protected component if authenticated
  return <>{children}</>
} 