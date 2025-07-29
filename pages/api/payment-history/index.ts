import supabase from "@/lib/supabaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const table = "payment_history";

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
          .order('transaction_time', { ascending: false });

        if (error) throw error;

        // Transform the data to include customer name
        const transformedData = data?.map(item => ({
          history_id: item.history_id,
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

      case "POST": {
        const {
          loan_id,
          receipt_id,
          amount,
          payment_method,
          notes,
          transaction_time
        } = req.body;

        // Validate required fields
        if (!loan_id || !amount || !payment_method || !transaction_time) {
          return res.status(400).json({ 
            error: "Missing required fields: loan_id, amount, payment_method, transaction_time" 
          });
        }

        const { data, error } = await supabase
          .from(table)
          .insert({
            loan_id,
            receipt_id: receipt_id || 0,
            amount,
            payment_method,
            notes: notes || '',
            transaction_time
          })
          .select()
          .single();

        if (error) throw error;

        return res.status(201).json({ data });
      }

      case "PUT": {
        const {
          payment_history_id,
          loan_id,
          receipt_id,
          amount,
          payment_method,
          notes,
          transaction_time
        } = req.body;

        if (!payment_history_id) {
          return res.status(400).json({ error: "payment_history_id is required" });
        }

        const updateData: {
          loan_id?: number;
          receipt_id?: number;
          amount?: number;
          payment_method?: string;
          notes?: string;
          transaction_time?: string;
        } = {};
        if (loan_id !== undefined) updateData.loan_id = loan_id;
        if (receipt_id !== undefined) updateData.receipt_id = receipt_id;
        if (amount !== undefined) updateData.amount = amount;
        if (payment_method !== undefined) updateData.payment_method = payment_method;
        if (notes !== undefined) updateData.notes = notes;
        if (transaction_time !== undefined) updateData.transaction_time = transaction_time;

        const { data, error } = await supabase
          .from(table)
          .update(updateData)
          .eq('payment_history_id', payment_history_id)
          .select()
          .single();

        if (error) throw error;

        if (!data) {
          return res.status(404).json({ error: "Payment history record not found" });
        }

        return res.status(200).json({ data });
      }

      case "DELETE": {
        const { payment_history_id } = req.body;

        if (!payment_history_id) {
          return res.status(400).json({ error: "payment_history_id is required" });
        }

        const { error } = await supabase
          .from(table)
          .delete()
          .eq('payment_history_id', payment_history_id);

        if (error) throw error;

        return res.status(200).json({ message: "Payment history record deleted successfully" });
      }

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
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