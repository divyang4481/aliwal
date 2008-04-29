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
		try {
			// Destroy any existing markers and empty the list.
//			for ( var idx in xscopeNS.markers){
//				xscopeNS.markers[idx] = null;
//			};
//			xscopeNS.markers = [];
			
//			xscopeNS.pinList = [];
//			xscopeNS.pinItems = {};
//			xscopeNS.pinTagSets= {};
			
			
			// Get the browser settting up the webpage in the mean time.
			// It's important that xscopeNS.loadingData is set before loading the page otherwise it won't look for new data at all
			// Page loading done via a setTimeout to get it into a seperate thread			
			window.setTimeout( goMap, 1);
	
			var dataMgr = new DataManager();
			dataMgr.loadFile( fp.file,  xscopeNS.pinList, 
										xscopeNS.pinItems, 
										xscopeNS.pinTagSets,
										xscopeNS.flags );
		} catch(e){
			throw e	
		}
	}
}

function fileClose(){
	xscopeNS.raw_data = [];
	goWelcome();
}

function goWelcome(){
	var browser = document.getElementById("browser");
	browser.loadURI("chrome://on1map/content/welcome.html", null, null);
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
// Need to repopulate xscopeNS.pinList as they've all been trned into markers
	var dataMgr = new DataManager();
	dataMgr.reloadMarkers( xscopeNS.markers, xscopeNS.pinList );
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



addEventListener("load", onload, false);


























