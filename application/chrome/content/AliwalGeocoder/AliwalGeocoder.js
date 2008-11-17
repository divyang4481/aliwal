/*  Copyright (c) Greg Nicol 2008

	This file is part of Aliwal Geocoder.
	Aliwal Geocoder is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 2 of the License, or
	(at your option) any later version.
	
	Aliwal Geocoder is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.
	
	You should have received a copy of the GNU General Public License
	along with Aliwal Geocoder.  If not, see <http://www.gnu.org/licenses/>.
*/

function fileOpen(){
	//ToDo: Put the geocoding wizard back in here
	//
	var nsIFilePicker = Components.interfaces.nsIFilePicker;	
	var CC = Components.classes;
	var CI = Components.interfaces;
	var fp = CC["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "Pin Data File", nsIFilePicker.modeOpen);
	fp.appendFilter("On1Map Files","*.o1m");
	fp.appendFilter("Keyhole Files","*.KML");
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
			var fLoadedCallback = function(pPlacemark){		
				alert('file loaded callback');
			};
			
			xscopeNS.amodel = new AliwalModel();
			xscopeNS.acontroller = new AliwalController(xscopeNS.amodel);						
			xscopeNS.acontroller.loadKMLFile( 	fp.file.path, 
												fLoadHandler, 
												fProgressHandler, 
												fErrorHandler, 
												fLoadedCallback );
			xscopeNS.flags.loadingData = false;
			// Drop the Map drawing into it's own thread
			window.setTimeout( goMap, 1);
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
	fp.init(window, "Import Text File", nsIFilePicker.modeOpen);
	fp.appendFilter("CSV Files","*.csv");
	fp.appendFilter("TXT Files","*.txt");
	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK ) {
		document.title = 'Aliwal Geocoder - ' + fp.file.leafName;
		try {
			xscopeNS.flags.loadingData = true;
			xscopeNS.flags.promptForGeocodeFields = true;
			var fLoadHandler = function(){};
			var fProgressHandler = function(e){
				drawFileProgress(e);
			};
			var fErrorHandler = function(e) {
				jsdump("Error " + e.target.status + " occurred while loading the document.");
			};
			var fWizCallback = function( pFilename,pLayout,
										pDelimiters,pHeaderRows,pFooterRows,pColHeadings,
										pDataCols,pTagCols,pGeocodeAddressCols,pLonLatCols){
				
				xscopeNS.amodel = new AliwalModel();
				xscopeNS.acontroller = new AliwalController();
				if( pLayout === 'delimited'){						
					xscopeNS.acontroller.loadDelimitedFile( pFilename, 
															pDelimiters, 
															pHeaderRows, 
															pFooterRows,
															pColHeadings,
															pDataCols, 
															pTagCols, 
															pGeocodeAddressCols, 
															pLonLatCols,
															fLoadHandler, 
															fProgressHandler, 
															fErrorHandler, 
															function(){alert('done')} );
				} else {
					throw 'fileImportFlat: unhandled delimiter';
				}
				xscopeNS.flags.loadingData = false;				
				// Drop the Map drawing into it's own thread
				window.setTimeout( goMap, 1);
			}
			xscopeNS.currentFile = fp.file.path;
			var params = { 
					filename: fp.file.path, 
					callback: fWizCallback
			};
			window.openDialog("chrome://AliwalGeocoder/content/app.importWizard.xul","importWizard","modal", params);
		} catch(e){
			alert(e);
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
	fp.appendFilters(nsIFilePicker.filterXML);
	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK ) {
		try {
			var dataMgr = new DataManager();
			dataMgr.saveFile(fp.file.path, xscopeNS.KML);
		} catch(e){
			jsdump(e);
		}
	}
}
function filePageSetup(){
	PrintUtils.showPageSetup();
}
function filePrint(){
	PrintUtils.print(); 
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
	var  mapBrowser = document.getElementById("BrowserTabMap" );
	var dataBrowser = document.getElementById("BrowserTabData");
	
	var fEmpty = function(){};
	
	xscopeNS.amodel = new AliwalModel();
	xscopeNS.acontroller = new AliwalController( xscopeNS.amodel );
	xscopeNS.acontroller.loadDefaultData( fEmpty );
	
	mapBrowser.loadURI ("chrome://AliwalGeocoder/content/BrowserMap.html" , null, null);
	dataBrowser.loadURI("chrome://AliwalGeocoder/content/BrowserData.html", null, null);
	document.title = 'Aliwal Geocoder. Your data, on a map.';
}
function goViewDataWindow(){
	var winopts = "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar";
	window.open("chrome://AliwalGeocoder/content/app.DataWindow.xul", "_blank", winopts);
}
function goMap(){
	var  mapBrowser = document.getElementById("BrowserTabMap" );
	var dataBrowser = document.getElementById("BrowserTabData");
	
	mapBrowser.loadURI("chrome://AliwalGeocoder/content/BrowserMap.html"  , null, null);
	dataBrowser.loadURI("chrome://AliwalGeocoder/content/BrowserData.html", null, null);
}
function goPreferences(){
	window.openDialog("chrome://AliwalGeocoder/content/app.preferences.xul", "AliwalGeocoder Preferences", "chrome,titlebar,toolbar,centerscreen,modal");
	
}
function showConsole() {
  window.open("chrome://global/content/console.xul", "_blank",
    "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar");
}
function viewReload() {
	var  mapBrowser = document.getElementById("BrowserTabMap" );
	var dataBrowser = document.getElementById("BrowserTabData");
	
	mapBrowser.reload();
	dataBrowser.reload();
}
function viewStop() {
	var  mapBrowser = document.getElementById("BrowserTabMap" );
	var dataBrowser = document.getElementById("BrowserTabData");
	mapBrowser.stop();
	dataBrowser.stop();
}

function jsdump(str){
	/* Thanks: http://developer.mozilla.org/en/docs/Debugging_a_XULRunner_Application */
  Components.classes['@mozilla.org/consoleservice;1']
            .getService(Components.interfaces.nsIConsoleService)
            .logStringMessage(str);
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
	var listener = new WebProgressListener();
	var mapBrowser = document.getElementById("BrowserTabMap");
//$('#BrowserTabMap').css('min-height',444);
//$('#BrowserTabMap').css('min-width', 666);
	mapBrowser.addProgressListener(listener, Components.interfaces.nsIWebProgress.NOTIFY_ALL);
	goWelcome();
}


function toOpenWindowByType(inType, uri) {
	/* For venkman debugger */
	var winopts = "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar";
	window.open(uri, "_blank", winopts);
}

function viewVenkman(){
	start_venkman();
}

addEventListener("load", onload, false);





