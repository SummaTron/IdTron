document.addEventListener("deviceready", onStorageReady5, false);

var fE, sJSON, sPrivateKey="", sCuenta="";
function onStorageReady5() {
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


function readFile(fileEntry) {
	try{
		fileEntry.file(function (file) {
        var reader = new FileReader();
 
        reader.onloadend = function() {
			sJSON = atob(this.result);
			try
			{
				sD = JSON.parse(sJSON);
				LeerTransfers(sD.Account)
			}
			catch {}


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

