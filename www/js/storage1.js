document.addEventListener("deviceready", onStorageReady, false);

var fE, sJSON;

function onStorageReady() {
    navigator.splashscreen.hide();
	try
	{
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
		fs.root.getFile("IdTron/IdTron.txt", { create: true, exclusive: false }, function (fileEntry) {
			fE = fileEntry;
			//readFile(fE);
			Leer();
			console.log("fileEntry is file?" + fileEntry.isFile.toString());
			//fileEntry.name == 'IdTron.txt'
			//fileEntry.fullPath == '/IdTron.txt'
			//writeFile(fileEntry, null);
	 
		}, console.log("Error getFile"))
 
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
			sJSON = atob(this.result);
			sD = JSON.parse(sJSON);
			$("#account").val(sD.Account);
			$("#privateKey").val(sD.PrivateKey);
			$("#id").val(sD.id);
			$("#name").val(sD.name);
			$("#surname").val(sD.surname);
			$("#email").val(sD.email);
			if (sD.Id) {$('#customCheck1').prop("checked", true);}
			if (sD.Name) {$('#customCheck2').prop("checked", true);}
			if (sD.Surname) {$('#customCheck3').prop("checked", true);}
			if (sD.Email) {$('#customCheck4').prop("checked", true);}
            //displayFileData(fileEntry.fullPath + ": " + this.result);
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

