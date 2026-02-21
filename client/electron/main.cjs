const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");
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
