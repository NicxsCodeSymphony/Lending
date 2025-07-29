import supabase from "@/lib/supabaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";

const table = "receipt";

interface LoanReceiptRecord {
  receipt_id: number;
  loan_id: number;
  to_pay: number;
  original_to_pay: number;
  schedule: number;
  amount: number;
  payment_type: string;
  payment_method: string;
  transaction_time: string;
  status: string;
  payment_number: number;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const loanId = Number(req.query.loan_id);

  if (!loanId) return res.status(400).json({ error: "Missing loan ID" });

  try {
    if (req.method === "GET") {
      console.log(`Fetching receipts for loan ${loanId}...`);
      
      // First, test if the table exists and we can access it
      const { data: _testData, error: testError } = await supabase
        .from(table)
        .select("receipt_id")
        .limit(1);

      if (testError) {
        console.error("Table access error:", testError);
        return res.status(500).json({ error: `Table access error: ${testError.message}` });
      }

      console.log("Table access successful, proceeding with query...");
      
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("loan_id", loanId);

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({ error: error.message });
      }

      console.log(`Raw data from database:`, data);

      const transformed = data?.map((r: LoanReceiptRecord) => ({
        receipt_id: r.receipt_id,
        loan_id: r.loan_id,
        to_pay: r.to_pay,
        original_to_pay: r.original_to_pay,
        schedule: r.schedule,
        amount: r.amount,
        payment_type: r.payment_type,
        payment_method: r.payment_method,
        transaction_time: r.transaction_time,
        status: r.status ?? "Pending",
        payment_number: r.payment_number || 1,
        due_date: r.due_date || r.transaction_time,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));

      console.log(`Found ${transformed?.length || 0} receipts for loan ${loanId}:`, transformed);

      return res.status(200).json(transformed || []);
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err: unknown) {
    console.error("Unexpected error in loan receipts API:", err);
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: "An unknown error occurred" });
  }
}