
document.addEventListener("deviceready", onStorageReady0, false);

var fE, sJSON, sPrivateKey="", sCuenta="";

function onStorageReady0() {
	try
	{
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
		 fs.root.getDirectory('IdTron', {create: true}, function(dirEntry) {
			fs.root.getFile("IdTron/IdTron.txt", { create: true, exclusive: false }, function (fileEntry) {
				fE = fileEntry;
				//readFile(fE);
				Leer();
				console.log("fileEntry is file?" + fileEntry.isFile.toString());
				//fileEntry.name == 'IdTron.txt'
				//fileEntry.fullPath == '/IdTron.txt'
				//writeFile(fileEntry, null);
				navigator.splashscreen.hide();
			}, console.log("Error getFile"))
		 },console.log("Error getDirectory"))
	},console.log("Error requestFileSystem"))
	}
	catch
	{console.log('file system no iniciado: ');}
};
function writeFile(fileEntry, dataObj) {
    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function (fileWriter) {
 
        fileWriter.onwriteend = function() {
            console.log("Successful file write...");
            //readFile(fileEntry);
        };
 
        fileWriter.onerror = function (e) {
            console.log("Failed file write: " + e.toString());
        };
 
        // If data object is not passed in,
        // create a new Blob instead.
        if (!dataObj) {
            dataObj = new Blob(['some file data'], { type: 'text/plain' });
        }
		mensaje = btoa(dataObj)+new Array(2024).join(' ');
        fileWriter.write(mensaje);
    });
};

function readFile(fileEntry) {
	try{
		fileEntry.file(function (file) {
        var reader = new FileReader();
 
        reader.onloadend = function() {
			try{
			sJSON = atob(this.result);
			console.log("Contenido:"+sJSON);
			}
			catch
			{
				sJSON="";
			}
			try
			{
				sD = JSON.parse(sJSON);
				sCuenta = sD.Account;
				//alert(sCuenta);
				navigator.splashscreen.hide();
				window.location.replace("menu_3.html");
			}
			catch {	
				navigator.splashscreen.hide();
				$("#Registro").css("display","block");
			}
        };
 
        reader.readAsText(file);
 
    }, console.log("onErrorReadFile"));
	}
	catch
	{console.log("onErrorReadFile")}
};

function Leer()
{
	try
	{
		readFile(fE);
	}
	catch
	{
	}
}

