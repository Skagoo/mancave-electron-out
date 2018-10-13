const {app, BrowserWindow, globalShortcut} = require('electron');
const fs = require('fs');
const fse = require('fs-extra');

const {ipcMain} = require('electron');

let settings = require('./js/settings.js');

let log = require('electron-log');

// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};

// Logging
// Log level
log.transports.console.level = 'info';
log.transports.file.level = 'info';

log.transports.console.format = '{y}-{m}-{d} {h}:{i}:{s}:{ms}|{level}|{text}';
log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}:{ms}|{level}|{text}';

// Set approximate maximum log size in bytes. When it exceeds,
// the archived log will be saved as the log.old.log file
log.transports.file.maxSize = 5 * 1024 * 1024;

// Write to this file, must be set before first logging
log.transports.file.file = __dirname + '/log.txt';

// fs.createWriteStream options, must be set before first logging
// you can find more information at
// https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
log.transports.file.streamConfig = { flags: 'w' };

// set existed file stream
log.transports.file.stream = fs.createWriteStream('log.txt');



import getPath from 'platform-folders';
const electronSettings = require('electron-settings');
electronSettings.setPath(getPath('userData') + '\\..\\Local\\ManCave\\settings.json');

// Check if settings file exists, else create it
var settingsFile = getPath('userData') + '\\..\\Local\\ManCave\\settings.json';

if (!fs.existsSync(settingsFile)) {
  fse.outputFileSync(settingsFile, '{}');
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWin;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // Create the main window
  createMainWindow();

  registerKeyboardShortcuts();
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWin === null) {
    createMainWindow()
  }
})

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
})

function createMainWindow () {
  // Create the browser window.
  mainWin = new BrowserWindow({
    frame: false,
    width: 960,
    height: 600,
    minHeight: 300,
    minWidth: 769,
    backgroundColor: '#282828',
    show: false
  })

  // and load the index.html of the app.
  mainWin.loadFile('app/index.html')

  // Open the DevTools.
  // mainWin.webContents.openDevTools();
  // win.webContents.on("devtools-opened", () => {
  //   win.webContents.closeDevTools();
  // }); 

  // Emitted when the window is closed.
  mainWin.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWin = null
  })

  // This method will be called when electron has finished creating
  // the window. Now we can show it, this is done to avoid flashing
  // or elements loading in visually.
  mainWin.on('ready-to-show', () => {
    var settingsHostname = 'connection.hostname';
    if (electronSettings.has(settingsHostname)) {
      mainWin.show();
    }
  })
}

if (process.env.ELECTRON_ENV == 'dev') {
  log.info('Running in development');
} else { // ELECTRON_ENV == 'prod'
  log.info('Running in production');

  // Set listener for update request  
  ipcMain.on('request-update', (event, arg) => {
    event.sender.send('request-update-response', 'Request for update received');
  });
}

// Hotkeys
function registerKeyboardShortcuts() {
  /**
   * Hotkey - ToggleMuteInput
   * Mutes or unmutes the input device based on the current state.
   */
  var acceleratorToggleMuteInput = settings.hotkeyToggleMuteInput_value.get();
  if (acceleratorToggleMuteInput != '') {
    // Register ToggleMuteInput shortcut listener.
    const ret = globalShortcut.register(acceleratorToggleMuteInput, () => {
      log.info(acceleratorToggleMuteInput + ' is pressed');

      // Call function to toggle mute input
      mainWin.webContents.send('request-toggleMuteInput');
    })
  
    if (ret && globalShortcut.isRegistered(acceleratorToggleMuteInput)) {
      log.info('registration successfull ( ' + acceleratorToggleMuteInput + ')');
    }
    else {
      log.info('registration failed ( ' + acceleratorToggleMuteInput + ')')
    }
  }


  /**
   * Hotkey - ToggleMuteOutput
   * Mutes or unmutes the output device based on the current state.
   */
  var acceleratorToggleMuteOutput = settings.hotkeyToggleMuteOutput_value.get();
  if (acceleratorToggleMuteOutput != '') {
    // Register ToggleMuteOutput shortcut listener.
    const ret = globalShortcut.register(acceleratorToggleMuteOutput, () => {
      log.info(acceleratorToggleMuteOutput + ' is pressed');

      // Call function to toggle mute output
      mainWin.webContents.send('request-toggleMuteOutput');
    })
  
    if (ret && globalShortcut.isRegistered(acceleratorToggleMuteOutput)) {
      log.info('registration successfull ( ' + acceleratorToggleMuteOutput + ')');
    }
    else {
      log.info('registration failed ( ' + acceleratorToggleMuteOutput + ')')
    }
  }


  /**
   * Hotkey - OpenDevTools
   * Opens the chrome dev tools.
   */
  var acceleratorOpenDevTools = settings.hotkeyOpenDevTools_value.get();
  if (acceleratorOpenDevTools != '') {
    // Register OpenDevTools shortcut listener.
    const ret = globalShortcut.register(acceleratorOpenDevTools, () => {
      log.info(acceleratorOpenDevTools + ' is pressed');

      // Open the DevTools.
      mainWin.webContents.openDevTools();
    })
  
    if (ret && globalShortcut.isRegistered(acceleratorOpenDevTools)) {
      log.info('registration successfull ( ' + acceleratorOpenDevTools + ')');
    }
    else {
      log.info('registration failed ( ' + acceleratorOpenDevTools + ')')
    }
  }
}
