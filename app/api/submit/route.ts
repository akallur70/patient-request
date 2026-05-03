import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase';
import { sendAlerts } from '../../../lib/alerts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hospital, floor, wing, room, department, notes } = body;

    if (!hospital || !room || !department) {
      return NextResponse.json(
        { success: false, error: 'hospital, room and department are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('patient_requests')
      .insert([{ hospital, floor: floor || null, wing: wing || null, room, department, notes: notes || null }]);

    if (error) throw error;

    await sendAlerts({
      location: { hospital, floor: floor || null, wing: wing || null },
      room,
      department,
      notes: notes || null,
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
