"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  Plus,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  Target,
  Calendar,
  RefreshCw,
  FileText,
  Percent,
  PiggyBank,
  Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getLendingData, getLendingStats, type LendingData } from "@/lib/LendingServer";
import { customerServer, type Customer } from "@/lib/CustomerServer";
import { auditServer, type AuditRecord } from "@/lib/AuditServer";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

interface DashboardStats {
  totalCustomers: number;
  activeLoans: number;
  totalRevenue: number;
  pendingApplications: number;
  overdueLoans: number;
  monthlyGrowth: number;
  revenueGrowth: number;
  customerGrowth: number;
  totalLoans: number;
  totalDisbursed: number;
  outstanding: number;
  collectionRate: string;
  totalCollected: number;
  totalNotesReceivable: number;
  totalLoansThisMonth: number;
  pendingLoans: number;
  completedLoans: number;
}

interface RecentActivity {
  id: string;
  type: 'loan_approved' | 'payment_received' | 'customer_added' | 'overdue_alert' | 'loan_created' | 'loan_updated' | 'payment_recorded' | 'penalty_updated';
  title: string;  
  description: string;
  amount?: number;
  customer?: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

type PerformancePeriod = 'daily' | 'weekly' | 'monthly';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeLoans: 0,
    totalRevenue: 0,
    pendingApplications: 0,
    overdueLoans: 0,
    monthlyGrowth: 0,
    revenueGrowth: 0,
    customerGrowth: 0,
    totalLoans: 0,
    totalDisbursed: 0,
    outstanding: 0,
    collectionRate: '0.0',
    totalCollected: 0,
    totalNotesReceivable: 0,
    totalLoansThisMonth: 0,
    pendingLoans: 0,
    completedLoans: 0
  });

  const [lendingData, setLendingData] = useState<LendingData[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [performancePeriod, setPerformancePeriod] = useState<PerformancePeriod>('monthly');
  const [chartData, setChartData] = useState<{
    monthlyData: Array<{
      month: string;
      disbursed: number;
      collected: number;
      outstanding: number;
      loans: number;
    }>;
    loanDistribution: Array<{
      name: string;
      value: number;
    }>;
  }>({
    monthlyData: [],
    loanDistribution: []
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const lendingResult = await getLendingData();
      setLendingData(lendingResult);
      
      const customersResult = await customerServer.getAllCustomers();
      setCustomers(customersResult);
      
      // Fetch audit records
      const auditResult = await auditServer.getAllAuditRecords();
      setAuditRecords(auditResult);
      
      const lendingStats = getLendingStats(lendingResult);
      
      const pendingCustomers = customersResult.filter(c => c.status === "pending").length;
      
      setStats({
        totalCustomers: customersResult.length,
        activeLoans: lendingStats.pendingLoans,
        totalRevenue: lendingStats.totalCollected,
        pendingApplications: pendingCustomers,
        overdueLoans: lendingStats.overdueLoans,
        monthlyGrowth: 8.5, 
        revenueGrowth: 12.3, 
        customerGrowth: 5.7, 
        totalLoans: lendingStats.totalLoans,
        totalDisbursed: lendingStats.totalDisbursed,
        outstanding: lendingStats.outstanding,
        collectionRate: lendingStats.collectionRate,
        totalCollected: lendingStats.totalCollected,
        totalNotesReceivable: lendingStats.totalNotesReceivable,
        totalLoansThisMonth: lendingStats.totalLoansThisMonth,
        pendingLoans: lendingStats.pendingLoans,
        completedLoans: lendingStats.completedLoans
      });
      
             // Transform audit records to recent activity
       const transformedActivity = auditResult.slice(0, 10).map((record) => {
         return transformAuditToActivity(record, customersResult, lendingResult);
       });
       
       setRecentActivity(transformedActivity);

       // Process chart data
       const monthlyData = processPerformanceData(lendingResult, performancePeriod);
       const loanDistribution = processLoanDistribution(lendingResult);
       
       setChartData({
         monthlyData,
         loanDistribution
       });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching dashboard data:', err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Update chart data when performance period changes
  useEffect(() => {
    if (lendingData.length > 0) {
      const monthlyData = processPerformanceData(lendingData, performancePeriod);
      setChartData(prev => ({
        ...prev,
        monthlyData
      }));
    }
  }, [performancePeriod, lendingData]);

  const refreshData = async () => {
    await fetchData();
  };

  const transformAuditToActivity = (auditRecord: AuditRecord, customers: Customer[], loans: LendingData[]): RecentActivity => {
    const { action_type, action_details, time, entity_type } = auditRecord;
    
    // Parse amount from action details if present
    const amountMatch = action_details.match(/₱([\d,]+\.?\d*)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : undefined;
    
    // Extract customer name from action details
    const customerMatch = action_details.match(/customer\s+(?:ID\s+)?(\d+)/i) || 
                         action_details.match(/([A-Za-z\s]+)\s+(?:created|updated|payment)/i);
    const customerName = customerMatch ? customerMatch[1] : undefined;
    
    // Format time
    const timeAgo = formatTimeAgo(new Date(time));
    
    // Determine activity type and status based on action_type
    let type: RecentActivity['type'] = 'loan_approved';
    let status: RecentActivity['status'] = 'info';
    let title = '';
    
    switch (action_type) {
      case 'create':
        if (entity_type === 'customer') {
          type = 'customer_added';
          title = 'New Customer Added';
          status = 'info';
        } else if (entity_type === 'loan') {
          type = 'loan_created';
          title = 'New Loan Created';
          status = 'success';
        }
        break;
      case 'update':
        if (entity_type === 'customer') {
          type = 'customer_added';
          title = 'Customer Updated';
          status = 'info';
        } else if (entity_type === 'loan') {
          if (action_details.includes('Penalty')) {
            type = 'penalty_updated';
            title = 'Penalty Updated';
            status = 'warning';
          } else {
            type = 'loan_updated';
            title = 'Loan Updated';
            status = 'info';
          }
        }
        break;
      case 'payment':
        type = 'payment_recorded';
        title = 'Payment Recorded';
        status = 'success';
        break;
      default:
        type = 'loan_approved';
        title = 'System Activity';
        status = 'info';
    }
    
    return {
      id: auditRecord.audit_id.toString(),
      type,
      title,
      description: action_details,
      amount,
      customer: customerName,
      time: timeAgo,
      status
    };
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Chart data processing functions
  const processPerformanceData = (loans: LendingData[], period: PerformancePeriod) => {
    const performanceData = new Map();
    const now = new Date();
    
    // Generate date ranges based on period
    const dateRanges: Array<{ start: Date; end: Date; key: string }> = [];
    
    switch (period) {
      case 'daily':
        // Current week (Monday to Sunday)
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Monday
        weekStart.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 7; i++) {
          const dayStart = new Date(weekStart);
          dayStart.setDate(weekStart.getDate() + i);
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);
          
          const key = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(dayStart.getDate()).padStart(2, '0')}`;
          dateRanges.push({ start: dayStart, end: dayEnd, key });
        }
        break;
        
      case 'weekly':
        // Current month weeks
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const currentWeekStart = new Date(monthStart);
        currentWeekStart.setDate(monthStart.getDate() - monthStart.getDay() + (monthStart.getDay() === 0 ? -6 : 1)); // Monday
        
        while (currentWeekStart <= monthEnd) {
          const weekEnd = new Date(currentWeekStart);
          weekEnd.setDate(currentWeekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          
          const key = `${currentWeekStart.getFullYear()}-${String(currentWeekStart.getMonth() + 1).padStart(2, '0')}-${String(currentWeekStart.getDate()).padStart(2, '0')}`;
          dateRanges.push({ start: currentWeekStart, end: weekEnd, key });
          
          currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }
        break;
        
      case 'monthly':
      default:
        // Current year months
        for (let month = 0; month < 12; month++) {
          const monthStart = new Date(now.getFullYear(), month, 1);
          const monthEnd = new Date(now.getFullYear(), month + 1, 0);
          monthEnd.setHours(23, 59, 59, 999);
          
          const key = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
          dateRanges.push({ start: monthStart, end: monthEnd, key });
        }
        break;
    }
    
    // Initialize all date ranges with zero values
    dateRanges.forEach(range => {
      performanceData.set(range.key, {
        period: range.key,
        disbursed: 0,
        collected: 0,
        outstanding: 0,
        loans: 0
      });
    });
    
    // Process loan data
    loans.forEach(loan => {
      const loanDate = new Date(loan.transaction_date);
      
      // Find which date range this loan belongs to
      const matchingRange = dateRanges.find(range => 
        loanDate >= range.start && loanDate <= range.end
      );
      
      if (matchingRange) {
        const periodData = performanceData.get(matchingRange.key);
        periodData.disbursed += loan.loan_amount;
        periodData.collected += (loan.gross_receivable - loan.overall_balance);
        periodData.outstanding += loan.overall_balance;
        periodData.loans += 1;
      }
    });
    
    return Array.from(performanceData.values()).sort((a, b) => a.period.localeCompare(b.period));
  };

  const processLoanDistribution = (loans: LendingData[]) => {
    const distribution = {
      'Active Loans': 0,
      'Completed Loans': 0,
      'Overdue Loans': 0,
      'Pending Loans': 0
    };
    
    loans.forEach(loan => {
      if (loan.status === 'completed' || loan.overall_balance === 0) {
        distribution['Completed Loans']++;
      } else if (loan.status === 'overdue' || new Date(loan.loan_end) < new Date()) {
        distribution['Overdue Loans']++;
      } else if (loan.status === 'pending') {
        distribution['Pending Loans']++;
      } else {
        distribution['Active Loans']++;
      }
    });
    
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };

  const getPeriodLabel = (period: PerformancePeriod) => {
    switch (period) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return 'Monthly';
    }
  };

  const formatPeriodLabel = (periodKey: string, period: PerformancePeriod) => {
    switch (period) {
      case 'daily':
        const [year, month, day] = periodKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayOfWeek = date.getDay();
        const dayName = dayNames[dayOfWeek === 0 ? 6 : dayOfWeek - 1]; // Convert Sunday=0 to Sunday=6
        return `${dayName} ${date.getDate()}`;
      case 'weekly':
        const [wYear, wMonth, wDay] = periodKey.split('-');
        const weekStart = new Date(parseInt(wYear), parseInt(wMonth) - 1, parseInt(wDay));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        // Calculate week number in the month
        const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
        const weekNumber = Math.ceil((weekStart.getDate() + monthStart.getDay() - (monthStart.getDay() === 0 ? 7 : 1)) / 7);
        
        return `Week ${weekNumber} (${weekStart.getDate()}-${weekEnd.getDate()})`;
      case 'monthly':
      default:
        const [mYear, mMonth] = periodKey.split('-');
        const monthDate = new Date(parseInt(mYear), parseInt(mMonth) - 1);
        return monthDate.toLocaleDateString('en-US', { 
          month: 'short'
        });
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your lending business today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Loan
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLoans}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-green-600">All time loans</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalDisbursed)}</div>
              <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>Total amount lent</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalCollected)}</div>
              <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>Total amount collected</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              <Percent className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.collectionRate}%</div>
              <div className="flex items-center gap-1 text-xs text-blue-500 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>Success rate</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notes Receivable</CardTitle>
              <FileText className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{formatCurrency(stats.totalNotesReceivable)}</div>
              <div className="flex items-center gap-1 text-xs text-indigo-500 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>Total receivable</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <CreditCard className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.outstanding)}</div>
              <div className="flex items-center gap-1 text-xs text-orange-500 mt-1">
                <TrendingDown className="w-3 h-3" />
                <span>Amount to collect</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <PiggyBank className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalLoansThisMonth}</div>
              <div className="flex items-center gap-1 text-xs text-purple-500 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>New loans</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Loans</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueLoans}</div>
              <div className="flex items-center gap-1 text-xs text-red-500 mt-1">
                <TrendingDown className="w-3 h-3" />
                <span>Requires attention</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

             {/* Charts and Analytics */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.4, delay: 0.1 }}
         >
           <Card>
             <CardHeader>
               <div className="flex items-center justify-between">
                 <CardTitle className="flex items-center gap-2">
                   <BarChart3 className="w-5 h-5" />
                   {getPeriodLabel(performancePeriod)} Performance
                 </CardTitle>
                 <div className="flex gap-1">
                   <Button
                     variant={performancePeriod === 'daily' ? 'default' : 'outline'}
                     size="sm"
                     onClick={() => setPerformancePeriod('daily')}
                     className="text-xs"
                   >
                     Daily
                   </Button>
                   <Button
                     variant={performancePeriod === 'weekly' ? 'default' : 'outline'}
                     size="sm"
                     onClick={() => setPerformancePeriod('weekly')}
                     className="text-xs"
                   >
                     Weekly
                   </Button>
                   <Button
                     variant={performancePeriod === 'monthly' ? 'default' : 'outline'}
                     size="sm"
                     onClick={() => setPerformancePeriod('monthly')}
                     className="text-xs"
                   >
                     Monthly
                   </Button>
                 </div>
               </div>
             </CardHeader>
             <CardContent>
               <AnimatePresence mode="wait">
                 <motion.div
                   key={performancePeriod}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   transition={{ duration: 0.3, ease: "easeInOut" }}
                   className="h-64"
                 >
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={chartData.monthlyData}>
                       <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                       <XAxis 
                         dataKey="period" 
                         tickFormatter={(value) => formatPeriodLabel(value, performancePeriod)}
                       />
                       <YAxis 
                         tickFormatter={(value) => 
                           new Intl.NumberFormat('en-PH', {
                             notation: 'compact',
                             maximumFractionDigits: 1
                           }).format(value)
                         }
                       />
                       <Tooltip 
                         formatter={(value: number, name: string) => [
                           formatCurrency(value),
                           name === 'disbursed' ? 'Disbursed' : 
                           name === 'collected' ? 'Collected' : 
                           name === 'outstanding' ? 'Outstanding' : 'Loans'
                         ]}
                         labelFormatter={(label) => formatPeriodLabel(label, performancePeriod)}
                       />
                       <Line 
                         type="monotone" 
                         dataKey="disbursed" 
                         stroke="#3B82F6" 
                         strokeWidth={3}
                         name="Disbursed"
                         dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                       />
                       <Line 
                         type="monotone" 
                         dataKey="collected" 
                         stroke="#10B981" 
                         strokeWidth={3}
                         name="Collected"
                         dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                       />
                       <Line 
                         type="monotone" 
                         dataKey="outstanding" 
                         stroke="#F59E0B" 
                         strokeWidth={3}
                         name="Outstanding"
                         dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                       />
                     </LineChart>
                   </ResponsiveContainer>
                 </motion.div>
               </AnimatePresence>
             </CardContent>
           </Card>
         </motion.div>

         <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.4, delay: 0.1 }}
         >
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <BarChart3 className="w-5 h-5" />
                 Loan Distribution
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={chartData.loanDistribution}
                       cx="50%"
                       cy="50%"
                       labelLine={false}
                       label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                       outerRadius={80}
                       fill="#8884d8"
                       dataKey="value"
                     >
                       {chartData.loanDistribution.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                       formatter={(value: number) => [value, 'Loans']}
                     />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
             </CardContent>
           </Card>
         </motion.div>
       </div>

       {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading recent activity...</p>
                  </div>
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="mt-1">
                        {getStatusIcon(activity.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{activity.title}</h4>
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                        {activity.amount && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-sm font-medium">
                              {formatCurrency(activity.amount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Activity will appear here as you use the system
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  View All Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Customer
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Create Loan Application
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alerts and Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Action Required
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  You have {stats.overdueLoans} overdue loans that require immediate attention. 
                  <Button variant="link" className="p-0 h-auto text-yellow-700 dark:text-yellow-300 underline">
                    Review now
                  </Button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}