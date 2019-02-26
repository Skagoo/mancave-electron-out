var participants = []

// Here's how you'd do this with plain old Javascript
const iframe = document.querySelector('#jitsi');
iframe.onload = () => {
    console.log('iframe is completely loaded');
    var checkExist03 = setInterval(function () {
        try {
            if (frames[0].document.getElementsByClassName('button-group-center').length) {
                frames[0].document.getElementsByClassName('icon-microphone')[0].click();
                clearInterval(checkExist03);
            }
        } catch (err) { }
        
    }, 50);

    var styleElem = document.createElement('style');
    //.new-toolbox {visibility: hidden !important;}
    styleElem.innerHTML = '.watermark {visibility: hidden !important;} .filmstrip__videos {background: #181818 !important} .videocontainer__background { background: rgba(18, 18, 18, 0.5) !important;} .remote-videos-container { padding: 0 !important; width: 100% !important; } ';
    frames[0].document.head.appendChild(styleElem);


    var checkExistParticipant = setInterval(function () {
        try {
            var participants_elements = frames[0].document.getElementsByClassName('display-video');
            if (participants_elements.length) {
                console.log("===================   YUP");
                for (let i = 0; i < participants_elements.length; i++) {
                    var id = participants_elements[i].attr("id");

                    console.log("===================   " + id);

                    if (!participants.includes(id) ) {
                        console.log("===================  NEW PART " + id);
                        participants_elements[i].style["width"] = "400px";
                        participants_elements[i].style["height"] = "300px";

                        participants.push(id);
                    }
                    
                }
            }

            console.log("===================   NOP");

        } catch (err) { }
        
    }, 5000);
}
