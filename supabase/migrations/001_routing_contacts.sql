-- routing_contacts: stores email/whatsapp contacts per hospital/floor/wing/department
-- Null floor = applies to all floors in that hospital
-- Null wing  = applies to all wings on that floor (or floors without wings)
-- Alerts are sent to ALL matching rows across every level (hospital + floor + wing)

create table if not exists routing_contacts (
  id          uuid primary key default gen_random_uuid(),
  hospital    text not null,
  floor       text,
  wing        text,
  department  text not null check (department in ('Nursing', 'Housekeeping', 'Maintenance')),
  type        text not null check (type in ('email', 'whatsapp')),
  contact     text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Useful index for the alert query
create index routing_contacts_lookup
  on routing_contacts (hospital, department, active);

-- Extend patient_requests to record location context
alter table patient_requests
  add column if not exists hospital text,
  add column if not exists floor    text,
  add column if not exists wing     text;
