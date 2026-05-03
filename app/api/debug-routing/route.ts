import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hospital   = searchParams.get('hospital')   ?? '';
  const floor      = searchParams.get('floor')      ?? null;
  const wing       = searchParams.get('wing')       ?? null;
  const department = searchParams.get('department') ?? '';

  // Step 1: fetch ALL rows for this hospital+department so we can see what's in the table
  const { data: allRows, error: allErr } = await supabase
    .from('routing_contacts')
    .select('*')
    .eq('hospital', hospital)
    .eq('department', department);

  // Step 2: run the real routing query
  const floorFilter = floor ? `floor.is.null,floor.eq.${floor}` : 'floor.is.null';
  const wingFilter  = wing  ? `wing.is.null,wing.eq.${wing}`    : 'wing.is.null';

  const { data: matched, error: matchErr } = await supabase
    .from('routing_contacts')
    .select('*')
    .eq('hospital', hospital)
    .eq('department', department)
    .eq('active', true)
    .or(floorFilter)
    .or(wingFilter);

  return NextResponse.json({
    params:  { hospital, floor, wing, department },
    allRows: { data: allRows, error: allErr?.message },
    matched: { data: matched, error: matchErr?.message },
  });
}
