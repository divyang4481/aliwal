/* ***************************************************************************************************************************** */ 
// Load an emtpy set of symbols that will be used to share data between the XUL & HTML
Components.utils.import("resource://app/modules/xscope.jsm");
//
/* ***************************************************************************************************************************** */ 

function fileOpen(){
	
	var nsIFilePicker = Components.interfaces.nsIFilePicker;	
	var CC = Components.classes;
	var CI = Components.interfaces;
	var fp = CC["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "Pin Data File", nsIFilePicker.modeOpen);
	fp.appendFilter("On1Map Files","*.o1m");
	fp.appendFilter("Keyhole Files","*.KML");
	fp.appendFilters(nsIFilePicker.filterAll);	
	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK ) {			
		document.title = 'Aliwal Geocoder - ' + fp.file.leafName;
		try {
			xscopeNS.flags.loadingData = true;
			xscopeNS.flags.promptForGeocodeFields = true;
			
			
			var fLoadHandler = function(){}
			var fProgressHandler = function (e) {
				drawFileProgress(e);
			};
			var fErrorHandler = function(e) {
				jsdump("Error " + e.target.status + " occurred while loading the document.");
			};
			var fCallback = function( pDoc ){
				/* dataMgr.loadFile() is asyncronous. 
				 * This is called when it's finished loading successfully.
				 */
		
				if(xscopeNS.flags.promptForGeocodeFields){
					// Pop up a wizard which can get the geocode fields from the user
					var placemarks = dataMgr.domMissingGeocode(pDoc);
					if (placemarks.length > 0){
						var params = {  KML 			: pDoc,
										pointlessCount 	: placemarks.length,
										callback 		: function(pGeocodeArgs){ 
															dataMgr.enrichWithGeocode(placemarks, pGeocodeArgs);
														  }
									 };
						window.openDialog(	"chrome://AliwalGeocoder/content/wiz.importKML.xul",
											"importWizard","modal", params );
					}
				}
				// ToDo: What to do if user cancels wizard ???
				dataMgr.enrichFromCache( pDoc );
				xscopeNS.KML = pDoc;
				xscopeNS.flags.loadingData = false;
				
				// Drop the Map drawing into it's own thread
				window.setTimeout( goMap, 1);
				drawSidebarTree();
			};
			
			var dataMgr = new DataManager();
			dataMgr.emptyObj( xscopeNS.pointMarkers );
			dataMgr.emptyObj( xscopeNS.hiddenMarkers );
			dataMgr.loadFile( fp.file.path, fLoadHandler, fProgressHandler, fErrorHandler, fCallback );
		} catch(e){
			jsdump(e);
		}
	}	
}

function fileImportFlat(){
	var nsIFilePicker = Components.interfaces.nsIFilePicker;	
	var CC = Components.classes;
	var CI = Components.interfaces;
	var fp = CC["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "Import CVS Data File", nsIFilePicker.modeOpen);
	fp.appendFilter("CSV Files","*.csv");
	fp.appendFilter("TXT Files","*.txt");
	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK ) {
		document.title = 'Aliwal Geocoder - ' + fp.file.leafName;
		try {
			xscopeNS.flags.loadingData = true;
			xscopeNS.flags.promptForGeocodeFields = true;

			var fLoadHandler = function(){}
			var fProgressHandler = function (e) {
				drawFileProgress(e);
			};
			var fErrorHandler = function(e) {
				jsdump("Error " + e.target.status + " occurred while loading the document.");
			};
			var fDMCallback = function(pDoc){ 
				xscopeNS.KML = pDoc;
			};
			var fWizCallback = function( pFilename,pLayout,
										pDelimiter,pHeaderRows,pFooterRows,pColHeadings,
										pDataCols,pTagCols,pGeocodeAddressCols,pLonLatCols){

					if( pLayout === 'delimited'){
						var dataMgr = new DataManager();
						dataMgr.emptyObj( xscopeNS.pointMarkers );
						dataMgr.emptyObj( xscopeNS.hiddenMarkers );
						dataMgr.importDelimitedFile(pFilename,pHeaderRows, pFooterRows,pColHeadings,
													pDataCols, pTagCols, pGeocodeAddressCols, pLonLatCols,
													fLoadHandler, fProgressHandler, fErrorHandler, 
													fDMCallback );
					
					} else {
						throw 'fileImportFlat: unhandled delimiter';
					}
					xscopeNS.flags.loadingData = false;				
					// Drop the Map drawing into it's own thread
					window.setTimeout( goMap, 1);
					drawSidebarTree();
				}
			xscopeNS.currentFile = fp.file.path;
			var params = { 
					filename: fp.file.path, 
					callback: fWizCallback
				};
			window.openDialog("chrome://AliwalGeocoder/content/app.importWizard.xul","importWizard","modal", params);
		} catch(e){
			jsdump(e);
		}
	}
}

function fileSaveAs(){
	var nsIFilePicker = Components.interfaces.nsIFilePicker;	
	var CC = Components.classes;
	var CI = Components.interfaces;
	var fp = CC["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "Pin Data File", nsIFilePicker.modeSave);
	fp.appendFilter("On1Map Files","*.o1m");
	fp.appendFilter("Keyhole Files","*.KML");
	fp.appendFilters(nsIFilePicker.filterXML);	
	fp.appendFilters(nsIFilePicker.filterAll);	
	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK ) {
		try {
			var savefile = fp.file.path;
			//Thanks: http://www.captain.at/programming/xul/
			var file = Components.classes["@mozilla.org/file/local;1"]
				.createInstance(Components.interfaces.nsILocalFile);
			file.initWithPath( savefile );
			if ( file.exists() == false ) {
				file.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420 );
			}
			var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
				.createInstance( Components.interfaces.nsIFileOutputStream );
			/* Open flags 
			#define PR_RDONLY       0x01
			#define PR_WRONLY       0x02
			#define PR_RDWR         0x04
			#define PR_CREATE_FILE  0x08
			#define PR_APPEND      0x10
			#define PR_TRUNCATE     0x20
			#define PR_SYNC         0x40
			#define PR_EXCL         0x80
			*/
			/*
			** File modes ....
			**
			** CAVEAT: 'mode' is currently only applicable on UNIX platforms.
			** The 'mode' argument may be ignored by PR_Open on other platforms.
			**
			**   00400   Read by owner.
			**   00200   Write by owner.
			**   00100   Execute (search if a directory) by owner.
			**   00040   Read by group.
			**   00020   Write by group.
			**   00010   Execute by group.
			**   00004   Read by others.
			**   00002   Write by others
			**   00001   Execute by others.
			**
			*/
			outputStream.init( file, 0x02 | 0x08 | 0x20, 0664, 0);   // write, create, truncate
			var serializer = new XMLSerializer();
			serializer.serializeToStream(xscopeNS.KML, outputStream, "");
			outputStream.close();
		} catch(e){
			jsdump(e);
		}
	}
}
function fileClose(){
	goWelcome();
}
function fileQuit(){
	// Generated by XULExplorer
	var aForceQuit = false;
	var appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].getService(Components.interfaces.nsIAppStartup);
	  
	    // eAttemptQuit will try to close each XUL window, but the XUL window can cancel the quit
	// process if there is unsaved data. eForceQuit will quit no matter what.
	var quitSeverity = aForceQuit ? Components.interfaces.nsIAppStartup.eForceQuit : Components.interfaces.nsIAppStartup.eAttemptQuit;
	appStartup.quit(quitSeverity);
}
function goAbout(){
	window.openDialog("chrome://AliwalGeocoder/content/about.xul","aboutDialog","dialog" );
}
function goWelcome(){
	document.title = 'Aliwal Geocoder. Your data, on a map.';
	var browser = document.getElementById("browser");
	browser.loadURI("chrome://AliwalGeocoder/content/welcome.html", null, null);
}
function goViewData(){
	toggleSidebar();
}
function goMap(){
	var browser = document.getElementById("browser");
	browser.loadURI("chrome://AliwalGeocoder/content/on1map.html", null, null);
}
function goPreferences(){
	window.openDialog("chrome://AliwalGeocoder/content/connection.xul", "", "chrome,toolbar");
	
}
function showConsole() {
  window.open("chrome://global/content/console.xul", "_blank",
    "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar");
}
function reload() {
	var dataMgr = new DataManager();
	var browser = document.getElementById("browser");
	browser.reload();
}
function stop() {
  var browser = document.getElementById("browser");
  browser.stop();
}

function jsdump(str)
{
	/* Thanks: http://developer.mozilla.org/en/docs/Debugging_a_XULRunner_Application */
  Components.classes['@mozilla.org/consoleservice;1']
            .getService(Components.interfaces.nsIConsoleService)
            .logStringMessage(str);
}

function toggleSidebar(){
	var sb = document.getElementById('hb_sidebar_data');
	var sp = document.getElementById('sp_sidebar_data');
	if( sb.getAttribute('collapsed') === 'true' ){
		sb.removeAttribute('collapsed');
		sp.removeAttribute('collapsed');
	} else {
		sb.setAttribute('collapsed', 'true');
		sp.setAttribute('collapsed', 'true');
	}
}

function drawSidebarTree(){
	return true;
	xscopeNS.KML.firstChild.setAttribute('id', 'xscopeNS_KML');
	try{
		var dataEle = document.getElementById('xscopeNS_KML');
		jsdump('document.removeChild( dataEle );');
		document.removeChild( dataEle );
	} catch(e){
		// ignore
	}
	
	jsdump('Appending xscopeNS.KML to document.getElementById(\'on1map\')');
	var cloned = xscopeNS.KML.firstChild.cloneNode(true);
	document.getElementById('on1map').appendChild( cloned, true);
	
	var tree = document.getElementById("tr_raw_data");
	tree.datasources="#xscopeNS_KML";
}
function drawFileProgress(e){
	var percentComplete = (e.position / e.totalSize)*100;
	var progress = document.getElementById("progress");
	progress.setAttribute("style", "");
    progress.setAttribute("mode", "determined");
    progress.setAttribute("value", percentComplete + "%");
    var status = document.getElementById("sp_status");
    status.setAttribute("label", 'Reading file ...');
};

function onload() {
    listener = new WebProgressListener();

	var browser = document.getElementById("browser");
	browser.addProgressListener(listener, Components.interfaces.nsIWebProgress.NOTIFY_ALL);
    
	goWelcome();
}

addEventListener("load", onload, false);


























