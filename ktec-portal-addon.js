/* เชื่อมเว็บลูกค้า (index.html) เข้ากับ Supabase: ส่งแจ้งปัญหา / เฟิร์มแวร์ล่าสุด / ประกาศ / ดูคำตอบ
   โหลดต่อท้าย index.html (หลัง supabase-js) ไม่ต้องแก้โค้ดเดิม */
(function () {
  if (typeof supabase === "undefined") return;
  const sb = supabase.createClient("https://jtrewmckqeetpybocpsu.supabase.co", "sb_publishable_e_l3eaYgsoE6hgPrq_pVrg_OFfFkpSy");

  Object.assign(T.th, {
    send_db: "ส่งแจ้งปัญหา", name_ph: "ชื่อ (ไม่บังคับ)", ct_ph: "เบอร์ / LINE ที่ติดต่อกลับ (ไม่บังคับ)",
    sent_ok: "ส่งแล้ว เจ้าของได้รับเรื่องแล้ว", sent_fail: "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง", need_msg: "พิมพ์รายละเอียดก่อนส่ง",
    wait: "รอสักครู่ก่อนส่งอีกครั้ง", my_rep: "เรื่องที่คุณแจ้งไว้", s_new: "รอดำเนินการ", s_prog: "กำลังดูแล", s_done: "เสร็จแล้ว",
    reply: "คำตอบ", rep_hint: "ระบบแนบรหัสเครื่องและเวอร์ชันไปให้อัตโนมัติ",
    n_reply: "ทีมงานตอบกลับเรื่องที่คุณแจ้ง", n_msg: "ข้อความจากทีมงาน", n_ok: "รับทราบ"
  });
  Object.assign(T.en, {
    send_db: "Send report", name_ph: "Name (optional)", ct_ph: "Phone / LINE for reply (optional)",
    sent_ok: "Sent. The owner has received it.", sent_fail: "Could not send. Please try again.", need_msg: "Please describe the problem first",
    wait: "Please wait a moment before sending again", my_rep: "Your reports", s_new: "Pending", s_prog: "In progress", s_done: "Done",
    reply: "Reply", rep_hint: "Device ID and version are attached automatically",
    n_reply: "The team replied to your report", n_msg: "Message from the team", n_ok: "Got it"
  });

  const mk = (tag, attrs) => Object.assign(document.createElement(tag), attrs || {});

  /* รหัสเครื่อง: ใช้จากลิงก์ (?id=) ถ้ามี และจำไว้ในมือถือเครื่องนี้ เพื่อให้เปิดเว็บครั้งหน้าโดยไม่มีลิงก์ก็ยังเห็นแจ้งเตือน */
  let dev = devId;
  try { if (dev !== "-") localStorage.setItem("ktec_dev", dev); else dev = localStorage.getItem("ktec_dev") || "-"; } catch (e) {}
  const st = document.head.appendChild(mk("style"));
  st.textContent = ".card input.x{width:100%;margin-top:8px;padding:12px 14px;font:inherit;color:var(--text);background:var(--bg);border:1px solid var(--line);border-radius:10px}" +
    ".mine{margin-top:18px;display:grid;gap:10px}.mine .it{padding:12px 14px;background:var(--bg);border:1px solid var(--line);border-radius:10px}" +
    ".mine .it small{color:var(--muted)}.mine .rp{margin-top:6px;padding-left:10px;border-left:3px solid var(--cyan)}" +
    ".tip.note{border-left-color:var(--cyan);background:rgba(0,229,255,.07);color:var(--text);margin:0 0 12px}.tip.note b{display:block;color:var(--cyan)}.tip.note div{white-space:pre-wrap;margin-top:4px}";

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
      device_id: dev.slice(0, 20), fw: curFw.slice(0, 20), name: rn.value.trim().slice(0, 80), contact: rc.value.trim().slice(0, 80), message: m.slice(0, 2000)
    });
    if (error) { last = 0; return say("sent_fail", "warn"); }
    say("sent_ok", "ok"); $("#msg").value = ""; loadMine();
  };

  let msgs = [];
  const when = d => new Date(d).toLocaleString(lang === "th" ? "th-TH" : "en-GB");
  function renderMine() {
    list.textContent = "";
    if (msgs.length) {
      list.appendChild(mk("h3", { textContent: t("n_msg") }));
      msgs.forEach(m => {
        const it = mk("div", { className: "it" });
        it.appendChild(mk("small", { textContent: when(m.created_at) }));
        it.appendChild(mk("div", { textContent: m.message }));
        list.appendChild(it);
      });
    }
    if (!mine.length) return;
    list.appendChild(mk("h3", { textContent: t("my_rep") }));
    mine.forEach(r => {
      const it = mk("div", { className: "it" });
      it.appendChild(mk("small", { textContent: when(r.created_at) + " · " + t("s_" + r.status) }));
      it.appendChild(mk("div", { textContent: r.message }));
      if (r.reply) it.appendChild(mk("div", { className: "rp", textContent: t("reply") + ": " + r.reply }));
      list.appendChild(it);
    });
  }

  /* ---- แจ้งเตือนจากทีมงาน: คำตอบของเรื่องที่แจ้ง + ข้อความที่เจ้าของส่งถึงเครื่องนี้ ---- */
  const seenKey = "ktec_seen_" + dev;
  const getSeen = () => { try { return JSON.parse(localStorage.getItem(seenKey)) || []; } catch (e) { return []; } };
  const setSeen = a => { try { localStorage.setItem(seenKey, JSON.stringify(a.slice(-200))); } catch (e) {} };
  const hash = s => { let x = 0; for (const c of String(s)) x = (x * 31 + c.charCodeAt(0)) | 0; return x; };
  const noteBox = mk("div", { id: "notices" });
  document.querySelector("main").prepend(noteBox);
  function notices() {
    const seen = getSeen(), items = [];
    mine.forEach(r => { if (r.reply) items.push({ k: "r:" + r.created_at + ":" + hash(r.reply), title: t("n_reply"), text: r.reply }); });
    msgs.forEach(m => items.push({ k: "m:" + m.id, title: t("n_msg"), text: m.message }));
    noteBox.textContent = "";
    items.filter(i => !seen.includes(i.k)).forEach(i => {
      const b = mk("div", { className: "tip note" });
      const ok = mk("button", { type: "button", className: "btn", textContent: t("n_ok") });
      ok.onclick = () => { setSeen(getSeen().concat(i.k)); notices(); };
      b.append(mk("b", { textContent: i.title }), mk("div", { textContent: i.text }), ok);
      noteBox.appendChild(b);
    });
  }
  async function loadMine() {
    if (dev === "-") return;                                // ไม่มีรหัสเครื่อง = ไม่แสดงรายการ (กันเห็นของคนอื่น)
    const { data } = await sb.rpc("my_reports", { dev });
    mine = data || []; renderMine(); notices();
  }
  async function loadMsgs() {
    if (dev === "-") return;
    const { data } = await sb.rpc("my_messages", { dev });
    msgs = data || []; renderMine(); notices();
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
    if (s.ssid) CONFIG.ssid = s.ssid;
    if (s.ota) CONFIG.ota = s.ota;
    if (s.email) {
      const first = !CONFIG.email; CONFIG.email = s.email;
      if (first) { const m = $("#mail"); m.hidden = false; m.onclick = e => { e.preventDefault();
        location.href = "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent(t("mail_subject") + " " + devId) + "&body=" + encodeURIComponent($("#msg").value + info()); }; }
    }
    if (s.contact) $("#footMail").textContent = " · " + s.contact;
    applyLang();
  }
  async function loadDtc() {                                // รหัส DTC ที่เจ้าของเพิ่ม/แก้/ซ่อน ทับของเดิมในเว็บ
    const { data } = await sb.from("dtc_codes").select("*");
    if (!data || !data.length) return;
    data.forEach(r => {
      const i = DTC.findIndex(x => x[0] === r.code);
      if (r.hidden) { if (i >= 0) DTC.splice(i, 1); return; }
      const row = [r.code, r.th, r.en || r.th];
      if (i >= 0) DTC[i] = row; else DTC.push(row);
    });
    DTC.sort((a, b) => a[0] < b[0] ? -1 : 1); renderDtc();
  }

  const oldApply = applyLang;
  applyLang = function () { oldApply(); if (stat.dataset.k) stat.textContent = t(stat.dataset.k); renderMine(); notices(); };
  applyLang();

  if (devId !== "-") sb.rpc("ping_device", { dev: devId, v: curFw });
  loadFw(); loadSettings(); loadDtc(); loadMine(); loadMsgs();
  setInterval(() => { if (!document.hidden) { loadMine(); loadMsgs(); } }, 60000);   // เช็กข้อความใหม่ทุก 1 นาทีขณะเปิดหน้าเว็บอยู่
})();
