-- COPY-PASTE THIS INTO SUPABASE SQL EDITOR
-- Go to: https://supabase.co → Your Project → SQL Editor → New Query

-- Request Status Lifecycle Tracking
-- Status values: created, acknowledged, resolved, escalated

-- Main request tracking table
create table if not exists request_status (
  id              uuid primary key default gen_random_uuid(),
  request_id      bigint not null references patient_requests(id) on delete cascade,
  status          text not null check (status in ('created', 'acknowledged', 'resolved', 'escalated')),
  assigned_to     text not null, -- phone number of staff member
  assigned_at     timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  
  -- For escalation tracking
  escalation_count  int default 0,
  last_escalated_at timestamptz,
  
  unique(request_id) -- Only one active status per request
);

-- Audit trail for all status changes
create table if not exists request_audit_log (
  id              uuid primary key default gen_random_uuid(),
  request_id      bigint not null references patient_requests(id) on delete cascade,
  status_from     text,
  status_to       text not null,
  action_by       text, -- phone number of person making the change
  action_type     text not null check (action_type in ('created', 'acknowledged', 'resolved', 'escalated', 'reassigned', 'timeout')),
  notes           text,
  timestamp       timestamptz not null default now()
);

-- Create indexes for faster queries
create index if not exists request_status_active 
  on request_status (status, assigned_to);

create index if not exists request_audit_log_request 
  on request_audit_log (request_id, timestamp desc);

create index if not exists request_audit_log_staff 
  on request_audit_log (action_by, timestamp desc);
