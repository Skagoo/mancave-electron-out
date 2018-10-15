const { ipcRenderer } = require('electron');

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