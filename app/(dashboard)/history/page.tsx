"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Users,
  ArrowUpDown,
  Loader2,
  AlertCircle
} from "lucide-react"
import { 
  historyServer, 
  type HistoryFilters, 
  type HistorySort 
} from "@/lib/HistoryServer"
import { type PaymentHistory, type PaymentHistoryStats } from "@/lib/PaymentHistoryServer"

export default function History() {
  // State management
  const [transactions, setTransactions] = useState<PaymentHistory[]>([])
  const [stats, setStats] = useState<PaymentHistoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [filters, setFilters] = useState<HistoryFilters>({
    searchTerm: '',
    statusFilter: 'all',
    typeFilter: 'all',
    dateRange: 'all',
    paymentMethod: 'all'
  })

  const [sort, setSort] = useState<HistorySort>({
    field: 'transaction_time',
    direction: 'desc'
  })

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  // Data fetching functions
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { transactions: fetchedTransactions, stats: fetchedStats } = await historyServer.fetchAllData()
      
      setTransactions(fetchedTransactions)
      setStats(fetchedStats)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    try {
      setRefreshing(true)
      setError(null)
      
      const { transactions: fetchedTransactions, stats: fetchedStats } = await historyServer.fetchAllData()
      
      setTransactions(fetchedTransactions)
      setStats(fetchedStats)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setRefreshing(false)
    }
  }

  // Filtered and sorted transactions
  const filteredAndSortedTransactions = useMemo(() => {
    return historyServer.filterAndSortTransactions(transactions, filters, sort)
  }, [transactions, filters, sort])

  // Event handlers
  const handleSort = (field: keyof PaymentHistory) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleFilterChange = (key: keyof HistoryFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleExport = async () => {
    try {
      await historyServer.exportTransactions(filters)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading transaction history...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-gray-600">View and manage all payment transactions</p>
        </motion.div>
        <div className="flex space-x-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button onClick={refreshData} variant="outline" disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      {stats && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="h-full"
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                <p className="text-xs text-muted-foreground">
                  All time transactions
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="h-full"
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{historyServer.formatCurrency(stats.totalAmount)}</div>
                <p className="text-xs text-muted-foreground">
                  Total transaction value
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="h-full"
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedTransactions}</div>
                <p className="text-xs text-muted-foreground">
                  Successful transactions
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="h-full"
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingTransactions}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting processing
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <label className="text-sm font-medium">Search</label>
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.02 }}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    className="pl-10"
                  />
                </motion.div>
              </motion.div>

              {/* Date Range */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                <label className="text-sm font-medium">Date Range</label>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </motion.div>

              {/* Payment Method */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.8 }}
              >
                <label className="text-sm font-medium">Payment Method</label>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Select value={filters.paymentMethod} onValueChange={(value) => handleFilterChange('paymentMethod', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="gcash">GCash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="paymaya">PayMaya</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </motion.div>

              {/* Results Count */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.9 }}
              >
                <label className="text-sm font-medium">Results</label>
                <div className="text-sm text-gray-600 pt-2">
                  {filteredAndSortedTransactions.length} of {transactions.length} transactions
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <CardTitle>Transaction History</CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost" onClick={() => handleSort('history_id')} className="flex items-center gap-1">
                        ID
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost" onClick={() => handleSort('amount')} className="flex items-center gap-1">
                        Amount
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost" onClick={() => handleSort('transaction_time')} className="flex items-center gap-1">
                        Date
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredAndSortedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <motion.div 
                      className="text-gray-500"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <Search className="w-8 h-8 mx-auto mb-2" />
                      </motion.div>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        No transactions found
                      </motion.p>
                    </motion.div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {filteredAndSortedTransactions.map((transaction, index) => {
                    const statusBadge = historyServer.getStatusBadge(transaction)
                    const typeIcon = historyServer.getTypeIcon(transaction)
                    
                    return (
                      <motion.tr
                        key={transaction.history_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
                        className="border-b"
                      >
                        <TableCell className="font-medium">
                          #{transaction.history_id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{typeIcon.icon}</span>
                            <div>
                              <div className="font-medium">{transaction.customer_name || `Customer #${transaction.loan_id}`}</div>
                              <div className="text-sm text-gray-500">Loan #{transaction.loan_id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {historyServer.formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {transaction.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.notes || '-'}
                        </TableCell>
                        <TableCell>
                          {historyServer.formatDateTime(transaction.transaction_time)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusBadge.className}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </motion.div>
    </motion.div>
  )
}