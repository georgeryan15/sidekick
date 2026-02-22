const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { exec } = require("child_process");

const isDev = !app.isPackaged;

let mainWindow = null;
let overlayWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

function createOverlayWindow() {
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 500,
    height: 52,
    x: Math.round((screenWidth - 500) / 2),
    y: screenHeight - 52 - 24,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    overlayWindow.loadURL("http://localhost:5173/#/overlay");
  } else {
    overlayWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"), {
      hash: "/overlay",
    });
  }
}

// IPC: toggle between main and overlay
ipcMain.handle("overlay:toggle", () => {
  if (!mainWindow || !overlayWindow) return;

  if (mainWindow.isVisible()) {
    mainWindow.hide();
    overlayWindow.show();
  } else {
    overlayWindow.hide();
    mainWindow.show();
  }
});

// IPC: resize overlay (keep bottom-anchored)
ipcMain.handle("overlay:resize", (_event, height) => {
  if (!overlayWindow) return;

  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;

  const newY = screenHeight - height - 24;
  overlayWindow.setBounds({
    x: Math.round((screenWidth - 500) / 2),
    y: newY,
    width: 500,
    height,
  });
});

ipcMain.handle("exec:run", (_event, command) => {
  return new Promise((resolve) => {
    exec(command, { timeout: 30_000, env: { ...process.env } }, (error, stdout, stderr) => {
      if (error) {
        resolve(`Error: ${error.message}\n${stderr}`.trim());
        return;
      }
      resolve(stdout || stderr || "(no output)");
    });
  });
});

// IPC: capture accessibility snapshot of current screen state
ipcMain.handle("screen:capture-context", () => {
  const screengrabsDir = path.join(__dirname, "..", "screengrabs");
  if (!fs.existsSync(screengrabsDir)) {
    fs.mkdirSync(screengrabsDir, { recursive: true });
  }

  // Use JXA (JavaScript for Automation) - avoids AppleScript quoting hell
  const script = `
var se = Application("System Events");
se.includeStandardAdditions = true;

var frontApp = se.applicationProcesses.whose({frontmost: true})[0];
var appName = frontApp.name();
var appBundle = frontApp.bundleIdentifier();

var winTitle = "";
try { winTitle = frontApp.windows[0].name(); } catch(e) {}

var focusedRole = "";
var focusedValue = "";
var focusedDesc = "";
try {
  var fel = frontApp.focusedUIElement();
  focusedRole = fel.role();
  try { focusedValue = String(fel.value()); } catch(e) {}
  try { focusedDesc = fel.description(); } catch(e) {}
} catch(e) {}

var selectedText = "";
try {
  var fel2 = frontApp.focusedUIElement();
  selectedText = fel2.attributes.byName("AXSelectedText").value();
} catch(e) {}

var browserURL = "";
if (appName === "Safari") {
  try { browserURL = Application("Safari").documents[0].url(); } catch(e) {}
} else if (appName === "Google Chrome") {
  try { browserURL = Application("Google Chrome").windows[0].activeTab.url(); } catch(e) {}
} else if (appName === "Arc") {
  try { browserURL = Application("Arc").windows[0].activeTab.url(); } catch(e) {}
}

// Walk the AX tree of the focused window to extract visible text
// Depth-limited to avoid hanging on complex UIs
function extractText(el, depth, maxDepth) {
  if (depth > maxDepth) return [];
  var texts = [];
  try {
    var role = el.role();
    var val = "";
    try { val = String(el.value()); } catch(e) {}
    var title = "";
    try { title = el.title(); } catch(e) {}
    var desc = "";
    try { desc = el.description(); } catch(e) {}

    // Collect meaningful text from this element
    var roleStr = role || "";
    if (val && val !== "undefined" && val !== "null" && val.length > 0) {
      // For text areas / text fields, grab the value (this is the main content)
      if (roleStr === "AXTextArea" || roleStr === "AXTextField" || roleStr === "AXStaticText") {
        // Truncate very long values but keep enough to be useful
        var trimmed = val.length > 5000 ? val.substring(val.length - 5000) : val;
        texts.push({ role: roleStr, text: trimmed });
      }
    }
    if (title && title !== val) {
      texts.push({ role: roleStr, title: title });
    }
    // Only include descriptions for non-text roles (buttons, menus, etc.)
    if (desc && desc !== val && desc !== title && roleStr !== "AXStaticText") {
      texts.push({ role: roleStr, description: desc });
    }

    // Recurse into children
    try {
      var children = el.uiElements();
      for (var i = 0; i < children.length; i++) {
        var childTexts = extractText(children[i], depth + 1, maxDepth);
        for (var j = 0; j < childTexts.length; j++) {
          texts.push(childTexts[j]);
        }
        // Cap total items to prevent runaway
        if (texts.length > 500) break;
      }
    } catch(e) {}
  } catch(e) {}
  return texts;
}

var windowContent = [];
try {
  var win = frontApp.windows[0];
  windowContent = extractText(win, 0, 6);
} catch(e) {}

var visibleWindows = [];
var procs = se.applicationProcesses.whose({visible: true})();
for (var i = 0; i < procs.length; i++) {
  var procName = procs[i].name();
  try {
    var wins = procs[i].windows();
    for (var j = 0; j < wins.length; j++) {
      visibleWindows.push(procName + " | " + wins[j].name());
    }
  } catch(e) {}
}

JSON.stringify({
  frontmostApp: appName,
  bundleId: appBundle,
  windowTitle: winTitle,
  focusedElement: { role: focusedRole, value: focusedValue, description: focusedDesc },
  selectedText: selectedText,
  browserURL: browserURL,
  windowContent: windowContent,
  visibleWindows: visibleWindows
});
`;

  const tmpFile = path.join(os.tmpdir(), `sidekick-screen-${Date.now()}.js`);
  fs.writeFileSync(tmpFile, script);

  return new Promise((resolve) => {
    exec(
      `osascript -l JavaScript "${tmpFile}"`,
      { timeout: 15_000 },
      (error, stdout, stderr) => {
        // Clean up temp file
        try { fs.unlinkSync(tmpFile); } catch {}

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `context-${timestamp}.json`;
        const filepath = path.join(screengrabsDir, filename);

        if (error) {
          const errorData = {
            error: error.message,
            stderr: stderr,
            timestamp: new Date().toISOString(),
          };
          fs.writeFileSync(filepath, JSON.stringify(errorData, null, 2));
          resolve({ success: false, file: filename, data: errorData });
          return;
        }

        try {
          const raw = stdout.trim();
          const data = JSON.parse(raw);
          data.timestamp = new Date().toISOString();
          fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
          resolve({ success: true, file: filename, data });
        } catch (parseErr) {
          // Save raw output if JSON parse fails
          const fallback = {
            raw: stdout.trim(),
            parseError: parseErr.message,
            timestamp: new Date().toISOString(),
          };
          fs.writeFileSync(filepath, JSON.stringify(fallback, null, 2));
          resolve({ success: false, file: filename, data: fallback });
        }
      }
    );
  });
});

app.whenReady().then(() => {
  createWindow();
  createOverlayWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
