"use client"

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Menu, 
  Home, 
  Settings, 
  Users, 
  CreditCard, 
  History, 
  RefreshCw,
  ChevronDown,
  User,
  Activity,
  X,
  HelpCircle,
  Star,
  TrendingUp,
  Shield,
  Zap,
  LogOut
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import AuthServer from "@/lib/AuthServer"

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await AuthServer.logout()
      router.push('/')
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Logout error:', err.message)
      } else {
        console.error('Unexpected logout error')
      }
      // Even if logout fails, redirect to home page
      router.push('/')
    }
  }

  // Simulate online status
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(Math.random() > 0.1) // 90% chance of being online
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Set initialized after first render
  useEffect(() => {
    setHasInitialized(true)
  }, [])



  const isActive = (path: string) => {
    if (!pathname) return false
    if (path === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(path)
  }

  const navItems = [
    {
      href: "/dashboard",
      icon: Home,
      label: "Dashboard",
      description: "Overview and analytics",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      hoverColor: "hover:bg-blue-500/20",
      badge: null
    },
    {
      href: "/customers",
      icon: Users,
      label: "Customers",
      description: "Manage customer data",
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
      hoverColor: "hover:bg-green-500/20",
      badge: "1.2k"
    },
    {
      href: "/lending",
      icon: CreditCard,
      label: "Lending",
      description: "Loan management",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      hoverColor: "hover:bg-purple-500/20",
      badge: "New"
    },
    {
      href: "/history",
      icon: History,
      label: "History",
      description: "Transaction history",
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      hoverColor: "hover:bg-orange-500/20",
      badge: null
    },
    {
      href: "/audit-trail",
      icon: Activity,
      label: "Audit Trail",
      description: "System activity logs",
      color: "bg-red-500/10 text-red-600 dark:text-red-400",
      hoverColor: "hover:bg-red-500/20",
      badge: null
    }
  ]

  const settingsItems = [
    {
      href: "/settings",
      icon: Settings,
      label: "Settings",
      description: "System configuration",
      color: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
      hoverColor: "hover:bg-gray-500/20"
    },
    {
      href: "/sync-data",
      icon: RefreshCw,
      label: "Sync Data",
      description: "Data synchronization",
      color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
      hoverColor: "hover:bg-cyan-500/20"
    }
  ]

  const SidebarContent = () => (
    <motion.div 
      initial={hasInitialized ? false : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full bg-gradient-to-b from-background via-background to-muted/20 border-r border-border/50 backdrop-blur-xl"
    >
      {/* Header */}
      <motion.div 
        initial={hasInitialized ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <motion.div 
              initial={hasInitialized ? false : { scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary via-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <motion.div 
                initial={hasInitialized ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.7 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" 
              />
            </motion.div>
            <div>
              <motion.h1 
                initial={hasInitialized ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="text-xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent"
              >
                LendingPro
              </motion.h1>
              <motion.div 
                initial={hasInitialized ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="flex items-center gap-1 mt-0.5"
              >
                <div className={cn(
                  "w-2 h-2 rounded-full transition-colors duration-300",
                  isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
                )} />
                <span className="text-xs text-muted-foreground">
                  {isOnline ? "Online" : "Offline"}
                </span>
              </motion.div>
            </div>
          </div>
          <motion.div
            initial={hasInitialized ? false : { opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden hover:bg-primary/10 transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* User Profile */}
      <motion.div 
        initial={hasInitialized ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="p-4 border-b border-border/30 bg-gradient-to-r from-muted/30 via-muted/20 to-accent/10 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <motion.div 
              initial={hasInitialized ? false : { scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 200 }}
              className="relative"
            >
              <Avatar className="h-11 w-11 ring-2 ring-primary/30 shadow-lg transition-all duration-300 hover:ring-primary/50 hover:scale-105">
                <AvatarImage src="/avatar.png" alt="Admin" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-sm border border-primary/20">
                  AD
                </AvatarFallback>
              </Avatar>
              <motion.div 
                initial={hasInitialized ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.8 }}
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </motion.div>
            </motion.div>
            <motion.div 
              initial={hasInitialized ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex flex-col"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Admin User</span>
                <motion.div
                  initial={hasInitialized ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.9 }}
                >
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                    <Star className="w-2.5 h-2.5 mr-1" />
                    Pro
                  </Badge>
                </motion.div>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Administrator
              </span>
            </motion.div>
          </div>
          <motion.div 
            initial={hasInitialized ? false : { opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="flex items-center gap-1"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 transition-all duration-200 hover:scale-110">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-background/95 border-border/50">
                <DropdownMenuLabel className="font-semibold">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 transition-colors duration-200">
                  <User className="mr-2 h-4 w-4 text-blue-500" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 transition-colors duration-200">
                  <Settings className="mr-2 h-4 w-4 text-gray-500" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 transition-colors duration-200">
                  <HelpCircle className="mr-2 h-4 w-4 text-green-500" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer hover:bg-red-500/10 text-red-600 hover:text-red-700 transition-colors duration-200"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Navigation */}
      <motion.div 
        initial={hasInitialized ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex-1 p-4 space-y-6 overflow-y-auto"
      >
        {/* Main Nav Section */}
        <div>
          <motion.h3 
            initial={hasInitialized ? false : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2 flex items-center gap-2"
          >
            <div className="w-1 h-4 bg-gradient-to-b from-primary to-secondary rounded-full" />
            Main Navigation
          </motion.h3>
          <nav className="space-y-2">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <motion.div
                  key={item.href}
                  initial={hasInitialized ? false : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: hasInitialized ? 0 : 0.5 + (index * 0.1),
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-3 text-sm rounded-xl transition-all duration-300 relative overflow-hidden",
                      "hover:bg-accent/50 hover:text-accent-foreground hover:shadow-md hover:scale-[1.02]",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-accent/50",
                      "border border-transparent hover:border-border/50",
                      item.hoverColor,
                      active && "bg-gradient-to-r from-primary/15 via-primary/10 to-secondary/10 text-primary font-semibold shadow-lg border-primary/20",
                      active && "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/5 before:to-secondary/5 before:rounded-xl"
                    )}
                  >
                    <motion.div 
                      className={cn(
                        "relative z-10 p-2 rounded-lg transition-all duration-300",
                        active ? item.color : "bg-muted/50 text-muted-foreground group-hover:bg-accent",
                        active && "scale-110 shadow-md"
                      )}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      key={pathname} // This will trigger animation when pathname changes
                      animate={active ? { 
                        scale: [1, 1.1, 1.05],
                        rotate: [0, 5, 0]
                      } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className="w-4 h-4 transition-all duration-300 group-hover:scale-110" />
                    </motion.div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="block truncate font-medium">{item.label}</span>
                        {item.badge && (
                          <motion.div
                            initial={hasInitialized ? false : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: hasInitialized ? 0 : 0.8 + (index * 0.1) }}
                          >
                            <Badge 
                              variant={active ? "default" : "secondary"} 
                              className="text-xs px-2 py-0.5 animate-pulse"
                            >
                              {item.badge}
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                      <span className={cn(
                        "block text-xs truncate transition-colors duration-300",
                        active ? "text-primary/80" : "text-muted-foreground group-hover:text-accent-foreground"
                      )}>
                        {item.description}
                      </span>
                    </div>
                    {active && (
                      <motion.div 
                        key={pathname} // This will trigger animation when pathname changes
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-8 bg-gradient-to-b from-primary to-secondary rounded-full shadow-lg animate-pulse" 
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </Link>
                </motion.div>
              )
            })}
          </nav>
        </div>

        {/* Settings Section */}
        <div>
          <motion.h3 
            initial={hasInitialized ? false : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2 flex items-center gap-2"
          >
            <div className="w-1 h-4 bg-gradient-to-b from-secondary to-accent rounded-full" />
            Settings & Tools
          </motion.h3>
          <nav className="space-y-2">
            {settingsItems.map((item, index) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <motion.div
                  key={item.href}
                  initial={hasInitialized ? false : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: hasInitialized ? 0 : 0.7 + (index * 0.1),
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-3 text-sm rounded-xl transition-all duration-300 relative overflow-hidden",
                      "hover:bg-accent/50 hover:text-accent-foreground hover:shadow-md hover:scale-[1.02]",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-accent/50",
                      "border border-transparent hover:border-border/50",
                      item.hoverColor,
                      active && "bg-gradient-to-r from-primary/15 via-primary/10 to-secondary/10 text-primary font-semibold shadow-lg border-primary/20"
                    )}
                  >
                    <motion.div 
                      className={cn(
                        "relative z-10 p-2 rounded-lg transition-all duration-300",
                        active ? item.color : "bg-muted/50 text-muted-foreground group-hover:bg-accent",
                        active && "scale-110 shadow-md"
                      )}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      key={pathname} // This will trigger animation when pathname changes
                      animate={active ? { 
                        scale: [1, 1.1, 1.05],
                        rotate: [0, 5, 0]
                      } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className={cn(
                        "w-4 h-4 transition-all duration-300 group-hover:scale-110",
                        item.href === "/sync-data" && "group-hover:rotate-180"
                      )} />
                    </motion.div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <span className="block truncate font-medium">{item.label}</span>
                      <span className={cn(
                        "block text-xs truncate transition-colors duration-300",
                        active ? "text-primary/80" : "text-muted-foreground group-hover:text-accent-foreground"
                      )}>
                        {item.description}
                      </span>
                    </div>
                    {active && (
                      <motion.div 
                        key={pathname} // This will trigger animation when pathname changes
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-8 bg-gradient-to-b from-primary to-secondary rounded-full shadow-lg animate-pulse" 
                      />
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </nav>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div 
        initial={hasInitialized ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.8 }}
        className="p-4 border-t border-border/30 bg-gradient-to-r from-muted/20 to-accent/10"
      >
        <div className="text-center">
          <motion.p 
            initial={hasInitialized ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="text-xs text-muted-foreground mb-2"
          >
            LendingPro v2.4.1
          </motion.p>
          <motion.div 
            initial={hasInitialized ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 1.0 }}
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
          >
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-2 h-2 bg-green-500 rounded-full" 
            />
            All systems operational
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="outline" 
              size="sm"
              className="md:hidden fixed top-4 left-4 z-50 shadow-lg bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 hover:from-primary/20 hover:to-secondary/20 transition-all duration-300 hover:scale-105"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </motion.div>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0 border-r-0 bg-background/95 backdrop-blur-xl">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <motion.div 
        initial={hasInitialized ? false : { x: -320 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="hidden md:flex md:w-80 md:flex-col md:fixed md:inset-y-0 md:border-r md:bg-background/95 md:backdrop-blur-xl z-40 md:shadow-xl"
      >
        <SidebarContent />
      </motion.div>
      
      {/* Spacer for desktop layout */}
      <div className="hidden md:block md:w-80" />
    </>
  )
}