import supabase from "@/lib/supabaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";
import { toManilaTime } from "@/lib/utils";

const table = "receipt";

interface ReceiptRecord {
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
  try {
    switch (req.method) {
      case "GET": {
        const { data, error } = await supabase.from(table).select("*");
        if (error) throw error;

        const transformed = data?.map((r: ReceiptRecord) => ({
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
          payment_number: r.payment_number,
          due_date: r.due_date,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }));

        return res.status(200).json(transformed);
      }

      case "POST": {
        const {
          loan_id,
          to_pay,
          original_to_pay,
          schedule,
          amount,
          payment_type,
          payment_method,
          transaction_time,
          status = "Pending",
          payment_number,
          due_date,
          payment_distribution,
        } = req.body;

        const { data, error } = await supabase.from(table).insert([
          {
            loan_id,
            to_pay,
            original_to_pay,
            schedule,
            amount,
            payment_type,
            payment_method,
            transaction_time,
            status,
            payment_number,
            due_date,
            payment_distribution,
            created_at: toManilaTime(),
            updated_at: toManilaTime(),
          },
        ]).select();

        if (error) {
          console.error("Error creating receipt:", error);
          throw error;
        }

        return res.status(201).json(data?.[0]);
      }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Receipt API Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: "An unknown error occurred" });
  }
}