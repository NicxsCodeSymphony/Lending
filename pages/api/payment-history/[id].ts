import supabase from "@/lib/supabaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const table = "payment_history";

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: "Invalid payment history ID" });
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
          .eq('payment_history_id', parseInt(id))
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: "Payment history record not found" });
          }
          throw error;
        }

        // Transform the data to include customer name
        const transformedData = {
          payment_history_id: data.history_id,
          loan_id: data.loan_id,
          receipt_id: data.receipt_id,
          amount: data.amount,
          payment_method: data.payment_method,
          notes: data.notes,
          transaction_time: data.transaction_time,
          created_at: data.created_at,
          updated_at: data.updated_at,
          customer_name: data.loan?.customers 
            ? `${data.loan.customers.first_name} ${data.loan.customers.last_name}`
            : `Customer #${data.loan_id}`,
          loan_amount: data.loan?.loan_amount || 0
        };

        return res.status(200).json({ data: transformedData });
      }

      default:
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (err: unknown) {
    console.error('Payment history API error:', err);
    
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }
    
    return res.status(500).json({ error: "Internal server error" });
  }
} 