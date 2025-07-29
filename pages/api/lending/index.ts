import supabase from "@/lib/supabaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";
import { toManilaTime } from "@/lib/utils";

interface LoanData {
  loan_id: string;
  customer_id: string;
  loan_start: string;
  months: number;
  loan_end: string;
  transaction_date: string;
  loan_amount: number;
  interest: number;
  gross_receivable: number;
  payday_payment: number;
  service: number;
  balance: number;
  adjustment: number;
  overall_balance: number;
  penalty: number;
  status: string;
  created_at: string;
  updated_at: string;
  customers?: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const table = "loan";

  try {
    switch (req.method) {
      case "GET": {
        const { data, error } = await supabase
          .from(table)
          .select(`
            *,
            customers (
              first_name,
              middle_name,
              last_name
            )
          `);
        if (error) throw error;
        
        // Transform the data to match the expected interface
        const transformedData = data?.map((loan: LoanData) => ({
          loan_id: loan.loan_id,
          customer_id: loan.customer_id,
          loan_start: loan.loan_start,
          months: loan.months,
          loan_end: loan.loan_end,
          transaction_date: loan.transaction_date,
          loan_amount: loan.loan_amount,
          interest: loan.interest,
          gross_receivable: loan.gross_receivable,
          payday_payment: loan.payday_payment,
          service: loan.service,
          balance: loan.balance,
          adjustment: loan.adjustment,
          overall_balance: loan.overall_balance,
          penalty: loan.penalty,
          status: loan.status,
          created_at: loan.created_at,
          updated_at: loan.updated_at,
          first_name: loan.customers?.first_name || '',
          middle_name: loan.customers?.middle_name || '',
          last_name: loan.customers?.last_name || ''
        })) || [];
        
        return res.status(200).json(transformedData);
      }

      case "POST": {
        const {
          customer_id,
          loan_start,
          months,
          loan_end,
          transaction_date,
          loan_amount,
          interest,
          gross_receivable,
          payday_payment,
          service,
          balance,
          adjustment,
          overall_balance,
          penalty,
          payment_schedule, // Add payment_schedule to the destructuring
        } = req.body;

        console.log("Creating loan with data:", {
          customer_id,
          months,
          payment_schedule,
          payday_payment
        });

        // First, create the loan record
        const { data: loanData, error: loanError } = await supabase.from(table).insert([
          {
            customer_id,
            loan_start,
            months,
            loan_end,
            transaction_date,
            loan_amount,
            interest,
            gross_receivable,
            payday_payment,
            service,
            balance,
            adjustment,
            overall_balance,
            penalty,
            status: "not paid",
            created_at: toManilaTime(),
            updated_at: toManilaTime(),
          },
        ]).select();

        if (loanError) {
          console.error("Error creating loan:", loanError);
          throw loanError;
        }

        const newLoan = loanData?.[0];
        if (!newLoan) {
          throw new Error("Failed to create loan");
        }

        console.log("Loan created successfully with ID:", newLoan.loan_id);

        // Now create receipt records for each payment term
        const receiptRecords = [];
        const startDate = new Date(loan_start);

        console.log("Creating receipt records for", months, "payments with schedule:", payment_schedule);

        for (let i = 1; i <= months; i++) {
          const dueDate = new Date(startDate);
          
          // Calculate the due date based on payment schedule
          switch (payment_schedule) {
            case 'daily':
              dueDate.setDate(dueDate.getDate() + (i - 1));
              break;
            case 'weekly':
              dueDate.setDate(dueDate.getDate() + ((i - 1) * 7));
              break;
            case 'monthly':
              dueDate.setMonth(dueDate.getMonth() + (i - 1));
              break;
            case 'semester':
              dueDate.setMonth(dueDate.getMonth() + ((i - 1) * 6));
              break;
            case 'annually':
              dueDate.setFullYear(dueDate.getFullYear() + (i - 1));
              break;
            default:
              // Default to monthly if no schedule specified
              dueDate.setMonth(dueDate.getMonth() + (i - 1));
          }

          // Simplified receipt record with only basic fields
          const receiptRecord = {
            loan_id: newLoan.loan_id,
            to_pay: payday_payment,
            original_to_pay: payday_payment,
            schedule: payment_schedule || 'monthly',
            amount: 0,
            transaction_time: dueDate.toISOString(),
            status: "Pending"
          };

          receiptRecords.push(receiptRecord);
          console.log(`Receipt ${i}:`, receiptRecord);
        }

        // Insert all receipt records
        if (receiptRecords.length > 0) {
          console.log("Inserting", receiptRecords.length, "receipt records...");
          
          const { data: receiptData, error: receiptError } = await supabase
            .from("receipt")
            .insert(receiptRecords)
            .select();

          if (receiptError) {
            console.error("Error creating receipt records:", receiptError);
            // Return error but don't throw to avoid breaking the loan creation
            return res.status(500).json({ 
              error: "Loan created but failed to create receipt records", 
              loan: newLoan,
              receiptError: receiptError.message 
            });
          } else {
            console.log("Successfully created", receiptData?.length, "receipt records");
          }
        } else {
          console.log("No receipt records to create");
        }

        return res.status(201).json(newLoan);
      }

      case "PUT": {
        const { loan_id, ...updates } = req.body;

        if (!loan_id) {
          return res.status(400).json({ error: "Missing loan_id" });
        }

        const { data, error } = await supabase
          .from(table)
          .update({
            ...updates,
            updated_at: toManilaTime(),
          })
          .eq("loan_id", loan_id)
          .select();

        if (error) {
          console.error("Error updating loan:", error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(data?.[0]);
      }

      case "DELETE": {
        const { id } = req.body;

        const { data, error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
        return res.status(200).json({ message: "Loan deleted", data });
      }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("API Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: "An unknown error occurred" });
  }
}