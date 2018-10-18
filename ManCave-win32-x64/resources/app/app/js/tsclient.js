const electron = require('electron');
const remote = require('electron').remote;
const BrowserWindow = remote.BrowserWindow;

const wNumb = require('wnumb');

const path = require('path');

var imgur = require('imgur');

var validUrl = require('valid-url');

global.ts3client = require('node-ts3sdk-client');

let settings = require('./js/settings.js');

global.soundpack = settings.playbackSoundpack_value.get();

var schID;
var selfClientID;
var selfClientUID;
var lastChannel;

var global_selfClientUID;

let connectWin;

var testConnectionInterval;

let lastWhisperClientID;

let ImgFormats = ['jpg', 'png', 'bmp', 'jpeg', 'jif', 'jiff'];

const Tray = remote.Tray;
let tray = new Tray(__dirname + `\\img\\tray\\icon.ico`);
tray.setToolTip('ManCave by Skagoo');


// ============================================================
// ======================== CALLBACKS =========================
// ============================================================

/**
 * Register callback function for 'onConnectStatusChangeEvent'. This will write debug messages to the
 * client log upon connection status updates and kill the process when the connection attempt fails.
 */
ts3client.on('onConnectStatusChangeEvent', function (schID, status, errno) {
	ts3client.logMessage('Connect status changed; new status is: ' + status, ts3client.LogLevel.DEBUG);

	if (status == 0x00) { //DISCONNECTED
	} else if (status == 0x01) { //CONNECTING
		// Set soundpack volume
		setPlaybackSoundpackVolume(settings.playbackSoundpackVolume_value.get());
	} else if (status == 0x04) { //CONNECTED
		showConnectionLostOverlay(false);

		// Apply settings
		setPlaybackMasterVolume(settings.playbackMasterVolume_value.get());
		setPreprocessorDenoise(settings.preprocessorDenoise_value.get());
		setPreprocessorVad(settings.preprocessorVad_value.get());
		setPreprocessorVoiceActivationLevel(settings.preprocessorVoiceActivationLevel_value.get());
		setPreprocessorExtraBufferSize(settings.preprocessorExtraBufferSize_value.get());
		setPreprocessorAgc(settings.preprocessorAgc_value.get());
		setPreprocessorAgcLevel(settings.preprocessorAgcLevel_value.get());
		setPreprocessorAgcMaxGain(settings.preprocessorAgcMaxGain_value.get());
		setPreprocessorEchoCanceling(settings.preprocessorEchoCanceling_value.get());

		// Play soundfile
		ts3client.playWaveFile(schID, __dirname + `\\sound\\${soundpack}\\connected.wav`);

		// Get clientID
		selfClientID = ts3client.getClientID(schID);
		selfClientUID = ts3client.getClientVariableAsString(schID, selfClientID, ts3client.ClientProperties.UNIQUE_IDENTIFIER);
		global_selfClientUID = selfClientUID;

		// Setup channelNav
		function setupChannelNav() {
			$.ajax({
				url:addChannelsToChannelNav(),
				success:function(){
					addClientsToChannelNav();
				 }
			})
		}
		setupChannelNav();	
	}

	if (errno) {
		var error = ts3client.getErrorMessage(errno);

		ts3client.logMessage('Failed to connect: ' + error, ts3client.LogLevel.ERROR);

		if (error == 'Connection lost') {
			// Play soundfile
			ts3client.playWaveFile(schID, __dirname + `\\sound\\${soundpack}\\connection_lost.wav`);

			showConnectionLostOverlay(true);

			// Clear ChannelNav
			channelNav_clear();

			testForInternetConnection();
		}
	}
});

function addChannelsToChannelNav() {
	// Get channel list
	var channelList = ts3client.getChannelList(schID);
	var lastSpacer;
	for (var i = 0; i < channelList.length; i++) {
		var channelName = ts3client.getChannelVariableAsString(schID, channelList[i], ts3client.ChannelProperties.NAME);
		var channelID = channelList[i];

		var channelDisplayText = channelName;

		// Add the channelDisplayText to the channel_tree_view on the appropriate place,
		// based on the type of channel
		if (channelDisplayText.includes('[spacer]')) {
			// Spacer
			channelDisplayText = channelDisplayText.replace('[spacer]', '');
			channelNav_addSpacer(channelID, channelDisplayText);

			lastSpacer = channelDisplayText;
		} else {
			channelNav_addChannel(channelID, channelDisplayText, lastSpacer);
		}
	}

	// Subscribe to all channels
	ts3client.requestChannelSubscribeAll(schID);
}

function addClientsToChannelNav() {
	// Get all clients
	var clientList = ts3client.getClientList(schID);

	for (let index = 0; index < clientList.length; index++) {
		// For each client, check their current channel
		var client = clientList[index];
		var channel = ts3client.getChannelOfClient(schID, client);

		// Get the name of the client
		var nickname = ts3client.getClientVariableAsString(schID, client, ts3client.ClientProperties.NICKNAME);
		// Get the name of the client's channel
		var channelName = ts3client.getChannelVariableAsString(schID, channel, ts3client.ChannelProperties.NAME);

		// Get talk status
		var isTalking = (ts3client.getClientVariableAsString(schID, client, ts3client.ClientProperties.FLAG_TALKING) == ts3client.TalkStatus.TALKING);
		var isWhisper = false;

		// Get mute status
		var isInputMuted = (ts3client.getClientVariableAsString(schID, client, ts3client.ClientProperties.INPUT_MUTED) == ts3client.MuteInputStatus.MUTED);
		var isOutputMuted = (ts3client.getClientVariableAsString(schID, client, ts3client.ClientProperties.OUTPUT_MUTED) == ts3client.MuteOutputStatus.MUTED);

		// Insert the client label under the correct channel
		channelNav_addClient(client, nickname, channelName, channel);

		// Update the client indicator
		channelNav_UpdateClientIndicator(client, nickname, isTalking, isWhisper, isInputMuted, isOutputMuted)

		if (client == selfClientID) {
			// Update the active channel in ChannelNav
			channelNav_setActiveChannel(channelName, channel);

			// Update lastChannel
			lastChannel = channelName;
		}
	}
}

/**
 * Register callback function for 'onNewChannelEvent'. This will write an informational message to the
 * client log for channels announced by the server while connecting.
 */
ts3client.on('onNewChannelEvent', function (schID, channelID, channelPID) {
	try {
		var channelName = ts3client.getChannelVariableAsString(schID, channelID, ts3client.ChannelProperties.NAME);

		ts3client.logMessage('Server announced channel "' + channelName + '" (id:' + channelID + ')');

		// Subscribe to all channels
		ts3client.requestChannelSubscribeAll(schID);
	} catch (err) {
		var error = ts3client.getErrorMessage(errno);

		ts3client.logMessage('Failed to determine channel name: ' + error, ts3client.LogLevel.WARNING);
	}
});

/**
 * Register callback function for 'onNewChannelCreatedEvent'. This will write an informational message to the client log
 * whenever a new channel gets created.
 */
ts3client.on('onNewChannelCreatedEvent', function (schID, channelID, channelPID, invokerID, invokerName, invokerUID) {
	try {
		var channelName = ts3client.getChannelVariableAsString(schID, channelID, ts3client.ChannelProperties.NAME);

		ts3client.logMessage('Client "' + invokerName + '" (id:' + invokerID + ') created channel "' + channelName + '" (id:' + channelID + ')');
	} catch (err) {
		var error = ts3client.getErrorMessage(errno);

		ts3client.logMessage('Failed to determine channel name: ' + error, ts3client.LogLevel.WARNING);
	}
});

/**
 * Register callback function for 'onDelChannelEvent'. This will write an informational message to the client log whenever
 * a channel gets deleted. Note, that we cannot determine the name for channels that are already deleted.
 */
ts3client.on('onDelChannelEvent', function (schID, channelID, invokerID, invokerName, invokerUID) {
	ts3client.logMessage('Client "' + invokerName + '" deleted channel (id:' + channelID + ')');
});

/**
 * Register a callback function for 'onClientMoveEvent'. This will write an informational message to the client log whenever
 * a client gets moved, connects or disconnects.
 */
ts3client.on('onClientMoveEvent', function (schID, clientID, oldChannelID, newChannelID, visibility, moveMessage) {
	if (!oldChannelID) { //CONNECTED
		ts3client.logMessage('Client (id:' + clientID + ') connected');

		// Play soundfile accordingly to the action 
		if (clientID != selfClientID && newChannelID == ts3client.getChannelOfClient(schID, selfClientID)) {
			// Client connected to self
			ts3client.playWaveFile(schID, __dirname + `\\sound\\${soundpack}\\neutral_connection_connected_currentchannel.wav`);
		}

		// Get the name of the new channel
		var channelName = ts3client.getChannelVariableAsString(schID, newChannelID, ts3client.ChannelProperties.NAME);

		// Get the name of the client
		var nickname = ts3client.getClientVariableAsString(schID, clientID, ts3client.ClientProperties.NICKNAME);

		// Update ChannelNav
		channelNav_addClient(clientID, nickname, channelName, newChannelID);
	} else if (!newChannelID) { //DISCONNECTED
		ts3client.logMessage('Client (id:' + clientID + ') disconnected' + (moveMessage ? ' (' + moveMessage + ')' : ''));

		// Play soundfile accordingly to the action 
		if (clientID != selfClientID && oldChannelID == ts3client.getChannelOfClient(schID, selfClientID)) {
			// Client disconnected from self
			ts3client.playWaveFile(schID, __dirname + `\\sound\\${soundpack}\\neutral_connection_disconnected_currentchannel.wav`);
		}

		// Update ChannelNav
		channelNav_deleteClient(clientID);
	} else { //MOVED
		ts3client.logMessage('Client (id:' + clientID + ') switched channels; new channel is ' + newChannelID);

		// Get the name of the new channel
		var channelName = ts3client.getChannelVariableAsString(schID, newChannelID, ts3client.ChannelProperties.NAME);

		if (clientID != selfClientID) { // CLIENT IS NOT SELF
			if (oldChannelID == ts3client.getChannelOfClient(schID, selfClientID)) { // Client moved away from self
				// Play soundfile
				ts3client.playWaveFile(schID, __dirname + `\\sound\\${soundpack}\\neutral_switched_awayfromcurrentchannel.wav`);
			} else if (newChannelID == ts3client.getChannelOfClient(schID, selfClientID)) { // Client moved to self
				// Play soundfile
				ts3client.playWaveFile(schID, __dirname + `\\sound\\${soundpack}\\neutral_switched_tocurrentchannel.wav`);
			}
		} else { // CLIENT IS SELF
			// Play soundfile
			ts3client.playWaveFile(schID, __dirname + `\\sound\\${soundpack}\\channel_switched.wav`);

			// Update the active channel in ChannelNav
			channelNav_setActiveChannel(channelName, newChannelID);

			// Update lastChannel
			lastChannel = channelName;
		}

		// Get the name of the client
		var nickname = ts3client.getClientVariableAsString(schID, clientID, ts3client.ClientProperties.NICKNAME);

		// Update ChannelNav
		channelNav_moveClient(clientID, nickname, channelName, newChannelID);
	}
});

/**
 * Register a callback function for 'onClientMoveTimeoutEvent'. This will write an informational message to the client
 * log for clients announced by the server.
 */
ts3client.on('onClientMoveTimeoutEvent', function (schID, clientID, oldChannelID, newChannelID, visibility, timeoutMessage) {
	ts3client.logMessage('Client (id:' + clientID + ') timed out (' + timeoutMessage + ')');

	if (clientID != selfClientID && oldChannelID == ts3client.getChannelOfClient(schID, selfClientID)) { // Client disconnected from self
		// Play soundfile
		ts3client.playWaveFile(schID, __dirname + `\\sound\\${soundpack}\\neutral_connection_connectionlost_currentchannel.wav`);
	}

	if (clientID != selfClientID) {
		// Update ChannelNav
		channelNav_deleteClient(clientID);
	}
});

/**
 * Register a callback function for 'onClientMoveSubscriptionEvent'. This will write an informational message to the client
 * log for clients announced by the server.
 */
ts3client.on('onClientMoveSubscriptionEvent', function (schID, clientID, oldChannelID, newChannelID, visibility) {
	try {
		var clientName = ts3client.getClientVariableAsString(schID, clientID, ts3client.ClientProperties.NICKNAME);

		ts3client.logMessage('Server announced client "' + clientName + '" (id:' + clientID + ')');
	} catch (err) {
		var error = ts3client.getErrorMessage(errno);

		ts3client.logMessage('Failed to determine client name: ' + error, ts3client.LogLevel.WARNING);
	}
});

/**
 * Register a callback function for 'onTalkStatusChangeEvent'. This will write a debug message to the client log whenever
 * a client starts/stops talking.
 */
ts3client.on('onTalkStatusChangeEvent', function (schID, status, isWhisper, clientID) {
	try {
		ts3client.logMessage('Client (id:' + clientID + ') ' + (status ? 'started' : 'stopped') + ' talking', ts3client.LogLevel.INFO);

		// Get the clients nickname
		var clientName = ts3client.getClientVariableAsString(schID, clientID, ts3client.ClientProperties.NICKNAME);
		var isTalking = (status == ts3client.TalkStatus.TALKING);

		// Get mute status
		var isInputMuted = (ts3client.getClientVariableAsString(schID, clientID, ts3client.ClientProperties.INPUT_MUTED) == ts3client.MuteInputStatus.MUTED);
		var isOutputMuted = (ts3client.getClientVariableAsString(schID, clientID, ts3client.ClientProperties.OUTPUT_MUTED) == ts3client.MuteOutputStatus.MUTED);

		console.log(isWhisper);

		// Update the clients status indicator
		channelNav_UpdateClientIndicator(clientID, clientName, isTalking, isWhisper, isInputMuted, isOutputMuted);

		// If self, update tray icon
		if (clientID == selfClientID) {
			if (isTalking) {
				tray.setImage(__dirname + `\\img\\tray\\talking.ico`);
			}
			else {
				tray.setImage(__dirname + `\\img\\tray\\icon.ico`);
			}

			if (isOutputMuted) {
				tray.setImage(__dirname + `\\img\\tray\\speakers_muted.ico`);
			}
			else if (isInputMuted){
				tray.setImage(__dirname + `\\img\\tray\\microphone_muted.ico`);
			}
			
			
		}
	} catch (error) {
		// Do nothing, client disconnected while talking
	}
});

/**
 * Register a callback function for 'onTextMessageEvent'. This will handle delivering the message to the client
 * in the correct format.
 */
ts3client.on('onTextMessageEvent', function (schID, targetMode, toID, fromID, fromName, fromUID, message) {
	ts3client.logMessage('Text message received from ' + fromName + ' (id:' + fromID + ') | target mode: ' + targetMode + ' | message: ' + message);

	renderMessage(fromName, fromID, fromUID, message).then(function whenOk(response) {
			if (fromID == selfClientID) { // Message was sent by self
				// Store in DB
				addChatMessage(response);
			} else {
				// Play soundfile
				ts3client.playWaveFile(schID, __dirname + `\\sound\\${soundpack}\\chat_message_inbound.wav`);

				// Flash taskbar icon if window has no focus
				var currWin = remote.getCurrentWindow();
				if (!currWin.isFocused()) {
					currWin.flashFrame(true);
				}

			}

			// Enable imageViewer
			var viewer = ImageViewer();
			$('.gallery-items').click(function () {
				var imgSrc = this.src;
				var highResolutionImage = $(this).data('high-res-img');
		
				viewer.show(imgSrc, highResolutionImage);

				$(document).on("contextmenu", ".iv-container", function(e){
					viewer.hide();
					return false;
				 });
	
				 document.onkeydown = function(evt) {
					evt = evt || window.event;
					if (evt.keyCode == 27) {
						viewer.hide();
					}
				};
			});
		})
		.catch(function notOk(err) {
			console.error(err)
		})
});

/**
 * Register a callback function for 'onIgnoredWhisperEvent'. This will be triggered When a client
 * recieves a whisper while the whispering client has not yet been added to the whisper allow list.
 */
ts3client.on('onIgnoredWhisperEvent', function (schID, clientID) {
	ts3client.logMessage('Ignored whisper received from ' + clientID);

	// Add the client to the whitelist
	ts3client.allowWhispersFrom(schID, clientID);
});

/**
 * Register a callback function for 'onServerErrorEvent'. This will write an error message to the client log for errors
 * reported by the server.
 */
ts3client.on('onServerErrorEvent', function (schID, error, errno, returnCode, extraMessage) {
	if (errno) {
		ts3client.logMessage('Server returned error: ' + error, ts3client.LogLevel.ERROR);
	}
});

ts3client.on('onUpdateClientEvent', function (schID, clientID, invokerID, invokerName, invokerUID) {
	try {
		var clientName = ts3client.getClientVariableAsString(schID, clientID, ts3client.ClientProperties.NICKNAME);
		var isTalking = (ts3client.getClientVariableAsString(schID, clientID, ts3client.ClientProperties.FLAG_TALKING) == ts3client.TalkStatus.TALKING);
		var isWhisper = false;
		var isInputMuted = (ts3client.getClientVariableAsString(schID, clientID, ts3client.ClientProperties.INPUT_MUTED) == ts3client.MuteInputStatus.MUTED);
		var isOutputMuted = (ts3client.getClientVariableAsString(schID, clientID, ts3client.ClientProperties.OUTPUT_MUTED) == ts3client.MuteOutputStatus.MUTED);

		channelNav_UpdateClientIndicator(clientID, clientName, isTalking, isWhisper, isInputMuted, isOutputMuted);
	} catch (error) {
		// Do nothing, client disconnected while talking
	}
});

// ============================================================
// ========================= CLIENT ===========================
// ============================================================
connect(null);

function connect(channel) {
	try {
		/**
		 * Initialize the ClientLib and point the resource path to the platform specific SDK\bin directory to
		 * locate the sound backend libraries.
		 */
		ts3client.initClientLib(ts3client.LogTypes.CONSOLE, undefined, ts3client.getResourcePath());

		/**
		 * Spawn a new server connection handler and store its ID. Since we did not specify any port, the OS
		 * will determine a free port for outgoing connections automatically.
		 */
		schID = ts3client.spawnNewServerConnectionHandler();

		/**
		 * Open the capture/playback devices. Since we did not specify any devices, the ClientLib will use the
		 * default audio devices.
		 */
		ts3client.openCaptureDevice(schID);
		ts3client.openPlaybackDevice(schID);

		// Get the current window
		var mainWin = remote.getCurrentWindow();

		if (settings.connectionHostname_value.get() != null) {
			/**
			 * Connect to server
			 */
			// ts3client.startConnection(schID, ident, '51.254.24.100', 12435, 'ElectronSkagoo', ['Guest Channel'], '', '63df0-dc283-245ec-253d5-f6110-7b384');
			var channelToConnect;
			if (channel != null) {
				channelToConnect = [channel];
			}
			else {
				channelToConnect = settings.connectionDefaultChannel_value.get();
			}

			ts3client.startConnection(
				schID,
				settings.connectionIdentity_value.get(),
				settings.connectionHostname_value.get(),
				settings.connectionPort_value.get(),
				settings.connectionNickname_value.get(),
				channelToConnect,
				settings.connectionDefaultChannelPassword_value.get(),
				settings.connectionServerPassword_value.get()
			);

			/**
			 * Intercept SIGINT signals, disconnect from the server and destroy the ClientLib.
			 */
			process.on('SIGINT', function () {
				ts3client.stopConnection(schID);

				setTimeout(function () {
					ts3client.destroyServerConnectionHandler(schID);
					ts3client.destroyClientLib();
				}, 200);

				process.exit();
			});
		} else {
			// Here the connection modal should be shown.
			connectWin = new BrowserWindow({
				frame: false,
				width: 550,
				height: 680,
				backgroundColor: '#282828',
				show: false
			})

			// and load the connect.html of the app.
			connectWin.loadFile('app/connect.html')

			// Emitted when the window is closed.
			connectWin.on('closed', () => {
				// Dereference the window object, usually you would store windows
				// in an array if your app supports multi windows, this is the time
				// when you should delete the corresponding element.
				connectWin = null

				mainWin.show();

				if (settings.connectionHostname_value.get() != null) {
					/**
					 * Connect to server
					 */
					// ts3client.startConnection(schID, ident, '51.254.24.100', 12435, 'ElectronSkagoo', ['Guest Channel'], '', '63df0-dc283-245ec-253d5-f6110-7b384');
					var channelToConnect;
					if (channel != null) {
						channelToConnect = [channel];
					}
					else {
						channelToConnect = settings.connectionDefaultChannel_value.get();
					}

					ts3client.startConnection(
						schID,
						settings.connectionIdentity_value.get(),
						settings.connectionHostname_value.get(),
						settings.connectionPort_value.get(),
						settings.connectionNickname_value.get(),
						channelToConnect,
						settings.connectionDefaultChannelPassword_value.get(),
						settings.connectionServerPassword_value.get()
					);

					/**
					 * Intercept SIGINT signals, disconnect from the server and destroy the ClientLib.
					 */
					process.on('SIGINT', function () {
						ts3client.stopConnection(schID);

						setTimeout(function () {
							ts3client.destroyServerConnectionHandler(schID);
							ts3client.destroyClientLib();
						}, 200);

						process.exit();
					});
				} else {
					mainWin.close();
				}
			})

			// This method will be called when electron has finished creating
			// the window. Now we can show it, this is done to avoid flashing
			// or elements loading in visually.
			connectWin.on('ready-to-show', () => {
				mainWin.hide();
				connectWin.show();
			})
		}
	} catch (err) {
		/**
		 * Print the last known error code and the error message from the exception.
		 */
		console.log('ERROR ' + ts3client.getLastError() + ': ' + err.message);
	}
}

function joinChannel(channelID) {
	ts3client.requestClientMove(schID, selfClientID, channelID);
}

function setPlaybackMasterVolume(value) {
	// Set the master volume to the given value
	ts3client.setPlaybackConfigValue(schID, 'volume_modifier', value);

	// Save in settings
	settings.playbackMasterVolume_value.set(value.toString());

	ts3client.logMessage('Set master volume to: ' + value);
}

function setPlaybackSoundpackVolume(value) {
	// Set the soundpack volume to the given value
	ts3client.setPlaybackConfigValue(schID, 'volume_factor_wave', value);

	// Save in settings
	settings.playbackSoundpackVolume_value.set(value.toString());

	ts3client.logMessage('Set soundpack volume to: ' + value);
}

function setPreprocessorDenoise(value) {
	// Set the voice activation detection level to the given value
	ts3client.setPreProcessorConfigValue(schID, 'denoise', value);

	// Save in settings
	settings.preprocessorDenoise_value.set(value);

	ts3client.logMessage('denoise: ' + value);
}

function setPreprocessorVad(value) {
	// Set the voice activation detection level to the given value
	ts3client.setPreProcessorConfigValue(schID, 'vad', value);

	// Save in settings
	settings.preprocessorVad_value.set(value);

	ts3client.logMessage('vad: ' + value);
}

function setPreprocessorVoiceActivationLevel(value) {
	// Set the voice activation detection level to the given value
	ts3client.setPreProcessorConfigValue(schID, 'voiceactivation_level', value);

	// Save in settings
	settings.preprocessorVoiceActivationLevel_value.set(value);

	ts3client.logMessage('voiceactivation_level: ' + value);
}

function setPreprocessorExtraBufferSize(value) {
	// Set the voice activation detection level to the given value
	ts3client.setPreProcessorConfigValue(schID, 'vad_extrabuffersize', value);

	// Save in settings
	settings.preprocessorExtraBufferSize_value.set(value);

	ts3client.logMessage('vad_extrabuffersize: ' + value);
}

function setPreprocessorAgc(value) {
	// Set the voice activation detection level to the given value
	ts3client.setPreProcessorConfigValue(schID, 'agc', value);

	// Save in settings
	settings.preprocessorAgc_value.set(value);

	ts3client.logMessage('agc: ' + value);
}

function setPreprocessorAgcLevel(value) {
	// Set the voice activation detection level to the given value
	ts3client.setPreProcessorConfigValue(schID, 'agc_level', value);

	// Save in settings
	settings.preprocessorAgcLevel_value.set(value);

	ts3client.logMessage('agc_level: ' + value);
}

function setPreprocessorAgcMaxGain(value) {
	// Set the voice activation detection level to the given value
	ts3client.setPreProcessorConfigValue(schID, 'agc_max_gain', value);

	// Save in settings
	settings.preprocessorAgcMaxGain_value.set(value);

	ts3client.logMessage('agc_max_gain: ' + value);
}

function setPreprocessorEchoCanceling(value) {
	// Set the voice activation detection level to the given value
	ts3client.setPreProcessorConfigValue(schID, 'echo_canceling', value);

	// Save in settings
	settings.preprocessorEchoCanceling_value.set(value);

	ts3client.logMessage('echo_canceling: ' + value);
}

function sendMessage(message) {
	ts3client.requestSendServerTextMsg(schID, message);
}

function sendPoke(message) {
	console.log('function reached');
}

function sendImageFromClipboard(imgBase64) {
	if (imgBase64 != null) {
		// Upload to imgur
		imgur.uploadBase64(imgBase64)
			.then(function (json) {
				sendMessage('[IMG]' + json.data.link);
			})
			.catch(function (err) {
				console.error(err.message);
			});
	}
}

function sendImage() {
	var img = openImageDialog();

	if (img != null) {
		// Upload to imgur
		imgur.uploadFile(img)
			.then(function (json) {
				sendMessage('[IMG]' + json.data.link);
			})
			.catch(function (err) {
				console.error(err.message);
			});
	}
}

function openImageDialog() {
	const {
		dialog
	} = require('electron').remote;
	var file = dialog.showOpenDialog({
		filters: [{
			name: 'Images',
			extensions: ImgFormats
		}],
		properties: ['openFile']
	})[0];

	return file;
}

function testForInternetConnection() {
	// repeat with the interval of 5 seconds
	testConnectionInterval = setInterval(() => ping(), 5000);
}

function ping() {
	var ping = require ("net-ping");
	var session = ping.createSession ();
	var target = '8.8.8.8';

	session.pingHost (target, function (error, target) {
		if (error) {
			console.log(target + ": " + error.toString ());
		}
		else { // Internet connection alive
			console.log(target + ": Alive");
			clearInterval(testConnectionInterval);

			// Try to reconnect
			connect(lastChannel);
		}
	});
}

function clearWhisperlist() {
	ts3client.requestClientSetWhisperList(schID, selfClientID, [], []);

	if (lastWhisperClientID != null) {
		// Update the client indicator
		channelNav_whisperTarget(lastWhisperClientID, false);
	}
}

function setWhisperlist(targetUID) {
	clearWhisperlist();

	var targetID;
	
	// Get all clients
	var clientList = ts3client.getClientList(schID);

	for (let index = 0; index < clientList.length; index++) {
		// For each client, check their UID
		var clientUID = ts3client.getClientVariableAsString(schID, clientList[index], ts3client.ClientProperties.UNIQUE_IDENTIFIER);

		console.log(clientUID + ' ' + ts3client.getClientVariableAsString(schID, clientList[index], ts3client.ClientProperties.NICKNAME));

		// Check if the UID of the client matches with the target UID
		if (clientUID == targetUID) {
			// Set the value of targetID
			targetID = clientList[index];
		}
	}

	if (targetID != null && targetID != selfClientID) {
		// Get the name of the client
		var nickname = ts3client.getClientVariableAsString(schID, targetID, ts3client.ClientProperties.NICKNAME);

		// Get mute status
		// var isInputMuted = (ts3client.getClientVariableAsString(schID, targetID, ts3client.ClientProperties.INPUT_MUTED) == ts3client.MuteInputStatus.MUTED);
		var isOutputMuted = (ts3client.getClientVariableAsString(schID, targetID, ts3client.ClientProperties.OUTPUT_MUTED) == ts3client.MuteOutputStatus.MUTED);

		if (!isOutputMuted) {
			// Set as last whisper target
			lastWhisperClientID = targetID;

			// Update the client indicator
			channelNav_whisperTarget(targetID, true);

			ts3client.requestClientSetWhisperList(schID, selfClientID, [], [targetID]);

			ipcRenderer.send('request-set-last-whisper-target', targetUID);
		}
		else { // Target output muted
			ts3client.logMessage('Whisper target output muted: ' + targetUID);
	
			// Play soundfile
			ts3client.playWaveFile(schID, __dirname + `\\sound\\${soundpack}\\no_whisper_target_found.wav`);
		}
	}
	else { // Target not found
		ts3client.logMessage('Whisper target not found: ' + targetUID);

		// Play soundfile
		ts3client.playWaveFile(schID, __dirname + `\\sound\\${soundpack}\\no_whisper_target_found.wav`);
	}
}

// UI
// ============================================================
// =========================== UI =============================
// ============================================================
function channelNav_addSpacer(channelID, title) {
	var nav = $('.navigation');
	var titleNoSpace = title.replace(/[\s\&\:]/g, "");
	var elem = '<div class="navigation__list"><div class="navigation__list__header" role="button" data-toggle="collapse" href="#' + titleNoSpace + '" aria-expanded="true" aria-controls="' + titleNoSpace + '">' + title + ' </div><div class="collapse in" id="' + titleNoSpace + '"></div></div>';
	nav.append(elem);
}

function channelNav_addChannel(channelID, channelName, spacer) {
	var spacerNoSpace = spacer.replace(/[\s\&\:]/g, "");
	var navSpacer = $('#' + spacerNoSpace);
	var elem = '<a class="navigation__list__item channel" id="' + channelName.replace(/[\s\&\:]/g, "") + '_' + channelID + '" ondblclick="joinChannel(' + channelID + ')"><span>' + channelName + '</span></a>';
	navSpacer.append(elem);
}

function channelNav_addClient(clientID, nickname, channelName, channelID) {
	var navChannel = $('#' + channelName.replace(/[\s\&\:]/g, "") + '_' + channelID);
	var elem = '<a class="navigation__list__item client" id="client-' + clientID + '"><img src="img/client_indicators/client_indicator.png" alt="icon"><span>' + nickname + '</span></a>';
	navChannel.after(elem);
}

function channelNav_moveClient(clientID, nickname, channelName, channelID) {
	// Get the channel to navigate to
	var navChannel = $('#' + channelName.replace(/[\s\&\:]/g, "") + '_' + channelID);
	console.log(navChannel);

	// Get the old client element
	var oldClientElem = $('#client-' + clientID);
	console.log(oldClientElem);

	// Copy the client element into a new client element
	var newClientElem = oldClientElem[0].outerHTML;
	console.log(newClientElem);

	// Delete the old client element
	oldClientElem.remove();
	console.log(newClientElem);

	// Place the new client element after the correct channel element
	navChannel.after(newClientElem);
	console.log(navChannel);
}

function channelNav_deleteClient(clientID) {
	// Get the client element
	var clientElem = $('#client-' + clientID);

	// Delete the client element
	clientElem.remove();
}

function channelNav_UpdateClientIndicator(clientID, nickname, isTalking, isWhisper, isInputMuted, isOutputMuted) {
	// Get the client element
	var clientElem = $('#client-' + clientID);

	// Update the client indicator acordingly to the given parameters
	if (isOutputMuted) {
		clientElem.children('img').attr('src', 'img/client_indicators/client_indicator_speakers_muted_icon.png');
	} else if (isInputMuted) {
		clientElem.children('img').attr('src', 'img/client_indicators/client_indicator_microphone_muted_icon.png');
	} else if (isTalking) {
		if (isWhisper) {
			clientElem.children('img').attr('src', 'img/client_indicators/client_indicator_whispering.png');
		} else {
			clientElem.children('img').attr('src', 'img/client_indicators/client_indicator_talking.png');
		}
	} else {
		clientElem.children('img').attr('src', 'img/client_indicators/client_indicator.png');
	}
}

function channelNav_whisperTarget(clientID, isTarget) {
	// Get the client element
	var clientElem = $('#client-' + clientID);

	if (isTarget) {
		clientElem.addClass('whisper-target');
	}
	else {
		clientElem.removeClass('whisper-target');
	}
}

function channelNav_setActiveChannel(channelName, channelID) {
	// Remove 'active' class from all channel elements
	$(".channel").removeClass("active");

	// Get the new active channel element
	var channelElem = $('#' + channelName.replace(/[\s\&\:]/g, "") + '_' + channelID);

	// Add 'active' as class to the new active channel element
	channelElem.addClass('active');
}

function channelNav_clear() {
	var nav = $('.navigation');
	nav.empty();
}

// VAD level slider
var sliderVadLevel = document.getElementById('vad-level');
noUiSlider.create(sliderVadLevel, {
	start: [parseInt(settings.preprocessorVoiceActivationLevel_value.get())],
	step: 1,
	range: {
		'min': [-50],
		'max': [50]
	},
	format: wNumb({
		decimals: 0
	}),
	tooltips: true
});

// Master volume slider
var sliderMasterVolume = document.getElementById('master-volume');
noUiSlider.create(sliderMasterVolume, {
	start: [parseInt(settings.playbackMasterVolume_value.get())],
	step: 1,
	range: {
		'min': [-20],
		'max': [20]
	},
	format: wNumb({
		decimals: 0
	}),
	tooltips: true
});

// Listen to value change events
sliderVadLevel.noUiSlider.on('update', function (values, handle, unencoded, isTap, positions) {
	var value = values[handle];
	console.log('sliderVadLevel value changed to: ' + value);

	setPreprocessorVoiceActivationLevel(value.toString());
});

// Listen to value change events
sliderMasterVolume.noUiSlider.on('update', function (values, handle, unencoded, isTap, positions) {
	var value = values[handle];
	console.log('sliderMasterVolume value changed to: ' + value);

	setPlaybackMasterVolume(value.toString());
});

function toggleMuteOutput () {
	// Get the icon element
	var iconElem = $('#toggle-mute-output');

	if (ts3client.getClientVariableAsString(schID, selfClientID, ts3client.ClientProperties.OUTPUT_MUTED) == ts3client.MuteOutputStatus.MUTED) {
		// Output is muted => Unmute
		ts3client.setClientSelfVariableAsString(schID, ts3client.ClientProperties.OUTPUT_MUTED, ts3client.MuteOutputStatus.NONE.toString());

		// Remove the old class
		iconElem.removeClass('ion-android-volume-off');

		// Add the new class
		iconElem.addClass('ion-android-volume-up');

		// Check if output is muted, if it is no need to update icon
		if (ts3client.getClientVariableAsString(schID, selfClientID, ts3client.ClientProperties.INPUT_MUTED) == ts3client.MuteInputStatus.MUTED) {
			// Update the tray icon
			tray.setImage(__dirname + `\\img\\tray\\microphone_muted.ico`);

			// Update the thumbar
			ipcRenderer.send('request-thumbar-minput-output');
		}
		else {
			// Update the tray icon
			tray.setImage(__dirname + `\\img\\tray\\icon.ico`);

			// Update the thumbar
			ipcRenderer.send('request-thumbar-input-output');
		}

		// Play soundfile
		ts3client.playWaveFile(schID, __dirname + `\\sound\\${soundpack}\\sound_resumed.wav`);
	} else {
		// Output is unmuted => Mute
		ts3client.setClientSelfVariableAsString(schID, ts3client.ClientProperties.OUTPUT_MUTED, ts3client.MuteOutputStatus.MUTED.toString());

		// Remove the old class
		iconElem.removeClass('ion-android-volume-up');

		// Add the new class
		iconElem.addClass('ion-android-volume-off');

		// Check if output is muted, if it is no need to update icon
		if (ts3client.getClientVariableAsString(schID, selfClientID, ts3client.ClientProperties.INPUT_MUTED) == ts3client.MuteInputStatus.MUTED) {
			// Update the tray icon
			tray.setImage(__dirname + `\\img\\tray\\speakers_muted.ico`);

			// Update the thumbar
			ipcRenderer.send('request-thumbar-minput-moutput');
		}
		else {
			// Update the tray icon
			tray.setImage(__dirname + `\\img\\tray\\speakers_muted.ico`);

			// Update the thumbar
			ipcRenderer.send('request-thumbar-input-moutput');
		}

		// Play soundfile
		ts3client.playWaveFile(schID, __dirname + `\\sound\\${soundpack}\\sound_muted.wav`);
	}

	// Flush to send change to server
	ts3client.flushClientSelfUpdates(schID);
}

function toggleMuteInput () {
	// Get the icon element
	var iconElem = $('#toggle-mute-input');

	if (ts3client.getClientVariableAsString(schID, selfClientID, ts3client.ClientProperties.INPUT_MUTED) == ts3client.MuteInputStatus.MUTED) {
		// Input is muted => Unmute
		ts3client.setClientSelfVariableAsString(schID, ts3client.ClientProperties.INPUT_MUTED, ts3client.MuteInputStatus.NONE.toString());

		// Remove the old class
		iconElem.removeClass('ion-android-microphone-off');

		// Add the new class
		iconElem.addClass('ion-android-microphone');

		// Check if output is muted, if it is no need to update icon
		if (ts3client.getClientVariableAsString(schID, selfClientID, ts3client.ClientProperties.OUTPUT_MUTED) == ts3client.MuteOutputStatus.MUTED) {
			// Update the tray icon
			tray.setImage(__dirname + `\\img\\tray\\speakers_muted.ico`);

			// Update the thumbar
			ipcRenderer.send('request-thumbar-input-moutput');
		}
		else {
			// Update the tray icon
			tray.setImage(__dirname + `\\img\\tray\\icon.ico`);

			// Update the thumbar
			ipcRenderer.send('request-thumbar-input-output');
		}

		// Play soundfile
		ts3client.playWaveFile(schID, __dirname + `\\sound\\${soundpack}\\mic_activated.wav`);
	} else {
		// Input is unmuted => Mute
		ts3client.setClientSelfVariableAsString(schID, ts3client.ClientProperties.INPUT_MUTED, ts3client.MuteInputStatus.MUTED.toString());

		// Remove the old class
		iconElem.removeClass('ion-android-microphone');

		// Add the new class
		iconElem.addClass('ion-android-microphone-off');

		// Check if output is muted, if it is no need to update icon
		if (ts3client.getClientVariableAsString(schID, selfClientID, ts3client.ClientProperties.OUTPUT_MUTED) == ts3client.MuteOutputStatus.MUTED) {
			// Update the tray icon
			tray.setImage(__dirname + `\\img\\tray\\speakers_muted.ico`);

			// Update the thumbar
			ipcRenderer.send('request-thumbar-minput-moutput');
		}
		else {
			// Update the tray icon
			tray.setImage(__dirname + `\\img\\tray\\microphone_muted.ico`);

			// Update the thumbar
			ipcRenderer.send('request-thumbar-minput-output');
		}
	
		// Play soundfile
		ts3client.playWaveFile(schID, __dirname + `\\sound\\${soundpack}\\mic_muted.wav`);
	}

	// Flush to send change to server
	ts3client.flushClientSelfUpdates(schID);
}

function renderMessage(fromClient, fromClientID, fromClientUID, message) {
	return new Promise(function (resolve, reject) {
		var template;
		var templateID;
		var context;

		if (fromClientID == selfClientID) { // Message is from self
			if (message.includes('[IMG]')) { // Message is uploaded IMG, so render with message-media-template
				var url = message.replace('[IMG]', '');

				templateID = '#message-media-template';
				template = Handlebars.compile($(templateID).html());
				context = {
					sender: fromClient,
					senderUID: fromClientUID,
					messageContent: '<img src="' + url + '" alt="Unable to load image" class="img-responsive gallery-items" style="max-width:450px;max-height:450px;float:right;">',
					time: chat.getCurrentTime()
				};
			} else if (validUrl.isUri(message)) { // URL, handle it
				if (message.includes('instantfap.com')) {
					$.ajax({
						url: message,
						success: function (data) {
							var regex = String.raw `(id=\"post-image\"\>)(.*)(?=\<\/div)`;
							var match = data.match(regex).slice(-1)[0];
							if (match) { // found what we need e.g. <img id="post-content" src="http://domain.com/image/dyBtGvs.gif" />

								match = match.replace('<img', '<img class="img-responsive gallery-items" style="max-width:450px;max-height:450px;float:right;"');

								templateID = '#message-media-template';
								template = Handlebars.compile($(templateID).html());
								context = {
									sender: fromClient,
									senderUID: fromClientUID,
									messageContent: match,
									time: chat.getCurrentTime()
								};

								// Show
								chat.$chatHistoryList.append(template(context));
								chat.scrollToBottom();
								resolve({
									"templateID": templateID,
									"context": context
								});

							}
						}
					});
				} else if (ImgFormats.includes(message.split('.').slice(-1)[0])) { // is a direct url to an img
					templateID = '#message-media-template';
					template = Handlebars.compile($(templateID).html());
					context = {
						sender: fromClient,
						senderUID: fromClientUID,
						messageContent: '<img src="' + message + '" alt="Unable to load image" class="img-responsive gallery-items" style="max-width:450px;max-height:450px;float:right;">',
						time: chat.getCurrentTime()
					};
				} else { // Message is a url, so render with message-media-template
					templateID = '#message-media-template';
					template = Handlebars.compile($(templateID).html());
					context = {
						sender: fromClient,
						senderUID: fromClientUID,
						messageContent: '<a href="' + message + '">' + message + '</a>',
						time: chat.getCurrentTime()
					};
				}
			} else { // Message is just text, so render with message-template
				templateID = '#message-template';
				template = Handlebars.compile($(templateID).html());
				context = {
					sender: fromClient,
					senderUID: fromClientUID,
					messageContent: message,
					time: chat.getCurrentTime()
				};
			}
		} else { // Message is not from self
			if (message.includes('[IMG]')) { // Message is uploaded IMG, so render with message-media-response-template
				var url = message.replace('[IMG]', '');

				templateID = '#message-media-response-template';
				template = Handlebars.compile($(templateID).html());
				context = {
					sender: fromClient,
					senderUID: fromClientUID,
					messageContent: '<img src="' + url + '" alt="Unable to load image" class="img-responsive gallery-items" style="max-width:450px;max-height:450px;float:left;">',
					time: chat.getCurrentTime()
				};
			} else if (validUrl.isUri(message)) { // URL, handle it
				if (message.includes('instantfap.com')) {
					$.ajax({
						url: message,
						success: function (data) {
							var regex = String.raw `(id=\"post-image\"\>)(.*)(?=\<\/div)`;
							var match = data.match(regex).slice(-1)[0];
							if (match) { // found what we need e.g. <img id="post-content" src="http://domain.com/image/dyBtGvs.gif" />

								match = match.replace('<img', '<img class="img-responsive gallery-items" style="max-width:450px;max-height:450px;float:left;"');

								templateID = '#message-media-response-template';
								template = Handlebars.compile($(templateID).html());
								context = {
									sender: fromClient,
									senderUID: fromClientUID,
									messageContent: match,
									time: chat.getCurrentTime()
								};

								// Show
								chat.$chatHistoryList.append(template(context));
								chat.scrollToBottom();
								resolve({
									"templateID": templateID,
									"context": context
								});

							}
						}
					});
				} else if (ImgFormats.includes(message.split('.').slice(-1)[0])) { // is a direct url to an img
					templateID = '#message-media-response-template';
					template = Handlebars.compile($(templateID).html());
					context = {
						sender: fromClient,
						senderUID: fromClientUID,
						messageContent: '<img src="' + message + '" alt="Unable to load image" class="img-responsive gallery-items" style="max-width:450px;max-height:450px;float:left;">',
						time: chat.getCurrentTime()
					};
				} else { // Message is a url, so render with message-media-response-template
					templateID = '#message-media-response-template';
					template = Handlebars.compile($(templateID).html());
					context = {
						sender: fromClient,
						senderUID: fromClientUID,
						messageContent: '<a href="' + message + '">' + message + '</a>',
						time: chat.getCurrentTime()
					};
				}
			} else { // Message is just text, so render with message-response-template
				templateID = '#message-response-template';
				template = Handlebars.compile($(templateID).html());
				context = {
					sender: fromClient,
					senderUID: fromClientUID,
					messageContent: message,
					time: chat.getCurrentTime()
				};
			}
		}

		if (template) {
			chat.$chatHistoryList.append(template(context));
			chat.scrollToBottom();
			resolve({
				"templateID": templateID,
				"context": context
			});
		}
	})
}

$('body').on('click', '.message a', (event) => {
	event.preventDefault();
	let link = event.target.href;
	require("electron").shell.openExternal(link);
});

function showConnectionLostOverlay(show) {
	if (show) {
		$('.connection-lost-container').waitMe({
			effect: 'win8_linear',
			text: 'Connection lost, trying to reconnect...',
			bg: 'rgba(0,0,0,0.9)',
			color: 'rgb(200,200,200)',
			maxSize: '',
			waitTime: -1,
			textPos: 'vertical',
			fontSize: 'x-large',
			source: '',
			onClose: function () {}
		});
	} else {
		$(".connection-lost-container").waitMe("hide");
	}
}

$(window).on("beforeunload", function() {
	// Close the teamspeak connection
	ts3client.stopConnection(schID);
})

// IPC listeners
ipcRenderer.on('request-toggleMuteInput', (evt, msg) => toggleMuteInput());
ipcRenderer.on('request-toggleMuteOutput', (evt, msg) => toggleMuteOutput());

ipcRenderer.on('request-clear-whisperlist', (evt, msg) => clearWhisperlist());
ipcRenderer.on('request-set-whisperlist', (evt, targetUID) => setWhisperlist(targetUID));