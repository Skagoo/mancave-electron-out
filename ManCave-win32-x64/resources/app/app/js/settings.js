const remote = require('electron');
const electronSettings = require('electron-settings');

// ============================================================
// ========================== SETUP ===========================
// ============================================================
let settingsPath;
var settingsPath_value = {
    get: function() {
        return settingsPath;
    },
    set: function(val) {
        // Save the value
        settingsPath = val;
        electronSettings.setPath(settingsPath);
    }
}

// ============================================================
// ========================== KEYS ============================
// ============================================================

// Connection
const connectionIdentity = 'connection.identity';
const connectionHostname = 'connection.hostname';
const connectionPort = 'connection.port';
const connectionNickname = 'connection.nickname';
const connectionDefaultChannel = 'connection.defaultChannel';
const connectionDefaultChannelPassword = 'connection.defaultChannelPassword';
const connectionServerPassword = 'connection.serverPassword';

// Playback
const playbackMasterVolume = 'playback.masterVolume';
const playbackSoundpack = 'playback.soundpack';
const playbackSoundpackVolume = 'playback.soundpackVolume';

// Preprocessor
const preprocessorDenoise = 'preprocessor.denoise';
const preprocessorVad = 'preprocessor.vad';
const preprocessorVoiceActivationLevel = 'preprocessor.voiceActivationLevel';
const preprocessorExtraBufferSize = 'preprocessor.extraBufferSize';
const preprocessorAgc = 'preprocessor.agc';
const preprocessorAgcLevel = 'preprocessor.agcLevel';
const preprocessorAgcMaxGain = 'preprocessor.agcMaxGain';
const preprocessorEchoCanceling = 'preprocessor.echoCanceling';

// Hotkey
const hotkeyToggleMuteInput = 'hotkey.toggleMuteInput';
const hotkeyToggleMuteOutput = 'hotkey.toggleMuteOutput';
const hotkeyOpenDevTools = 'hotkey.openDevTools';

// Whisperlist
const whisperlist = 'whisperlist';


// ============================================================
// ========================= VALUES ===========================
// ============================================================
var connectionIdentity_value = {
    get: function() {
        if (!electronSettings.has(connectionIdentity)) {
            // create and save indentity
            electronSettings.set(connectionIdentity, ts3client.createIdentity());
        }
        return electronSettings.get(connectionIdentity);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(connectionIdentity, val);
    }
}

var connectionHostname_value = {
    get: function() {
        if (!electronSettings.has(connectionHostname)) {
            // return default value
            return null;
        }
        return electronSettings.get(connectionHostname);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(connectionHostname, val);
    }
}

var connectionPort_value = {
    get: function() {
        if (!electronSettings.has(connectionPort)) {
            // return default value
            // UDP port of the TeamSpeak 3 server, by default 9987.
            // TeamSpeak 3 uses UDP. Support for TCP might be added in the future.
            return 9987;
        }
        return electronSettings.get(connectionPort);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(connectionPort, val);
    }
}

var connectionNickname_value = {
    get: function() {
        if (!electronSettings.has(connectionNickname)) {
            // return default value
            return 'Guest';
        }
        return electronSettings.get(connectionNickname);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(connectionNickname, val);
    }
}

var connectionDefaultChannel_value = {
    get: function() {
        if (!electronSettings.has(connectionDefaultChannel)) {
            // return default value
            // Pass NULL to join the servers default channel.
            return [''];
        }
        return [electronSettings.get(connectionDefaultChannel)];
    },
    set: function(val) {
        // Save the value
        electronSettings.set(connectionDefaultChannel, val);
    }
}

var connectionDefaultChannelPassword_value = {
    get: function() {
        if (!electronSettings.has(connectionDefaultChannelPassword)) {
            // return default value
            // Password for the default channel. Pass an empty string
            // if no password is required or no default channel is specified.
            return '';
        }
        return electronSettings.get(connectionDefaultChannelPassword);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(connectionDefaultChannelPassword, val);
    }
}

var connectionServerPassword_value = {
    get: function() {
        if (!electronSettings.has(connectionServerPassword)) {
            // return default value
            // Password for the server. Pass an empty string
            // if the server does not require a password.
            return '';
        }
        return electronSettings.get(connectionServerPassword);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(connectionServerPassword, val);
    }
}

var playbackMasterVolume_value = {
    get: function() {
        if (!electronSettings.has(playbackMasterVolume)) {
            // return default value
            // Value is in decibel, so 0 is no modification.
            return '0';
        }
        return electronSettings.get(playbackMasterVolume);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(playbackMasterVolume, val);
    }
}

var playbackSoundpack_value = {
    get: function() {
        if (!electronSettings.has(playbackSoundpack)) {
            // return default value
            return 'default';
        }
        return electronSettings.get(playbackSoundpack);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(playbackSoundpack, val);
    }
}

var playbackSoundpackVolume_value = {
    get: function() {
        if (!electronSettings.has(playbackSoundpackVolume)) {
            // return default value
            // The value is a float defining the volume reduction in decibel.
            // Reasonable values range from “-40.0” (very silent) to “0.0” (loudest).
            return '-20';
        }
        return electronSettings.get(playbackSoundpackVolume);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(playbackSoundpackVolume, val);
    }
}

var preprocessorDenoise_value = {
    get: function() {
        if (!electronSettings.has(preprocessorDenoise)) {
            // return default value
            // Enable or disable noise suppression.
            // Value can be “true” or “false”. Enabled by default.
            return 'true';
        }
        return electronSettings.get(preprocessorDenoise);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(preprocessorDenoise, val);
    }
}

var preprocessorVad_value = {
    get: function() {
        if (!electronSettings.has(preprocessorVad)) {
            // return default value
            // Enable or disable Voice Activity Detection.
            // Value can be “true” or “false”. Enabled by default
            return 'true';
        }
        return electronSettings.get(preprocessorVad);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(preprocessorVad, val);
    }
}

var preprocessorVoiceActivationLevel_value = {
    get: function() {
        if (!electronSettings.has(preprocessorVoiceActivationLevel)) {
            // return default value
            // Voice Activity Detection level in decibel. Numeric value converted to string.
            // A high voice activation level means you have to speak louder
            // into the microphone in order to start transmitting.
            // Reasonable values range from -50 to 50. Default is 0.
            return '0';
        }
        return electronSettings.get(preprocessorVoiceActivationLevel);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(preprocessorVoiceActivationLevel, val);
    }
}

var preprocessorExtraBufferSize_value = {
    get: function() {
        if (!electronSettings.has(preprocessorExtraBufferSize)) {
            // return default value
            // Voice Activity Detection extrabuffer size. Numeric value converted to string.
            // Should be “0” to “8”, defaults to “2”. Lower value means faster transmission,
            // higher value means better VAD quality but higher latency.
            return '2';
        }
        return electronSettings.get(preprocessorExtraBufferSize);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(preprocessorExtraBufferSize, val);
    }
}

var preprocessorAgc_value = {
    get: function() {
        if (!electronSettings.has(preprocessorAgc)) {
            // return default value
            // Enable or disable Automatic Gain Control.
            // Value can be “true” or “false”. Enabled by default.
            return 'true';
        }
        return electronSettings.get(preprocessorAgc);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(preprocessorAgc, val);
    }
}

var preprocessorAgcLevel_value = {
    get: function() {
        if (!electronSettings.has(preprocessorAgcLevel)) {
            // return default value
            // AGC level. Numeric value converted to string. Default is “16000”.
            return '16000';
        }
        return electronSettings.get(preprocessorAgcLevel);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(preprocessorAgcLevel, val);
    }
}

var preprocessorAgcMaxGain_value = {
    get: function() {
        if (!electronSettings.has(preprocessorAgcMaxGain)) {
            // return default value
            // AGC max gain. Numeric value converted to string. Default is “30”.
            return '30';
        }
        return electronSettings.get(preprocessorAgcMaxGain);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(preprocessorAgcMaxGain, val);
    }
}

var preprocessorEchoCanceling_value = {
    get: function() {
        if (!electronSettings.has(preprocessorEchoCanceling)) {
            // return default value
            // Enable echo canceling. Boolean value converted to string.
            // Default is “false”.
            return 'false';
        }
        return electronSettings.get(preprocessorEchoCanceling);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(preprocessorEchoCanceling, val);
    }
}

var hotkeyToggleMuteInput_value = {
    get: function() {
        if (!electronSettings.has(hotkeyToggleMuteInput)) {
            return '';
        }
        return electronSettings.get(hotkeyToggleMuteInput);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(hotkeyToggleMuteInput, val);
    }
}

var hotkeyToggleMuteOutput_value = {
    get: function() {
        if (!electronSettings.has(hotkeyToggleMuteOutput)) {
            return '';
        }
        return electronSettings.get(hotkeyToggleMuteOutput);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(hotkeyToggleMuteOutput, val);
    }
}

var hotkeyOpenDevTools_value = {
    get: function() {
        if (!electronSettings.has(hotkeyOpenDevTools)) {
            return '';
        }
        return electronSettings.get(hotkeyOpenDevTools);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(hotkeyOpenDevTools, val);
    }
}

var whisperlist_value = {
    get: function() {
        if (!electronSettings.has(whisperlist)) {
            return '';
        }
        return electronSettings.get(whisperlist);
    },
    set: function(val) {
        // Save the value
        electronSettings.set(whisperlist, val);
    }
}

// Export values
module.exports = {
    settingsPath_value: settingsPath_value,
    connectionIdentity_value : connectionIdentity_value,
    connectionHostname_value : connectionHostname_value,
    connectionPort_value : connectionPort_value,
    connectionNickname_value : connectionNickname_value,
    connectionDefaultChannel_value : connectionDefaultChannel_value,
    connectionDefaultChannelPassword_value : connectionDefaultChannelPassword_value,
    connectionServerPassword_value : connectionServerPassword_value,
    playbackMasterVolume_value : playbackMasterVolume_value,
    playbackSoundpack_value : playbackSoundpack_value,
    playbackSoundpackVolume_value : playbackSoundpackVolume_value,
    preprocessorDenoise_value : preprocessorDenoise_value,
    preprocessorVad_value : preprocessorVad_value,
    preprocessorVoiceActivationLevel_value : preprocessorVoiceActivationLevel_value,
    preprocessorExtraBufferSize_value : preprocessorExtraBufferSize_value,
    preprocessorAgc_value : preprocessorAgc_value,
    preprocessorAgcLevel_value : preprocessorAgcLevel_value,
    preprocessorAgcMaxGain_value : preprocessorAgcMaxGain_value,
    preprocessorEchoCanceling_value : preprocessorEchoCanceling_value,
    hotkeyToggleMuteInput_value : hotkeyToggleMuteInput_value,
    hotkeyToggleMuteOutput_value : hotkeyToggleMuteOutput_value,
    hotkeyOpenDevTools_value : hotkeyOpenDevTools_value,
    whisperlist_value : whisperlist_value
}
