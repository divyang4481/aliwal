Components.utils.import("resource://app/modules/xscope.jsm");

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

function drawMarkers( pPoll){
	/* Want to start drawing markers as soon as data starts arriving 
	 * So use xscope.pinList like a fifo buffer, DataManager pushes onto the end, 
	 * drawMarkers shifts off of the begining 
	 */
	var redraw = xscopeNS.flags.loadingData;
	 
	while( xscopeNS.pinList.length > 0){
		var fm = xscopeNS.pinList.shift();
		var nm = markerMgr.createMarker( fm );
		map.addOverlay(nm);
		xscopeNS.markers.push( nm );
		

	}

	// This only works via the markers array. Some scope issue if in loop above	
	$.each(xscopeNS.markers, function(idx, val){	
		// Sort out the smartWindow
		YEvent.Capture( val, EventsList.MouseClick, function(){
			val.openSmartWindow('<blink>Loading...</blink>');
			domMgr.setPopupLabel( val, domMgr.getPopupDetails() );
		});
	});
	
	// Trigger a clicked event to set the intial pin labels
	$('#sel_change_pin_label').trigger( 'change');
			
	if( redraw) {
		if(pPoll){
			/*There's more data coming so sleep for a bit and then recurse */
			window.setTimeout( drawMarkers,1000,true);
		}
	}
}

function drawControls( pPoll ){
	var redraw = xscopeNS.flags.loadingData;
	
	// Filtering stuff
	var labels = [];
	for (var pi in xscopeNS.pinItems){
		labels.push(pi);
	}
	
	var tagdata = xscopeNS.pinTagSets;
	var html = '<table id="tbl_filters"></table>';
	$("#div_filters").empty();
	$("#div_filters").append(html);

 	var filcnt = 0;
	$.each( tagdata, function(tagset, tags){
		html = '<tr><td id="divFilter_' + filcnt + '"></td></tr>';
		$('#tbl_filters').append(html);
		domMgr.drawTagsetFilter('divFilter_' + filcnt, tagset, tagdata );
		filcnt++;
	});
	
	// Attach an event handler to the filter stuff
	$('.tagset_filter').bind('change', function(e){
		var filterset = domMgr.getSelectedFilters();
		markerMgr.showHideMarkers( xscopeNS.markers, filterset );
	});
	
	// Pin stuff
	domMgr.drawLabelSelector('pin_label_selector', labels );
	$('#sel_change_pin_label').bind( 'change', function(e){
		markerMgr.setPinLabels( xscopeNS.markers, this.value );
	});

	// Popup Selectors	
	domMgr.drawPopupSelector('pin_popup_switches', labels );	

	if( redraw ){ 
		if(pPoll){
			jsdump( 'Setting drawControls polling. xscopeNS.loadingData = ' + xscopeNS.loadingData );
			window.setTimeout( drawControls, 1000, true);
		}
	}

}


/* ****************************************************************************************************************************** */
function DomManager(){
	/* A namespace for DOM functionality */
	this.tagsetnum=0;
}
DomManager.prototype.drawLabelSelector = function( pDivId, pLabels ){
	/* Args: The string id of the div and an array of label options */
	var dd = $('#' + pDivId);
	dd.empty();
	var sel = '<SELECT id="sel_change_pin_label">';
	$.each( pLabels, function(i,val){
		sel += '<OPTION>'+val+'</OPTION>\n';
	});
	sel += '</SELECT>';
	if( pLabels.length > 0){
		dd.append( sel );
	} else {
		dd.append('<div class="warn">No data</div>');
		this.log('No pin labels found in data', 'INFO');
	}
}
DomManager.prototype.drawPopupSelector= function( pDivId, pLabels){
	/* Args: The string id of the div and and an array of label options */
	var dd = $('#' + pDivId);
	dd.empty();
	var html = '';	
	$.each( pLabels, function(i, val){
		html += '<UL id="ul_popup_selector">';
		html += '<LI><input class="cb_popup_selector"  type="checkbox" checked="checked" value="'+val+'">'+val+'</LI>';
		html += '</UL> \n';
	});
	if( pLabels.length > 0){
		dd.append( html );
	} else {
		dd.append('<div class="warn">No data</div>');
	}
}
DomManager.prototype.getPopupDetails = function( ){
	/* returns an array of members that should be shown in popups */
	var ret = new Array();
	$('.cb_popup_selector:checked').each(function(i,v){
		ret.push( $(v).val() );
	});
	return ret;
}
DomManager.prototype.drawTagsetFilter = function( pDivId, pTag, pTagData){
	/* Draws a filter for a tagset. Where to draw it is pDivId, which tagset is pTag.
	 * pTagData is the nested hash as defined in DataManager.getTags.
	 */
	var dd = $('#' + pDivId);
	dd.empty();
	var labl = '<label class="label_sub">' + pTag + '</label>';
	dd.append(labl);
	
	var sellen = 7;
	var sel = '<SELECT class="tagset_filter" tagset="'+pTag+'" id="sel_filter_'+this.tagsetnum+'" size="' + sellen + '" MULTIPLE>\n';
	$.each( pTagData[pTag], function(key,val){
		sel += '<OPTION SELECTED value="'+key+'">'+key+'     ('+pTagData[pTag][key]+')</OPTION>\n';
	});
	sel += '</SELECT>\n';
	dd.append(sel);
	this.tagsetnum++;
}
DomManager.prototype.setPopupLabel = function( pObj, pDets ){
	/* Takes an enriched marker and sets its popup contents to the
	 * on1data value named pPopupAttrib
	 */
	var html = '<table class="tbl_popup_details">';
	$.each( pDets, function(idx, val){
		html += '<tr><td></td>' + pObj.on1data.ExtendedData[val] + '</tr>\n';
	});
	html += '</table>';	
	pObj.updateSmartWindow( html );
}
DomManager.prototype.getSelectedFilters = function(){
	/* Returns an object. Members are named after the tagsets, their value is the array of selected options 
	 */
	var ret = {};
	$('.tagset_filter' + ' option:selected').each(function(i,v){
		var tagset =  $(v).parent().attr('tagset');
		if (typeof(ret[tagset]) === 'undefined'){
			ret[tagset] = new Array();
		} 
		ret[tagset].push( $(v).val() );
	});
	return ret;
}
DomManager.prototype.hideShowOptions = function( pId, pChecked){
	/* Takes the ID of the checkbox and hides or shows everything in that div except the triggering element ( usually checkbox pId) 
	 * */
	var dd = $('#' + pId ).siblings().not('label');
	pChecked ? dd.slideDown(20): dd.slideUp(20);
}
DomManager.prototype.log = function( pMsg, pClass){
	if(!pClass){
		pClass = 'INFO';
	}
	var img;
	
	switch( pClass.toUpperCase() ){
		case 'INFO':
			img = '<IMG class="img_log_msg_type" src="icons/log_info.png" >';
			break;
		case 'WARN':
			img = '<IMG class="img_log_msg_type" src="icons/log_warning.png" >';
			break;
		case 'ERROR':
			img = '<IMG class="img_log_msg_type" src="icons/log_error.png" >';
			break;
		default:
			img = '<IMG class="img_log_msg_type" src="icons/log_default.png" >';
			break;
	}
	var html = '<p>' + img  + '&nbsp;' + pMsg + '</p>';
	$('#messagebox').prepend(html);
}

/* ****************************************************************************************************************************** */
function MarkerManager(){
	/* Namespace for for markers functions */
}
MarkerManager.prototype.createMarker = function( pObj ){
	/* Takes an object, creates a YMarker for it and copies the object members into
	 * a special "on1data" member of the new marker.
	 * This means that each marker holds all of it's on1map data.
	 * Expects the object to have one of either:
	 *   both a "latitude" & "longitude" member.
	 *         or 
	 *   an address member ( named as per _addrMember ) suitable for geocoding.
	 * If no latitude & longitude but there is an address, then check it that address has been cached.
	 * The object should be flat.
	 */
	const _addrMember = 'GeocodeAddress';
	var cacheMgr = new CacheManager();
	var ret;
	
	// 1.) Try asking the pObj if it has coordinates 
	if ( typeof( pObj.Point) !== 'undefined' ){
		if( typeof(pObj.Point.coordinates) !== 'undefined'){
			var spl = pObj.Point.coordinates.split(',');
			var geo = new YGeoPoint( spl[0], spl[1] );
			jsdump('Cache hit. Going with cache data for address:\n' + pObj.ExtendedData[_addrMember] );
			ret = new YMarker( geo );
		}
	}
	
	if (typeof(ret) === 'undefined'){
		ret = new YMarker( pObj.ExtendedData[_addrMember] );
	}
	
	// Add the on1data to the marker
	ret.on1data = eval(uneval( pObj));
		
	return ret;
}
MarkerManager.prototype.showHideMarkers = function( pMarkers, pFilterSets ){
	/* pFilterSets =  {  	'Tagset1': ['selected_filter1','selected_filter2','etc'],
	 * 						'Tagset2': ['another_selection1','another_selection2','etc'], 
	 * 					};
	 * Loops through all of the markers and hides them, then 
	 * with each marker, run thorugh the tagsets and look for that as a memeber on the marker.
	 * If any matches are found, the marker should be shown
	 */
	$.each( pMarkers, function( midx, ymarker){
		ymarker.hide();
		for(var tagset in pFilterSets){
			$.each(pFilterSets[tagset], function(id0, filterval){
				if( ymarker.on1data.ExtendedData[tagset] === undefined ){
					//return null;
				} else {
					$.each( ymarker.on1data.ExtendedData[tagset], function(idx, markerval){
						if( markerval === filterval ){
							ymarker.unhide();
						}
					});
				}
			});
		}
	});
}
MarkerManager.prototype.setPinLabel = function( pObj, pLabelAttrib ){
	/* Takes an enriched marker and sets its autoexpand / label to the
	 * on1data value named pLabelAttrib
	 */
	 if( typeof( pObj.on1data.ExtendedData[ pLabelAttrib ]) !== 'undefined'){
	 	pObj.addAutoExpand( pObj.on1data.ExtendedData[ pLabelAttrib ] );
	 }
}
MarkerManager.prototype.setPinLabels = function( pArr, pLabelAttrib ){
	/* Takes an array of enriched markers and sets their autoexpand / label to the
	 * on1data value named pLabelAttrib
	 */
	 var that = this;
	 $.each(pArr, function(idx, val){
	 	that.setPinLabel(val, pLabelAttrib );
	 });
}
MarkerManager.prototype.setPopupLabels = function( pArr, pPopupAttribArr ){
	/* Takes an array of enriched markers and sets their popup contents to the
	 * on1data values named pPopupAttribArr
	 */
	 var that = this;
	 $.each( pArr, function(idx, val){
	 	that.setPopupLabel(val, pPopupAttribArr )
	 });
}


/* ****************************************************************************************************************************** */

/* ****************************************************************************************************************************** */

$(document).ready( function(){
/* Start with things that don't need a net connection */

	// Attach an event handler to ALL of the options hideshow checkboxes
	$('.cb_hideshow_option').bind( 'change', function(e){
		domMgr.hideShowOptions( this.id, this.checked );
	});	
	
	drawControls( true );
	
	/* 
	 * get the map sorted out 
	 */

	// Create a Map that will be placed in the "map" div.
	map = new YMap(document.getElementById('map'));

	// Add the ability to change between Sat, Hybrid, and Regular Maps
	map.addTypeControl(); 	
	// Add the zoom control. Long specifies a Slider versus a "+" and "-" zoom control
	map.addZoomLong();    		
	// Add the Pan control to have North, South, East and West directional control
	map.addPanControl();  
	// Specifying the Map starting location and zoom level
	var homeloc = new YGeoPoint(51.496439,-0.244269); //Goldhawk Road, London
	map.drawZoomAndCenter( homeloc, 7);
	
	// Make the map update the address cache whenever it can.
	YEvent.Capture(map, EventsList.onEndGeoCode, function(resultObj) {
		/* Thanks: http://josephsmarr.com/2007/03/20/handling-geocoding-errors-from-yahoo-maps/
		 */
		 
		 if( resultObj.success ){
		 	// Cache the co-ordinates in storage.
		 	var addrhash = resultObj.Address; //str_md5( resultObj.Address );
		 	var cachestr = resultObj.GeoPoint.Lat + ',' + resultObj.GeoPoint.Lon;
		 	cacheMgr.setItem(addrhash, cachestr);
		 } else {
		 	domMgr.log('Couldn\'t map address: '+resultObj.Address , 'WARN' );
		 }
	});
	
	drawMarkers( true );
});

