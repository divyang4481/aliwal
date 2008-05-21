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
		KML 			: {},   // A KML DOM document
		pointMarkers  	: {},   // Hash of YMarker objects that are on the map, keyed by ymarker.id
		hiddenMarkers 	: {}, 	// Hash of hidden/filtered etc. markers
		errorMarkers 	: {}, 	// Hash of error markers.
		geoMarkers 		: {}, 	// Hash of markers that need to be geocoded
		
		// Whole flags object should be passed because of pass by reference requirement
		flags		: { loadingData 		: false, 
						scrollOnGeocodeSuccess: false,
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
	//req.open("GET", "fake-jsm-data-live-490.o1m", false); //All need geocoding
	req.open("GET", "fake-jsm-data-49.o1m", false);
	//req.open("GET", "fake-jsm-data-980.o1m", false);
	//req.open("GET", "google-addresses.kml", false); 
	//req.open("GET", "example-data-barebones-49.o1m", false);
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
	
	/* Filter controls need to be in place bfore the map can be drawn */
	domMgr.drawControls( true );
	
	// Attach an event handler to ALL of the options hideshow checkboxes
	$('.cb_hideshow_option').bind( 'change', function(e){
		domMgr.hideShowOptions( this.id, this.checked );
	});	
	
	// Attach another event handler to hideshow2
	$('.div_hideshow_option').bind( 'click', function(e){
		domMgr.hideShow2( this.id );
	});	

	
	/* get the map sorted out ASAP ( but not 1st) because it
	 * originates off-site and takes longer 
	 */
	map = new YMap(document.getElementById('map'));	
	map.addTypeControl(); 	
	map.addZoomLong();    		
	map.addPanControl();  
	
	// Capture events that require drawing
	YEvent.Capture(map, EventsList.endMapDraw, function(resultObj) { 
		domMgr.drawMarkers(xscopeNS.pointMarkers, xscopeNS.hiddenMarkers, map.getBoundsLatLon() );
	});
	YEvent.Capture(map, EventsList.endPan, function(resultObj) { 
		domMgr.drawMarkers(xscopeNS.pointMarkers, xscopeNS.hiddenMarkers, map.getBoundsLatLon() );
	});
	YEvent.Capture(map, EventsList.endAutoPan, function(resultObj) { 
		var currb = map.getBoundsLatLon();
		/* endAutoPan fires by popups even if the map hasn't moved when no need to redraw */
		if (uneval(lastBounds) !== uneval(currb)){ 
			domMgr.drawMarkers(xscopeNS.pointMarkers, xscopeNS.hiddenMarkers, currb );
			lastBounds = currb;
		}
	});
	
	YEvent.Capture(map, EventsList.onEndGeoCode, function(resultObj) {
		/* An event to  make the map update the address cache whenever it can.
		 * Also notifies user of geoError
		 */
		var updateCache = false
		for(key in xscopeNS.geoMarkers){
			updateCache = true;
			break;
		}
		if(updateCache ){
			if( resultObj.success ){
			 	// NB. KML wants LONGITUDE,LATITUDE
			 	//jsdump('Caching coordinates for ' + resultObj.Address );
			 	var addrhash = resultObj.Address; //str_md5( resultObj.Address );
			 	var cachestr = resultObj.GeoPoint.Lon + ',' + resultObj.GeoPoint.Lat;
			 	cacheMgr.setItem(addrhash, cachestr);
			} else {
				// Geocoding didn't succeed.
			 	// A wierd issue (race I think), doing the alert in here.
				if(xscopeNS.flags.warnGeocodingError === true){
					xscopeNS.flags.warnGeocodingError = false;
					alert('Some addresses couldn\'t be geocoded to \ncoordinates and are not shown.');
				}
			 	domMgr.warningGeocodingError(true, resultObj.Address );
			}
		}
	});
	
	YEvent.Capture(map, EventsList.onEndGeoCode, function(resultObj) {
		if(resultObj.success){
			$.each( xscopeNS.geoMarkers, function(key, mkr){
			/* Move successfully geocoded marker into hiddenMarkers and remove them from the map.
			 */
				jsdump('testing mkr.YGeoPoint.Lat & mkr.YGeoPoint.Lon for non zero:\n' + mkr.YGeoPoint.Lat +', '+ mkr.YGeoPoint.Lon );
				if( mkr.YGeoPoint.Lat !== 0 && mkr.YGeoPoint.Lon !== 0){
					//jsdump('Moving marker ' + key + ' from geo to hiddenMarkers.');
					xscopeNS.hiddenMarkers[key] = xscopeNS.geoMarkers[key];
					map.removeOverlay(xscopeNS.geoMarkers[key]);
					delete xscopeNS.geoMarkers[key];
					return false; //break $.each() iteration
				}
			});
		}else{
			/* Move ungeocoded markers to one side so that that it doesn't keep retrying to geocode them.
			 */
			$.each(xscopeNS.geoMarkers, function(key, mkr){
				if(typeof(mkr.on1map_geocodeAddress) !== 'undefined'){
					if($.trim(mkr.on1map_geocodeAddress.toUpperCase() ) === $.trim(resultObj.Address.toUpperCase() ) ){
						//jsdump('Moving marker ' + key + ' from geo to errorMarkers.');
						xscopeNS.errorMarkers[key] = xscopeNS.geoMarkers[key];
						delete xscopeNS.geoMarkers[key];
						return false; //break $.each() iteration
					}
				}
			});
		}
	});
	

	var homeloc = new YGeoPoint(51.496439,-0.244269); //Goldhawk Road, London
	map.drawZoomAndCenter( homeloc, 7);
	lastBounds = map.getBoundsLatLon();
	
	domMgr.drawInitMarkers(true, function(){
		return true;
	});
	
	xscopeNS.flags.scrollOnGeocodeSuccess = true;
	domMgr.drawInitPointlessMarkers(true, function(){
		
		// These are here coz it's the last thing to happen
		domMgr.drawMarkers( xscopeNS.pointMarkers, 
							xscopeNS.hiddenMarkers, 
							map.getBoundsLatLon() );
		// If any markers exist by now, pan to one
		domMgr.initPan();
		$('#sel_change_pin_label').trigger( 'change');
	});
});
