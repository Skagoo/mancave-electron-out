const electron = require('electron');
let settings = require('./js/settings.js');

(function ($) {
    /*==================================================================
    [ Validate ]*/
    var input = $('.validate-input .input100');

    $('.login100-form-btn').on('click',function(){
        var check = true;

        for(var i=0; i<input.length; i++) {
            if(validate(input[i]) == false){
                showValidate(input[i]);
                check=false;
            }
        }

        if (check) {
            var hostname;
            var port;
            var nickname;
            var defaultChannel;
            var defaultChannelPassword;
            var serverPassword;

            $('.validate-form .input100').each(function(){
                if ($(this).attr('name') == 'hostname') {
                    hostname = $(this).val().split(':')[0];
                    port = $(this).val().split(':')[1];
                }
                else if ($(this).attr('name') == 'nickname') {
                    nickname = $(this).val();
                }
                else if ($(this).attr('name') == 'defaultChannel') {
                    defaultChannel = $(this).val();
                }
                else if ($(this).attr('name') == 'defaultChannelPassword') {
                    defaultChannelPassword = $(this).val();
                }
                else if ($(this).attr('name') == 'serverPassword') {
                    serverPassword = $(this).val();
                }
            });

            if (defaultChannel == '') {
                defaultChannel = null;
                defaultChannelPassword = '';
            }

            settings.connectionHostname_value.set(hostname);
            settings.connectionPort_value.set(parseInt(port));
            settings.connectionNickname_value.set(nickname);
            settings.connectionDefaultChannel_value.set(defaultChannel);
            settings.connectionDefaultChannelPassword_value.set(defaultChannelPassword);
            settings.connectionServerPassword_value.set(serverPassword);

            let window = remote.getCurrentWindow();
            window.close();
        }
    });


    $('.validate-form .input100').each(function(){
        $(this).focus(function(){
           hideValidate(this);
        });
    });

    function validate (input) {
        if($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
            if($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
                return false;
            }
        }
        else {
            if($(input).val().trim() == ''){
                return false;
            }
        }
    }

    function showValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).addClass('alert-validate');
    }

    function hideValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).removeClass('alert-validate');
    }
    

})(jQuery);
