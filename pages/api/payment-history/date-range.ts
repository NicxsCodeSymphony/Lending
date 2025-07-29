import supabase from "@/lib/supabaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end } = req.query;
  const table = "payment_history";

  if (!start || !end || typeof start !== 'string' || typeof end !== 'string') {
    return res.status(400).json({ error: "Start and end dates are required" });
  }

  try {
    switch (req.method) {
      case "GET": {
        const { data, error } = await supabase
          .from(table)
          .select(`
            *,
            loan:loan_id (
              loan_id,
              loan_amount,
              customers (
                first_name,
                last_name
              )
            )
          `)
          .gte('transaction_time', start)
          .lte('transaction_time', end)
          .order('transaction_time', { ascending: false });

        if (error) throw error;

        const transformedData = data?.map(item => ({
          payment_history_id: item.history_id,
          loan_id: item.loan_id,
          receipt_id: item.receipt_id,
          amount: item.amount,
          payment_method: item.payment_method,
          notes: item.notes,
          transaction_time: item.transaction_time,
          created_at: item.created_at,
          updated_at: item.updated_at,
          customer_name: item.loan?.customers 
            ? `${item.loan.customers.first_name} ${item.loan.customers.last_name}`
            : `Customer #${item.loan_id}`,
          loan_amount: item.loan?.loan_amount || 0
        })) || [];

        return res.status(200).json({ data: transformedData });
      }

      default:
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (err: unknown) {
    console.error('Payment history date range API error:', err);
    
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }
    
    return res.status(500).json({ error: "Internal server error" });
  }
} 