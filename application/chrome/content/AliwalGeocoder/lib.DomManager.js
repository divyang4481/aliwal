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
function DomManager(){
	/* A namespace for DOM functionality */
	
	var that = this; // http://javascript.crockford.com/private.html
	
	this.tagsetnum=0;
	this.pinLabels = [];
	
	this.drawMarkers = function( pVisibleMarkers, pHiddenMarkers, pBounds ){
		/* Takes a hash of marker objects and puts them on the map.
		 * Privileged method.
		 */
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
		$('#sel_change_pin_label').trigger( 'change');
	}
	
	this.drawPinCounts = function( pVisCount, pTotCount ){
		$('#feedback_pincounts').text( pVisCount + ' / ' + pTotCount );
	}
	
	this.drawInitMarkers = function( pPoll, pCallback){
		/* If pPoll then wait until xscopeNS.flags.loadingData is finished.
		 * Privileged method.
		 */
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
	
	this.drawInitPointlessMarkers = function( pPoll, pCallback ){
		/* Markers without coordinates are plonked onto the map and left there until
		 * their geocoding comes back.
		 * Privileged method.
		 */
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
	 * Special case for options with class 'selectany'
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
