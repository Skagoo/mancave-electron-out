const { ipcRenderer } = require('electron');

var cmClientLastTarget = '';
var cmClientLastTargetName = '';


// Tooltips

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

// Viewport Heights

$(window).on("resize load", function(){
  
  var totalHeight = $(window).height();

  var headerHeight = $('.header').outerHeight();
  var footerHeight = $('.current-track').outerHeight();
  var playlistHeight = $('.playlist').outerHeight();
  var nowPlaying = $('.playing').outerHeight();

  var navHeight = totalHeight - (headerHeight + footerHeight + playlistHeight + nowPlaying);
  var artistHeight = totalHeight - (headerHeight + footerHeight);
  var chatHistoryHeight = artistHeight - 20 - $('.chat-message').outerHeight();

  console.log(totalHeight);
  
  $(".navigation").css("height" , navHeight);
  $(".artist").css("height" , artistHeight);
  $(".chat-history").css("height" , chatHistoryHeight);
  $(".social").css("height" , artistHeight);

  
});
    


  

// Collapse Toggles

$(".navigation__list__header").on( "click" , function() {
  
  $(this).toggleClass( "active" );
  
});


// Media Queries

$(window).on("resize load", function(){
	if ($(window).width() <= 768){	
		
    $(".collapse").removeClass("in");
    
    $(".navigation").css("height" , "auto");
    
    $(".artist").css("height" , "auto");

    $(".chat-history").css("height" , "auto");
    
	}	
});

$(window).on("resize load", function(){
	if ($(window).width() > 768){	
		
    $(".collapse").addClass("in");
    
	}	
});

function checkForUpdates() {
  ipcRenderer.send('request-update');
}

// Add the event listener for the response from the main process
ipcRenderer.on('request-update-response', (event, arg) => {
  console.log(arg);
});

// Video conference
function startVideoConference() {
  console.log('Starting video conference');
  ipcRenderer.send('request-video-conference');
}

// Add the event listener for the response from the main process
ipcRenderer.on('request-video-conference-response', (event, arg) => {
  console.log(arg);
});
// End of Video conference

// Context menu client
const cmclient = document.querySelector(".cm-client");
let cmclientVisible = false;

const toggleCmclient = command => {
  cmclient.style.display = command === "show" ? "block" : "none";
  cmclientVisible = !cmclientVisible;
};

const setPosition = ({ top, left }) => {
  cmclient.style.left = `${left}px`;
  cmclient.style.top = `${top}px`;
  toggleCmclient("show");
};

window.addEventListener("click", e => {
  if(cmclientVisible)toggleCmclient("hide");
});

function eventListenerCmclient(e) {
  e.preventDefault();
  const origin = {
    left: e.pageX,
    top: e.pageY
  };
  setPosition(origin);

  console.log(e);
  cmClientLastTarget = e.target.parentElement.id;
  cmClientLastTargetName = e.target.innerText;

  return false;
}

function cmClient_moveClient() {
  return null;
}

function cmClient_muteClient() {
  var targetID = parseInt(cmClientLastTarget.split('-')[1]);
  toggleMuteClient(targetID);
}

function cmClient_pokeClient() {
  var targetID = parseInt(cmClientLastTarget.split('-')[1]);
  // sendPoke(targetID);
  setInputText('/poke ' + cmClientLastTargetName + ' ');
}

function cmClient_whisperClient() {
  return null;
}
// End of Context menu client

// Plyr
function initPlyrPlayers() { 
  // This is the bare minimum JavaScript. You can opt to pass no arguments to setup.
  const players = Array.from(document.querySelectorAll('.plyr-player')).map(p => new Plyr(p));
  
  // Expose
  window.players = players;

  // Bind event listener
  function on(selector, type, callback) {
    document.querySelector(selector).addEventListener(type, callback, false);
  }
}
// End of plyr

function hideRelatedVideoSection(video) {
  
  style = document.createElement('style');
  style.innerText = '.ytp-expand-pause-overlay .ytp-pause-overlay { display: none; }';
  video.contentDocument.head.appendChild(style);
}