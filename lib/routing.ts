import supabase from './supabase';

export interface RouteContact {
  type: 'email' | 'whatsapp';
  contact: string;
}

export interface Location {
  hospital: string;
  floor: string | null;
  wing: string | null;
}

// Returns all active contacts matching the location at every applicable level:
//   hospital + floor + wing  (most specific)
//   hospital + floor         (floor-wide)
//   hospital                 (hospital-wide)
// All levels are unioned — contacts at each level receive the alert.
export async function getContacts(
  location: Location,
  department: string
): Promise<{ emails: string[]; whatsapp: string[] }> {
  const { hospital, floor, wing } = location;

  // Build an OR filter that matches any applicable scope level
  // A row matches if:
  //   its floor is null (hospital-wide) OR equals the request floor
  //   its wing  is null (floor-wide)   OR equals the request wing
  const floorFilter = floor ? `floor.is.null,floor.eq.${floor}` : 'floor.is.null';
  const wingFilter  = wing  ? `wing.is.null,wing.eq.${wing}`   : 'wing.is.null';

  const { data, error } = await supabase
    .from('routing_contacts')
    .select('type, contact, name')
    .eq('hospital', hospital)
    .eq('department', department)
    .eq('active', true)
    .or(floorFilter)
    .or(wingFilter);

  if (error) {
    console.error('routing_contacts query failed:', error.message);
    return { emails: [], whatsapp: [] };
  }

  const emails: string[]   = [];
  const whatsapp: string[] = [];

  for (const row of data ?? []) {
    if (row.type === 'email')    emails.push(row.contact);
    if (row.type === 'whatsapp') whatsapp.push(row.contact);
  }

  return { emails, whatsapp };
}
