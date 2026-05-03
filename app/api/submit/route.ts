import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase';
import { sendAlerts } from '../../../lib/alerts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { room, department, notes } = body;

    if (!room || !department) {
      return NextResponse.json(
        { success: false, error: 'room and department are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('patient_requests')
      .insert([{ room, department, notes: notes || null }]);

    if (error) throw error;

    await sendAlerts({ room, department, notes: notes || null });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
