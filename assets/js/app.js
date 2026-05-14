import { manifest as BUNDLED_MANIFEST } from "../manifest/projects.manifest.js";

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
const PRISM_SCRIPT_ID = "prism-core";
const PRISM_CSS_ID = "prism-theme";

const state = {
  manifest: null,
  currentProject: null,
  prismLoaded: false,
};

// Terminal worker state
let terminalWorker = null;
let metaBuffer = null;
let dataBuffer = null;
let metaView = null;
let dataView = null;

const projectGrid = document.querySelector("#projectGrid");
const emptyState = document.querySelector("#emptyState");

const terminalOverlay = document.querySelector("#terminalOverlay");
const terminalTitle = document.querySelector("#terminalTitle");
const terminalOutput = document.querySelector("#terminalOutput");
const terminalInputRow = document.querySelector("#terminalInputRow");
const terminalInputField = document.querySelector("#terminalInputField");
const terminalSendBtn = document.querySelector("#terminalSendBtn");
const terminalStatus = document.querySelector("#terminalStatus");
const terminalHint = document.querySelector("#terminalHint");
const runBtn = document.querySelector("#runBtn");
const abortBtn = document.querySelector("#abortBtn");

const codeOverlay = document.querySelector("#codeOverlay");
const codeTitle = document.querySelector("#codeTitle");
const codeMeta = document.querySelector("#codeMeta");
const codeViewer = document.querySelector("#codeViewer");

init().catch((error) => {
  console.error(error);
  showFatalError("Unable to initialize showcase. Check manifest and network access.");
});

async function init() {
  state.manifest = BUNDLED_MANIFEST;
  renderProjectCards(BUNDLED_MANIFEST.projects || []);
  wireGlobalEvents();
}

function renderProjectCards(projects) {
  projectGrid.innerHTML = "";

  if (!projects.length) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  for (const project of projects) {
    const article = document.createElement("article");
    article.className = "project-card";

    const tags = (project.tags || [])
      .map((tag) => `<span class="meta-pill">${escapeHtml(tag)}</span>`)
      .join("");

    article.innerHTML = `
      <div class="card-head">
        <h3 class="card-title">${escapeHtml(project.title)}</h3>
        <span class="chip">${escapeHtml(project.status)}</span>
      </div>
      <p class="card-summary">${escapeHtml(project.summary)}</p>
      <div class="card-meta">
        <span class="meta-pill">${escapeHtml(project.runtimeMode)}</span>
        <span class="meta-pill">${escapeHtml(String(project.year || "n/a"))}</span>
        ${tags}
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn-primary" data-action="run" data-id="${escapeHtml(project.id)}">Open Terminal</button>
        <button type="button" class="btn" data-action="view" data-id="${escapeHtml(project.id)}">Look at main.py</button>
      </div>
    `;

    projectGrid.append(article);
  }

  projectGrid.addEventListener("click", onProjectGridClick);
}

async function onProjectGridClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const project = (state.manifest.projects || []).find((item) => item.id === button.dataset.id);
  if (!project) {
    return;
  }

  if (button.dataset.action === "run") {
    openTerminalOverlay(project);
    return;
  }

  if (button.dataset.action === "view") {
    await openCodeOverlay(project);
  }
}

function openTerminalOverlay(project) {
  state.currentProject = project;
  terminalTitle.textContent = `${project.title} — Terminal`;
  resetTerminalUI();
  openOverlay(terminalOverlay);
}

function resetTerminalUI() {
  terminalOutput.textContent = "Click \u25b6 Run Game to start the script.\n";
  terminalInputRow.hidden = true;
  terminalInputField.value = "";
  runBtn.hidden = false;
  runBtn.textContent = "\u25b6 Run Game";
  abortBtn.hidden = true;
  terminalHint.textContent = "Inputs appear here as the script runs.";
  setTerminalStatus("Ready");
}

async function openCodeOverlay(project) {
  const scriptPath = getScriptPath(project);
  codeTitle.textContent = `${project.title} - main.py`;
  codeMeta.textContent = scriptPath;
  codeViewer.textContent = "Loading source...";
  openOverlay(codeOverlay);

  try {
    await ensurePrismAssets();
    const source = await fetchText(scriptPath);
    codeViewer.textContent = source;
    if (window.Prism) {
      window.Prism.highlightElement(codeViewer);
    }
  } catch (error) {
    console.error(error);
    codeViewer.textContent = "Unable to load script source.";
  }
}

function wireGlobalEvents() {
  runBtn.addEventListener("click", onRunBtn);
  abortBtn.addEventListener("click", onAbortBtn);
  terminalSendBtn.addEventListener("click", onSendInput);
  terminalInputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSendInput();
    }
  });

  document.querySelectorAll(".close-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const overlay = document.getElementById(button.dataset.close);
      closeOverlay(overlay);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeOverlay(terminalOverlay);
      closeOverlay(codeOverlay);
    }
  });

  [terminalOverlay, codeOverlay].forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeOverlay(overlay);
    });
  });
}

async function onRunBtn() {
  if (!state.currentProject) return;

  if (typeof SharedArrayBuffer === "undefined") {
    const protocol = window.location.protocol;
    const isIsolated = window.crossOriginIsolated;

    if (protocol === "file:") {
      appendTerminal(
        "[error] SharedArrayBuffer is not available.\n" +
          "Open the site over HTTP, not file://.\n" +
          "Run: python -m http.server 3333  then visit http://127.0.0.1:3333\n"
      );
    } else {
      appendTerminal(
        "[error] SharedArrayBuffer is not available on this page yet.\n" +
          `Current page: ${window.location.origin}${window.location.pathname}\n` +
          `crossOriginIsolated: ${String(isIsolated)}\n` +
          "Reload once after the COI service worker installs.\n" +
          "If it still fails, close the tab and reopen http://127.0.0.1:3333\n"
      );
    }
    return;
  }

  runBtn.hidden = true;
  abortBtn.hidden = false;
  terminalOutput.textContent = "";
  setTerminalStatus("Fetching script\u2026");

  let script;
  try {
    script = await fetchText(getScriptPath(state.currentProject));
  } catch (err) {
    appendTerminal(`[error] ${err.message}\n`);
    runBtn.hidden = false;
    abortBtn.hidden = true;
    setTerminalStatus("Error");
    return;
  }

  startWorkerRun(script);
}

function startWorkerRun(script) {
  if (terminalWorker) {
    terminalWorker.terminate();
    terminalWorker = null;
  }

  metaBuffer = new SharedArrayBuffer(4);
  dataBuffer = new SharedArrayBuffer(4096);
  metaView = new Int32Array(metaBuffer);
  dataView = new Uint8Array(dataBuffer);

  terminalWorker = new Worker("assets/js/terminal-worker.js");
  terminalWorker.onmessage = ({ data }) => handleWorkerMessage(data, script);
  terminalWorker.onerror = (e) => {
    appendTerminal(`[worker error] ${e.message}\n`);
    setTerminalStatus("Error");
    terminalInputRow.hidden = true;
    runBtn.hidden = false;
    runBtn.textContent = "\u25b6 Run Again";
    abortBtn.hidden = true;
  };

  terminalWorker.postMessage({ type: "init", metaBuffer, dataBuffer });
  setTerminalStatus("Loading Python runtime\u2026");
  appendTerminal("[loading python\u2026]\n");
}

function handleWorkerMessage(data, script) {
  switch (data.type) {
    case "status":
      setTerminalStatus(data.text);
      break;
    case "stdout":
      appendTerminal(data.text + "\n");
      break;
    case "stderr":
      appendTerminal(data.text + "\n");
      break;
    case "ready":
      setTerminalStatus("Running\u2026");
      appendTerminal("[python ready \u2014 starting]\n\n");
      terminalWorker.postMessage({ type: "run", script });
      break;
    case "need_input":
      if (data.prompt) appendTerminal(data.prompt);
      setTerminalStatus("Waiting for input\u2026");
      terminalInputRow.hidden = false;
      terminalInputField.focus();
      break;
    case "done":
      terminalInputRow.hidden = true;
      setTerminalStatus("Done");
      appendTerminal("\n[script finished]");
      runBtn.hidden = false;
      runBtn.textContent = "\u25b6 Run Again";
      abortBtn.hidden = true;
      terminalHint.textContent = "Script finished. Click Run Again to play.";
      break;
    case "error":
      terminalInputRow.hidden = true;
      setTerminalStatus("Error");
      appendTerminal(`\n[error] ${data.message}`);
      runBtn.hidden = false;
      runBtn.textContent = "\u25b6 Run Again";
      abortBtn.hidden = true;
      break;
  }
}

function onSendInput() {
  const value = terminalInputField.value;
  // Allow empty string and "0" as valid inputs
  if (value === "" && terminalInputField.placeholder !== "type then press Enter\u2026") return;
  terminalInputField.value = "";
  terminalInputRow.hidden = true;
  setTerminalStatus("Running\u2026");
  appendTerminal(value + "\n");
  deliverInput(value);
}

function deliverInput(text) {
  const encoded = new TextEncoder().encode(text + "\n");
  dataView.set(encoded);
  Atomics.store(metaView, 0, encoded.length);
  Atomics.notify(metaView, 0, 1);
}

function onAbortBtn() {
  if (terminalWorker) {
    terminalWorker.terminate();
    terminalWorker = null;
  }
  if (metaView) Atomics.store(metaView, 0, 0);
  appendTerminal("\n[aborted]\n");
  terminalInputRow.hidden = true;
  setTerminalStatus("Aborted");
  runBtn.hidden = false;
  runBtn.textContent = "\u25b6 Run Game";
  abortBtn.hidden = true;
  terminalHint.textContent = "Click Run Game to start again.";
}

async function ensurePrismAssets() {
  if (state.prismLoaded) {
    return;
  }

  if (!document.getElementById(PRISM_CSS_ID)) {
    const link = document.createElement("link");
    link.id = PRISM_CSS_ID;
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css";
    document.head.append(link);
  }

  await ensureScript("https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js", PRISM_SCRIPT_ID);
  await ensureScript("https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-python.min.js", "prism-python");
  state.prismLoaded = true;
}

function appendTerminal(text) {
  if (text == null) return;
  terminalOutput.textContent += String(text);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function setTerminalStatus(text) {
  terminalStatus.textContent = text;
}

function openOverlay(overlay) {
  overlay.hidden = false;
  overlay.setAttribute("aria-hidden", "false");
}

function closeOverlay(overlay) {
  if (!overlay) return;
  if (overlay === terminalOverlay && terminalWorker) {
    terminalWorker.terminate();
    terminalWorker = null;
  }
  overlay.hidden = true;
  overlay.setAttribute("aria-hidden", "true");
}

function getScriptPath(project) {
  return project?.entry?.scriptLocation || project?.entry?.scriptPath || "";
}

function showFatalError(message) {
  emptyState.hidden = false;
  emptyState.textContent = message;
}

async function fetchText(url) {
  if (location.protocol === "file:") {
    throw new Error(
      "Script source cannot be loaded from a local file:// URL. " +
      "Serve the site with a local HTTP server (e.g. python -m http.server) to use code viewer and runtime."
    );
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load file: ${url}`);
  }
  return response.text();
}

function ensureScript(src, id) {
  const existing = id ? document.getElementById(id) : null;
  if (existing) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    if (id) {
      script.id = id;
    }
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed loading script ${src}`));
    document.head.append(script);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
