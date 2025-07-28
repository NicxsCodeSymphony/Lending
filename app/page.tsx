"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <span className="text-lg text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    router.push('/dashboard')
    return null
  }

  // Show login page if not authenticated
  return <Login />
}
