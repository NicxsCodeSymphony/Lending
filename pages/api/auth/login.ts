import supabase from "@/lib/supabaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Query the users table for the provided username and password
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - invalid credentials
        return res.status(401).json({ error: "Invalid username or password" });
      }
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const { password: _unused, ...userWithoutPassword } = data;
    
    res.status(200).json({
      message: "Login successful",
      user: userWithoutPassword
    });

  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
}