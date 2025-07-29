"use client"

import * as React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Toast {
  id: string
  type: "success" | "error"
  title?: string
  message: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { ...toast, id }

    setToasts(prev => [...prev, newToast])

    const duration = toast.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 w-[90vw] sm:w-96 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsVisible(false)
    setTimeout(() => onRemove(toast.id), 200)
  }

  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return "border-green-300 bg-green-100 text-green-900 dark:border-green-600 dark:bg-green-900/20 dark:text-green-100"
      case "error":
        return "border-red-300 bg-red-100 text-red-900 dark:border-red-600 dark:bg-red-900/20 dark:text-red-100"
      default:
        return ""
    }
  }

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        "transform transition-all duration-300 ease-out",
        isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95"
      )}
    >
      <Alert
        className={cn(
          "shadow-xl border-2 p-4 min-h-[80px] backdrop-blur-sm relative",
          getToastStyles()
        )}
      >
        {getIcon()}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <AlertTitle className="font-semibold text-base mb-1">
              {toast.title}
            </AlertTitle>
          )}
          <AlertDescription className="text-sm">
            {toast.message}
          </AlertDescription>
        </div>
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>
    </div>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    return { type: "success" as const, message, title, duration }
  },
  error: (message: string, title?: string, duration?: number) => {
    return { type: "error" as const, message, title, duration }
  }
}
