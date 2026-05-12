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

  // Fetch all contacts for this hospital/department
  const { data, error } = await supabase
    .from('routing_contacts')
    .select('type, contact, name, floor, wing')
    .eq('hospital', hospital)
    .eq('department', department)
    .eq('active', true);

  if (error) {
    console.error('routing_contacts query failed:', error.message);
    return { emails: [], whatsapp: [] };
  }

  const emails: string[]   = [];
  const whatsapp: string[] = [];

  // Filter in code: include rows where:
  // - floor is null (hospital-wide) OR floor matches
  // - wing is null (floor-wide) OR wing matches
  for (const row of data ?? []) {
    const floorMatches = row.floor === null || row.floor === floor;
    const wingMatches = row.wing === null || row.wing === wing;

    if (floorMatches && wingMatches) {
      if (row.type === 'email')    emails.push(row.contact);
      if (row.type === 'whatsapp') whatsapp.push(row.contact);
    }
  }

  return { emails, whatsapp };
}
