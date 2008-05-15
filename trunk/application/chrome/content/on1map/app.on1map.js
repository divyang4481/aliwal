// nsIWebProgressListener implementation to monitor activity in the browser.
function WebProgressListener() {
}
WebProgressListener.prototype = {
  _requestsStarted: 0,
  _requestsFinished: 0,

  // We need to advertize that we support weak references.  This is done simply
  // by saying that we QI to nsISupportsWeakReference.  XPConnect will take
  // care of actually implementing that interface on our behalf.
  QueryInterface: function(iid) {
    if (iid.equals(Components.interfaces.nsIWebProgressListener) ||
        iid.equals(Components.interfaces.nsISupportsWeakReference) ||
        iid.equals(Components.interfaces.nsISupports))
      return this;
    
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  // This method is called to indicate state changes.
  onStateChange: function(webProgress, request, stateFlags, status) {
    var WPL = Components.interfaces.nsIWebProgressListener;

    var progress = document.getElementById("progress");

    if (stateFlags & WPL.STATE_IS_REQUEST) {
      if (stateFlags & WPL.STATE_START) {
        this._requestsStarted++;
      } else if (stateFlags & WPL.STATE_STOP) {
        this._requestsFinished++;
      }
      if (this._requestsStarted > 1) {
        var value = (100 * this._requestsFinished) / this._requestsStarted;
        progress.setAttribute("mode", "determined");
        progress.setAttribute("value", value + "%");
      }
    }
/* Nic: No stop button at th moment
 * 
 
    if (stateFlags & WPL.STATE_IS_NETWORK) {
      var stop = document.getElementById("stop");
      if (stateFlags & WPL.STATE_START) {
        stop.setAttribute("disabled", false);
        progress.setAttribute("style", "");
      } else if (stateFlags & WPL.STATE_STOP) {
        stop.setAttribute("disabled", true);
        progress.setAttribute("style", "display: none");
        this.onStatusChange(webProgress, request, 0, "Done");
        this._requestsStarted = this._requestsFinished = 0;
      }
    }
    *
    *  
    */
  },

 
  // This method is called to indicate progress changes for the currently
  // loading page.
  onProgressChange: function(webProgress, request, curSelf, maxSelf,
                             curTotal, maxTotal) {
    if (this._requestsStarted == 1) {
      var progress = document.getElementById("progress");
      if (maxSelf == -1) {
        progress.setAttribute("mode", "undetermined");
      } else {
        progress.setAttribute("mode", "determined");
        progress.setAttribute("value", ((100 * curSelf) / maxSelf) + "%");
      }
    }
  },

  // This method is called to indicate a status changes for the currently
  // loading page.  The message is already formatted for display.
  onStatusChange: function(webProgress, request, status, message) {
    var status = document.getElementById("status");
    status.setAttribute("label", message);
  },

  // This method is called when the security state of the browser changes.
  onSecurityChange: function(webProgress, request, state) {
    var WPL = Components.interfaces.nsIWebProgressListener;

    var sec = document.getElementById("security");

    if (state & WPL.STATE_IS_INSECURE) {
      sec.setAttribute("style", "display: none");
    } else {
      var level = "unknown";
      if (state & WPL.STATE_IS_SECURE) {
        if (state & WPL.STATE_SECURE_HIGH)
          level = "high";
        else if (state & WPL.STATE_SECURE_MED)
          level = "medium";
        else if (state & WPL.STATE_SECURE_LOW)
          level = "low";
      } else if (state & WPL_STATE_IS_BROKEN) {
        level = "mixed";
      }
      sec.setAttribute("label", "Security: " + level);
      sec.setAttribute("style", "");
    }
  }
};
var listener;




/* ****************************************************************************************************************************** 
 * Don't know what all that above is for?
 * On1Map starts here
 * 
 ****************************************************************************************************************************** */

// Load an emtpy set of symbols that will be used to share data between the XUL & HTML
Components.utils.import("resource://app/modules/xscope.jsm");

/* ***************************************************************************************************************************** */ 

function fileOpen(){
	var nsIFilePicker = Components.interfaces.nsIFilePicker;	
	var CC = Components.classes;
	var CI = Components.interfaces;
	var fp = CC["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "Pin Data File", nsIFilePicker.modeOpen);
	fp.appendFilter("On1Map Files","*.o1m");
	fp.appendFilter("Keyhole Files","*.KML");
	fp.appendFilters(nsIFilePicker.filterXML);	
	fp.appendFilters(nsIFilePicker.filterAll);	
	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK ) {			
		document.defaultView.title = 'Aliwal On1map - ' + fp.file.leafName;
		try {
			xscopeNS.flags.loadingData = true;
			var dataMgr = new DataManager();
			dataMgr.emptyObj( xscopeNS.KML );
			dataMgr.loadFile( fp.file.path, function( pDoc ){
				/* dataMgr.loadFile() is asyncronous. 
				 * This is called when it's finished loading successfully.
				 */

				/* Scope issues mean that pDoc has to be copied back to xscopeNS in here. */
				var inter = document.implementation.createDocument("","",null);
				var clonedNode = inter.importNode( pDoc.firstChild , true );
				inter.appendChild( clonedNode );
				xscopeNS.KML = inter;

				dataMgr.enrichFromCache( xscopeNS.KML );
				xscopeNS.flags.loadingData = false;
				
				// Drop the Map drawing into it's own thread
				window.setTimeout( goMap, 1);
			});
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
			jsdump('savefile is:\n' + savefile);
			file.initWithPath( savefile );
			if ( file.exists() == false ) {
				jsdump( "Creating file... " );
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
	xscopeNS.raw_data = [];
	goWelcome();
}
function goAbout(){
	window.openDialog("chrome://on1map/content/about.xul","aboutDialog","dialog" );
}
function goWelcome(){
	document.defaultView.title = 'Aliwal On1map. Your data, on a map.';
	var browser = document.getElementById("browser");
	browser.loadURI("chrome://on1map/content/welcome.html", null, null);
}
function goViewData(){
	var browser = document.getElementById("browser");
	toggleSidebar("viewDataSidebar");
}





function goDebug(){
	var browser = document.getElementById("browser");
	browser.loadURI("chrome://on1map/content/debug.html", null, null);
}
function goMap(){
	var browser = document.getElementById("browser");
	browser.loadURI("chrome://on1map/content/on1map.html", null, null);
}

function goTests(){
	var browser = document.getElementById("browser");
	browser.loadURI("chrome://on1map/content/j3unit-0.9.0/j3unit-0.9.0/index.html", null, null);
}

function goPreferences(){
	window.openDialog("chrome://on1map/content/connection.xul", "", "chrome,toolbar");
	
}
function showConsole() {
  window.open("chrome://global/content/console.xul", "_blank",
    "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar");
}

function onload() {
    listener = new WebProgressListener();

	var browser = document.getElementById("browser");
	browser.addProgressListener(listener,
    Components.interfaces.nsIWebProgress.NOTIFY_ALL);
    
	goWelcome();
	//goDebug();
}

function back() {
  var browser = document.getElementById("browser");
  browser.stop();
  browser.goBack();
}

function forward() {
  var browser = document.getElementById("browser");
  browser.stop();
  browser.goForward();
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

function fileNew(){
	alert('File New');
}

function jsdump(str)
{
	/* Thanks: http://developer.mozilla.org/en/docs/Debugging_a_XULRunner_Application */
  Components.classes['@mozilla.org/consoleservice;1']
            .getService(Components.interfaces.nsIConsoleService)
            .logStringMessage(str);
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
		document.defaultView.title = 'Aliwal On1map - ' + fp.file.leafName;
		xscopeNS.currentFile = fp.file.path;
		var params = { 
			filename: fp.file.path, 
			callback: function(pDoc){
				var dataMgr = new DataManager();
				dataMgr.emptyObj( xscopeNS.KML );
				var inter = document.implementation.createDocument("","",null);
				var clonedNode = inter.importNode( pDoc.firstChild , true );
				inter.appendChild( clonedNode );
				xscopeNS.KML = inter;

				dataMgr.enrichFromCache( xscopeNS.KML );
				xscopeNS.flags.loadingData = false;
				
				// Drop the Map drawing into it's own thread
				window.setTimeout( goMap, 1);
			}
		};
		window.openDialog("chrome://on1map/content/app.importWizard.xul","importWizard","modal", params);
	}
}
function fileImportKML(){
	var nsIFilePicker = Components.interfaces.nsIFilePicker;	
	var CC = Components.classes;
	var CI = Components.interfaces;
	var fp = CC["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "Import KML File", nsIFilePicker.modeOpen);
	fp.appendFilter("Keyhole Files","*.kml");
	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK ) {
		document.defaultView.title = 'Aliwal On1map - ' + fp.file.leafName;
		xscopeNS.currentFile = fp.file.path;
		var params = { 
			filename: fp.file.path, 
			callback: function(pDoc, pGeocodeArr ){
				var dataMgr = new DataManager();
				dataMgr.emptyObj( xscopeNS.KML );
				var inter = document.implementation.createDocument("","",null);
				var clonedNode = inter.importNode( pDoc.firstChild , true );
				inter.appendChild( clonedNode );
				xscopeNS.KML = inter;
				dataMgr.enrichWithGeocode( xscopeNS.KML );
				dataMgr.enrichFromCache( xscopeNS.KML );
				xscopeNS.flags.loadingData = false;
				
				// Drop the Map drawing into it's own thread
				window.setTimeout( goMap, 1);
			}
		};
		window.openDialog("chrome://on1map/content/wiz.importKML.xul","importKMLWizard","modal", params);
	}
}

function graftKMLToSidebar(){
	jsdump('STARTING');
	xscopeNS.KML.firstChild.setAttribute('id', 'xscopeNS_KML');
	xscopeNS.KML.firstChild.setAttribute('xmlns', ''); // Needed to get query below to work
	document.importNode(xscopeNS.KML.firstChild, true);
	var gb = document.getElementById('gb_tree_data');
	while( gb.hasChildNodes() ){
		gb.removeChild( gb.firstChild );
	}
	jsdump('GB Empty');
	var tree = document.createElement('tree' );
	tree.setAttribute('id', 		'tr_kml_data' );
	tree.setAttribute('datasources','#xscopeNS_KML' );
	tree.setAttribute('ref', 		'*' );
	tree.setAttribute('querytype', 	'xml' );
	
	jsdump('MID');
	var tcols = document.createElement('treecols');
	var treecol = document.createElement('treecol');
	treecol.setAttribute( 'id', 	'mycolid');
	treecol.setAttribute( 'flex', 	'1');
	treecol.setAttribute( 'label', 	'cats');
	treecol.setAttribute( 'primary', 'true');
	
	tcols.appendChild(treecol);
	tree.appendChild(tcols);
	
	var template = document.createElement('template');
	var query = document.createElement('query');
	query.setAttribute('expr','Placemark');
	var action1 = document.createElement('action');
	var a1_1 = document.createElement('treechildren');
	var a1_2 = document.createElement('treeitem');
	var a1_3 = document.createElement('treerow');
	var a1_4 = document.createElement('treecell');
	a1_4.setAttribute('label', 	'?');
	
	a1_3.appendChild(a1_4);
	a1_2.appendChild(a1_3);
	a1_1.appendChild(a1_2);
	action1.appendChild(a1_1);
	
	template.appendChild(query);
	template.appendChild(action1);

	
	jsdump('BUILT');
	
	gb.appendChild(tree);
	
	var frag = '';
	frag += '<tree id="tr_kml_data" datasources="#xscopeNS_KML" ref="*" querytype="xml" ';
	frag += ' 	flex="1" hidecolumnpicker="true" >';
	frag += '	<treecols>';
	frag += '		<treecol id="sex2"   flex="1" label="Cats" primary="true" />';
	frag += '	</treecols>';
	frag += '	<template>';
	frag += '		<rule>';
	frag += '			<treechildren>';
	frag += '				<treeitem uri="rdf:*">';
	frag += '					<treerow>';
	frag += '						<treecell label="rdf:http://home.netscape.com/NC-rdf#Name"/>';
//	frag += '						<treecell label="rdf:http://home.netscape.com/WEB-rdf#LastModifiedDate"/>';
	frag += '					</treerow>';
	frag += '				</treeitem>';
	frag += '			</treechildren>';
	frag += '		</rule>';
	frag += '	</template>';
	frag += '</tree>';

	jsdump('DONE');
}

addEventListener("load", onload, false);


























