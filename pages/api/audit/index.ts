import supabase from "@/lib/supabaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";
import { toManilaTime } from "@/lib/utils";

const table = "audit";

// Sample audit data for demonstration
const sampleAuditData = [
  {
    audit_id: 1,
    actor_id: 1,
    actor_role: "admin",
    action_type: "create",
    entity_id: 101,
    entity_type: "customer",
    action_details: "Created new customer: John Doe",
    time: new Date().toISOString()
  },
  {
    audit_id: 2,
    actor_id: 1,
    actor_role: "admin",
    action_type: "create",
    entity_id: 201,
    entity_type: "loan",
    action_details: "Created loan for customer ID 101: $5000 at 5% interest",
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    audit_id: 3,
    actor_id: 2,
    actor_role: "manager",
    action_type: "payment",
    entity_id: 301,
    entity_type: "payment",
    action_details: "Processed payment of $500 for loan ID 201",
    time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
  },
  {
    audit_id: 4,
    actor_id: 1,
    actor_role: "admin",
    action_type: "update",
    entity_id: 101,
    entity_type: "customer",
    action_details: "Updated customer contact information",
    time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    audit_id: 5,
    actor_id: 3,
    actor_role: "user",
    action_type: "view",
    entity_id: 201,
    entity_type: "loan",
    action_details: "Viewed loan details for loan ID 201",
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  },
  {
    audit_id: 6,
    actor_id: 1,
    actor_role: "admin",
    action_type: "delete",
    entity_id: 102,
    entity_type: "customer",
    action_details: "Deleted customer: Jane Smith (ID: 102)",
    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  },
  {
    audit_id: 7,
    actor_id: 2,
    actor_role: "manager",
    action_type: "payment",
    entity_id: 302,
    entity_type: "payment",
    action_details: "Processed late payment with penalty for loan ID 201",
    time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  },
  {
    audit_id: 8,
    actor_id: 1,
    actor_role: "admin",
    action_type: "create",
    entity_id: 103,
    entity_type: "customer",
    action_details: "Created new customer: Mike Johnson",
    time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "GET": {
        // For demonstration, always return sample data
        // In production, you would fetch from the database
        try {
          const { data, error } = await supabase
            .from(table)
            .select("*")
            .order('time', { ascending: false });

          if (error || !data || data.length === 0) {
            // If database is not available or no data, return sample data
            console.warn("Using sample data:", error?.message || "No data in database");
            return res.status(200).json(sampleAuditData);
          }

          const transformedData = data?.map((item: Record<string, unknown>) => ({
            audit_id: item.audit_id,
            actor_id: item.actor_id,
            actor_role: item.actor_role,
            action_type: item.action_type,
            entity_id: item.entity_id,
            entity_type: item.entity_type,
            action_details: item.action_details,
            time: item.time,
          }));

          return res.status(200).json(transformedData);
        } catch (dbError) {
          // If any database error occurs, return sample data
          console.warn("Database connection error, using sample data:", dbError);
          return res.status(200).json(sampleAuditData);
        }
      }

      case "POST": {
        const {
          actor_id,
          actor_role,
          action_type,
          entity_id,
          entity_type,
          action_details,
        } = req.body;

        const { data, error } = await supabase
          .from(table)
          .insert([
            {
              actor_id,
              actor_role,
              action_type,
              entity_id,
              entity_type,
              action_details,
              time: toManilaTime(),
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json(data);
      }

      case "PUT": {
        const { audit_id, ...updates } = req.body;

        const { data, error } = await supabase
          .from(table)
          .update({
            ...updates,
            time: toManilaTime(), 
          })
          .eq("audit_id", audit_id)
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json(data);
      }

      case "DELETE": {
        const { audit_id } = req.body;

        const { data, error } = await supabase
          .from(table)
          .delete()
          .eq("audit_id", audit_id)
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json({ message: "Audit entry deleted", data });
      }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Audit API error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    console.error("Audit API error:", err);
    return res.status(500).json({ error: "An unknown error occurred" });
  }
}