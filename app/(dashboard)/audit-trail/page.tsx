"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Calendar,
  User,
  CreditCard,
  Users,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  DollarSign,
  Clock,
  AlertCircle,
  Info
} from "lucide-react"
import { AuditRecord } from "@/lib/AuditServer"
import { auditServer } from "@/lib/AuditServer"
import { formatDistanceToNow, format } from "date-fns"

export default function AuditTrailPage() {
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AuditRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionTypeFilter, setActionTypeFilter] = useState("all")
  const [entityTypeFilter, setEntityTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    fetchAuditRecords()
  }, [])

  const filterRecords = useCallback(() => {
    let filtered = [...auditRecords]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.action_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.actor_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.entity_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Action type filter
    if (actionTypeFilter !== "all") {
      filtered = filtered.filter(record => record.action_type === actionTypeFilter)
    }

    // Entity type filter
    if (entityTypeFilter !== "all") {
      filtered = filtered.filter(record => record.entity_type === entityTypeFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const recordDate = new Date()
      
      switch (dateFilter) {
        case "today":
          filtered = filtered.filter(record => {
            recordDate.setTime(new Date(record.time).getTime())
            return recordDate.toDateString() === now.toDateString()
          })
          break
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(record => {
            recordDate.setTime(new Date(record.time).getTime())
            return recordDate >= weekAgo
          })
          break
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(record => {
            recordDate.setTime(new Date(record.time).getTime())
            return recordDate >= monthAgo
          })
          break
      }
    }

    setFilteredRecords(filtered)
  }, [auditRecords, searchTerm, actionTypeFilter, entityTypeFilter, dateFilter])

  useEffect(() => {
    filterRecords()
  }, [filterRecords])

  const fetchAuditRecords = async () => {
    try {
      setLoading(true)
      const records = await auditServer.getAllAuditRecords()
      setAuditRecords(records)
    } catch (error) {
      console.error("Failed to fetch audit records:", error)
    } finally {
      setLoading(false)
    }
  }



  const getActionIcon = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case "create":
        return <Plus className="w-4 h-4 text-green-600" />
      case "update":
        return <Edit className="w-4 h-4 text-blue-600" />
      case "delete":
        return <Trash2 className="w-4 h-4 text-red-600" />
      case "view":
        return <Eye className="w-4 h-4 text-gray-600" />
      case "payment":
        return <DollarSign className="w-4 h-4 text-green-600" />
      default:
        return <Info className="w-4 h-4 text-gray-600" />
    }
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case "customer":
        return <Users className="w-4 h-4" />
      case "loan":
        return <CreditCard className="w-4 h-4" />
      case "payment":
        return <DollarSign className="w-4 h-4" />
      case "user":
        return <User className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case "create":
        return "default"
      case "update":
        return "secondary"
      case "delete":
        return "destructive"
      case "view":
        return "outline"
      case "payment":
        return "default"
      default:
        return "outline"
    }
  }

  const getEntityBadgeVariant = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case "customer":
        return "default"
      case "loan":
        return "secondary"
      case "payment":
        return "outline"
      case "user":
        return "destructive"
      default:
        return "outline"
    }
  }

  const exportAuditData = () => {
    const csvContent = [
      ["Time", "Actor ID", "Actor Role", "Action Type", "Entity Type", "Entity ID", "Action Details"].join(","),
      ...filteredRecords.map(record => [
        record.time,
        record.actor_id,
        record.actor_role,
        record.action_type,
        record.entity_type,
        record.entity_id,
        `"${record.action_details}"`
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-trail-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStats = () => {
    const total = filteredRecords.length
    const today = filteredRecords.filter(record => {
      const recordDate = new Date(record.time)
      const today = new Date()
      return recordDate.toDateString() === today.toDateString()
    }).length

    const actionTypes = filteredRecords.reduce((acc, record) => {
      acc[record.action_type] = (acc[record.action_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return { total, today, actionTypes }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading audit trail...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-muted-foreground">
            Monitor system activities and user actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportAuditData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchAuditRecords}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-scale-in">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All time activities
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Activities</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">
              Activities today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common Action</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(stats.actionTypes).length > 0 
                ? Object.entries(stats.actionTypes).sort(([,a], [,b]) => b - a)[0][0]
                : "N/A"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Most frequent action type
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Actors</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredRecords.map(r => r.actor_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Active users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Records */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Showing {filteredRecords.length} of {auditRecords.length} activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No activities found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              filteredRecords.map((record, index) => (
                <div
                  key={record.audit_id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-all duration-200 hover-lift animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-2 mt-1">
                    {getActionIcon(record.action_type)}
                    {getEntityIcon(record.entity_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getActionBadgeVariant(record.action_type)}>
                        {record.action_type}
                      </Badge>
                      <Badge variant={getEntityBadgeVariant(record.entity_type)}>
                        {record.entity_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ID: {record.entity_id}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium mb-1">
                      {record.action_details}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {record.actor_role} (ID: {record.actor_id})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(record.time), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                                                 {format(new Date(record.time), "MMM dd, yyyy 'at' HH:mm")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 