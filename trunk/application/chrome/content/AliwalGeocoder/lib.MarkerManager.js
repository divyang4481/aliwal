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
function MarkerManager(){
	/* Namespace for for markers functions */
	
	var that = this; // http://javascript.crockford.com/private.html

	// Privileged methods
	this.createDomPointMarkers = function( pKML, pDest ){
		/* Populates a hash of marker objects ready to be dropped onto the map.
		 * The pDest hash is keyed by the YMarker.id
		 * Only handles Dom  Placemark elments with cooordinates
		 * Privileged method
		 */
		var nm;
		for(var keys in pDest){
			delete pDest[keys];
		};
		$(pKML).find('Placemark:has("Point>coordinates")').each(function(idx, pmark){
			try{
				var spl = $(pmark).find('Point>coordinates:first').text().split(',');
				if( !(isNaN(parseFloat(spl[0])) || isNaN(parseFloat(spl[1]))) ) {				
					/* NB!  KML says coordinates come LON,LAT */
					var geopoint = new YGeoPoint( spl[1], spl[0] );
					nm = new YMarker( geopoint );		
				}else {
					throw 'MarkerManager: Point.coordinates could not be parsed.\nIgnoring Placemark';
				}
				that.enrichMarker( nm, pmark );
	
				pDest[nm.id] = nm;
			} catch(e){
				jsdump(e)
			}
		});
	}
	
	this.createDomGeocodeMarkers = function( pKML, pDest ){
		/* Populates a hash of marker objects ready to be dropped onto the map.
		 * The pDest hash is keyed by the YMarker.id
		 * Only handles Dom Placemark elments with GeoCodeAddress elements AND without a cooordinates element
		 * Privileged method
		 */
		var nm;
		for(var keys in pDest){
			delete pDest[keys];
		};
		$(pKML).find('Placemark:has("ExtendedData>GeocodeAddress")').not(':has("Point>coordinates")').each(function(idx, pmark){
			try{
				var geoaddr = $.trim( $(pmark).find('ExtendedData>GeocodeAddress:first').text() );
				nm = new YMarker(geoaddr);
				nm.on1map_geocodeAddress = geoaddr;
				
				that.enrichMarker( nm, pmark );
	
				pDest[nm.id] = nm;
			} catch(e){
				jsdump(e)
			}
		});
	}
	
	that.setPopupLabels = function( pVisibleMarkers, pPopupAttribArr ){
		/* Takes an array of enriched markers and sets their popup contents to the
		 * on1data values named pPopupAttribArr
		 * Privileged method
		 */
		 $.each( pVisibleMarkers, function(idx, marker){
			that.setPopupLabel(marker, pPopupAttribArr);
		 });
	}
}

MarkerManager.prototype.enrichMarker = function( pMarker, pDomFrag ){
	/* Tags the DOM document Placemark element with attribute "on1map_markerid", the ID of the created marker.
	 * Tags the YMarker object with a jquery reference "on1map_kml_ref" into the DOM doc.
	 * Tags the YMarker object with a copy of the tag data in a native structure because refering to the 
	 * XML doc is too slow.
	 */
	$(pDomFrag).attr('on1map_markerid', pMarker.id );					
	pMarker.on1map_kml_ref = $(pDomFrag);
	
	// Copy across tag data into an array of tags, 1 array per tagset
	pMarker.on1map_tagdata = new Object();
	$(pDomFrag).find('ExtendedData>TagSet').each(function(idx,tagsetele){
		var tagset = $(tagsetele).attr('name');
		pMarker.on1map_tagdata[ tagset ] = new Array();
		$(tagsetele).children('Tag').each(function(idx2, tagele){
			pMarker.on1map_tagdata[ tagset ].push( $(tagele).text() );
		});
	});
	YEvent.Capture( pMarker, EventsList.MouseClick, function(){
			/* Scope of "this" will have changed to the YMarker object by the time this gets invoked. */
			this.openSmartWindow('<blink>Loading...</blink>');
			markerMgr.setPopupLabel( this, domMgr.getPopupSelection() );
	});
}
MarkerManager.prototype.unfilteredMarker = function( pMarker, pFilterSets ){
	/* pFilterSets =    {  	'Tagset1': ['selected_filter1','selected_filter2','etc'],
	 * 						'Tagset2': ['another_selection1','another_selection2','etc'], 
	 * 					};
	 * Changed to AND tagsets but OR individual tags within a set
	 * If all tags present, the marker should, be shown so return true.
	 * Performance critical function.
	 */
	var tscount = 0;
	var foundOuter = true;
	$.each(pFilterSets, function( filtagset, filtags ){
		tscount++;
		var foundInner = false;
		$.each(filtags, function(idx, itag ){
			if( typeof(pMarker.on1map_tagdata[filtagset]) !== 'undefined'){
				if( $.inArray(itag, pMarker.on1map_tagdata[filtagset]) >= 0 ){
					foundInner = true;
					return false ;// Found a tag for this set so break out of $.each(filtags, ...)
				}
			} else {
				return false; // marker doesn't have the necessary tagset, break out of $.each(filtags, ...)
			}
		});
		foundOuter = foundOuter && foundInner;
		return foundOuter; // Keep iterating through pFilterSets ?
	 });
	if(tscount === 0){
		// If there are no tagsets in the data, so there's no filtering
		return true;
	}
	//jsdump('Checking '+uneval(pFilterSets) +'\n against marker with tagdata: ' + uneval(pMarker.on1map_tagdata) + '\nreturning: ' + foundOuter );
	return foundOuter;
}
MarkerManager.prototype.setPinLabels = function( pVisibleMarkers, pLabelAttrib ){
	/* Takes an array of enriched markers and sets their autoexpand / label to the
	 * on1data value named pLabelAttrib
	 */
	 $.each(pVisibleMarkers, function(idx, pMarker){
		var labelstr = '<div class="marker_label">' + $(pMarker.on1map_kml_ref).find('ExtendedData>Data[name="'+pLabelAttrib+'"]>value').text() + '</div>';
		pMarker.addAutoExpand(labelstr);
	 });
}

MarkerManager.prototype.setPopupLabel = function( pMarker, pPopupAttribArr ){
	var html;
	if(pPopupAttribArr.length === 0){
		html = '<div class="marker_popup_warning"><img class="marker_popup_warning_img" src="icons/no_pin_info_warning.png" />No popup details selected</div>';
	} else {
		html = '<table class="marker_popup_table"><caption class="marker_popup_caption"></caption>';
		html += '<colgroup><col class="marker_popup_labelcol"/><col class="marker_popup_datacol"/></colgroup>';
		html += '<thead></thead><tfooter></tfooter><tbody class="marker_popup_tbody">';
		$.each( pPopupAttribArr, function(idx, val){
			html += '<tr><th class="marker_popup_th">' + val + '&nbsp;</th>\n';
			html += '<td>' + $(pMarker.on1map_kml_ref).find('ExtendedData>Data[name="'+val+'"]>value').text() + '</td></tr>';
		});
		html += '</tbody></table>';	
	}
	pMarker.updateSmartWindow( html );
}






