const {app, BrowserWindow, globalShortcut, Tray} = require('electron');
const fs = require('fs');
const fse = require('fs-extra');

const {ipcMain} = require('electron');

let settings = require('./js/settings.js');

let log = require('electron-log');

let videoConferenceWin;

let lastWhisperClientUID;

// ThumbarButtons
let thumbarButtonInput = {
  tooltip: 'Mute microphone',
  icon: __dirname + '/img/thumbar/microphone.png',
  click () { mainWin.webContents.send('request-toggleMuteInput') }
}

let thumbarButtonOutput = {
  tooltip: 'Mute speakers',
  icon: __dirname + '/img/thumbar/speakers.png',
  click () { mainWin.webContents.send('request-toggleMuteOutput') }
}

let thumbarButtonMutedInput = {
  tooltip: 'Unmute microphone',
  icon: __dirname + '/img/thumbar/microphone_muted.png',
  click () { mainWin.webContents.send('request-toggleMuteInput') }
}

let thumbarButtonMutedOutput = {
  tooltip: 'Unmute speakers',
  icon: __dirname + '/img/thumbar/speakers_muted.png',
  click () { mainWin.webContents.send('request-toggleMuteOutput') }
}

ipcMain.on('request-thumbar-input-output', (event, arg) => {
  mainWin.setThumbarButtons([
    thumbarButtonOutput,
    thumbarButtonInput
  ]);
});
ipcMain.on('request-thumbar-minput-output', (event, arg) => {
  mainWin.setThumbarButtons([
    thumbarButtonOutput,
    thumbarButtonMutedInput
  ]);
});
ipcMain.on('request-thumbar-input-moutput', (event, arg) => {
  mainWin.setThumbarButtons([
    thumbarButtonMutedOutput,
    thumbarButtonInput
  ]);
});
ipcMain.on('request-thumbar-minput-moutput', (event, arg) => {
  mainWin.setThumbarButtons([
    thumbarButtonMutedOutput,
    thumbarButtonMutedInput
  ]);
});

// Logging
// Log level
log.transports.console.level = 'info';
// log.transports.file.level = 'info';

log.transports.console.format = '{y}-{m}-{d} {h}:{i}:{s}:{ms}|{level}|{text}';
// log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}:{ms}|{level}|{text}';

// Set approximate maximum log size in bytes. When it exceeds,
// the archived log will be saved as the log.old.log file
// log.transports.file.maxSize = 5 * 1024 * 1024;

// Write to this file, must be set before first logging
// log.transports.file.file = __dirname + '/log.txt';

// fs.createWriteStream options, must be set before first logging
// you can find more information at
// https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
// log.transports.file.streamConfig = { flags: 'w' };

const electronSettings = require('electron-settings');
const settingsPath = app.getPath('userData') + '\\Settings';

electronSettings.setPath(settingsPath);

settings.settingsPath_value.set(settingsPath);

// Check if settings file exists, else create it
var settingsFile = settingsPath;

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
  log.info('App ready');
  // Create the main window
  // createMainWindow();
  createVideoConferenceWindow()

  // registerKeyboardShortcuts();
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
    // createMainWindow()
    createVideoConferenceWindow()
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
    log.info(settingsFile);
    if (electronSettings.has(settingsHostname)) {
      mainWin.show();

      // console.log('=========' + mainWin.setThumbarButtons([
      //   thumbarButtonOutput,
      //   thumbarButtonInput
      // ]));

      mainWin.setThumbarButtons([
        thumbarButtonOutput,
        thumbarButtonInput
      ]);
    }
  })

  mainWin.once('focus', () => mainWin.flashFrame(false))
}

function createVideoConferenceWindow () {
  // Create the browser window.
  videoConferenceWin = new BrowserWindow({
    frame: false,
    width: 960,
    height: 600,
    minHeight: 300,
    minWidth: 769,
    backgroundColor: '#282828',
    show: false
  })

  // and load the index.html of the app.
  videoConferenceWin.loadFile('app/video-conf-jitsi.html')

  // Open the DevTools.
  // videoConferenceWin.webContents.openDevTools();
  // videoConferenceWin.webContents.on("devtools-opened", () => {
  //   videoConferenceWin.webContents.closeDevTools();
  // }); 

  // Emitted when the window is closed.
  videoConferenceWin.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    videoConferenceWin = null
  })

  // This method will be called when electron has finished creating
  // the window. Now we can show it, this is done to avoid flashing
  // or elements loading in visually.
  videoConferenceWin.on('ready-to-show', () => {
    videoConferenceWin.show();
  })
}

function update() {
  // Disconnect client
  mainWin.webContents.send('request-stop-connection');

  // Initiate batch file (updater)
  var updateBatchPath = require("path").resolve(__dirname + '/../update.bat');
  const {shell} = require('electron');
  shell.openItem(updateBatchPath);

  // Batch file should terminate existing mancave process
  // To be sure we initiate termination here as well.

  if (videoConferenceWin != null) {
    videoConferenceWin.close();
  }

  mainWin.close();
}

if (process.env.ELECTRON_ENV == 'dev') {
  log.info('Running in development');
} else { // ELECTRON_ENV == 'prod'
  log.info('Running in production');

  // Set listener for update request  
  ipcMain.on('request-update', (event, arg) => {
    event.sender.send('request-update-response', 'Request for update received');

    var updateAvailable = false;

    // Check for available updates (git fetch | git status) with batch file
    var updateCheckBatchPath = require("path").resolve(__dirname + '/../updateCheck.bat');
    
    const spawn = require('child_process').spawn;
    const bat = spawn('cmd.exe', ['/c', updateCheckBatchPath]);

    // Handle normal output
    bat.stdout.on('data', (data) => {
      // As said before, convert the Uint8Array to a readable string.
      var str = String.fromCharCode.apply(null, data);
      log.info(str);

      if (str.includes('branch is behind')) {
        // Update available
        log.info('Update available');
        updateAvailable = true;
      }
    });

    // Handle error output
    bat.stderr.on('data', (data) => {
      // As said before, convert the Uint8Array to a readable string.
      var str = String.fromCharCode.apply(null, data);
      console.error(str);
    });

    // Handle on exit event
    bat.on('exit', (code) => {
      var preText = `Child (updateCheck.bat) exited with code ${code} : `;

      switch(code){
          case 0:
              log.info(preText+'Something unknown happened executing the batch.');
              break;
          case 1:
              log.info(preText+'Success');

              // If updates available prompt to update
              if (updateAvailable) {
                // Prompt

                // Prompt accepted
                update();

                // Prompt rejected
                  // Close prompt and do nothing
              }

              break;
      }
    });

  });
}

// Set listener for video conference request  
ipcMain.on('request-video-conference', (event, arg) => {
  event.sender.send('request-video-conference-response', 'Request for video conference received');

  if (videoConferenceWin == null) {
    createVideoConferenceWindow();
  }
  else {
    videoConferenceWin.focus();
  }
});

// Set listener for last whisper target  
ipcMain.on('request-set-last-whisper-target', (event, targetUID) => {
  lastWhisperClientUID = targetUID;
});

// Set listener for window focus request
ipcMain.on('request-window-focus', (event, arg) => {
  mainWin.setAlwaysOnTop(true);
  mainWin.focus();
  mainWin.setAlwaysOnTop(false);
});

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

      if (videoConferenceWin != null) {
        videoConferenceWin.webContents.openDevTools();
      }

    })
  
    if (ret && globalShortcut.isRegistered(acceleratorOpenDevTools)) {
      log.info('registration successfull ( ' + acceleratorOpenDevTools + ')');
    }
    else {
      log.info('registration failed ( ' + acceleratorOpenDevTools + ')')
    }
  }


  /**
   * Whisperlist
   * Initialize all hotkeys for configured whisperlist
   */
  var whisperlist = settings.whisperlist_value.get();
  for (let i = 0; i < whisperlist.length; i++) {
    const whisper = whisperlist[i];

    const acceleratorWhisper = whisper.accelerator;
    if (acceleratorWhisper != '') {
      // Register ToggleMuteInput shortcut listener.
      const ret = globalShortcut.register(acceleratorWhisper, () => {
        log.info(acceleratorWhisper + ' is pressed');
        
        if (lastWhisperClientUID == whisper.clientUID) {
          // Call function to clear whisperlist
          mainWin.webContents.send('request-clear-whisperlist');

          lastWhisperClientUID = null;
        }
        else {
          // Call function to clear whisperlist
          mainWin.webContents.send('request-set-whisperlist', whisper.clientUID);
        }
      })
    
      if (ret && globalShortcut.isRegistered(acceleratorWhisper)) {
        log.info('registration successfull ( ' + acceleratorWhisper + ')');
      }
      else {
        log.info('registration failed ( ' + acceleratorWhisper + ')')
      }
    }
  }

}
