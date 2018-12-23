function Copy(sCampo)
{
	cordova.plugins.clipboard.copy($("#"+sCampo).val());
}
function Paste(sCampo)
{
	cordova.plugins.clipboard.paste(function (text) 
	{ 
	$("#"+sCampo).val(text);
	});
}
function Exportar()
{		var tab_text="<table border='2px'><tr bgcolor='#87AFC6'>";
	var textRange; var j=0;
	tab = document.getElementById('summatabla'); // id of table

	for(j = 0 ; j < tab.rows.length ; j++) 
	{     
		sLinea = tab.rows[j].innerHTML;
		sLinea = sLinea.split("€").join("");
		sLinea = sLinea.split(".").join(",");
		tab_text=tab_text+sLinea+"</tr>";
		//tab_text=tab_text+"</tr>";
	}

	tab_text=tab_text+"</table>";
	tab_text= tab_text.replace(/<A[^>]*>|<\/A>/g, "");//remove if u want links in your table
	tab_text= tab_text.replace(/<img[^>]*>/gi,""); // remove if u want images in your table
	tab_text= tab_text.replace(/<input[^>]*>|<\/input>/gi, ""); // reomves input params

	//tab_text = encodeURIComponent(tab_text);
	
	var ua = window.navigator.userAgent;
	var msie = ua.indexOf("MSIE "); 

	if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer
	{
		txtArea1.document.open("txt/html","replace");
		txtArea1.document.write(tab_text);
		txtArea1.document.close();
		txtArea1.focus(); 
		sa=txtArea1.document.execCommand("SaveAs",true,"Say Thanks to Sumit.xls");
	}  
	else                 //other browser not tested on IE 11
	{   sa = window.open('data:application/vnd.ms-excel;base64,' + btoa(tab_text)); } 

	return (sa);
}

function Leer_Cookie(nombre) {
	 
	 if (esMovil())
	 {
	  var valor = window.localStorage.getItem(nombre);
	  if (valor==null) {valor="";} 
	 }
	 else
	 {
		 var micookie=""
		 var lista = document.cookie.split(";");
		 for (i in lista) {
			 var busca = lista[i].search(nombre);
			 if (busca > -1) {micookie=lista[i]}
			 }
		 var igual = micookie.indexOf("=");
		 var valor = micookie.substring(igual+1);
	 }	 
	 
	 return valor;
}
function Borrar_Cookie(Nombre) {
	
	if (esMovil())
	{ window.localStorage.removeItem(Nombre);}
	else
	{document.cookie = Nombre + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'; }
}
function Poner_Cookie(Nombre, Valor) {
	 
	if (esMovil())
	 { window.localStorage.setItem(Nombre, Valor);}
	else
	 { document.cookie = Nombre +"="+Valor+"; max-age=3600; path=/";}
	
}
function getParameter2(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}

 function getParameter(name){
   url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return '';
    if (!results[2]) return '';
    retorno = decodeURIComponent(results[2].replace(/\+/g, " "));
	retorno=retorno.split("'").join("");
	return retorno;
}
function Fecha(sFecha)
{
    if (sFecha.length == 10)
	{
	sFecha = sFecha.substring(8,10)+"-"+sFecha.substring(5,7)+"-"+sFecha.substring(2,4);
	}
	else
	{ Fecha ="";}
	return sFecha;
}
function Fecha10(sFecha)
{
	sFecha = sFecha.substring(8,10)+"-"+sFecha.substring(5,7)+"-"+sFecha.substring(0,4);
	return sFecha;
}
function FechaInversa(sFecha)
{
return "20"+sFecha.substring(6,8)+"-"+sFecha.substring(3,5)+"-"+sFecha.substring(0,2);
}
function Fecha10Inversa(sFecha)
{
return sFecha.substring(6,10)+"-"+sFecha.substring(3,5)+"-"+sFecha.substring(0,2);
}
function FechaLarga(sFecha)
{
	aFecha=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
	if (sFecha.length == 10)
	{
		sFecha = sFecha.substring(8,10)+" de "+aFecha[parseInt(sFecha.substring(5,7))-1]+" de "+sFecha.substring(0,4);
	}
	else
	{ Fecha ="";}
	return sFecha;
}

function esMovil()
{
	if (Android () || iOS())
	{return true;}
	else
	{return false;}
}

function Android()
{
var ua = navigator.userAgent.toLowerCase();
var isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
return isAndroid;
}
function iOS() {

 if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
    return true;
  }

  return false;
}
function Pad(sTexto,nLong)
{
	sRetorno=sTexto;
	if (sTexto.length <  nLong)
	{
		for (i=1;i<10;i++)
		{sRetorno =sRetorno+ "&nbsp;";} 
	}
return sRetorno;
}
function PAD(sTexto,nLong)
{
	sRetorno=sTexto;
	if (sTexto.length < nLong)
	{
		for (i=1;i<nLong;i++)
		{sRetorno =sRetorno+ "&nbsp;";} 
	}
return sRetorno;
}

function greyscale(src,coordenadas)
{ //Creates a canvas element with a grayscale version of the color image
var nc=coordenadas.split(";");
var nx=0, ny=0, nw=800, nh=1024;
var supportsCanvas = !!document.createElement('canvas').getContext;
	if (supportsCanvas) {
		var canvas = document.createElement('canvas'), 
		canvassal = document.createElement('canvas'), 
		context = canvas.getContext('2d'), 
		contextsal = canvassal.getContext('2d'), 
		imageData, px, length, i = 0, gray, 
		img = new Image();
		img.src = src;
		if ( (nc[2] == 0) && (nc[3] == 0))
		{
			nx = 0;
			ny = 0;
			nw = img.width;
			nh = img.height;
		}
		else
		{
			
			nx = nc[0];
			ny = nc[1];
			nw = nc[2];
			nh = nc[3];
		}
		canvas.width = img.width;
		canvas.height = img.height;
		canvassal.width = nw;
		canvassal.height = nh;
		context.drawImage(img, 0, 0, canvas.width, canvas.height);
		imageData = context.getImageData(nx, ny, nw, nh);
	
		px = imageData.data;
		length = px.length;
		
		for (; i < length; i += 4) {
			gray = px[i] * .3 + px[i + 1] * .59 + px[i + 2] * .11;
			px[i] = px[i + 1] = px[i + 2] = gray;
		}
				
		contextsal.putImageData(imageData, 0, 0);
		return canvassal.toDataURL();

	} else {
		return src;
	}
}

function Euro(number)
{
	var numberStr = parseFloat(number).toFixed(2).toString();
	var numFormatDec = numberStr.slice(-2); /*decimal 00*/
	numberStr = numberStr.substring(0, numberStr.length-3); /*cut last 3 strings*/
	var numFormat = new Array;
	while (numberStr.length > 3) {
		numFormat.unshift(numberStr.slice(-3));
		numberStr = numberStr.substring(0, numberStr.length-3);
	}
	numFormat.unshift(numberStr);
	return numFormat.join('.') /*+','+numFormatDec; format 000.000.000,00 */
}
function Euro2(number)
{
	var numberStr = number;
	var numFormatDec = numberStr.slice(-2); /*decimal 00*/
	numberStr = numberStr.substring(0, numberStr.length-2); /*cut last 3 strings*/
	var numFormat = new Array;
	while (numberStr.length > 3) {
		numFormat.unshift(numberStr.slice(-3));
		numberStr = numberStr.substring(0, numberStr.length-3);
	}
	numFormat.unshift(numberStr);
	return numFormat.join('.') +','+numFormatDec; /*format 000.000.000,00 */
}
function Numero(number)
{
	var numberStr =number;
	var numFormat = new Array;
	while (numberStr.length > 3) {
		numFormat.unshift(numberStr.slice(-3));
		numberStr = numberStr.substring(0, numberStr.length-3);
	}
	numFormat.unshift(numberStr);
	return numFormat.join('.'); /*format 000.000.000,00 */
}
function PrecioFruta(number)
{
	retorno = parseFloat(number.replace(",",".")).toFixed(2).toString();
	return retorno;
}
function VolverAtras()
{
	window.history.back();
}
function Host()
{
	var Retorno = "http://www.summame.es";
	if (esMovil())
	{Retorno="http://www.summame.es";}
	return Retorno;
	
}
function Ascii2Hex(str)
  {
	var arr1 = [];
	for (var n = 0, l = str.length; n < l; n ++) 
     {
		var hex = Number(str.charCodeAt(n)).toString(16);
		arr1.push(hex);
	 }
	return arr1.join('');
   }

 function hex2asc(hex) {

	var str = '';
	for (var n = 0; n < hex.length; n += 2) {
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	}
	return str;
 }
