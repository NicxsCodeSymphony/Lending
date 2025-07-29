import supabase from "@/lib/supabaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";
import { toManilaTime } from "@/lib/utils";

interface CustomerData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  contact: string;
  address: string;
  birthdate: string;
  email: string;
}

interface CustomerUpdateData extends CustomerData {
  customer_id: string | number;
}

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// Validation function
const validateCustomerData = (data: Partial<CustomerData>): string | null => {
  if (!data.first_name?.trim()) return "First name is required";
  if (!data.last_name?.trim()) return "Last name is required";
  if (!data.contact?.trim()) return "Contact number is required";
  if (!data.email?.trim()) return "Email is required";
  if (!data.birthdate) return "Birthdate is required";
  if (!data.address?.trim()) return "Address is required";

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return "Please enter a valid email address";
  }

  // Contact number validation (basic)
  const contactRegex = /^\d{11}$/;
  if (!contactRegex.test(data.contact.replace(/\D/g, ''))) {
    return "Please enter a valid 11-digit contact number";
  }

  return null;
};

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<ApiResponse>
) {
  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Database error:", error);
        return res.status(500).json({ 
          error: "Failed to fetch customers" 
        });
      }

      return res.status(200).json({ data });

    } else if (req.method === "POST") {
      const customerData: CustomerData = req.body;

      // Validate input data
      const validationError = validateCustomerData(customerData);
      if (validationError) {
        return res.status(400).json({ 
          error: validationError 
        });
      }

      // Check if email already exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerData.email)
        .single();

      if (existingCustomer) {
        return res.status(409).json({ 
          error: "A customer with this email already exists" 
        });
      }

      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customerData,
          status: "pending",
                      created_at: toManilaTime(),
            updated_at: toManilaTime()
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        return res.status(500).json({ 
          error: "Failed to create customer" 
        });
      }

      return res.status(201).json({ 
        data, 
        message: "Customer created successfully" 
      });

    } else if (req.method === "PUT") {
      const updateData: CustomerUpdateData = req.body;

      if (!updateData.customer_id) {
        return res.status(400).json({ 
          error: "Customer ID is required" 
        });
      }

      // Validate input data
      const validationError = validateCustomerData(updateData);
      if (validationError) {
        return res.status(400).json({ 
          error: validationError 
        });
      }

      // Check if email already exists for another customer
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('customer_id')
        .eq('email', updateData.email)
        .neq('customer_id', updateData.customer_id)
        .single();

      if (existingCustomer) {
        return res.status(409).json({ 
          error: "A customer with this email already exists" 
        });
      }

      const { data, error } = await supabase
        .from('customers')
        .update({
          ...updateData,
                      updated_at: toManilaTime()
        })
        .eq('customer_id', updateData.customer_id)
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        return res.status(500).json({ 
          error: "Failed to update customer" 
        });
      }

      return res.status(200).json({ 
        data, 
        message: "Customer updated successfully" 
      });

    } else if (req.method === "DELETE") {
      const { customer_id } = req.body;

      if (!customer_id) {
        return res.status(400).json({ 
          error: "Customer ID is required" 
        });
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('customer_id', customer_id);

      if (error) {
        console.error("Database error:", error);
        return res.status(500).json({ 
          error: "Failed to delete customer" 
        });
      }

      return res.status(200).json({ 
        message: "Customer deleted successfully" 
      });

    } else {
      return res.status(405).json({ 
        error: "Method not allowed" 
      });
    }

  } catch (err: unknown) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ 
      error: "An unexpected error occurred" 
    });
  }
}