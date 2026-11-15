/* เชื่อมเว็บลูกค้า (index.html) เข้ากับ Supabase: ส่งแจ้งปัญหา / เฟิร์มแวร์ล่าสุด / ประกาศ / ดูคำตอบ
   โหลดต่อท้าย index.html (หลัง supabase-js) ไม่ต้องแก้โค้ดเดิม */
(function () {
  if (typeof supabase === "undefined") return;
  const sb = supabase.createClient("https://jtrewmckqeetpybocpsu.supabase.co", "sb_publishable_e_l3eaYgsoE6hgPrq_pVrg_OFfFkpSy");

  Object.assign(T.th, {
    send_db: "ส่งแจ้งปัญหา", name_ph: "ชื่อ (ไม่บังคับ)", ct_ph: "เบอร์ / LINE ที่ติดต่อกลับ (ไม่บังคับ)",
    sent_ok: "ส่งแล้ว เจ้าของได้รับเรื่องแล้ว", sent_fail: "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง", need_msg: "พิมพ์รายละเอียดก่อนส่ง",
    wait: "รอสักครู่ก่อนส่งอีกครั้ง", my_rep: "เรื่องที่คุณแจ้งไว้", s_new: "รอดำเนินการ", s_prog: "กำลังดูแล", s_done: "เสร็จแล้ว",
    reply: "คำตอบ", rep_hint: "ระบบแนบรหัสเครื่องและเวอร์ชันไปให้อัตโนมัติ"
  });
  Object.assign(T.en, {
    send_db: "Send report", name_ph: "Name (optional)", ct_ph: "Phone / LINE for reply (optional)",
    sent_ok: "Sent. The owner has received it.", sent_fail: "Could not send. Please try again.", need_msg: "Please describe the problem first",
    wait: "Please wait a moment before sending again", my_rep: "Your reports", s_new: "Pending", s_prog: "In progress", s_done: "Done",
    reply: "Reply", rep_hint: "Device ID and version are attached automatically"
  });

  const mk = (tag, attrs) => Object.assign(document.createElement(tag), attrs || {});
  const st = document.head.appendChild(mk("style"));
  st.textContent = ".card input.x{width:100%;margin-top:8px;padding:12px 14px;font:inherit;color:var(--text);background:var(--bg);border:1px solid var(--line);border-radius:10px}" +
    ".mine{margin-top:18px;display:grid;gap:10px}.mine .it{padding:12px 14px;background:var(--bg);border:1px solid var(--line);border-radius:10px}" +
    ".mine .it small{color:var(--muted)}.mine .rp{margin-top:6px;padding-left:10px;border-left:3px solid var(--cyan)}";

  /* ---- ฟอร์มแจ้งปัญหา ---- */
  $("#gh").hidden = true;                                   // เลิกส่งผ่าน GitHub Issues
  const rn = mk("input", { id: "rn", className: "x", maxLength: 80 }); rn.dataset.ph = "name_ph";
  const rc = mk("input", { id: "rc", className: "x", maxLength: 80 }); rc.dataset.ph = "ct_ph";
  $("#msg").maxLength = 2000; $("#msg").after(rn, rc);
  const send = mk("a", { id: "sendDb", href: "#", className: "btn solid" }); send.dataset.t = "send_db";
  $("#mail").before(send);
  const stat = mk("p", { id: "repStat", className: "status info", hidden: true });
  const list = mk("div", { className: "mine", id: "mine" });
  const card = document.querySelector("#v-report .card"); card.append(stat, list);

  let last = 0, mine = [];
  const say = (k, c) => { stat.hidden = false; stat.dataset.k = k; stat.textContent = t(k); stat.className = "status " + c; };
  send.onclick = async e => {
    e.preventDefault();
    const m = $("#msg").value.trim();
    if (!m) return say("need_msg", "warn");
    if (Date.now() - last < 30000) return say("wait", "warn");
    last = Date.now();
    const { error } = await sb.from("reports").insert({
      device_id: devId.slice(0, 20), fw: curFw.slice(0, 20), name: rn.value.trim().slice(0, 80), contact: rc.value.trim().slice(0, 80), message: m.slice(0, 2000)
    });
    if (error) { last = 0; return say("sent_fail", "warn"); }
    say("sent_ok", "ok"); $("#msg").value = ""; loadMine();
  };

  function renderMine() {
    list.textContent = "";
    if (!mine.length) return;
    list.appendChild(mk("h3", { textContent: t("my_rep") }));
    mine.forEach(r => {
      const it = mk("div", { className: "it" });
      it.appendChild(mk("small", { textContent: new Date(r.created_at).toLocaleString(lang === "th" ? "th-TH" : "en-GB") + " · " + t("s_" + r.status) }));
      it.appendChild(mk("div", { textContent: r.message }));
      if (r.reply) it.appendChild(mk("div", { className: "rp", textContent: t("reply") + ": " + r.reply }));
      list.appendChild(it);
    });
  }
  async function loadMine() {
    if (devId === "-") return;                              // ไม่มีรหัสเครื่อง = ไม่แสดงรายการ (กันเห็นของคนอื่น)
    const { data } = await sb.rpc("my_reports", { dev: devId });
    mine = data || []; renderMine();
  }

  /* ---- เฟิร์มแวร์ล่าสุด / ประกาศ / บันทึกเครื่อง ---- */
  async function loadFw() {
    const { data } = await sb.from("firmware").select("*").order("created_at", { ascending: false }).limit(1);
    const f = data && data[0]; if (!f) return;
    CONFIG.latest = f.version; CONFIG.notes = { th: f.notes || "", en: f.notes || "" };
    CONFIG.file = sb.storage.from("firmware").getPublicUrl(f.file_path).data.publicUrl;
    $("#heroVer").textContent = "v" + f.version; $("#newVer").textContent = f.version; $("#dl").href = CONFIG.file;
    applyLang();
  }
  async function loadSettings() {
    const { data } = await sb.from("settings").select("*"); const s = {};
    (data || []).forEach(r => s[r.key] = r.value);
    if (s.announcement) { const a = mk("div", { className: "tip", textContent: s.announcement }); a.style.marginBottom = "16px"; document.querySelector("main").prepend(a); }
    if (s.contact) $("#footMail").textContent = " · " + s.contact;
  }

  const oldApply = applyLang;
  applyLang = function () { oldApply(); if (stat.dataset.k) stat.textContent = t(stat.dataset.k); renderMine(); };
  applyLang();

  if (devId !== "-") sb.rpc("ping_device", { dev: devId, v: curFw });
  loadFw(); loadSettings(); loadMine();
})();
