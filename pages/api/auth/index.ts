import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import supabase from '@/lib/supabaseAdmin';

const SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password } = req.body;
  try {
    // Query the users table for the provided username and password
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !users) {
      console.log('Authentication failed:', error?.message || 'User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = {
      id: users.account_id,
      username: users.username,
      role: users.role || 'user'
    };

    const token = jwt.sign(user, SECRET, { expiresIn: '1h' });

    res.setHeader('Set-Cookie', serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    }));
    return res.status(200).json({ user, token });

  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}