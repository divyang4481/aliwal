/* ****************************************************************************************************************************** */
function DomManager(){
	/* A namespace for DOM functionality */
	this.tagsetnum=0;
}
DomManager.prototype.warningPinCeiling = function( pSet ){
	if(pSet){
		if(xscopeNS.flags.warnPinCountError){
			//ToDo, move xscopeNS ... to an argument 
			alert('Only the 1st 200 markers within this map area are shown.\nZoom or filter to avoid this limit.');
			xscopeNS.flags.warnPinCountError = false;
		}
		$('#feedback_pin_ceiling').fadeOut('fast');
		$('#feedback_pin_ceiling').attr('src','icons/pin_ceiling_warn.png');
		$('#feedback_pin_ceiling').attr('title','Too many pins');
		$('#feedback_pin_ceiling').fadeIn('slow');
		
		
	} else if ( $('#feedback_pin_ceiling').attr('src') !== 'icons/pin_ceiling_ok.png' ){
		$('#feedback_pin_ceiling').fadeOut('fast');
		$('#feedback_pin_ceiling').attr('src','icons/pin_ceiling_ok.png');
		$('#feedback_pin_ceiling').attr('title','Number of pins OK');
		$('#feedback_pin_ceiling').fadeIn('slow');
	}
}
DomManager.prototype.warningGeocodingError = function( pSet, pAddress ){
	if(pSet){
		$('#feedback_geocoding_err').fadeOut('fast');
		$('#feedback_geocoding_err').attr('src','icons/geocoding_warn.png');
		$('#feedback_geocoding_err').attr('title','Geocoding errors');
		$('#feedback_geocoding_err').fadeIn('slow');
		jsdump('Couldn\'t geocode address ' + pAddress );
	} else if ( $('#feedback_geocoding_err').attr('src') !== 'icons/geocoding_ok.png' ){
		$('#feedback_geocoding_err').fadeOut('fast');
		$('#feedback_geocoding_err').attr('src','icons/geocoding_ok.png');
		$('#feedback_geocoding_err').attr('title','Geocoding OK');
		$('#feedback_geocoding_err').fadeIn('slow');
	}
}
DomManager.prototype.inBounds = function( pBounds, pLat, pLon ){
	/* Returns a boolean if pLat & pLon are inside pBounds.
	 */
	if ( (pLat < pBounds.LatMax) &&
		 (pLat > pBounds.LatMin) &&
		 (pLon < pBounds.LonMax) &&
		 (pLon > pBounds.LonMin) ) {
					return true;
	}
	return false;
}
DomManager.prototype.drawMarkers = function( pVisibleMarkers, pHiddenMarkers, pBounds ){
	/* Takes a hash of marker objects, to them and puts them on the map.
	 */
	var that = this;
	var fils = that.getFilterSelection();
	var visicount = 0;
	this.warningPinCeiling(false);
	
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
					if ( visicount < 200 ){
						//jsdump('Moving from hidden to visible: ' + pHiddenMarkers[key].id );
						visicount++;
						pVisibleMarkers[key] = pHiddenMarkers[key];
						map.addOverlay(pVisibleMarkers[key]);
						delete pHiddenMarkers[key];	
					} else {
						throw 'Map density ceiling';
				 	}
				}
			} else if( pHiddenMarkers[key].YGeoPoint.Lat === 0 && pHiddenMarkers[key].YGeoPoint.Lon === 0 ){
				// The marker has been created but not yet geocoded. Add it to the map and 
				// leave it alone until it's been geocoded.
				visicount++;
				pVisibleMarkers[key] = pHiddenMarkers[key];
				map.addOverlay(pVisibleMarkers[key]);
				delete pHiddenMarkers[key];	
			}
		}
	} catch(e){
		this.warningPinCeiling(true);
	}
	var totalcount = 0;
	for(var m in pVisibleMarkers){
		totalcount++;
	}
	for(var m in pHiddenMarkers){
		totalcount++;
	}
	$('#feedback_pincounts').text(visicount + ' / ' + totalcount);
}

DomManager.prototype.drawInitMarkers = function( pPoll, pCallback){
	var that = this;
	if( pPoll){
		if(xscopeNS.flags.loadingData){
			setTimeout( that.drawInitMarkers,555, true, pCallback );
		} else {
			setTimeout( that.drawInitMarkers,1, false, pCallback );
		}
	} else {
		dataMgr.emptyObj( xscopeNS.pointMarkers );
		dataMgr.emptyObj( xscopeNS.hiddenMarkers );
		try{
			markerMgr.createDomPointMarkers(xscopeNS.KML, xscopeNS.hiddenMarkers );
		} catch(e){
			jsdump('Exception:\n'+e);
		}
		pCallback.call(that);
	}
}
DomManager.prototype.drawInitPointlessMarkers = function( pPoll, pCallback ){
	/* Markers without coordinates are plonked until the map and left there until
	 * their geocoding comes back.
	 */
	var that = this;
	if( pPoll){
		if(xscopeNS.flags.loadingData){
			setTimeout( that.drawInitPointlessMarkers,555, true, pCallback );
		} else {
			setTimeout( that.drawInitPointlessMarkers,1, false, pCallback );
		}
	} else {
		dataMgr.emptyObj( xscopeNS.geoMarkers );
		dataMgr.emptyObj( xscopeNS.errorMarkers );
		try{
			markerMgr.createDomGeocodeMarkers(xscopeNS.KML, xscopeNS.geoMarkers );
		} catch(e){
			jsdump('Exception:\n'+e);
		}
		$.each(xscopeNS.geoMarkers, function(key, mkr){
			map.addOverlay(xscopeNS.geoMarkers[key]);
		});
		pCallback.call(that);
	}
}
DomManager.prototype.initPan = function(){
	// Specifying the Map starting location and zoom level
	if ( xscopeNS.flags.scrollOnGeocodeSuccess){
		for(var key in xscopeNS.hiddenMarkers){
			// They're all hidden at this point
			if(xscopeNS.hiddenMarkers[key].YGeoPoint){
				if( xscopeNS.hiddenMarkers[key].YGeoPoint.Lat !== 0 && xscopeNS.hiddenMarkers[key].YGeoPoint.Lon !== 0){
					var homeloc = xscopeNS.hiddenMarkers[key].YGeoPoint;
					xscopeNS.flags.scrollOnGeocodeSuccess = false;
					map.drawZoomAndCenter( homeloc, 7);
					break; // Only want 1st good marker
				}
			}
		}
	}
}
DomManager.prototype.drawControls = function( pPoll){
	var that = this;
	if( pPoll){
		if(xscopeNS.flags.loadingData){
			setTimeout( that.drawControls,555, true );
		} else {
			setTimeout( that.drawControls,1, false );
		}
	} else {
		// Filtering stuff
		var pinTagSets = dataMgr.domTagSetCensus( xscopeNS.KML );
			
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
			domMgr.drawMarkers( xscopeNS.pointMarkers, xscopeNS.hiddenMarkers, map.getBoundsLatLon() );
		});
		
		// Pin label stuff
		var pinItems = dataMgr.domLabelCensus( xscopeNS.KML );	
		var labels = [];
		for (var pi in pinItems){
			labels.push(pi);
		}
		domMgr.drawLabelSelector('pin_label_selector', labels );
		$('#sel_change_pin_label').bind( 'change', function(e){
			markerMgr.setPinLabels( xscopeNS.pointMarkers, this.value );
		});
	
		// Popup Selectors	
		domMgr.drawPopupSelector('pin_popup_switches', labels );	
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
		jsdump('No pin labels found in data');
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
	
	var options = [];
	$.each( pTagData[pTag], function(key,val){
		options.push( '<OPTION value="'+key+'">'+key+'     ('+pTagData[pTag][key]+')</OPTION>\n');
	});
	options.sort();
	options.unshift('<OPTION class="tagset_selectany" SELECTED > --ANY-- </OPTION>\n');
	
	var sellen = 7;
	var sel = '<SELECT class="tagset_filter" tagset="'+pTag+'" id="sel_filter_'+this.tagsetnum+'" size="' + sellen + '" MULTIPLE>\n';
	$.each( options, function(idx, opt){
		sel += opt;
	});
	sel += '</SELECT>\n';
	dd.append(sel);
	
	this.tagsetnum++;
}
DomManager.prototype.getFilterSelection = function(){
	/* Returns an object. Members are named after the tagsets, their value is the array of selected tags 
	 * Must return an empty array for tagsets with no selections. No tagsets implies no filtering at all.
	 * Special case for options with class 'selectall'
	 */
	var ret = {};
	$('SELECT.tagset_filter').each(function(i,v){
		var tagset =  $(v).attr('tagset');
		ret[tagset] = new Array();
	});
	$('SELECT.tagset_filter').each(function(i,v){
		if( $(v).children('OPTION.tagset_selectany:selected').length > 0 ){
			// Remove the tagset all together so induce --ANY-- behaviour
				delete ret[ $(v).attr('tagset') ];
		} else {
			$(v).children('OPTION:selected').not('.tagset_selectany').each(function(ii,vv){
				ret[ $(v).attr('tagset') ].push( $(vv).val() );
			});
		}
	});
	
	return ret;
}
DomManager.prototype.hideShow2 = function(pId){
	var ctl = $('#'+pId);
	var victims = ctl.siblings();

	if( ctl.attr('state') === 'HIDDEN'){
		victims.slideDown(20);
		ctl.attr('state','SHOWN');
		ctl.find('.hideshowicon>img').attr('src','icons/minimize_option.png');
	} else{ 
		victims.slideUp(20);
		ctl.attr('state','HIDDEN');
		ctl.find('.hideshowicon>img').attr('src','icons/maximize_option.png');
	}
}
