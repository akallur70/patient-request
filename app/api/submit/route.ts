import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase';
import { sendAlerts } from '../../../lib/alerts';
import { initializeRequestTracking } from '../../../lib/statusTracking';
import { getContacts } from '../../../lib/routing';

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

    const { data: insertedRequest, error } = await supabase
      .from('patient_requests')
      .insert([{ hospital, floor: floor || null, wing: wing || null, room, department, notes: notes || null }])
      .select('id')
      .single();

    console.log('insert result:', JSON.stringify({ data: insertedRequest, error }));

    if (error) throw error;

    const requestId = insertedRequest?.id ?? null;

    await sendAlerts({
      location: { hospital, floor: floor || null, wing: wing || null },
      room,
      department,
      notes: notes || null,
      requestId,
    });

    // Initialise status tracking — assign to first WhatsApp contact
    const { whatsapp } = await getContacts(
      { hospital, floor: floor || null, wing: wing || null },
      department
    );
    if (requestId && whatsapp.length > 0) {
      await initializeRequestTracking(String(requestId), whatsapp[0]).catch(err =>
        console.error('Tracking init failed:', err.message)
      );
    } else {
      console.log('Tracking skipped — requestId:', requestId, 'whatsapp contacts:', whatsapp.length);
    }

    return NextResponse.json({ success: true, requestId });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
