/* sysf.io on-device demo widget.
 * Drives the Bonsai-1.7B WebGPU engine (engine.js in this directory, lazy-loaded
 * on user request) directly inside the site page — no iframe. Two modes:
 * "triage" (each message classified independently) and "chat" (free multi-turn).
 * Engine interaction mirrors the reference app layer of the standalone demo. */

const $ = (id) => document.getElementById(id);
const I18N = JSON.parse($("sd-i18n").textContent);
const TOTAL_BYTES_FALLBACK = 2.5e8;

let engine = null;      // module namespace of engine.js
let chat = null;        // loaded pipeline
let loadState = "idle"; // idle | loading | ready | failed
let mode = "triage";
let isGenerating = false;
let contextExhausted = false;
let abortController = null;
let messages = [];      // chat-mode history

const els = {
  root: $("sd"), dot: $("sdDot"), status: $("sdStatus"),
  gate: $("sdGate"), note: $("sdNote"), load: $("sdLoad"),
  loading: $("sdLoading"), phase: $("sdPhase"), fill: $("sdFill"), bytes: $("sdBytes"),
  err: $("sdError"), errMsg: $("sdErrorMsg"), retry: $("sdRetry"),
  run: $("sdRun"), thread: $("sdThread"), seeds: $("sdSeeds"),
  input: $("sdInput"), send: $("sdSend"), stop: $("sdStop"),
  live: $("sdLive"), clear: $("sdClear"),
};

/* ---------------- status / panels ---------------- */
function setStatus(kind, text) {
  els.dot.dataset.kind = kind;
  els.status.textContent = text;
}
function showPanel(name) {
  for (const p of ["gate", "loading", "err", "run"]) els[p].hidden = p !== name;
}

/* ---------------- init ---------------- */
function t(key) { return I18N.ui[key] ?? key; }

function init() {
  setStatus("idle", t("statusIdle"));
  showPanel("gate");
  if (!("gpu" in navigator)) {
    els.load.disabled = true;
    els.note.textContent = t("noWebgpu");
    els.note.hidden = false;
    setStatus("err", t("statusUnavailable"));
  }
  els.load.addEventListener("click", loadModel);
  els.retry.addEventListener("click", () => { if (loadState === "failed") loadModel(); });
  els.send.addEventListener("click", send);
  els.stop.addEventListener("click", () => abortController?.abort());
  els.clear.addEventListener("click", clearThread);
  els.input.addEventListener("input", () => { autoGrow(); refreshSend(); });
  els.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!els.send.disabled) send(); }
  });
  for (const tab of els.root.querySelectorAll("[data-sd-mode]")) {
    tab.addEventListener("click", () => switchMode(tab.dataset.sdMode));
  }
  applyMode();
}

function applyMode() {
  for (const tab of els.root.querySelectorAll("[data-sd-mode]")) {
    tab.classList.toggle("on", tab.dataset.sdMode === mode);
    tab.setAttribute("aria-selected", String(tab.dataset.sdMode === mode));
  }
  els.input.placeholder = I18N[mode].placeholder;
  renderSeeds();
}

function switchMode(m) {
  if (m === mode || isGenerating) return;
  mode = m;
  messages = [];
  contextExhausted = false;
  chat?.reset();
  els.thread.replaceChildren();
  els.input.disabled = false;
  applyMode();
  refreshSend();
  if (loadState === "ready") setStatus("ok", t("statusReady"));
}

/* ---------------- load flow (mirrors reference onLoadProgress) ---------------- */
function fmtMB(n) { return (n / 1e6).toFixed(1); }

function onLoadProgress(event) {
  if (event.status === "init") {
    els.phase.textContent = (event.message || t("phaseInit"));
  } else if (event.status === "tokenizer") {
    els.phase.textContent = t("phaseTokenizer");
  } else if (event.status === "weights") {
    if (event.kind === "bytes" && Number.isFinite(event.loaded)) {
      const total = Number.isFinite(event.total) && event.total > 0 ? event.total : TOTAL_BYTES_FALLBACK;
      els.phase.textContent = t("phaseWeights");
      els.fill.style.width = `${Math.min(100, (event.loaded / total) * 100)}%`;
      els.bytes.textContent = `${fmtMB(event.loaded)} / ${fmtMB(total)} MB`;
    } else if (event.kind === "tensors" && /warmup/i.test(event.message || "")) {
      els.phase.textContent = t("phaseKernels");
      els.fill.style.width = "100%";
    }
  }
}

async function loadModel() {
  if (loadState === "loading" || loadState === "ready") return;
  loadState = "loading";
  showPanel("loading");
  setStatus("busy", t("statusLoading"));
  els.fill.style.width = "0%";
  els.bytes.textContent = "";
  els.phase.textContent = t("phaseEngine");
  try {
    engine = engine || await import("./engine.js");
    els.phase.textContent = t("phaseDevice");
    chat = await engine.Bonsai27B.load(engine.DEFAULT_MODEL_ID, {
      file: engine.DEFAULT_GGUF_FILE,
      onProgress: onLoadProgress,
    });
    loadState = "ready";
    showPanel("run");
    setStatus("ok", t("statusReady"));
    renderSeeds();
    refreshSend();
    els.input.focus();
  } catch (error) {
    console.error(error);
    loadState = "failed";
    showPanel("err");
    const msg = String(error?.message ?? error);
    els.errMsg.textContent = /adapter|webgpu/i.test(msg) ? `${msg} — ${t("noWebgpu")}` : msg;
    setStatus("err", t("statusError"));
  }
}

/* ---------------- seeds ---------------- */
function renderSeeds() {
  els.seeds.replaceChildren(...I18N[mode].seeds.map((seed) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "sd-seed";
    b.textContent = seed.label;
    b.addEventListener("click", () => {
      if (!chat || isGenerating) { els.input.value = seed.prompt; refreshSend(); return; }
      els.input.value = seed.prompt;
      send();
    });
    return b;
  }));
}

/* ---------------- composer ---------------- */
function refreshSend() {
  els.send.disabled = isGenerating || contextExhausted || !chat || els.input.value.trim() === "";
}
function autoGrow() {
  els.input.style.height = "auto";
  els.input.style.height = `${Math.min(els.input.scrollHeight, 160)}px`;
}
function setGenerating(on) {
  isGenerating = on;
  els.input.disabled = on;
  els.clear.disabled = on;
  els.send.hidden = on;
  els.stop.hidden = !on;
  for (const s of els.seeds.querySelectorAll(".sd-seed")) s.disabled = on;
  setStatus(on ? "busy" : "ok", on ? t("statusWriting") : t("statusReady"));
  refreshSend();
}

/* ---------------- thread rendering ---------------- */
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (v) => String(v).replace(/[&<>"']/g, (c) => ESC[c]);
function inlineFmt(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+?)`/g, "<code>$1</code>");
}
function renderChatText(el, raw, caret) {
  const safe = escapeHtml(raw || "");
  const paragraphs = safe.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  el.innerHTML = paragraphs.map((p) => `<p>${inlineFmt(p).replace(/\n/g, "<br>")}</p>`).join("") || "<p></p>";
  if (caret) el.lastElementChild?.insertAdjacentHTML("beforeend", '<span class="sd-caret"></span>');
}

const URGENCY_KEYS = { low: "urgLow", medium: "urgMedium", high: "urgHigh" };
function parseTriage(text) {
  const grab = (re) => { const m = text.match(re); return m ? m[1].trim() : null; };
  return {
    category: grab(/Category:\s*([A-Za-zÀ-ÿ]+)/i),
    urgency: grab(/Urgency:\s*([A-Za-z]+)/i),
    summary: grab(/Summary:\s*(.+)/i),
  };
}
function renderTriage(el, raw, done) {
  const r = parseTriage(raw || "");
  const pend = done ? "&mdash;" : '<span class="sd-pend"></span>';
  if (done && !r.category && !r.urgency && !r.summary) {
    renderChatText(el, raw, false);
    return;
  }
  const urgKey = r.urgency ? URGENCY_KEYS[r.urgency.toLowerCase()] : null;
  const urgLabel = urgKey ? t(urgKey) : r.urgency;
  el.innerHTML = `
    <div class="sd-tri">
      <div class="sd-tri-row">
        <span class="sd-tri-k">${escapeHtml(t("fieldCategory"))}</span>
        ${r.category ? `<span class="sd-chip">${escapeHtml(r.category)}</span>` : pend}
      </div>
      <div class="sd-tri-row">
        <span class="sd-tri-k">${escapeHtml(t("fieldUrgency"))}</span>
        ${r.urgency ? `<span class="sd-chip" data-urg="${escapeHtml(r.urgency.toLowerCase())}">${escapeHtml(urgLabel)}</span>` : pend}
      </div>
      <div class="sd-tri-row sd-tri-sum">
        <span class="sd-tri-k">${escapeHtml(t("fieldSummary"))}</span>
        <span class="sd-tri-v">${r.summary ? escapeHtml(r.summary) : pend}${!done ? '<span class="sd-caret"></span>' : ""}</span>
      </div>
    </div>`;
}

function appendUser(text) {
  const div = document.createElement("div");
  div.className = "sd-msg sd-user";
  div.innerHTML = `<div class="sd-role">${escapeHtml(t("roleYou"))}</div><div class="sd-bubble"></div>`;
  div.querySelector(".sd-bubble").textContent = text;
  els.thread.appendChild(div);
  scrollDown(true);
}
function appendAssistant() {
  const div = document.createElement("div");
  div.className = "sd-msg sd-bot";
  div.innerHTML = `<div class="sd-role">${escapeHtml(t("roleModel"))}</div><div class="sd-body"></div>`;
  els.thread.appendChild(div);
  scrollDown(true);
  return div;
}
function scrollDown(force) {
  const near = els.thread.scrollHeight - els.thread.scrollTop - els.thread.clientHeight < 90;
  if (force || near) els.thread.scrollTop = els.thread.scrollHeight;
}

/* stream paint throttle (mirrors reference: ~33ms via rAF) */
const STREAM_RENDER_MS = 33;
let streamPaint = null, renderQueued = false, lastRenderAt = 0;
function scheduleStream(paint) {
  streamPaint = paint;
  if (renderQueued) return;
  renderQueued = true;
  const tick = () => {
    if (!streamPaint) { renderQueued = false; return; }
    if (performance.now() - lastRenderAt < STREAM_RENDER_MS) { requestAnimationFrame(tick); return; }
    renderQueued = false;
    lastRenderAt = performance.now();
    const paintNow = streamPaint;
    streamPaint = null;
    paintNow();
    scrollDown();
  };
  requestAnimationFrame(tick);
}
function cancelStream() { streamPaint = null; }

/* live stat (mirrors reference) */
const LIVE_STAT_MS = 150;
let lastLiveStatAt = 0;
function updateLiveStat({ startedAt, firstTokenAt, now, tokens }) {
  if (tokens <= 1) { els.live.textContent = `TTFT ${(firstTokenAt - startedAt).toFixed(0)} MS`; lastLiveStatAt = now; return; }
  if (now - lastLiveStatAt < LIVE_STAT_MS) return;
  lastLiveStatAt = now;
  els.live.textContent = `${((tokens - 1) / Math.max((now - firstTokenAt) / 1e3, 1e-9)).toFixed(0)} TOK/S`;
}
function appendMeta(msg, { startedAt, firstTokenAt, endedAt, tokens }) {
  if (tokens <= 0) return;
  const parts = [`${tokens} TOK`];
  if (firstTokenAt) parts.push(`TTFT ${(firstTokenAt - startedAt).toFixed(0)} MS`);
  if (tokens > 5 && firstTokenAt) parts.push(`${((tokens - 1) / Math.max((endedAt - firstTokenAt) / 1e3, 1e-9)).toFixed(1)} TOK/S`);
  const meta = document.createElement("div");
  meta.className = "sd-msg-meta";
  meta.textContent = parts.join("  ·  ");
  msg.appendChild(meta);
}

/* ---------------- generation (mirrors reference send()) ---------------- */
async function send() {
  const text = els.input.value.trim();
  if (!text || !chat || isGenerating || contextExhausted) return;
  els.input.value = "";
  autoGrow();
  appendUser(text);

  let history;
  if (mode === "triage") {
    history = [{ role: "user", content: I18N.triage.wrapper + text }];
  } else {
    messages.push({ role: "user", content: text });
    history = messages;
  }
  chat.chatTemplateArgs = { enable_thinking: false, preserve_thinking: true };

  const msg = appendAssistant();
  const body = msg.querySelector(".sd-body");
  const render = mode === "triage" ? renderTriage : renderChatText;
  setGenerating(true);
  abortController = new AbortController();
  let answer = "";
  let startedAt = performance.now(), firstTokenAt = 0, tokens = 0;
  try {
    for await (const tok of chat.generate(history, { signal: abortController.signal })) {
      const now = performance.now();
      if (!firstTokenAt) firstTokenAt = now;
      if (tok.token !== null) tokens++;
      answer += answer === "" ? tok.delta.replace(/^\s+/, "") : tok.delta;
      scheduleStream(() => render(body, answer, mode === "chat"));
      updateLiveStat({ startedAt, firstTokenAt, now, tokens });
    }
  } catch (error) {
    console.error(error);
    if (!answer) {
      body.innerHTML = "";
      const err = document.createElement("div");
      err.className = "sd-err-inline";
      err.textContent = `${t("genStopped")} ${String(error?.message ?? error)}`;
      body.appendChild(err);
    }
    setStatus("err", t("statusError"));
  } finally {
    cancelStream();
    if (mode === "chat") renderChatText(body, answer, false);
    else renderTriage(body, answer, true);
    appendMeta(msg, { startedAt, firstTokenAt, endedAt: performance.now(), tokens });
    scrollDown();
    if (mode === "chat") {
      const content = chat.lastAssistantContent;
      if (content !== null) messages.push({ role: "assistant", content });
    }
    setGenerating(false);
    els.live.textContent = "";
    abortController = null;
    if (chat.contextFull) lockContextFull(msg);
    else els.input.focus();
  }
}

function lockContextFull(msg) {
  contextExhausted = true;
  const note = document.createElement("div");
  note.className = "sd-ctxfull";
  note.textContent = t("contextFull");
  msg.appendChild(note);
  els.input.disabled = true;
  refreshSend();
  setStatus("err", t("statusContextFull"));
  scrollDown();
}

function clearThread() {
  if (isGenerating) return;
  messages = [];
  chat?.reset();
  contextExhausted = false;
  els.thread.replaceChildren();
  els.input.disabled = false;
  els.input.placeholder = I18N[mode].placeholder;
  setStatus(loadState === "ready" ? "ok" : "idle", loadState === "ready" ? t("statusReady") : t("statusIdle"));
  refreshSend();
  els.input.focus();
}

init();
