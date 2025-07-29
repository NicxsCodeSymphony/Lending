import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const dbService = await getDatabaseService();
    
    // Debug: Check if we're using SQLite or PostgreSQL
    console.log('Database service type:', dbService.constructor.name);
    
    // Ensure admin user exists (for development)
    if (dbService.constructor.name === 'DatabaseService') {
      try {
        const existingAdmin = await dbService.getUserByUsername('admin');
        if (!existingAdmin) {
          console.log('Creating admin user...');
          await dbService.createUser({
            account_name: 'admin',
            username: 'admin',
            password: 'admin'
          });
          console.log('✅ Admin user created successfully');
        }
      } catch (error) {
        console.log('Error ensuring admin user exists:', error);
      }
    }
    
    const user = await dbService.getUserByUsername(username);

    console.log("Users from database: ", user);

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Return user data that matches the AuthContext interface
    return NextResponse.json({
      success: true,
      user: {
        account_id: user.account_id,
        account_name: user.account_name,
        username: user.username,
        role: 'admin' // Add the role field back
      }
    });

  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 