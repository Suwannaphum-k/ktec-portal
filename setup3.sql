-- รันเพิ่มใน Supabase > SQL Editor (รันซ้ำได้) สำหรับ: เจ้าของส่งข้อความถึงเครื่องลูกค้า
create table if not exists device_messages(
  id bigint generated always as identity primary key,
  device_id text not null check (length(device_id) <= 20),
  message text not null check (length(message) between 1 and 1000),
  created_at timestamptz not null default now()
);
alter table device_messages enable row level security;
drop policy if exists dm_own on device_messages;
create policy dm_own on device_messages for all to authenticated using (true) with check (true);

-- ลูกค้า (ไม่ต้องล็อกอิน) ดึงได้เฉพาะข้อความของรหัสเครื่องที่ส่งมา ไม่เปิดอ่านทั้งตาราง
create or replace function my_messages(dev text)
returns table(id bigint, message text, created_at timestamptz)
language sql security definer set search_path = public as $$
  select m.id, m.message, m.created_at from device_messages m where m.device_id = dev order by m.created_at desc limit 20;
$$;
grant execute on function my_messages(text) to anon, authenticated;
