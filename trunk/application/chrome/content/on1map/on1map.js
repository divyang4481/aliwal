Components.utils.import("resource://app/modules/xscope.jsm");

var dataMgr = new DataManager();
var markerMgr = new MarkerManager();
var domMgr = new DomManager();
var cacheMgr = new CacheManager();
var map;

function jsdump(str)
{
	/* Thanks: http://developer.mozilla.org/en/docs/Debugging_a_XULRunner_Application */
  Components.classes['@mozilla.org/consoleservice;1']
            .getService(Components.interfaces.nsIConsoleService)
            .logStringMessage(str);
}

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
		//jsdump('Event: endMapDraw:\n' + uneval(null) ); 
		domMgr.drawMarkers(xscopeNS.domMarkers, xscopeNS.hiddenMarkers, map.getBoundsLatLon() );
	});
	YEvent.Capture(map, EventsList.changeZoom, function(resultObj) { 
		//jsdump('Event: changeZoom:\n' + uneval(null) ); 
		//domMgr.drawMarkers(xscopeNS.domMarkers, xscopeNS.hiddenMarkers, map.getBoundsLatLon() );
	});
	YEvent.Capture(map, EventsList.endPan, function(resultObj) { 
		//jsdump('Event: endPan:\n' + uneval(null) ); 
		domMgr.drawMarkers(xscopeNS.domMarkers, xscopeNS.hiddenMarkers, map.getBoundsLatLon() );
	});
	YEvent.Capture(map, EventsList.endAutoPan, function(resultObj) { 
		//jsdump('Event: endAutoPan:\n' + uneval(null) ); 
		domMgr.drawMarkers(xscopeNS.domMarkers, xscopeNS.hiddenMarkers, map.getBoundsLatLon() );
	});
	YEvent.Capture(map, EventsList.onEndGeoCode, function(resultObj) {
		/* Make the map update the address cache whenever it can.
		 * Thanks: http://josephsmarr.com/2007/03/20/handling-geocoding-errors-from-yahoo-maps/
		 */
		 if( resultObj.success ){
		 	// Cache the coordinates in storage.
		 	var addrhash = resultObj.Address; //str_md5( resultObj.Address );
		 	var cachestr = resultObj.GeoPoint.Lat + ',' + resultObj.GeoPoint.Lon;
		 	cacheMgr.setItem(addrhash, cachestr);
		 } else {
		 	domMgr.log('Couldn\'t map address: '+resultObj.Address , 'WARN' );
		 }
	});
		
	markerMgr.createMarkersFromDom(xscopeNS.KML, xscopeNS.hiddenMarkers, function(){
			/* Scope of "this" will have changed to the YMarker object by the time this gets invoked. */
			this.openSmartWindow('<blink>Loading...</blink>');
			markerMgr.setPopupLabel( this, domMgr.getPopupSelection() );
	});
	
	// Specifying the Map starting location and zoom level
	var homeloc = new YGeoPoint(51.496439,-0.244269); //Goldhawk Road, London
	map.drawZoomAndCenter( homeloc, 7);

	// Trigger a clicked event to set the intial pin labels
	$('#sel_change_pin_label').trigger( 'change');
	
});

