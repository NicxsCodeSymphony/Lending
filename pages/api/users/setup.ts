import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // First, let's check if the users table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('Table structure error:', tableError);
      return res.status(500).json({ error: 'Users table not properly configured' });
    }

    // Insert a test user if the table exists
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          username: 'admin',
          password: 'password',
          role: 'admin',
          email: 'admin@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          username: 'user',
          password: 'password',
          role: 'user',
          email: 'user@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (insertError) {
      console.log('Insert error:', insertError);
      return res.status(500).json({ error: insertError.message });
    }

    return res.status(200).json({ 
      message: 'Users table setup completed',
      users: insertData 
    });

  } catch (err) {
    console.error('Setup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 