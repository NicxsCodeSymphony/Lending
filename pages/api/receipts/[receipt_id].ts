import supabase from "@/lib/supabaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";
import { toManilaTime } from "@/lib/utils";

const table = "receipt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const receiptId = Number(req.query.receipt_id);

  if (!receiptId) return res.status(400).json({ error: "Missing receipt ID" });

  try {
    switch (req.method) {
      // 📖 GET receipt by ID
      case "GET": {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq("receipt_id", receiptId)
          .single();

        if (error) {
          console.error("Error fetching receipt:", error);
          return res.status(500).json({ error: error.message });
        }
        return res.status(200).json(data);
      }

      // ✏️ PUT update receipt
      case "PUT": {
        console.log(`Updating receipt ${receiptId} with data:`, req.body);
        
        // First, let's check if the receipt exists and see its current structure
        const { data: existingReceipt, error: fetchError } = await supabase
          .from(table)
          .select("*")
          .eq("receipt_id", receiptId)
          .single();

        if (fetchError) {
          console.error("Error fetching existing receipt:", fetchError);
          return res.status(500).json({ error: `Receipt not found: ${fetchError.message}` });
        }

        console.log("Existing receipt structure:", existingReceipt);
        
        const updates = {
          ...req.body,
                      updated_at: toManilaTime(),
        };

        console.log("Attempting to update with:", updates);

        const { data, error } = await supabase
          .from(table)
          .update(updates)
          .eq("receipt_id", receiptId)
          .select();

        if (error) {
          console.error("Error updating receipt:", error);
          return res.status(500).json({ error: error.message });
        }

        console.log(`Successfully updated receipt ${receiptId}:`, data?.[0]);
        return res.status(200).json(data?.[0]);
      }

      // ❌ DELETE receipt
      case "DELETE": {
        const { data, error } = await supabase.from(table).delete().eq("receipt_id", receiptId);
        if (error) {
          console.error("Error deleting receipt:", error);
          return res.status(500).json({ error: error.message });
        }
        return res.status(200).json({ message: "Receipt deleted", data });
      }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err: unknown) {
    console.error("Unexpected error in receipt API:", err);
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: "An unknown error occurred" });
  }
}