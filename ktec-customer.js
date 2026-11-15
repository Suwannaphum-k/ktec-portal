/* ใส่ในเว็บลูกค้า (ktec-portal) ต่อจาก <script src=".../supabase.min.js"> เวอร์ชัน 2.45.4 ตัวเดียวกับหน้าเจ้าของ
   เกจเปิดเว็บมาพร้อม ?id=KT-XXXXXX&fw=2.0.0&page=fw|report  ฟังก์ชันด้านล่างอ่านค่านั้นให้เอง
   ข้อความที่ได้จากฐานข้อมูลให้แสดงด้วย textContent เสมอ (ห้าม innerHTML) */
const SUPABASE_URL = "https://jtrewmckqeetpybocpsu.supabase.co", SUPABASE_KEY = "sb_publishable_e_l3eaYgsoE6hgPrq_pVrg_OFfFkpSy";   // ค่าเดียวกับ owner.html
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const Q = new URLSearchParams(location.search);
const KTEC = {
  id: (Q.get("id") || "").slice(0, 20), fw: (Q.get("fw") || "").slice(0, 20), page: Q.get("page") || "fw",

  async init() {                                   // เรียกตอนเปิดหน้า: บันทึกว่าเครื่องนี้เข้าเว็บ + ดึงประกาศ
    if (this.id) await sb.rpc("ping_device", { dev: this.id, v: this.fw });
    const { data } = await sb.from("settings").select("*");
    const s = {}; (data || []).forEach(r => s[r.key] = r.value);
    return s;                                      // s.announcement , s.contact
  },
  async latestFw() {                               // เฟิร์มแวร์ล่าสุดที่เผยแพร่ + ลิงก์ดาวน์โหลด + เทียบกับเครื่อง
    const { data } = await sb.from("firmware").select("*").order("created_at", { ascending: false }).limit(1);
    const f = data && data[0]; if (!f) return null;
    return { version: f.version, notes: f.notes, size: f.size, isNew: f.version !== this.fw,
             url: sb.storage.from("firmware").getPublicUrl(f.file_path).data.publicUrl };
  },
  async sendReport(name, contact, message) {       // ปุ่มส่งแจ้งปัญหา
    const { error } = await sb.from("reports").insert({ device_id: this.id, fw: this.fw, name, contact, message });
    return !error;
  },
  async myReports() {                              // สถานะ/คำตอบจากเจ้าของ
    const { data } = await sb.rpc("my_reports", { dev: this.id });
    return data || [];
  }
};
