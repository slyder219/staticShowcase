// assets/js/terminal-worker.js
// Runs Pyodide in a Web Worker with fully interactive, blocking stdin
// implemented via SharedArrayBuffer + Atomics so Python's input() truly pauses
// and waits for the user to type — no pre-queuing needed.

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";

let metaView = null; // Int32Array(1) over metaBuffer: [0] = byte count ready (0 = none)
let dataView = null; // Uint8Array over dataBuffer: holds the UTF-8 input bytes

let pyodide = null;
let pendingScript = null;

const IMPORT_PACKAGE_MAP = {
  pandas: "pandas",
  numpy: "numpy",
};

// Called synchronously from Python's patched input().
// Blocks the worker thread until the main thread deposits data.
function blockingReadline(prompt) {
  // Tell the main thread we need input (and what the prompt text is)
  self.postMessage({ type: "need_input", prompt: String(prompt ?? "") });

  // Atomics.wait blocks the worker (not the main thread) until metaView[0] != 0
  Atomics.wait(metaView, 0, 0);

  const length = Atomics.load(metaView, 0);
  const text = new TextDecoder().decode(dataView.slice(0, length));

  // Reset so the next readline call starts clean
  Atomics.store(metaView, 0, 0);

  return text; // includes trailing \n; Python's input() strips it
}

async function boot() {
  try {
    self.postMessage({ type: "status", text: "loading python" });

    importScripts(PYODIDE_CDN + "pyodide.js");

    pyodide = await loadPyodide({
      indexURL: PYODIDE_CDN,
      stdout: (text) => self.postMessage({ type: "stdout", text }),
      stderr: (text) => self.postMessage({ type: "stderr", text }),
    });

    // Expose our blocking JS function to Python via pyodide.globals so it is
    // accessible as a Python global (no `from js import` needed).
    pyodide.globals.set("_js_readline", blockingReadline);

    // Patch builtins.input to use our blocking readline
    pyodide.runPython(`
import builtins

def _interactive_input(prompt=""):
    result = _js_readline(str(prompt) if prompt else "")
    return str(result).rstrip("\\n")

builtins.input = _interactive_input
`);

    self.postMessage({ type: "ready" });

    if (pendingScript) {
      runScript(pendingScript);
      pendingScript = null;
    }
  } catch (err) {
    self.postMessage({ type: "error", message: String(err?.message ?? err) });
  }
}

function detectRequiredPackages(script) {
  const packages = new Set();
  const lines = String(script || "").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    let match = line.match(/^import\s+([^#]+)/);
    if (match) {
      for (const chunk of match[1].split(",")) {
        const moduleName = chunk.trim().split(/\s+as\s+/i)[0]?.split(".")[0];
        const pkg = IMPORT_PACKAGE_MAP[moduleName];
        if (pkg) packages.add(pkg);
      }
      continue;
    }

    match = line.match(/^from\s+([A-Za-z0-9_.]+)\s+import\s+/);
    if (match) {
      const moduleName = match[1].split(".")[0];
      const pkg = IMPORT_PACKAGE_MAP[moduleName];
      if (pkg) packages.add(pkg);
    }
  }

  return [...packages];
}

async function ensurePackagesForScript(script) {
  const packages = detectRequiredPackages(script);
  if (!packages.length) {
    return;
  }

  self.postMessage({ type: "status", text: `loading packages: ${packages.join(", ")}` });
  await pyodide.loadPackage(packages);
}

async function stageProjectAssets(script) {
  const text = String(script || "");

  // GymDataParsing expects assets/gymdata.txt as a local fallback path.
  if (!text.includes("gymdata.txt")) {
    return;
  }

  try {
    const candidateUrls = [
      new URL("../gymdata.txt", self.location.href).toString(),
      new URL("/assets/gymdata.txt", self.location.origin).toString(),
    ];

    let raw = null;
    for (const assetUrl of candidateUrls) {
      const response = await fetch(assetUrl, { cache: "no-store" });
      if (response.ok) {
        raw = await response.text();
        break;
      }
    }

    if (raw == null) {
      return;
    }

    try {
      pyodide.FS.mkdirTree("/assets");
    } catch (_err) {
      // Directory already exists; ignore.
    }

    try {
      pyodide.FS.mkdirTree("/home/pyodide/assets");
    } catch (_err) {
      // Directory already exists; ignore.
    }

    pyodide.FS.writeFile("/assets/gymdata.txt", raw, { encoding: "utf8" });
    pyodide.FS.writeFile("/home/pyodide/assets/gymdata.txt", raw, { encoding: "utf8" });
  } catch (_err) {
    // Keep runtime resilient; script fallback paths can still run.
  }
}

function getMissingTopLevelModule(errorMessage) {
  const match = String(errorMessage || "").match(/No module named ['\"]([^'\"]+)['\"]/);
  if (!match) {
    return null;
  }
  return match[1].split(".")[0];
}

async function runScript(script) {
  try {
    await ensurePackagesForScript(script);
    await stageProjectAssets(script);
    pyodide.runPython(script);
    self.postMessage({ type: "done" });
  } catch (err) {
    const message = String(err?.message ?? err);
    const missingModule = getMissingTopLevelModule(message);
    const fallbackPackage = IMPORT_PACKAGE_MAP[missingModule];

    if (fallbackPackage) {
      try {
        self.postMessage({ type: "status", text: `loading missing package: ${fallbackPackage}` });
        await pyodide.loadPackage([fallbackPackage]);
        pyodide.runPython(script);
        self.postMessage({ type: "done" });
        return;
      } catch (retryErr) {
        self.postMessage({ type: "error", message: String(retryErr?.message ?? retryErr) });
        return;
      }
    }

    // Surface the error but don't crash the worker
    self.postMessage({ type: "error", message });
  }
}

self.onmessage = ({ data }) => {
  switch (data.type) {
    case "init":
      metaView = new Int32Array(data.metaBuffer);
      dataView = new Uint8Array(data.dataBuffer);
      boot();
      break;

    case "run":
      if (!pyodide) {
        // Still booting — queue it
        pendingScript = data.script;
      } else {
        runScript(data.script);
      }
      break;
  }
};
