import supabase from "@/lib/supabaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const table = "payment_history";

  try {
    switch (req.method) {
      case "GET": {
        // Get all payment history data
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('transaction_time', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
          return res.status(200).json({
            data: {
              totalTransactions: 0,
              totalAmount: 0,
              completedTransactions: 0,
              pendingTransactions: 0,
              totalPayments: 0,
              totalDisbursements: 0,
              monthlyStats: []
            }
          });
        }

        // Calculate statistics
        const totalTransactions = data.length;
        const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0);
        const completedTransactions = data.filter(item => item.amount > 0).length;
        const pendingTransactions = 0; // You might want to add a status field to your database

        // Calculate monthly statistics
        const monthlyStats = calculateMonthlyStats(data);

        // For now, all transactions are considered payments
        // You might want to differentiate between payments and disbursements based on your business logic
        const totalPayments = totalAmount;
        const totalDisbursements = 0; // This would come from loan disbursements

        const stats = {
          totalTransactions,
          totalAmount,
          completedTransactions,
          pendingTransactions,
          totalPayments,
          totalDisbursements,
          monthlyStats
        };

        return res.status(200).json({ data: stats });
      }

      default:
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (err: unknown) {
    console.error('Payment history stats API error:', err);
    
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }
    
    return res.status(500).json({ error: "Internal server error" });
  }
}

interface PaymentHistoryItem {
  transaction_time: string;
  amount: number;
}

function calculateMonthlyStats(data: PaymentHistoryItem[]) {
  const monthlyMap = new Map<string, { total: number; count: number }>();

  data.forEach(item => {
    const date = new Date(item.transaction_time);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const current = monthlyMap.get(monthKey) || { total: 0, count: 0 };
    current.total += item.amount || 0;
    current.count += 1;
    
    monthlyMap.set(monthKey, current);
  });

  const monthlyStats = Array.from(monthlyMap.entries())
    .map(([month, stats]) => ({
      month,
      total: stats.total,
      count: stats.count
    }))
    .sort((a, b) => b.month.localeCompare(a.month));

  return monthlyStats;
} 