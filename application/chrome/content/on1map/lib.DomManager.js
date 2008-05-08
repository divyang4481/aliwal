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
DomManager.prototype.drawMarkers = function( pMarkers, pBounds ){
	/* Takes a hash of marker objects, to them and puts them on the map.
	 * Address geocoded markers can arrive here, before they've been encoded with cooordinates. 
	 * This stumps inBounds() logic etc, hence lat&lon===0 case.
	 */
	var that = this;
	var fils = that.getFilterSelection();
	var visicount = 0;
	try{
		for( var key in pMarkers ){
			if( !pMarkers[key].on1map_visible && pMarkers[key].YGeoPoint.Lat === 0 && pMarkers[key].YGeoPoint.Lon === 0 ){
				// The marker has been created but not yet geocoded. Add it to the map and 
				// leave it alone until it's been geocoded.
				pMarkers[key].on1map_visible = true;
				map.addOverlay(pMarkers[key]);
			} else {
				if(pMarkers[key].on1map_visible){
					if( that.inBounds(pBounds, pMarkers[key].YGeoPoint.Lat, pMarkers[key].YGeoPoint.Lon) 
					  && markerMgr.unfilteredMarker(pMarkers[key], fils) ){
						// leave already visible,inBounds&unfiltered alone
						visicount++;
					} else {
						// Remove visible&(filtered or out of bounds ) to hidden
						//jsdump('Moving from visible to hidden: ' + pMarkers[key].id );
						pMarkers[key].on1map_visible = false;
						map.removeOverlay(pMarkers[key]);
					}
				} else {
					// Marker is not currently visible
					if( that.inBounds(pBounds, pMarkers[key].YGeoPoint.Lat, pMarkers[key].YGeoPoint.Lon) ){
						if( markerMgr.unfilteredMarker(pMarkers[key], fils) ){
							if ( visicount < 600 ){
								//jsdump('Moving from hidden to visible: ' + pMarkers[key].id );
								visicount++;
								pMarkers[key].on1map_visible = true;
								map.addOverlay(pMarkers[key]);
							} else {
								throw 'Map density ceiling';
						 	}
						}
					}
				}
			}
		}
	} catch(e){
		jsdump(e);
		jsdump('Only the 1st 599 markers within this map area shown.\nTry zooming or filtering to avoid this limit.');
	}
}
DomManager.prototype.drawMarkers_bak = function( pVisibleMarkers, pHiddenMarkers, pBounds ){
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
			if( that.inBounds(pBounds, pHiddenMarkers[key].YGeoPoint.Lat, pHiddenMarkers[key].YGeoPoint.Lon) ){
				if( markerMgr.unfilteredMarker(pHiddenMarkers[key], fils) ){
					if ( visicount < 600 ){
						//jsdump('Moving from hidden to visible: ' + pHiddenMarkers[key].id );
						visicount++;
						pVisibleMarkers[key] = pHiddenMarkers[key];
						map.addOverlay(pVisibleMarkers[key]);
						delete pHiddenMarkers[key];	
					} else {
						throw 'Map density ceiling';
				 	}
				}
			}
		}
	} catch(e){
		jsdump('Only the 1st 599 markers within this map area shown.\nTry zooming or filtering to avoid this limit.');
	}
}
DomManager.prototype.drawControls = function(){
	
	var pinItems = dataMgr.domLabelCensus( xscopeNS.KML );	
	var pinTagSets = dataMgr.domTagSetCensus( xscopeNS.KML );
	
	// Filtering stuff
	var labels = [];
	for (var pi in pinItems){
		labels.push(pi);
	}
	
	var html = '<table id="tbl_filters"></table>';
	$("#div_filters").empty();
	$("#div_filters").append(html);

 	var filcnt = 0;
	$.each( pinTagSets, function(tagset, tags){
		html = '<tr><td id="divFilter_' + filcnt + '"></td></tr>';
		$('#tbl_filters').append(html);
		domMgr.drawTagsetFilter('divFilter_' + filcnt, tagset, pinTagSets );
		filcnt++;
	});
	
	// Attach an event handler to the filter stuff
	$('.tagset_filter').bind('change', function(e){
		domMgr.drawMarkers( xscopeNS.domMarkers, map.getBoundsLatLon() );
	});
	
	// Pin label stuff
	domMgr.drawLabelSelector('pin_label_selector', labels );
	$('#sel_change_pin_label').bind( 'change', function(e){
		markerMgr.setPinLabels( xscopeNS.domMarkers, this.value );
	});

	// Popup Selectors	
	domMgr.drawPopupSelector('pin_popup_switches', labels );	
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
DomManager.prototype.hideShow2 = function(pId){
	var ctl = $('#'+pId);
	var victims = ctl.siblings();

	if( ctl.attr('state') === 'HIDDEN'){
		victims.slideDown(20);
		ctl.attr('state','SHOWN');
		ctl.find('.hideshowicon>img').attr('src','images/red_cross_circle.png');
	} else{ 
		victims.slideUp(20);
		ctl.attr('state','HIDDEN');
		ctl.find('.hideshowicon>img').attr('src','images/green_tick_circle.png');
	}
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

