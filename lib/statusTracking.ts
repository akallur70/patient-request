import supabase from './supabase';

export type RequestStatus = 'created' | 'acknowledged' | 'resolved' | 'escalated';
export type AuditActionType = 'created' | 'acknowledged' | 'resolved' | 'escalated' | 'reassigned' | 'timeout';

export interface RequestStatusRecord {
  id: string;
  request_id: string;
  status: RequestStatus;
  assigned_to: string; // phone number
  assigned_at: string;
  updated_at: string;
  escalation_count: number;
  last_escalated_at: string | null;
}

export interface AuditLogEntry {
  id: string;
  request_id: string;
  status_from: string | null;
  status_to: string;
  action_by: string | null; // null for auto-actions like 'timeout'
  action_type: AuditActionType;
  notes: string | null;
  timestamp: string;
}

export interface StatusUpdate {
  requestId: string;
  statusFrom: RequestStatus;
  statusTo: RequestStatus;
  actionBy: string; // phone number of person making change
  actionType: AuditActionType;
  notes?: string;
}

/**
 * Initialize tracking for a new request
 * Called immediately after request is created
 */
export async function initializeRequestTracking(
  requestId: string,
  assignedToPhone: string
): Promise<RequestStatusRecord | null> {
  const { data, error } = await supabase
    .from('request_status')
    .insert([{
      request_id: requestId,
      status: 'created',
      assigned_to: assignedToPhone,
    }])
    .select()
    .single();

  if (error) {
    console.error('Failed to initialize request tracking:', error.message);
    return null;
  }

  // Log the creation
  await logAuditEntry({
    request_id: requestId,
    status_from: null,
    status_to: 'created',
    action_by: null,
    action_type: 'created',
    notes: `Assigned to ${assignedToPhone}`,
  });

  return data;
}

/**
 * Update request status and log to audit trail
 */
export async function updateRequestStatus(
  update: StatusUpdate
): Promise<RequestStatusRecord | null> {
  const { requestId, statusFrom, statusTo, actionBy, actionType, notes } = update;

  // Update status
  const { data, error } = await supabase
    .from('request_status')
    .update({
      status: statusTo,
      updated_at: new Date().toISOString(),
    })
    .eq('request_id', requestId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update request status:', error.message);
    return null;
  }

  // Log to audit trail
  await logAuditEntry({
    request_id: requestId,
    status_from: statusFrom,
    status_to: statusTo,
    action_by: actionBy,
    action_type: actionType,
    notes,
  });

  return data;
}

/**
 * Reassign request to another staff member
 * (happens during escalation)
 */
export async function reassignRequest(
  requestId: string,
  newAssigneePhone: string,
  previousAssigneePhone: string
): Promise<RequestStatusRecord | null> {
  // First get current escalation count
  const { data: current } = await supabase
    .from('request_status')
    .select('escalation_count')
    .eq('request_id', requestId)
    .single();

  const newEscalationCount = (current?.escalation_count || 0) + 1;

  const { data, error } = await supabase
    .from('request_status')
    .update({
      assigned_to: newAssigneePhone,
      escalation_count: newEscalationCount,
      last_escalated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'escalated',
    })
    .eq('request_id', requestId)
    .select()
    .single();

  if (error) {
    console.error('Failed to reassign request:', error.message);
    return null;
  }

  // Log reassignment
  await logAuditEntry({
    request_id: requestId,
    status_from: 'created',
    status_to: 'escalated',
    action_by: null, // Auto-escalation
    action_type: 'escalated',
    notes: `Escalated from ${previousAssigneePhone} to ${newAssigneePhone} due to timeout`,
  });

  return data;
}

/**
 * Get current request status
 */
export async function getRequestStatus(
  requestId: string
): Promise<RequestStatusRecord | null> {
  const { data, error } = await supabase
    .from('request_status')
    .select('*')
    .eq('request_id', requestId)
    .single();

  if (error) {
    console.error('Failed to get request status:', error.message);
    return null;
  }

  return data;
}

/**
 * Get full audit trail for a request
 */
export async function getAuditTrail(
  requestId: string
): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('request_audit_log')
    .select('*')
    .eq('request_id', requestId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Failed to get audit trail:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Get pending requests for a staff member
 */
export async function getPendingRequests(staffPhoneNumber: string) {
  const { data, error } = await supabase
    .from('request_status')
    .select(`
      *,
      patient_requests (
        id,
        hospital,
        floor,
        wing,
        room,
        department,
        notes,
        created_at
      )
    `)
    .eq('assigned_to', staffPhoneNumber)
    .in('status', ['created', 'escalated'])
    .order('assigned_at', { ascending: true });

  if (error) {
    console.error('Failed to get pending requests:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Get escalation history for analytics
 */
export async function getEscalationHistory(
  staffPhoneNumber: string,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('request_audit_log')
    .select('*')
    .eq('action_by', staffPhoneNumber)
    .gte('timestamp', startDate.toISOString())
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Failed to get escalation history:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Internal: Log audit entry
 */
async function logAuditEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
  const { error } = await supabase
    .from('request_audit_log')
    .insert([entry]);

  if (error) {
    console.error('Failed to log audit entry:', error.message);
  }
}
