// Maps Scraper — front-end for the local gosom/google-maps-scraper REST API.
// Talks to same-origin /api/v1 (proxied by nginx), Nominatim for geocoding, OpenStreetMap tiles for the map.
(() => {
  "use strict";

  const API = "/api/v1/jobs";
  const POLL_MS = 4000;
  const JOINER = { pt: "em", en: "in", es: "en" };   // "dentista em Barra Funda"
  const STATUS = { ok: "Concluída", working: "Pesquisando…", pending: "Na fila", failed: "Falhou" };
  const AMOUNT_HINT = {
    1: "Aproximado · leva ~2 min",
    5: "Aproximado · leva ~4 min",
    10: "Aproximado · leva ~7 min",
    20: "Aproximado · leva 15+ min",
  };
  const ICON = {
    search: '<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
    stop: '<svg viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>',
    web: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14a8.2 8.2 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4H4.26zm.81 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.07 16zm2.95-8H5.07a7.99 7.99 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.02 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14a16.5 16.5 0 0 0 0-4h3.38a8.2 8.2 0 0 1 0 4h-3.38z"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.1.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
    dir: '<svg viewBox="0 0 24 24"><path d="M21.71 11.29l-9-9a1 1 0 0 0-1.42 0l-9 9a1 1 0 0 0 0 1.42l9 9a1 1 0 0 0 1.42 0l9-9a1 1 0 0 0 0-1.42zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
    starOff: '<svg viewBox="0 0 24 24"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
  };
  const PIN = (color) => `<svg viewBox="0 0 27 43"><path fill="${color}" stroke="#fff" stroke-width="1.5" d="M13.5 1C6.6 1 1 6.6 1 13.5 1 23 13.5 42 13.5 42S26 23 26 13.5C26 6.6 20.4 1 13.5 1z"/><circle cx="13.5" cy="13.5" r="4.5" fill="#fff" fill-opacity=".9"/></svg>`;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => (+n || 0).toLocaleString("pt-BR");
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  // Jobs come back with Go-style capitalized keys; accept either.
  const norm = (j) => {
    const d = j.Data || j.data || {};
    return {
      id: j.ID || j.id, name: j.Name || j.name, date: j.Date || j.date,
      status: (j.Status || j.status || "").toLowerCase(), keywords: d.keywords || [],
      depth: d.depth, email: d.email, lang: d.lang,
      lat: +d.lat || 0, lon: +d.lon || 0, radius: +d.radius || 0,
    };
  };

  const state = {
    jobs: [], counts: {}, prevStatus: {}, current: null, rows: [], visible: [],
    sort: { key: null, dir: 1 }, geo: null, submitting: false, depth: 5, email: false,
  };

  // ───────────────────────── utils ─────────────────────────
  function toast(msg, ms = 4000) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), ms);
  }
  function store(k, v) { try { localStorage.setItem("ms:" + k, JSON.stringify(v)); } catch {} }
  function load(k, d) { try { const v = localStorage.getItem("ms:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } }

  function ago(iso) {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "agora";
    if (s < 3600) return `há ${Math.floor(s / 60)} min`;
    if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  // RFC 4180 CSV parser (quoted fields, embedded commas/newlines).
  function parseCSV(text) {
    const rows = []; let row = [], f = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
      else if (c !== "\r") f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    const [head, ...body] = rows;
    if (!head) return [];
    head[0] = head[0].replace(/^﻿/, "");
    return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
  }

  function toCSV(headers, rows, sep) {
    const cell = (v) => { v = String(v ?? ""); return /[";,\n\r\t]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
    return [headers, ...rows].map((r) => r.map(cell).join(sep)).join("\r\n");
  }

  function saveFile(name, content, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "busca";
  const digits = (s) => String(s || "").replace(/\D/g, "");
  const emailsOf = (r) => String(r.emails || "").split(/[\s,;]+/).filter((e) => e.includes("@"));

  // Brazilian mobile (DDD + 9xxxxxxxx) → wa.me link.
  function whatsapp(phone) {
    let d = digits(phone);
    if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
    return d.length === 11 && d[2] === "9" ? `https://wa.me/55${d}` : null;
  }

  // The "website" Google shows is often just a social profile, a link-in-bio page, a delivery/booking
  // listing or a free subdomain. For prospecting those count as "no site of its own".
  const NOT_OWN_SITE = {
    "instagram.com": "Instagram", "facebook.com": "Facebook", "fb.com": "Facebook", "fb.me": "Facebook",
    "wa.me": "WhatsApp", "whatsapp.com": "WhatsApp", "tiktok.com": "TikTok", "youtube.com": "YouTube",
    "youtu.be": "YouTube", "twitter.com": "X (Twitter)", "x.com": "X (Twitter)", "linkedin.com": "LinkedIn",
    "threads.net": "Threads", "pinterest.com": "Pinterest", "t.me": "Telegram",
    "linktr.ee": "Linktree", "linktree.com": "Linktree", "beacons.ai": "link na bio", "bio.link": "link na bio",
    "linkin.bio": "link na bio", "lnk.bio": "link na bio", "taplink.cc": "link na bio", "taplink.at": "link na bio",
    "campsite.bio": "link na bio", "instabio.cc": "link na bio", "linkbio.co": "link na bio",
    "ifood.com.br": "iFood", "anota.ai": "Anota AI", "goomer.app": "Goomer", "rappi.com.br": "Rappi",
    "doctoralia.com.br": "Doctoralia", "booksy.com": "Booksy", "trinks.com": "Trinks",
    "business.site": "site grátis do Google", "sites.google.com": "Google Sites", "g.page": "Google Maps",
    "goo.gl": "Google Maps", "wixsite.com": "Wix grátis", "negocio.site": "site grátis do Google",
    "ueniweb.com": "site grátis", "webnode.page": "site grátis", "webnode.com.br": "site grátis",
    "blogspot.com": "Blogspot", "wordpress.com": "WordPress grátis", "carrd.co": "Carrd",
  };
  // → null (no link) | { own: true, name: "clinicax.com.br" } | { own: false, name: "Instagram" }
  function siteInfo(url) {
    if (!url) return null;
    let host;
    try { host = new URL(/^https?:\/\//i.test(url) ? url : "https://" + url).hostname.toLowerCase().replace(/^www\./, ""); }
    catch { return null; }
    const d = Object.keys(NOT_OWN_SITE).find((d) => host === d || host.endsWith("." + d));
    if (d) return { own: false, name: NOT_OWN_SITE[d] };
    // Owners mistype these on Google ("instagran.com/…" was in a real result).
    if (/instag|insta\.gr/.test(host)) return { own: false, name: "Instagram" };
    if (/faceb|facebok/.test(host)) return { own: false, name: "Facebook" };
    return { own: true, name: host };
  }
  const ownSite = (r) => !!siteInfo(r.website)?.own;

  // Great-circle distance in meters.
  function distance(lat1, lon1, lat2, lon2) {
    const R = 6371000, rad = Math.PI / 180;
    const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  // Google Maps has no hard radius in normal mode, so we zoom the search viewport to fit the circle
  // (~1000px wide at 156543·cos(lat)/2^z m/px) and filter results outside it afterwards.
  const zoomFor = (meters, lat) => Math.max(11, Math.min(17, Math.round(Math.log2((156543 * Math.cos((lat * Math.PI) / 180) * 1000) / (2 * meters)))));

  function starsHTML(rating) {
    const full = Math.round(rating);
    return `<span class="stars" aria-hidden="true">${"★".repeat(full)}<span class="off">${"★".repeat(5 - full)}</span></span>`;
  }

  // ───────────────────────── map ─────────────────────────
  const hasMap = typeof L !== "undefined";
  let map, markerLayer, lookupMarker;
  const markers = {};
  if (hasMap) {
    const last = load("view", { lat: -23.5505, lon: -46.6333, z: 12 });
    map = L.map("map", { zoomControl: false }).setView([last.lat, last.lon], last.z);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, className: "map-tiles",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    map.on("moveend", () => { const c = map.getCenter(); store("view", { lat: c.lat, lon: c.lng, z: map.getZoom() }); });
  }
  // The map runs under the floating sidebar, so frame things in the part of the map you can see.
  function framePad() {
    const sb = $("#panel").getBoundingClientRect();
    const covers = sb.width < window.innerWidth * 0.8 && getComputedStyle($("#panel")).position === "fixed";
    return { paddingTopLeft: [covers ? sb.right + 32 : 32, 32], paddingBottomRight: [32, 32] };
  }
  function focusPoint(latlng, zoom) {
    const ll = L.latLng(latlng);
    map.flyToBounds(L.latLngBounds(ll, ll), { ...framePad(), maxZoom: zoom, duration: 0.7 });
  }
  const pinIcon = (color, hl) => hasMap && L.divIcon({ className: "pin-icon" + (hl ? " hl" : ""), html: PIN(color), iconSize: [27, 43], iconAnchor: [13.5, 42], popupAnchor: [0, -38] });

  let areaCircle;
  function drawArea(lat, lon, meters, fit) {
    if (!hasMap) return;
    if (areaCircle) areaCircle.remove();
    if (!lat || !meters) { areaCircle = null; return; }
    areaCircle = L.circle([lat, lon], { radius: meters, color: "#1a73e8", weight: 2, opacity: .7, fillColor: "#1a73e8", fillOpacity: .08, interactive: false }).addTo(map);
    if (fit) map.flyToBounds(areaCircle.getBounds(), { ...framePad(), duration: 0.5 });
  }
  const radiusMeters = () => (+$("#radius").value || 5) * 1000;

  function showLookup(g) {
    if (!hasMap) return;
    if (lookupMarker) lookupMarker.remove();
    if (!g) { drawArea(); return; }
    lookupMarker = L.marker([g.lat, g.lon], { icon: pinIcon("#1a73e8") }).addTo(map);
    if (!state.current) drawArea(+g.lat, +g.lon, radiusMeters(), true);
  }

  function plotRows(rows) {
    if (!hasMap) return;
    markerLayer.clearLayers();
    for (const k in markers) delete markers[k];
    const pts = [];
    rows.forEach((r, i) => {
      const lat = +r.latitude, lon = +r.longitude;
      if (!lat || !lon) return;
      markers[i] = L.marker([lat, lon], { icon: pinIcon("#ea4335"), riseOnHover: true })
        .bindPopup(`<b>${esc(r.title)}</b><br>${esc(r.category)}${r.review_rating ? ` · ${(+r.review_rating).toFixed(1).replace(".", ",")} ★` : ""}${r.phone ? `<br>${esc(r.phone)}` : ""}`)
        .on("click", () => highlight(i, true))
        .addTo(markerLayer);
      pts.push([lat, lon]);
    });
    if (pts.length) map.fitBounds(pts, { ...framePad(), maxZoom: 16 });
  }

  function highlight(i, scroll) {
    $$(".place.hl").forEach((el) => el.classList.remove("hl"));
    Object.entries(markers).forEach(([k, m]) => m.setIcon(pinIcon("#ea4335", +k === i)));
    const el = $(`.place[data-i="${i}"]`);
    if (el) { el.classList.add("hl"); if (scroll) el.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
  }

  // ───────────────────────── health + jobs ─────────────────────────
  function setHealth(ok) {
    const h = $("#health");
    h.className = "health " + (ok ? "ok" : "down");
    h.lastElementChild.textContent = ok ? "scraper online" : "offline: abra o Docker Desktop";
  }

  async function refreshJobs() {
    try {
      const r = await fetch(API, { cache: "no-store" });
      if (!r.ok) throw new Error(r.status);
      const list = (await r.json()) || [];
      setHealth(true);
      state.jobs = list.map(norm).sort((a, b) => new Date(b.date) - new Date(a.date));
      for (const j of state.jobs) {
        const prev = state.prevStatus[j.id];
        if (j.status === "ok" && state.counts[j.id] == null) fetchCount(j);
        if (prev && prev !== j.status && j.status === "ok") notifyDone(j);
        if (prev && prev !== j.status && j.status === "failed") toast(`A busca “${j.name}” falhou.`);
        state.prevStatus[j.id] = j.status;
      }
      renderJobs();
      if (!state.booted) { state.booted = true; openFromHash(); }
    } catch {
      setHealth(false);
      if (!state.jobs.length) $("#jobs").innerHTML = `<p class="empty">Não consegui falar com o scraper.<br>Confira se o Docker Desktop está aberto.</p>`;
    }
  }

  // /#job=<id> opens that job directly (used by the Mapa ⇄ Painel switch).
  function openFromHash() {
    const m = location.hash.match(/job=([\w-]+)/);
    const job = m && state.jobs.find((j) => j.id === m[1] && j.status === "ok");
    if (job) openResults(job);
  }

  const rowsCache = {};
  async function fetchRows(id) {
    if (rowsCache[id]) return rowsCache[id];
    const r = await fetch(`${API}/${id}/download`, { cache: "no-store" });
    if (!r.ok) throw new Error(r.status);
    return (rowsCache[id] = parseCSV(await r.text()));
  }

  async function fetchCount(j) {
    state.counts[j.id] = "…";
    try { state.counts[j.id] = (await fetchRows(j.id)).length; } catch { state.counts[j.id] = "?"; }
    renderJobs();
  }

  async function notifyDone(j) {
    try { toast(`“${j.name}” terminou: ${(await fetchRows(j.id)).length} resultados`, 6000); }
    catch { toast(`“${j.name}” terminou`); }
  }

  function renderJobs() {
    const box = $("#jobs");
    if (!state.jobs.length) {
      box.innerHTML = `<p class="empty">Nenhuma busca ainda. Faça a primeira acima.</p>`;
      renderJobs._last = null;
      return;
    }
    const html = state.jobs.map((j) => {
      const count = state.counts[j.id];
      const meta = [
        `<span class="status ${esc(j.status)}">${esc(STATUS[j.status] || j.status)}</span>`,
        `<span class="dot">${esc(ago(j.date))}</span>`,
        j.status === "ok" && count != null ? `<span class="dot">${esc(count)} lugares</span>` : "",
        j.email ? `<span class="dot">com e-mails</span>` : "",
      ].join("");
      return `<li class="job ${esc(j.status)}" data-id="${esc(j.id)}" ${j.status === "ok" ? 'tabindex="0" role="button" title="Ver resultados no mapa"' : ""}>
        <span class="job-icon">${j.status === "ok" ? ICON.list : ICON.search}</span>
        <div class="job-body">
          <div class="job-title">${esc(j.name || j.keywords.join(", "))}</div>
          <div class="job-meta">${meta}</div>
          ${j.status === "working" ? '<div class="progress" title="Coletando no Google Maps…"></div>' : ""}
        </div>
        <button class="job-del star${isFav(j) ? " on" : ""}" data-act="fav" title="${isFav(j) ? "Tirar das favoritas" : "Salvar nas favoritas para rodar de novo depois"}" aria-label="Favorita" aria-pressed="${isFav(j)}">${isFav(j) ? ICON.star : ICON.starOff}</button>
        <button class="job-del" data-act="delete" title="${j.status === "working" ? "Parar esta busca e apagá-la" : "Apagar esta busca e os resultados dela"}" aria-label="Apagar">${j.status === "working" ? ICON.stop : ICON.del}</button>
      </li>`;
    }).join("");
    // Only touch the DOM when something changed, so polling doesn't eat clicks/hover.
    if (html !== renderJobs._last) { box.innerHTML = html; renderJobs._last = html; }
  }

  async function deleteJob(job) {
    const msg = job.status === "working"
      ? `Parar a busca “${job.name}”? Ela será apagada e o que já foi coletado se perde.`
      : `Apagar a busca “${job.name}”? Os resultados somem daqui (arquivos já baixados continuam no seu computador).`;
    if (!confirm(msg)) return;
    const r = await fetch(`${API}/${job.id}`, { method: "DELETE" });
    if (!r.ok) return toast("Não consegui apagar essa busca.");
    delete rowsCache[job.id]; delete state.counts[job.id];
    toast("Busca apagada.");
    refreshJobs();
  }

  $("#jobs").addEventListener("click", (e) => {
    const li = e.target.closest(".job");
    const job = li && state.jobs.find((j) => j.id === li.dataset.id);
    if (!job) return;
    if (e.target.closest("[data-act=delete]")) return deleteJob(job);
    if (e.target.closest("[data-act=fav]")) return toggleFav(job);
    if (job.status === "ok") openResults(job);
  });
  $("#jobs").addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.target.closest("button")) return;
    const li = e.target.closest(".job.ok");
    const job = li && state.jobs.find((j) => j.id === li.dataset.id);
    if (job) openResults(job);
  });

  // ───────────────────────── favorites ─────────────────────────
  // A favorite keeps the exact request of a past search, so it can be re-run later to catch new businesses.
  const favs = load("favs", []);
  const favKey = (b) => [b.keywords.join("|"), b.radius, b.depth, !!b.email].join("~");
  const isFav = (j) => favs.some((f) => favKey(f.body) === favKey(j));
  // Time budget the scraper gets: grows with terms × depth, doubled when it also visits sites for e-mails.
  const autoTime = (terms, depth, email) => Math.min(3600, Math.max(300, terms * (120 + depth * 40) * (email ? 2 : 1)));

  function toggleFav(j) {
    const i = favs.findIndex((f) => favKey(f.body) === favKey(j));
    if (i >= 0) favs.splice(i, 1);
    else favs.unshift({ body: {
      name: j.name, keywords: j.keywords, lang: j.lang || "pt", depth: j.depth || 5, email: !!j.email,
      lat: String(j.lat || 0), lon: String(j.lon || 0), radius: j.radius || 5000,
      zoom: j.lat ? zoomFor(j.radius || 5000, j.lat) : 14, fast_mode: false,
      max_time: autoTime(j.keywords.length, j.depth || 5, j.email),
    } });
    store("favs", favs);
    toast(i >= 0 ? "Removida das favoritas." : "Salva nas favoritas.");
    renderFavs();
    renderJobs._last = null; renderJobs();
  }

  function renderFavs() {
    $("#favs-wrap").hidden = !favs.length;
    $("#favs").innerHTML = favs.map((f, i) => {
      const b = f.body, amount = $(`.chip[data-depth="${b.depth}"]`);
      const meta = [amount && `~${amount.textContent.trim()} resultados`, b.radius && `${Math.round(b.radius / 100) / 10} km`, b.email && "com e-mails"]
        .filter(Boolean).map((m, k) => `<span${k ? ' class="dot"' : ""}>${esc(m)}</span>`).join("");
      return `<li class="job fav" data-fav="${i}">
        <span class="job-icon">${ICON.star}</span>
        <div class="job-body"><div class="job-title">${esc(b.name || b.keywords.join(", "))}</div><div class="job-meta">${meta}</div></div>
        <button class="job-del run" data-act="run" title="Rodar esta busca de novo" aria-label="Rodar de novo">${ICON.play}</button>
        <button class="job-del" data-act="unfav" title="Tirar das favoritas" aria-label="Tirar das favoritas">${ICON.close}</button>
      </li>`;
    }).join("");
  }

  async function runFav(f) {
    const b = f.body;
    const dup = state.jobs.find((j) => (j.status === "pending" || j.status === "working") && j.keywords.join("|") === b.keywords.join("|"));
    if (dup && !confirm("Essa mesma busca já está rodando ou na fila. Criar outra igual mesmo assim?")) return;
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
      if (!r.ok) throw new Error();
      toast("Busca criada de novo! Acompanhe em “Suas buscas”.");
      refreshJobs();
    } catch { toast("Não consegui criar a busca. O scraper está online?"); }
  }

  $("#favs").addEventListener("click", (e) => {
    const li = e.target.closest(".fav");
    const f = li && favs[+li.dataset.fav];
    if (!f) return;
    if (e.target.closest("[data-act=run]")) runFav(f);
    else if (e.target.closest("[data-act=unfav]")) {
      favs.splice(+li.dataset.fav, 1); store("favs", favs);
      renderFavs(); renderJobs._last = null; renderJobs();
    }
  });

  // ───────────────────────── form controls ─────────────────────────
  $$(".chip[data-depth]").forEach((c) => c.addEventListener("click", () => setDepth(+c.dataset.depth)));
  function setDepth(d) {
    state.depth = d;
    $$(".chip[data-depth]").forEach((c) => c.classList.toggle("selected", +c.dataset.depth === d));
    $("#amount-hint").textContent = AMOUNT_HINT[d];
  }
  function syncRadius(fit) {
    const km = +$("#radius").value;
    $("#radius-val").textContent = `${km} km`;
    $("#radius").style.setProperty("--fill-pct", `${((km - 1) / 19) * 100}%`);
    $("#radius-hint").textContent = state.geo ? "Área em volta do local, desenhada no mapa." : "Digite o local acima para ver a área no mapa.";
    if (state.geo && !state.current) drawArea(+state.geo.lat, +state.geo.lon, km * 1000, fit);
  }
  $("#radius").addEventListener("input", () => syncRadius(true));

  $("#email-chip").addEventListener("click", () => {
    state.email = !state.email;
    $("#email-chip").setAttribute("aria-pressed", state.email);
    $("#email-note").hidden = !state.email;
  });

  // ───────────────────────── geocoding ─────────────────────────
  // Prefer Brazil first ("Barra Funda" alone would otherwise land on the town in RS), then worldwide.
  const geoCache = load("geo2", {});
  async function nominatim(place, extra) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&accept-language=pt-BR${extra}&q=${encodeURIComponent(place)}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("geocode " + r.status);
    return (await r.json())[0];
  }
  async function geocode(place) {
    const key = place.trim().toLowerCase();
    if (!key) return null;
    if (geoCache[key]) return geoCache[key];
    const hit = (await nominatim(place, "&countrycodes=br")) || (await nominatim(place, ""));
    if (!hit) return null;
    const a = hit.address || {};
    const uf = (a["ISO3166-2-lvl4"] || "").split("-")[1];
    const label = [a.suburb || a.neighbourhood || a.city_district || a.quarter, a.city || a.town || a.village || a.municipality,
      a.country_code === "br" ? uf || a.state : [a.state, a.country].filter(Boolean).join(", ")]
      .filter(Boolean).join(", ") || hit.display_name.split(",").slice(0, 3).join(",");
    const g = { lat: (+hit.lat).toFixed(6), lon: (+hit.lon).toFixed(6), label };
    geoCache[key] = g; store("geo2", geoCache);
    return g;
  }

  const GEO_HINT = 'Ex.: <em>dentista</em> em <em>Barra Funda, São Paulo</em>. Várias buscas? Separe por vírgula.';
  let geoTimer;
  async function checkLocation() {
    const place = $("#location").value.trim();
    const hint = $("#geo-status");
    state.geo = null;
    if (!place) { hint.className = "footnote"; hint.innerHTML = GEO_HINT; showLookup(null); return null; }
    hint.className = "footnote"; hint.textContent = "Localizando no mapa…";
    try {
      const g = await geocode(place);
      if ($("#location").value.trim() !== place) return null;   // user kept typing
      if (!g) { hint.className = "footnote warn"; hint.textContent = "Não achei esse lugar no mapa. A busca vai usar só o texto."; showLookup(null); return null; }
      return applyGeo(g);
    } catch {
      hint.className = "footnote warn"; hint.textContent = "Sem acesso ao serviço de mapas agora. A busca vai usar só o texto.";
      return null;
    }
  }
  function applyGeo(g) {
    state.geo = g;
    const hint = $("#geo-status");
    hint.className = "footnote ok";
    hint.textContent = "📍 " + g.label;
    showLookup(g);
    syncRadius(false);
    return g;
  }
  // Geocode when the user leaves the field without picking a suggestion (not per keystroke, which
  // would fly the map around mid-word and skew the "near the map" ranking of the suggestions).
  $("#location").addEventListener("input", () => { clearTimeout(geoTimer); state.geo = null; });
  $("#location").addEventListener("blur", () => { if (!state.geo) geoTimer = setTimeout(checkLocation, 0); });

  // ───────────────────────── suggestions ─────────────────────────
  // Type-ahead for both fields. "O que": your past searches, then common business types.
  // "Onde": places you used before, then Photon (OpenStreetMap search built for type-ahead;
  // Nominatim's usage policy forbids autocomplete). Brazil first, places near the map on top.
  const CATEGORIES = [
    "dentista", "clínica odontológica", "ortodontista", "médico", "clínica médica", "pediatra", "dermatologista",
    "ginecologista", "oftalmologista", "cardiologista", "ortopedista", "psicólogo", "psiquiatra", "fisioterapia",
    "nutricionista", "fonoaudiólogo", "laboratório de análises clínicas", "clínica de imagem", "hospital",
    "farmácia", "drogaria", "farmácia de manipulação", "ótica", "veterinário", "clínica veterinária", "pet shop",
    "banho e tosa", "hotel para cachorro", "academia", "crossfit", "pilates", "estúdio de yoga", "escola de dança",
    "escola de natação", "escola de lutas", "personal trainer", "salão de beleza", "cabeleireiro", "barbearia",
    "manicure", "esmalteria", "estética", "clínica de estética", "depilação", "design de sobrancelhas",
    "extensão de cílios", "spa", "massagem", "estúdio de tatuagem", "restaurante", "pizzaria", "hamburgueria",
    "lanchonete", "padaria", "confeitaria", "doceria", "cafeteria", "sorveteria", "açaiteria", "churrascaria",
    "restaurante japonês", "temakeria", "restaurante italiano", "comida árabe", "comida mexicana",
    "restaurante vegetariano", "restaurante self-service", "marmitaria", "bar", "pub", "cervejaria", "adega",
    "food truck", "supermercado", "mercado", "mercearia", "hortifruti", "açougue", "peixaria",
    "loja de conveniência", "empório", "loja de produtos naturais", "loja de suplementos", "loja de vinhos",
    "tabacaria", "loja de roupas", "loja de roupas femininas", "loja de roupas infantis", "moda praia",
    "loja de calçados", "loja de bolsas", "joalheria", "relojoaria", "loja de cosméticos", "perfumaria",
    "papelaria", "livraria", "floricultura", "loja de presentes", "loja de brinquedos", "loja de artigos esportivos",
    "loja de bicicletas", "loja de móveis", "loja de decoração", "loja de colchões", "loja de eletrodomésticos",
    "loja de celulares", "assistência técnica de celular", "assistência técnica", "loja de informática",
    "loja de material de construção", "depósito de material de construção", "loja de ferragens", "loja de tintas",
    "vidraçaria", "marmoraria", "serralheria", "marcenaria", "móveis planejados", "gesso e drywall",
    "eletricista", "encanador", "pintor", "chaveiro", "dedetizadora", "desentupidora", "empresa de limpeza",
    "lavanderia", "costureira", "sapataria", "jardinagem", "piscinas", "energia solar", "ar-condicionado",
    "provedor de internet", "segurança eletrônica", "oficina mecânica", "auto center", "funilaria e pintura",
    "borracharia", "lava-jato", "estética automotiva", "autopeças", "concessionária", "loja de carros usados",
    "loja de motos", "oficina de motos", "autoescola", "posto de combustível", "estacionamento", "guincho",
    "imobiliária", "corretor de imóveis", "construtora", "arquiteto", "engenheiro", "escritório de contabilidade",
    "contador", "advogado", "escritório de advocacia", "despachante", "cartório", "corretora de seguros",
    "agência de marketing", "agência de publicidade", "gráfica", "fotógrafo", "estúdio de fotografia", "buffet",
    "salão de festas", "decoração de festas", "organização de eventos", "hotel", "pousada", "hostel", "motel",
    "agência de viagens", "escola particular", "creche", "escola de idiomas", "curso de inglês", "cursinho",
    "faculdade", "escola de música", "escola de informática", "coworking", "igreja", "funerária",
    "transportadora", "empresa de mudanças", "gás de cozinha", "distribuidora de água", "distribuidora de bebidas",
    "atacadista", "indústria", "fábrica",
  ];
  const UF = {
    "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM", "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF",
    "Espírito Santo": "ES", "Goiás": "GO", "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
    "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE", "Piauí": "PI",
    "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR",
    "Santa Catarina": "SC", "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO",
  };
  const PLACE_KINDS = new Set(["city", "town", "village", "municipality", "suburb", "neighbourhood", "quarter",
    "district", "borough", "hamlet", "administrative", "state"]);
  const SUG_ICON = {
    history: "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7a6.96 6.96 0 0 1-4.94-2.06l-1.42 1.42A8.95 8.95 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z",
    category: "M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
    place: "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
  };

  // Accent- and case-insensitive ("aguas" finds "Águas"); keeps length so match offsets line up.
  const fold = (s) => String(s).normalize("NFC").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const kwHist = load("kwHist", []), placeHist = load("placeHist", []);
  function pushHist(name, list, item, text) {
    const i = list.findIndex((x) => fold(text(x)) === fold(text(item)));
    if (i >= 0) list.splice(i, 1);
    list.unshift(item);
    list.length = Math.min(list.length, 20);
    store(name, list);
  }
  // 0 = starts with the query, 1 = every typed word starts a word in it ("aguas cl df" → "Águas Claras, DF"),
  // 2 = contains it mid-word ("aca" in "tabacaria"), which is only noise unless nothing better matched.
  function rankText(text, q) {
    const t = fold(text);
    if (t.startsWith(q)) return 0;
    const tw = t.split(/[^a-z0-9]+/), qw = q.split(/[^a-z0-9]+/).filter(Boolean);
    if (qw.length && qw.every((w) => tw.some((x) => x.startsWith(w)))) return 1;
    return t.includes(q) ? 2 : -1;
  }
  function matching(list, q, text, max) {
    const hits = list.map((x) => [rankText(text(x), q), x]).filter(([r]) => r >= 0).sort((a, b) => a[0] - b[0]);
    const good = hits.filter(([r]) => r < 2);
    return (good.length ? good : hits).slice(0, max).map(([, x]) => x);
  }
  function mark(text, q) {
    text = String(text).normalize("NFC");
    const i = q ? fold(text).indexOf(q) : -1;
    return i < 0 ? esc(text) : esc(text.slice(0, i)) + "<b>" + esc(text.slice(i, i + q.length)) + "</b>" + esc(text.slice(i + q.length));
  }

  const photonCache = {};
  async function photon(q) {
    const c = hasMap && map.getCenter();
    const bias = c ? `&lat=${c.lat.toFixed(1)}&lon=${c.lng.toFixed(1)}` : "";
    const key = q + bias;
    if (photonCache[key]) return photonCache[key];
    const get = async (text, extra = "") => {
      const r = await fetch(`https://photon.komoot.io/api/?limit=20&lang=default&layer=city&layer=district&layer=locality&layer=county&layer=state${extra}&q=${encodeURIComponent(text)}`);
      if (!r.ok) throw new Error("photon " + r.status);
      return ((await r.json()).features || []).filter((f) => PLACE_KINDS.has(f.properties.osm_value));
    };
    // Adding "brasil" to the text is what ranks Brazilian places first ("aguas cl" alone returns Chile);
    // the map-center bias then pulls nearby ones in (map on Brasília: "aguas" → Águas Claras, DF).
    let feats = (await get(q + " brasil", bias)).filter((f) => f.properties.countrycode === "BR");
    if (feats.length < 3) feats = feats.concat((await get(q)).filter((f) => f.properties.countrycode !== "BR"));
    const near = (f) => c && distance(c.lat, c.lng, f.geometry.coordinates[1], f.geometry.coordinates[0]) < 200000;
    feats.sort((a, b) => (a.properties.countrycode !== "BR") - (b.properties.countrycode !== "BR") || near(b) - near(a));
    const seen = new Set(), out = [];
    for (const f of feats) {
      const p = f.properties, [lon, lat] = f.geometry.coordinates;
      const region = p.countrycode === "BR" ? UF[p.state] || p.state : [p.state, p.country].filter(Boolean).join(", ");
      const label = [p.name, p.city !== p.name && p.city, region].filter(Boolean).join(", ");
      if (seen.has(fold(label))) continue;
      seen.add(fold(label));
      out.push({ lat: (+lat).toFixed(6), lon: (+lon).toFixed(6), label });
    }
    // Same ordering rule as "O que". Photon also matches typos ("aguaz"), so if nothing matches
    // the text literally, keep its own guesses instead of showing nothing.
    const ranked = matching(out, q, (g) => g.label, out.length);
    return (photonCache[key] = ranked.length ? ranked : out);
  }

  const sug = { input: null, q: "", items: [], active: -1, loading: false, seq: 0, timer: 0 };
  function renderSuggest() {
    const box = $("#suggest"), open = !!sug.input && (sug.items.length > 0 || sug.loading);
    box.hidden = !open;
    $$("#keyword, #location").forEach((el) => el.setAttribute("aria-expanded", String(open && el === sug.input)));
    if (!open) return;
    const row = sug.input.closest(".search-row");
    box.style.top = row.offsetTop + row.offsetHeight + 4 + "px";
    box.innerHTML = sug.items.map((it, i) => `
      <li id="sug-${i}" class="sug${i === sug.active ? " active" : ""}" role="option" aria-selected="${i === sug.active}" data-i="${i}">
        <svg class="sug-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${SUG_ICON[it.kind]}"/></svg>
        <span class="sug-main">${mark(it.text, sug.q)}</span>
      </li>`).join("") + (sug.loading && !sug.items.length ? '<li class="sug-note">Buscando lugares…</li>' : "");
    if (sug.active >= 0) sug.input.setAttribute("aria-activedescendant", "sug-" + sug.active);
    else sug.input.removeAttribute("aria-activedescendant");
  }
  function closeSuggest() {
    clearTimeout(sug.timer); sug.seq++;
    sug.input = null; sug.items = []; sug.loading = false;
    renderSuggest();
  }
  // "O que" accepts several terms separated by commas; suggestions complete the last one.
  const lastTerm = (v) => v.slice(v.lastIndexOf(",") + 1);

  function updateSuggest(input) {
    sug.input = input; sug.active = -1; sug.loading = false;
    clearTimeout(sug.timer);
    const seq = ++sug.seq;
    if (input.id === "keyword") {
      const q = fold(lastTerm(input.value)).trim();
      sug.q = q;
      const hist = q ? matching(kwHist, q, String, 4) : kwHist.slice(0, 5);
      const cats = q ? matching(CATEGORIES.filter((c) => !hist.some((h) => fold(h) === fold(c))), q, String, 8 - hist.length) : [];
      sug.items = [...hist.map((t) => ({ kind: "history", text: t })), ...cats.map((t) => ({ kind: "category", text: t }))];
      return renderSuggest();
    }
    const q = fold(input.value).trim();
    sug.q = q;
    const hist = q ? matching(placeHist, q, (g) => g.label, 3) : placeHist.slice(0, 5);
    sug.items = hist.map((g) => ({ kind: "history", text: g.label, geo: g }));
    if (q.length >= 2) {
      sug.loading = true;
      sug.timer = setTimeout(async () => {
        let found = [];
        try { found = await photon(q); } catch {}   // offline: keep the local suggestions
        if (seq !== sug.seq) return;                  // user kept typing
        const known = new Set(sug.items.map((it) => fold(it.text)));
        sug.items = sug.items.concat(found.filter((g) => !known.has(fold(g.label))).slice(0, 7 - sug.items.length)
          .map((g) => ({ kind: "place", text: g.label, geo: g })));
        sug.loading = false;
        renderSuggest();
      }, 250);
    }
    renderSuggest();
  }

  function pickSuggestion(i) {
    const it = sug.items[i], input = sug.input;
    if (!it) return;
    closeSuggest();
    if (input.id === "keyword") {
      const v = input.value, cut = v.lastIndexOf(",") + 1;
      input.value = v.slice(0, cut) + (cut ? " " : "") + it.text;
      if (!$("#location").value.trim()) $("#location").focus();
      return;
    }
    clearTimeout(geoTimer);
    input.value = it.geo.label;
    geoCache[it.geo.label.trim().toLowerCase()] = it.geo; store("geo2", geoCache);
    pushHist("placeHist", placeHist, it.geo, (g) => g.label);
    applyGeo(it.geo);
  }

  $$("#keyword, #location").forEach((input) => {
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", "suggest");
    input.setAttribute("aria-expanded", "false");
    input.addEventListener("input", () => updateSuggest(input));
    input.addEventListener("focus", () => updateSuggest(input));
    input.addEventListener("blur", closeSuggest);
    // Registered before the keyword's own Enter handler, so a picked suggestion stops it.
    input.addEventListener("keydown", (e) => {
      if (sug.input !== input || $("#suggest").hidden) return;
      const n = sug.items.length;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!n) return;
        e.preventDefault();
        sug.active = e.key === "ArrowDown" ? (sug.active + 1) % n : sug.active <= 0 ? n - 1 : sug.active - 1;
        renderSuggest();
      } else if (e.key === "Enter" && sug.active >= 0) {
        e.preventDefault(); e.stopImmediatePropagation();
        pickSuggestion(sug.active);
      } else if (e.key === "Escape") {
        e.stopPropagation();
        closeSuggest();
      }
    });
  });
  // mousedown keeps focus in the field (no blur → no close) until the click lands.
  $("#suggest").addEventListener("mousedown", (e) => e.preventDefault());
  $("#suggest").addEventListener("click", (e) => {
    const li = e.target.closest(".sug");
    if (li) pickSuggestion(+li.dataset.i);
  });

  // ───────────────────────── submit ─────────────────────────
  function showError(msg) { const e = $("#form-error"); e.textContent = msg; e.hidden = !msg; }

  $("#search-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (state.submitting) return;                 // guards against double clicks
    showError("");
    const terms = $("#keyword").value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    const place = $("#location").value.trim();
    if (!terms.length) { $("#keyword").focus(); return showError("Diga o que você procura. Ex.: dentista."); }
    if (!place) { $("#location").focus(); return showError("Diga onde procurar. Ex.: Barra Funda, São Paulo."); }

    const lang = $("#lang").value, depth = state.depth, email = state.email;
    const keywords = terms.map((t) => `${t} ${JOINER[lang] || "em"} ${place}`);
    const dup = state.jobs.find((j) => (j.status === "pending" || j.status === "working") && j.keywords.join("|") === keywords.join("|"));
    if (dup && !confirm("Essa mesma busca já está rodando ou na fila. Criar outra igual mesmo assim?")) return;

    state.submitting = true;
    const btn = $("#submit"); btn.disabled = true; btn.querySelector(".btn-label").textContent = "Enviando…";
    try {
      const g = state.geo || await checkLocation();
      const autoSecs = autoTime(terms.length, depth, email);
      const maxMin = +$("#maxtime").value;
      const body = {
        name: `${terms.join(", ")} · ${place.split(",")[0].trim()}`,
        keywords, lang, depth, email,
        // lat/lon only bias the map viewport; the place is also in the keyword text,
        // so an un-geocodable place still works (the API just requires *some* coordinates).
        lat: g ? g.lat : "0", lon: g ? g.lon : "0",
        zoom: g ? zoomFor(radiusMeters(), +g.lat) : 14, radius: radiusMeters(),
        fast_mode: false, max_time: maxMin ? maxMin * 60 : autoSecs,
      };
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) {
        let msg = `O scraper recusou a busca (erro ${r.status}).`;
        try { const j = await r.json(); if (j.message) msg += ` ${j.message}`; } catch {}
        throw new Error(msg);
      }
      const busy = state.jobs.some((j) => j.status === "working" || j.status === "pending");
      toast(busy ? "Busca criada. Ela entra na fila depois da atual." : "Busca criada! Acompanhe em “Suas buscas”.");
      store("prefs", { lang, depth, radius: +$("#radius").value });
      terms.slice().reverse().forEach((t) => pushHist("kwHist", kwHist, t, String));
      if (g) pushHist("placeHist", placeHist, { lat: g.lat, lon: g.lon, label: place }, (x) => x.label);
      $("#keyword").value = "";
      refreshJobs();
    } catch (err) {
      showError(err.message || "Não consegui criar a busca. O scraper está online?");
    } finally {
      state.submitting = false; btn.disabled = false;
      btn.querySelector(".btn-label").textContent = "Pesquisar";
    }
  });

  // ───────────────────────── results ─────────────────────────
  function insideShare(job, rows) {
    const located = rows.filter((r) => +r.latitude);
    if (!job.lat || !job.radius || !located.length) return 0;
    return located.filter((r) => distance(job.lat, job.lon, +r.latitude, +r.longitude) <= job.radius).length / located.length;
  }

  async function openResults(job) {
    state.current = job.id;
    history.replaceState(null, "", `#job=${job.id}`);
    $("#to-painel").href = `/painel#job=${job.id}`;
    $("#view-home").hidden = true; $("#view-results").hidden = false;
    $("#panel").scrollTop = 0;
    $("#results-title").textContent = job.name || "Resultados";
    $("#dash-title").textContent = job.name || "Painel";
    $("#results-sub").textContent = "Carregando…";
    $("#places").innerHTML = "";
    $("#raw-download").href = `${API}/${job.id}/download`;
    $("#raw-download").setAttribute("download", `${slug(job.name)}-completo.csv`);
    if (lookupMarker) lookupMarker.remove();
    try { state.rows = await fetchRows(job.id); }
    catch { $("#results-sub").textContent = "Não consegui baixar os resultados dessa busca."; return; }

    const cats = [...new Set(state.rows.map((r) => r.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const counts = Object.fromEntries(cats.map((c) => [c, state.rows.filter((r) => r.category === c).length]));
    $("#cat-filter").innerHTML = `<option value="">Todas as categorias</option>` + cats.map((c) => `<option value="${esc(c)}">${esc(c)} (${counts[c]})</option>`).join("");
    $("#filter").value = "";
    state.sort = { key: null, dir: 1 };
    setPressed("#sort-rating", false);
    const hasArea = !!(job.lat && job.radius);
    const share = insideShare(job, state.rows);
    $("#in-radius").hidden = !hasArea;
    $("#in-radius").textContent = hasArea ? `Dentro de ${Math.round(job.radius / 100) / 10} km` : "";
    setPressed("#in-radius", hasArea && share >= 0.5);
    if (hasArea && share < 0.5) toast("A maioria dos resultados ficou fora do raio: o local pode ter sido entendido diferente. Filtro de raio desligado.", 7000);
    const n = (f) => state.rows.filter(f).length;
    const sub = `${state.rows.length} lugares · ${n((r) => r.phone)} com telefone · ${n(ownSite)} com site próprio` +
      (job.email ? ` · ${n((r) => emailsOf(r).length)} com e-mail` : "");
    $("#results-sub").textContent = sub;
    $("#dash-sub").textContent = `Busca: ${job.keywords.join(" / ")} · ${ago(job.date)}`;
    renderResults();
  }

  function closeResults() {
    state.current = null; state.rows = []; state.visible = [];
    history.replaceState(null, "", location.pathname);
    $("#to-painel").href = "/painel";
    $("#view-results").hidden = true; $("#view-home").hidden = false;
    $("#dash").hidden = true;
    if (hasMap) { markerLayer.clearLayers(); drawArea(); if (state.geo) showLookup(state.geo); }
  }
  $("#back").addEventListener("click", closeResults);

  const pressed = (s) => $(s).getAttribute("aria-pressed") === "true";
  function setPressed(s, v) { $(s).setAttribute("aria-pressed", v); $(s).classList.toggle("selected", v); }
  ["#in-radius", "#dedupe", "#only-phone", "#only-wa", "#sort-rating"].forEach((s) => $(s).addEventListener("click", () => {
    setPressed(s, !pressed(s));
    if (s === "#sort-rating") state.sort = pressed(s) ? { key: "review_rating", dir: -1 } : { key: null, dir: 1 };
    renderResults();
  }));
  ["#filter", "#cat-filter", "#site-filter", "#min-rating"].forEach((s) => $(s).addEventListener("input", renderResults));

  function visibleRows() {
    const q = $("#filter").value.trim().toLowerCase();
    const cat = $("#cat-filter").value, siteF = $("#site-filter").value, minRating = +$("#min-rating").value;
    const job = state.jobs.find((j) => j.id === state.current) || {};
    const area = pressed("#in-radius") && job.lat && job.radius;
    const siteOk = (r) => {
      if (!siteF) return true;
      const s = siteInfo(r.website);
      return siteF === "own" ? !!s?.own : siteF === "none" ? !s?.own : !!s && !s.own;
    };
    let rows = state.rows.filter((r) =>
      (!area || !+r.latitude || distance(job.lat, job.lon, +r.latitude, +r.longitude) <= job.radius) &&
      (!cat || r.category === cat) && (!pressed("#only-phone") || r.phone) && (!pressed("#only-wa") || whatsapp(r.phone)) &&
      (!minRating || +r.review_rating >= minRating) && siteOk(r) &&
      (!q || [r.title, r.category, r.address, r.phone, r.website, r.emails].join(" ").toLowerCase().includes(q)));
    state.dupes = 0;
    if (pressed("#dedupe")) {
      // A search with several terms ("dentista", "clínica odontológica") returns the same company once
      // per term, so a row is a repeat if ANY of its identifiers was already seen.
      const seen = new Set(), before = rows.length;
      rows = rows.filter((r) => {
        const keys = [r.cid && "c" + r.cid, r.data_id && "d" + r.data_id, r.place_id && "p" + r.place_id, r.link && "l" + r.link,
          digits(r.phone) && "t" + digits(r.phone), r.title && "n" + fold(r.title + "|" + r.address)].filter(Boolean);
        const dup = keys.some((k) => seen.has(k));
        keys.forEach((k) => seen.add(k));
        return !dup;
      });
      state.dupes = before - rows.length;
    }
    const { key, dir } = state.sort;
    if (key) {
      const numeric = key === "review_rating" || key === "review_count";
      rows = [...rows].sort((a, b) => numeric
        ? ((+a[key] || 0) - (+b[key] || 0) || (+a.review_count || 0) - (+b.review_count || 0)) * dir
        : String(a[key]).localeCompare(String(b[key]), "pt-BR") * dir);
    }
    return rows;
  }

  function renderResults() {
    const rows = (state.visible = visibleRows());
    $("#export-count").textContent = `${rows.length} de ${state.rows.length}` + (state.dupes ? ` · ${state.dupes} repetidas` : "");
    $("#places").innerHTML = rows.length ? rows.map((r, i) => {
      const wa = whatsapp(r.phone);
      const rating = +r.review_rating;
      const mails = emailsOf(r);
      const site = siteInfo(r.website);
      const route = +r.latitude ? `https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}` : r.link;
      return `<li class="place" data-i="${i}">
        <div class="place-name">${esc(r.title)}</div>
        ${rating ? `<div class="rating"><b>${rating.toFixed(1).replace(".", ",")}</b>${starsHTML(rating)}<span>(${fmt(r.review_count)})</span></div>` : ""}
        <div class="place-line">${esc([r.category, r.address.replace(r.title + " - ", "")].filter(Boolean).join(" · "))}</div>
        ${r.phone ? `<div class="place-line phone">${esc(r.phone)}</div>` : ""}
        ${mails.length ? `<div class="place-line mail">${mails.map((m) => `<a href="mailto:${esc(m)}">${esc(m)}</a>`).join(", ")}</div>` : ""}
        <div class="place-actions">
          ${site ? `<a class="act${site.own ? "" : " social"}" href="${esc(r.website)}" target="_blank" rel="noopener" title="${site.own ? esc(site.name) : `Sem site próprio: o link vai para ${esc(site.name)}`}">${ICON.web}${site.own ? "Site" : esc(site.name)}</a>` : ""}
          ${wa ? `<a class="act wa" href="${wa}" target="_blank" rel="noopener">${ICON.wa}WhatsApp</a>` : r.phone ? `<a class="act" href="tel:${esc(digits(r.phone))}">${ICON.phone}Ligar</a>` : ""}
          ${route ? `<a class="act" href="${esc(route)}" target="_blank" rel="noopener">${ICON.dir}Rotas</a>` : ""}
          ${r.link ? `<a class="act" href="${esc(r.link)}" target="_blank" rel="noopener">Ver no Maps</a>` : ""}
        </div>
      </li>`;
    }).join("") : `<li class="empty">Nada com esses filtros.</li>`;
    plotRows(rows);
    const job = state.jobs.find((j) => j.id === state.current) || {};
    if (job.lat && job.radius) drawArea(job.lat, job.lon, job.radius, false);
    if (!$("#dash").hidden) renderDash();
  }

  $("#places").addEventListener("mouseover", (e) => {
    const li = e.target.closest(".place");
    if (li && hasMap && markers[li.dataset.i]) markers[li.dataset.i].setIcon(pinIcon("#ea4335", true));
  });
  $("#places").addEventListener("mouseout", (e) => {
    const li = e.target.closest(".place");
    if (li && hasMap && markers[li.dataset.i] && !li.classList.contains("hl")) markers[li.dataset.i].setIcon(pinIcon("#ea4335"));
  });
  $("#places").addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    const li = e.target.closest(".place");
    if (!li) return;
    const i = +li.dataset.i, m = hasMap && markers[i];
    highlight(i, false);
    if (m) { focusPoint(m.getLatLng(), Math.max(map.getZoom(), 16)); setTimeout(() => m.openPopup(), 700); }
  });

  // ───────────────────────── dashboard ("Painel") ─────────────────────────
  // Everything here reflects the current filters, so the side panel and the dashboard always agree.
  function renderDash() {
    const rows = state.visible;
    const job = state.jobs.find((j) => j.id === state.current) || {};
    const n = (f) => rows.filter(f).length;
    const total = rows.length;
    const phone = n((r) => r.phone), wa = n((r) => whatsapp(r.phone)), site = n(ownSite), mail = n((r) => emailsOf(r).length);
    const social = n((r) => r.website && !ownSite(r));
    const rated = rows.filter((r) => +r.review_rating);
    const avg = rated.length ? rated.reduce((a, r) => a + +r.review_rating, 0) / rated.length : 0;
    const reviews = rows.reduce((a, r) => a + (+r.review_count || 0), 0);

    const kpis = [
      ["Empresas", fmt(total), total < state.rows.length ? `de ${fmt(state.rows.length)} (com filtros)` : "todas desta busca"],
      ["Com telefone", fmt(phone), `${pct(phone, total)}% das empresas`],
      ["Com WhatsApp", fmt(wa), "celulares (dá para chamar direto)"],
      ["Com site próprio", fmt(site), `${pct(site, total)}% · ${fmt(social)} só com Instagram/redes`],
      job.email ? ["Com e-mail", fmt(mail), `${pct(mail, total)}% (achados nos sites)`] : ["E-mails", "—", "busca feita sem e-mail"],
      ["Nota média", avg ? avg.toFixed(1).replace(".", ",") + " ★" : "—", `${fmt(reviews)} avaliações no total`],
    ];
    $("#dash-kpis").innerHTML = kpis.map(([l, v, h]) => `<div class="kpi"><span class="kpi-label">${esc(l)}</span><span class="kpi-value">${esc(v)}</span><span class="kpi-hint">${esc(h)}</span></div>`).join("");

    // Categories: computed over all rows (not the category filter) so you can switch between them.
    const base = state.rows;
    const byCat = {};
    base.forEach((r) => { const c = r.category || "Sem categoria"; byCat[c] = (byCat[c] || 0) + 1; });
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = cats.length ? cats[0][1] : 1;
    const active = $("#cat-filter").value;
    $("#dash-cats").innerHTML = cats.map(([c, v]) => `<li class="bar clickable ${c === active ? "on" : ""}" data-cat="${esc(c)}" title="Filtrar por ${esc(c)}">
      <span class="bar-name">${esc(c)}</span><span class="bar-val">${fmt(v)}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${(v / max) * 100}%"></span></span></li>`).join("") +
      (active ? `<li class="bar clickable" data-cat=""><span class="bar-name" style="color:var(--blue)">✕ Mostrar todas as categorias</span></li>` : "");

    const contacts = [
      ["Telefone", phone, "green"], ["WhatsApp (celular)", wa, "green"], ["Site próprio", site, ""],
      ["Só Instagram / redes", social, "yellow"],
      ...(job.email ? [["E-mail", mail, "yellow"]] : []), ["Sem nenhum contato", n((r) => !r.phone && !r.website && !emailsOf(r).length), "red"],
    ];
    $("#dash-contacts").innerHTML = contacts.map(([l, v, cls]) => `<li class="bar ${cls}">
      <span class="bar-name">${esc(l)}</span><span class="bar-val">${pct(v, total)}%</span>
      <span class="bar-track"><span class="bar-fill" style="width:${pct(v, total)}%"></span></span></li>`).join("");

    $("#dash-count").textContent = `${fmt(total)} empresas na tabela`;
    $$("#results-table th[data-sort]").forEach((th) => {
      th.classList.toggle("sorted-asc", th.dataset.sort === state.sort.key && state.sort.dir === 1);
      th.classList.toggle("sorted-desc", th.dataset.sort === state.sort.key && state.sort.dir === -1);
    });
    $("#results-table tbody").innerHTML = rows.length ? rows.map((r) => `<tr>
      <td>${r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(r.title)}</a>` : esc(r.title)}</td>
      <td>${esc(r.category)}</td>
      <td style="white-space:nowrap">${esc(r.phone)}${whatsapp(r.phone) ? ` <a href="${whatsapp(r.phone)}" target="_blank" rel="noopener" title="Abrir no WhatsApp" style="color:var(--green)">WA</a>` : ""}</td>
      <td>${emailsOf(r).map((m) => `<a href="mailto:${esc(m)}">${esc(m)}</a>`).join("<br>")}</td>
      <td>${r.website ? `<a href="${esc(r.website)}" target="_blank" rel="noopener">${ownSite(r) ? esc(r.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").slice(0, 36)) : `${esc(siteInfo(r.website)?.name || "link")} <small>(sem site próprio)</small>`}</a>` : ""}</td>
      <td class="num">${+r.review_rating ? (+r.review_rating).toFixed(1).replace(".", ",") : "—"}</td>
      <td class="num">${r.review_count ? fmt(r.review_count) : "—"}</td>
      <td>${esc(r.address)}</td>
    </tr>`).join("") : `<tr><td colspan="8" class="empty">Nenhuma empresa com esses filtros.</td></tr>`;
  }

  $("#open-dash").addEventListener("click", () => { $("#dash").hidden = false; renderDash(); });
  $("#dash-close").addEventListener("click", () => ($("#dash").hidden = true));
  $("#dash").addEventListener("click", (e) => { if (e.target.id === "dash") $("#dash").hidden = true; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("#dash").hidden = true; });
  $("#dash-cats").addEventListener("click", (e) => {
    const li = e.target.closest("[data-cat]");
    if (!li) return;
    $("#cat-filter").value = li.dataset.cat === $("#cat-filter").value ? "" : li.dataset.cat;
    renderResults();
  });
  $("#results-table thead").addEventListener("click", (e) => {
    const th = e.target.closest("th[data-sort]");
    if (!th) return;
    const key = th.dataset.sort;
    state.sort = state.sort.key === key ? { key, dir: -state.sort.dir } : { key, dir: key.startsWith("review") ? -1 : 1 };
    setPressed("#sort-rating", key === "review_rating" && state.sort.dir === -1);
    renderResults();
  });

  // ───────────────────────── export ─────────────────────────
  const EXPORT_HEAD = ["Nome", "Categoria", "Telefone", "WhatsApp", "E-mail", "Site", "Tipo de site", "Nota", "Avaliações", "Endereço", "Link Google Maps"];
  const siteKind = (r) => { const s = siteInfo(r.website); return !s ? "Sem site" : s.own ? "Próprio" : s.name; };
  const exportRow = (r) => [
    r.title, r.category, r.phone, whatsapp(r.phone) || "", emailsOf(r).join(", "), r.website, siteKind(r),
    +r.review_rating ? (+r.review_rating).toFixed(1).replace(".", ",") : "", r.review_count, r.address, r.link,
  ];

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-export]");
    if (!btn) return;
    const rows = state.visible.map(exportRow);
    const job = state.jobs.find((j) => j.id === state.current);
    const base = slug(job ? job.name : "resultados");
    const kind = btn.dataset.export;
    if (kind === "excel") {
      // Excel pt-BR expects ';' as separator; the BOM makes it read UTF-8 accents correctly.
      saveFile(`${base}.csv`, "﻿" + toCSV(EXPORT_HEAD, rows, ";"), "text/csv;charset=utf-8");
      toast(`${rows.length} empresas baixadas. Dê dois cliques no arquivo para abrir no Excel.`);
    } else if (kind === "sheets") {
      saveFile(`${base}-sheets.csv`, "﻿" + toCSV(EXPORT_HEAD, rows, ","), "text/csv;charset=utf-8");
      toast("Baixado. No Google Sheets: Arquivo → Importar → Upload.", 6000);
    } else if (kind === "copy") {
      const tsv = [EXPORT_HEAD, ...rows].map((r) => r.map((v) => String(v ?? "").replace(/[\t\r\n]+/g, " ")).join("\t")).join("\n");
      try { await navigator.clipboard.writeText(tsv); toast(`${rows.length} linhas copiadas. Cole (Ctrl+V) no Sheets ou Excel.`); }
      catch { toast("O navegador bloqueou a cópia. Use os botões de download."); }
    }
  });

  // ───────────────────────── keyboard ─────────────────────────
  $("#keyword").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !$("#location").value.trim()) { e.preventDefault(); $("#location").focus(); }
  });
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (e.key === "/" && !typing) {
      e.preventDefault();
      if (!$("#view-results").hidden) $("#filter").focus(); else $("#keyword").focus();
    }
  });

  // ───────────────────────── boot ─────────────────────────
  const prefs = load("prefs", {});
  if (prefs.lang) $("#lang").value = prefs.lang;
  setDepth(prefs.depth || 5);
  if (prefs.radius) $("#radius").value = prefs.radius;
  syncRadius(false);
  renderFavs();
  refreshJobs();
  setInterval(refreshJobs, POLL_MS);
  setInterval(() => { renderJobs._last = null; renderJobs(); }, 30000);  // keep "há X min" fresh
})();
