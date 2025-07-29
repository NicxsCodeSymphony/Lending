import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/app/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { username, oldPassword, newPassword } = await request.json();

    if (!username || !oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Username, old password, and new password are required' },
        { status: 400 }
      );
    }

    const dbService = await getDatabaseService();
    const user = await dbService.getUserByUsername(username);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if old password matches
    if (user.password !== oldPassword) {
      return NextResponse.json(
        { error: 'Invalid old password' },
        { status: 401 }
      );
    }

    // Update the password
    await dbService.updateUser(user.account_id, { password: newPassword });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}