import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (error) {
      console.error('Error fetching auth users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = data.users.map((u) => ({
      id: u.id,
      email: u.email,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching auth users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
