-- รันเพิ่มใน Supabase > SQL Editor (รันซ้ำได้) สำหรับ: รหัส DTC แก้จากหน้าเจ้าของ + ตั้งค่า WiFi/อีเมล
create table if not exists dtc_codes(
  code text primary key check (code ~ '^[PCBU][0-9A-F]{4}$'),
  th text not null check (length(th) <= 200),
  en text default '' check (length(en) <= 200),
  hidden boolean not null default false
);
alter table dtc_codes enable row level security;
drop policy if exists dtc_read on dtc_codes; create policy dtc_read on dtc_codes for select to anon using (true);
drop policy if exists dtc_own  on dtc_codes; create policy dtc_own  on dtc_codes for all to authenticated using (true) with check (true);
insert into settings(key,value) values ('email',''),('ssid',''),('ota','') on conflict do nothing;
