const NodeCouchDb = require('node-couchdb'); // https://www.npmjs.com/package/node-couchdb

const databaseName = 'mancave-electron';

// node-couchdb instance talking to external service
const couch = new NodeCouchDb({
    host: 'skagoo.com',
    protocol: 'https',
    port: 6984,
    auth: {
        user: 'admin',
        pass: 'couchdb759153'
    }
});

function getTodaysDocID() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();

    if(dd<10) {
        dd = '0'+dd
    } 

    if(mm<10) {
        mm = '0'+mm
    } 

    today = mm + '-' + dd + '-' + yyyy;

    return today;
}

function createTodaysDoc() {
    couch.insert(databaseName, {
        _id: getTodaysDocID(),
        messages: []
    }).then(({data, headers, status}) => {
        // data is json response
        // headers is an object with all response headers
        // status is statusCode number
    }, err => {
        // either request error occured
        // ...or err.code=EDOCCONFLICT if document with the same id already exists
    });
}
  
function loadTodaysChat() {
    var docID = getTodaysDocID();

    couch.get(databaseName, docID).then(({data, headers, status}) => {
        // data is json response
        // headers is an object with all response headers
        // status is statusCode number
        var doc = data;
        
        for (let index = 0; index < doc.messages.length; index++) {
            var templateID = doc.messages[index].templateID;
            var context = doc.messages[index].context;
            var template;

            if (context.senderUID != selfClientUID) { // Message was not sent by self
                templateID = templateID.replace('-template', '-response-template');
            }
            
            // Show
            template = Handlebars.compile($(templateID).html());
            chat.$chatHistoryList.append(template(context));
            chat.scrollToBottom();
        }
        chat.scrollToBottom();

        // Set NSFW hidden/visible
        showNSFW(getNSFWVisibility());

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

    }, err => {
        // either request error occured
        // ...or err.code=EDOCMISSING if document is missing
        // ...or err.code=EUNKNOWN if statusCode is unexpected
        if(err.code == 'EDOCMISSING') {
            createTodaysDoc();
        }
        else {
            console.log(err);
        }
    });
}

function addChatMessage(messageObj) {
    messageObj.context.messageContent = messageObj.context.messageContent.replace(`"`, `\"`);

    var docID = getTodaysDocID();

    couch.get(databaseName, docID).then(({data, headers, status}) => {
        // data is json response
        // headers is an object with all response headers
        // status is statusCode number
        var doc = data;
        doc.messages.push(messageObj);

        // note that "doc" must have both "_id" and "_rev" fields
        couch.update(databaseName, {
            _id: doc._id,
            _rev: doc._rev,
            messages: doc.messages
        }).then(({data, headers, status}) => {
            console.log('status' + status);
        }, err => {
            // either request error occured
            // ...or err.code=EFIELDMISSING if either _id or _rev fields are missing
            console.log(err);
        });

    }, err => {
        // either request error occured
        // ...or err.code=EDOCMISSING if document is missing
        // ...or err.code=EUNKNOWN if statusCode is unexpected
        if(err.code == 'EDOCMISSING') {
            createTodaysDoc();
            addChatMessage(messageObj);
        }
        else {
            console.log(err);
        }
    });
}