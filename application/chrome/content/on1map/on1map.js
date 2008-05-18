function jsdump(str){
	try{
		/* Thanks: http://developer.mozilla.org/en/docs/Debugging_a_XULRunner_Application */
	  Components.classes['@mozilla.org/consoleservice;1']
	            .getService(Components.interfaces.nsIConsoleService)
	            .logStringMessage(str);
	} catch(e){
		console.log(str);
	}
}

try{
	Components.utils.import("resource://app/modules/xscope.jsm");
}catch(e){
	alert('Falling back to DEMO mode because\nof an error while importing module xscope.jsm.');
	// ********************************* START OF FAKE JSM **********************************************
	var xscopeNS = {
		KML 		: {},   // A KML DOM document
		domMarkers  : {},   // Hash of YMarker objects that are on the map, keyed by ymarker.id
		hiddenMarkers: {}, 	// Hash of hidden/filtered etc. markers
		
		flags		: { loadingData 		: false, // Whole flags object should be passed because of pass by reference requirement
					    warnGeocodingError 	: true,
					    warnPinCountError 	: true
					  }
	};
	
   try {
    netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
   } catch (e) {
    alert("Permission UniversalBrowserRead denied.");
   }
	var req = new XMLHttpRequest();
	req.overrideMimeType('text/xml');	
	req.open("GET", "fake-jsm-data-980.o1m", false);
	//req.open("GET", "fake-jsm-data-49.o1m", false);
	//req.open("GET", "google-addresses.kml", false); 
	req.send(null);
	
	var inter = document.implementation.createDocument("","",null);
	var clonedNode = inter.importNode( req.responseXML.firstChild , true );
	inter.appendChild( clonedNode );
	xscopeNS.KML = inter;
	if(xscopeNS.KML.documentElement.nodeName == "parsererror" ){
		alert("error while parsing");
	}
	var dataMgr = new DataManager();
	dataMgr.enrichFromCache( xscopeNS.KML );
	// ********************************* END OF FAKE JSM **********************************************
}

var dataMgr = new DataManager();
var markerMgr = new MarkerManager();
var domMgr = new DomManager();
var cacheMgr = new CacheManager();
var map;
var lastBounds;

/* ****************************************************************************************************************************** */

$(document).ready( function(){
/* Start with things that don't need a net connection */

	// Attach an event handler to ALL of the options hideshow checkboxes
	$('.cb_hideshow_option').bind( 'change', function(e){
		domMgr.hideShowOptions( this.id, this.checked );
	});	
	
	// Attach another event handler to hideshow2
	$('.div_hideshow_option').bind( 'click', function(e){
		domMgr.hideShow2( this.id );
	});	
	
	/* Filter controls need to be in place bfore the map can be drawn */
	domMgr.drawControls( true );
	
	/* get the map sorted out ASAP ( but not 1st) because it
	 * originates off-site and takes longer 
	 */
	map = new YMap(document.getElementById('map'));	
	map.addTypeControl(); 	
	map.addZoomLong();    		
	map.addPanControl();  
	
	// Capture events that require drawing
	YEvent.Capture(map, EventsList.endMapDraw, function(resultObj) { 
		domMgr.drawMarkers(xscopeNS.domMarkers, xscopeNS.hiddenMarkers, map.getBoundsLatLon() );
	});
	YEvent.Capture(map, EventsList.endPan, function(resultObj) { 
		domMgr.drawMarkers(xscopeNS.domMarkers, xscopeNS.hiddenMarkers, map.getBoundsLatLon() );
	});
	YEvent.Capture(map, EventsList.endAutoPan, function(resultObj) { 
		var currb = map.getBoundsLatLon();
		/* endAutoPan fires by popups even if the map hasn't moved when no need to redraw */
		if (uneval(lastBounds) !== uneval(currb)){ 
			domMgr.drawMarkers(xscopeNS.domMarkers, xscopeNS.hiddenMarkers, currb );
			lastBounds = currb;
		}
	});
	YEvent.Capture(map, EventsList.onEndGeoCode, function(resultObj) {
		/* Make the map update the address cache whenever it can.
		 * Thanks: http://josephsmarr.com/2007/03/20/handling-geocoding-errors-from-yahoo-maps/
		 */
		 if( resultObj.success ){
		 	// Cache the coordinates in storage. 
		 	// NB. KML wants LONGITUDE,LATITUDE
		 	var addrhash = resultObj.Address; //str_md5( resultObj.Address );
		 	var cachestr = resultObj.GeoPoint.Lon + ',' + resultObj.GeoPoint.Lat;
		 	cacheMgr.setItem(addrhash, cachestr);
		 } else {
		 	// A wierd issue (race I think), trying to set the warning out here.
			if(xscopeNS.flags.warnGeocodingError === true){
				xscopeNS.flags.warnGeocodingError = false;
				alert('Some addresses couldn\'t be geocoded to \ncoordinates and are not shown.');
			}
		 	domMgr.warningGeocodingError(true, resultObj.Address );

		 }
	});
	dataMgr.emptyObj( xscopeNS.domMarkers );
	dataMgr.emptyObj( xscopeNS.hiddenMarkers );
	try{
		markerMgr.createMarkersFromDom(xscopeNS.KML, xscopeNS.hiddenMarkers );
	} catch(e){
		jsdump('Exception:\n'+e);
	}
	
	// Specifying the Map starting location and zoom level
	var homeloc = new YGeoPoint(51.496439,-0.244269); //Goldhawk Road, London
	map.drawZoomAndCenter( homeloc, 7);
	lastBounds = map.getBoundsLatLon();

	// Trigger a clicked event to set the intial pin labels
	$('#sel_change_pin_label').trigger( 'change');
	
});
