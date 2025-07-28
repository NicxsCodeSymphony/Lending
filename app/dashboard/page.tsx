"use client"

import React, { useState } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import DashboardLayout from '../pages/dashboard/Layout'
import Dashboard from '../pages/dashboard/Dashboard'
import Customers from '../pages/dashboard/Customers'
import Lending from '../pages/dashboard/Lending'
import Settings from '../pages/dashboard/Settings'

export default function DashboardPage() {
  const [activeItem, setActiveItem] = useState('dashboard')

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return <Dashboard />
      case 'customers':
        return <Customers />
      case 'settings':
        return <Settings />
      case 'lending':
        return <Lending />
      case 'history':
        return (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Transaction History</h2>
            <p className="text-gray-600">This section is coming soon...</p>
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout 
        activeItem={activeItem}
        onMenuItemClick={setActiveItem}
      >
        {renderContent()}
      </DashboardLayout>
    </ProtectedRoute>
  )
} 