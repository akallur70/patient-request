import { NextResponse } from 'next/server';
import supabase from '../../../../lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('routing_contacts')
    .select('*')
    .order('hospital')
    .order('department')
    .order('type');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { hospital, floor, wing, department, type, contact, name } = body;

  if (!hospital || !department || !type || !contact) {
    return NextResponse.json({ error: 'hospital, department, type and contact are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('routing_contacts')
    .insert([{
      hospital,
      floor:      floor?.trim()   || null,
      wing:       wing?.trim()    || null,
      department,
      type,
      contact:    contact.trim(),
      name:       name?.trim()    || null,
      active:     true,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
