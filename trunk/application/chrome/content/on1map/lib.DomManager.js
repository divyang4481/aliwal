/* ****************************************************************************************************************************** */
function DomManager(){
	/* A namespace for DOM functionality */
	this.tagsetnum=0;
}
DomManager.prototype.inBounds = function( pBounds, pLat, pLon ){
	/* Returns a boolean if pLat & pLon are inside pBounds.
	 */
	if( (pLat <= pBounds.LatMax) &&
		(pLat >= pBounds.LatMin) &&
		(pLon <= pBounds.LonMax) &&
		(pLon >= pBounds.LonMin) ){
		return true;
	}
	//jsdump('Out of bounds:');
	return false;
}
DomManager.prototype.drawMarkers = function( pVisibleMarkers, pHiddenMarkers, pBounds ){
	/* Takes a hash of marker objects, to them and puts them on the map.
	 */
	var that = this;
	var fils = that.getFilterSelection();
	var visicount = 0;
	
	
	for( var key in pVisibleMarkers ){	
		if( that.inBounds(pBounds, pVisibleMarkers[key].YGeoPoint.Lat, pVisibleMarkers[key].YGeoPoint.Lon) 
		  && markerMgr.unfilteredMarker(pVisibleMarkers[key], fils) ){
			// leave already visible,inBounds&unfiltered alone
			visicount++;
		} else {
			// Remove visible&(filtered or out of bounds ) to hidden
			//jsdump('Moving from visible to hidden: ' + pVisibleMarkers[key].id );
			pHiddenMarkers[key] = pVisibleMarkers[key];
			map.removeOverlay(pVisibleMarkers[key]);
			delete pVisibleMarkers[key];
		}
	}
	try{	
		for( var key in pHiddenMarkers ){
			if( that.inBounds(pBounds, pHiddenMarkers[key].YGeoPoint.Lat, pHiddenMarkers[key].YGeoPoint.Lon)
			 	&& markerMgr.unfilteredMarker(pHiddenMarkers[key], fils) ){
				if ( visicount <= 599 ){
					//jsdump('Moving from hidden to visible: ' + pHiddenMarkers[key].id );
					pVisibleMarkers[key] = pHiddenMarkers[key];
					map.addOverlay(pVisibleMarkers[key]);
					delete pHiddenMarkers[key];
				} else {
					throw 'Map density ceiling';
				}
			}
		}
	} catch(e){
		jsdump('Only the 1st 599 markers within this map area shown.\nTry zooming to avoid this limit.');
	}
	// Trigger a clicked event to set the intial pin labels
	$('#sel_change_pin_label').trigger( 'change');
}
DomManager.prototype.drawControls = function( pPoll ){
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
		domMgr.drawMarkers( xscopeNS.domMarkers, xscopeNS.hiddenMarkers, map.getBoundsLatLon() );
	});
	
	// Pin label stuff
	domMgr.drawLabelSelector('pin_label_selector', labels );
	$('#sel_change_pin_label').bind( 'change', function(e){
		markerMgr.setPinLabels( xscopeNS.domMarkers, this.value );
	});

	// Popup Selectors	
	domMgr.drawPopupSelector('pin_popup_switches', labels );	

	if( redraw ){ 
		if(pPoll){
			jsdump( 'Setting drawControls polling. xscopeNS.flags.loadingData = ' + xscopeNS.flags.loadingData );
			window.setTimeout( drawControls, 1000, true);
		}
	}
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
DomManager.prototype.getPopupSelection = function( ){
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
DomManager.prototype.getFilterSelection = function(){
	/* Returns an object. Members are named after the tagsets, their value is the array of selected tags 
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

