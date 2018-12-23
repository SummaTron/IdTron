var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
		
        document.querySelector("#scanButton").addEventListener("click", function() {
			document.body.style.backgroundColor="transparent";
			$("#Registro").css("display","none");
			window.QRScanner.prepare(onDone);
        });


        function onDone(err, status){
            if (err) {
                // here we can handle errors and clean up any loose ends.
                console.error(err);
            }
            if (status.authorized) {
                // W00t, you have camera access and the scanner is initialized.
				Copy("");
				window.QRScanner.scan(displayContents);
                window.QRScanner.show();
            } else if (status.denied) {
                // The video preview will remain black, and scanning is disabled. We can
                // try to ask the user to change their mind, but we'll have to send them
                // to their device settings with `QRScanner.openSettings()`.
            } else {
                // we didn't get permission, but we didn't get permanently denied. (On
                // Android, a denial isn't permanent unless the user checks the "Don't
                // ask again" box.) We can ask again at the next relevant opportunity.
            }
        }

        function displayContents(err, text){
			window.QRScanner.destroy();
			document.body.style.backgroundColor="white";
			$("#Registro").css("display","block");
            if(err){
				alert(JSON.stringify(err));
                // an error occurred, or the scan was canceled (error code `6`)
            } else {
                // The scan completed, display the contents of the QR code:
				
				$("#iPrivateKey").val(text);
				ImportarCuenta();
            }
        }
    }
};

app.initialize();

