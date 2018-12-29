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
			try
			{
				cordova.plugins.clipboard.paste(function (text) 
				{ 	
					if (typeof text == "string") 
					{
						if (text.indexOf("data")>-1)
						{
							$("#QR").val(text);
							cordova.plugins.clipboard.copy("");
							Identificar();
						}
						else
						{
							Camara();
						}
					}
					else
					{
						Camara();
					}
				}, Camara );
			}
			catch { Camara(); };
        });

        function onDone(err, status){
            if (err) {
                // here we can handle errors and clean up any loose ends.
                console.error(err);
            }
            if (status.authorized) {
                // W00t, you have camera access and the scanner is initialized.
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
		function Camara ()
		{
			document.body.style.backgroundColor="transparent";
			$("#middle").css("display","none");
			window.QRScanner.scan(displayContents);
			window.QRScanner.show();
		}

        function displayContents(err, text){
			window.QRScanner.destroy();
			document.body.style.backgroundColor="white";
			$("#middle").css("display","block");
            if(err){
				alert("Camera:" + JSON.stringify(err));
				// an error occurred, or the scan was canceled (error code `6`)
            } else {
                // The scan completed, display the contents of the QR code:
				
                $("#QR").val(text);
				Identificar();
            }
        }
    }
};

app.initialize();
