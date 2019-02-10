// Here's how you'd do this with plain old Javascript
const iframe = document.querySelector('#appearin');
iframe.onload = () => {
    console.log('iframe is completely loaded');
    var checkExist03 = setInterval(function () {
        try {
            if (frames[0].document.getElementsByClassName('video-space').length) {
                frames[0].document.getElementsByClassName('VideoToolbar-item--mic')[0].click();
                // document.getElementsByClassName('bottom-left-button-group')[0].style.cssText = 'visibility: hidden !important;';
                clearInterval(checkExist03);
            }
        } catch (err) { }
        
    }, 50);

    var styleElem = document.createElement('style');
    styleElem.innerHTML = 'invite-placeholder-box:before {visibility: hidden !important;} .splitscreen-wrapper {background-color: #181818 !important;} .video-space:before {background-color: rgba(0,0,0,0) !important;} .VideoView-bottomLeftStatus {visibility: hidden !important;}.video-space {background-color:#181818 !important; background-image:none !important; padding: 0px !important;} .video-space-header {visibility: hidden !important;}.video-wrapper {margin-bottom: 0px !important;}.chat-open-button {visibility: hidden !important;}local-client-controls {visibility: hidden !important;} invite-placeholder-box {visibility: hidden !important;}.bottom-left-button-group{visibility: hidden !important;}.in-room-messages{visibility: hidden !important;}';
    frames[0].document.head.appendChild(styleElem);
}
