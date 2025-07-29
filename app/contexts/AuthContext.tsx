"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { loginUser } from '../utils/DataType/AuthServer'

// Simple JWT decode function (without verification for frontend use)
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) {
      console.error('Invalid JWT token format');
      return null;
    }
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

// Types for authentication
export interface User {
  account_id: number
  account_name: string
  username: string
  role: 'admin' | 'user'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    try {
      const savedUser = localStorage.getItem('lendingAppUser')
      const savedToken = localStorage.getItem('lendingAppToken')
      
      if (savedUser && savedToken) {
        // Decode JWT to check if it's expired
        const jwtPayload = decodeJWT(savedToken)
        
        if (jwtPayload && jwtPayload.exp) {
          const currentTime = Date.now() / 1000
          
          if (jwtPayload.exp > currentTime) {
            // Token is still valid
            try {
              const parsedUser = JSON.parse(savedUser)
              setUser(parsedUser)
            } catch (parseError) {
              console.error('Failed to parse saved user data:', parseError)
              localStorage.removeItem('lendingAppUser')
              localStorage.removeItem('lendingAppToken')
            }
          } else {
            // Token is expired
            console.log('JWT token expired, logging out')
            localStorage.removeItem('lendingAppUser')
            localStorage.removeItem('lendingAppToken')
          }
        } else {
          // Invalid token format, try to use saved user data
          try {
            const parsedUser = JSON.parse(savedUser)
            setUser(parsedUser)
          } catch (parseError) {
            console.error('Failed to parse saved user data:', parseError)
            localStorage.removeItem('lendingAppUser')
            localStorage.removeItem('lendingAppToken')
          }
        }
      }
    } catch (error) {
      console.error('Failed to check authentication:', error)
      // Clear potentially corrupted data
      try {
        localStorage.removeItem('lendingAppUser')
        localStorage.removeItem('lendingAppToken')
      } catch (storageError) {
        console.error('Failed to clear localStorage:', storageError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true)
      
      // Make real API call to authenticate
      const response = await loginUser({ username, password })
      
      // Decode JWT to get user information
      const jwtPayload = decodeJWT(response.token)
      
      if (!jwtPayload) {
        throw new Error('Failed to decode authentication token');
      }
      
      // Create user data structure from JWT payload with fallbacks
      const userData: User = {
        account_id: jwtPayload?.account_id || 1,
        account_name: jwtPayload?.username || username,
        username: jwtPayload?.username || username,
        role: 'admin' // Default role, could be enhanced later
      }
      
      // Save to localStorage with error handling
      try {
        localStorage.setItem('lendingAppUser', JSON.stringify(userData))
        localStorage.setItem('lendingAppToken', response.token)
      } catch (storageError) {
        console.error('Failed to save to localStorage:', storageError)
        // Continue without localStorage if it fails (e.g., in private browsing)
      }
      
      setUser(userData)
    } catch (error: unknown) {
      // Check if it's an axios error with response data
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        if (axiosError.response?.data?.error) {
          throw new Error(axiosError.response.data.error)
        }
      }
      
      if (error instanceof Error) {
        throw new Error(error.message)
      }
      
      throw new Error('Invalid username or password')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('lendingAppUser')
    localStorage.removeItem('lendingAppToken')
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 