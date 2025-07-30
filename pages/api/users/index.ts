import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";

type UserPayload = {
  id?: string;
  username?: string;
  password?: string;
  email?: string;
  role?: string;
};

const selectFields = "id, username, email, role, created_at, updated_at";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "GET":
        return await handleGet(res);
      case "POST":
        return await handlePost(req, res);
      case "PUT":
        return await handlePut(req, res);
      case "DELETE":
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return res.status(500).json({ error: message });
  }
}

async function handleGet(res: NextApiResponse) {
  const { data, error } = await supabase
    .from("users")
    .select(selectFields);

  if (error) throw new Error(error.message);
  return res.status(200).json(data);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { username, password, email, role }: UserPayload = req.body;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("users")
    .insert({
      username,
      password,
      email,
      role: role || "user",
      created_at: now,
      updated_at: now,
    })
    .select(selectFields);

  if (error) throw new Error(error.message);
  return res.status(200).json(data);
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id, username, email, role }: UserPayload = req.body;

  if (!id) throw new Error("Missing user ID");

  const { data, error } = await supabase
    .from("users")
    .update({
      username,
      email,
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(selectFields);

  if (error) throw new Error(error.message);
  return res.status(200).json(data);
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id }: UserPayload = req.body;

  if (!id) throw new Error("Missing user ID");

  const { data, error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return res.status(200).json(data);
}