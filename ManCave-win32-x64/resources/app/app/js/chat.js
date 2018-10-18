global.chat = {
  messageToSend: '',
  messageResponses: [
    'Why did the web developer leave the restaurant? Because of the table layout.',
    'How do you comfort a JavaScript bug? You console it.',
    'An SQL query enters a bar, approaches two tables and asks: "May I join you?"',
    'What is the most used language in programming? Profanity.',
    'What is the object-oriented way to become wealthy? Inheritance.',
    'An SEO expert walks into a bar, bars, pub, tavern, public house, Irish pub, drinks, beer, alcohol'
  ],
  init: function() {
    this.cacheDOM();
    this.bindEvents();
    this.render();

    // Load chat from today
    loadTodaysChat();
  },
  cacheDOM: function() {
    this.$chat = $('.chat');
    this.$chatHistory = $('.chat-history');
    this.$textInput = $('#message-to-send');
    this.$chatHistoryList =  this.$chatHistory.find('ul');
  },
  bindEvents: function() {
    this.$textInput.on('keyup', this.addMessageEnter.bind(this));
  },
  render: function() {
    this.scrollToBottom();
    if (this.messageToSend.trim() !== '') {
    //   var template = Handlebars.compile( $("#message-template").html());
    //   var context = { 
    //     messageOutput: this.messageToSend,
    //     time: this.getCurrentTime()
    //   };

    //   this.$chatHistoryList.append(template(context));
    //   this.scrollToBottom();
      this.$textInput.val('');
      
      // responses
    //   var templateResponse = Handlebars.compile( $("#message-response-template").html());
    //   var contextResponse = { 
    //     response: this.getRandomItem(this.messageResponses),
    //     time: this.getCurrentTime()
    //   };
      
    //   setTimeout(function() {
    //     this.$chatHistoryList.append(templateResponse(contextResponse));
    //     this.scrollToBottom();
    //   }.bind(this), 1500);
      
    }

      setTimeout(function() {
        this.scrollToBottom();
      }.bind(this), 1000);
    
  },
  
  addMessage: function() {
    this.messageToSend = this.$textInput.val();

    // tsclient.js method
    sendMessage(this.messageToSend);

    this.render();         
  },
  addMessageEnter: function(event) {
      // enter was pressed
      if (event.keyCode === 13) {
        this.addMessage();
      }
  },
  scrollToBottom: function() {
      this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
  },
  getCurrentTime: function() {
    return new Date().toLocaleTimeString().
            replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
  },
  getRandomItem: function(arr) {
    return arr[Math.floor(Math.random()*arr.length)];
  },  
};

chat.init();

/**
 * This handler retrieves the images from the clipboard as a base64 string and returns it in a callback.
 * 
 * @param pasteEvent 
 * @param callback 
 */
function retrieveImageFromClipboardAsBase64(pasteEvent, callback, imageFormat){
	if(pasteEvent.clipboardData == false){
        if(typeof(callback) == "function"){
            callback(undefined);
        }
    };

    var items = pasteEvent.clipboardData.items;

    if(items == undefined){
        if(typeof(callback) == "function"){
            callback(undefined);
        }
    };

    for (var i = 0; i < items.length; i++) {
        // Skip content if not image
        if (items[i].type.indexOf("image") == -1) continue;
        // Retrieve image on clipboard as blob
        var blob = items[i].getAsFile();

        // Create an abstract canvas and get context
        var mycanvas = document.createElement("canvas");
        var ctx = mycanvas.getContext('2d');
        
        // Create an image
        var img = new Image();

        // Once the image loads, render the img on the canvas
        img.onload = function(){
            // Update dimensions of the canvas with the dimensions of the image
            mycanvas.width = this.width;
            mycanvas.height = this.height;

            // Draw the image
            ctx.drawImage(img, 0, 0);

            // Execute callback with the base64 URI of the image
            if(typeof(callback) == "function"){
                callback(mycanvas.toDataURL(
                    (imageFormat || "image/png")
                ));
            }
        };

        // Crossbrowser support for URL
        var URLObj = window.URL || window.webkitURL;

        // Creates a DOMString containing a URL representing the object given in the parameter
        // namely the original Blob
        img.src = URLObj.createObjectURL(blob);
    }
}

window.addEventListener("paste", function(e){

  // Handle the event
  retrieveImageFromClipboardAsBase64(e, function(imageDataBase64){
      // If there's an image, send it
      if(imageDataBase64){
          // data:image/png;base64,iVBORw0KGgoAAAAN......
          sendImageFromClipboard(imageDataBase64.split(',')[1]);
      }
  });
}, false);