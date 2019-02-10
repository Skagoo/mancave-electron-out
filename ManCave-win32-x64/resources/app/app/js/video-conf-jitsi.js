// Here's how you'd do this with plain old Javascript
const iframe = document.querySelector('#jitsi');
iframe.onload = () => {
    console.log('iframe is completely loaded');
    var checkExist03 = setInterval(function () {
        try {
            if (frames[0].document.getElementsByClassName('button-group-center').length) {
                frames[0].document.getElementsByClassName('icon-microphone')[0].click();
                frames[0].document.getElementsByClassName('icon-tiles-many')[0].click();
                clearInterval(checkExist03);
            }
        } catch (err) { }
        
    }, 50);

    var styleElem = document.createElement('style');
    //.new-toolbox {visibility: hidden !important;}
    styleElem.innerHTML = '.watermark {visibility: hidden !important;} .filmstrip__videos {background: #181818 !important} .videocontainer__background { background: rgba(18, 18, 18, 0.5) !important;}';
    frames[0].document.head.appendChild(styleElem);
}
