function MarkerManager(){
	/* Namespace for for markers functions */
}
MarkerManager.prototype.createMarkersFromDom = function( pKML, pDest ){
	/* Populates a hash of marker objects ready to be dropped onto the map.
	 * The pDest hash is keyed by the YMarker.id
	 * Checks for exact coordinates 1st, then tries a geocode
	 * Tags the DOM document Placemark element with attribute "on1map_markerid", the ID of the created marker.
	 * Tags the YMarker object with a jquery reference "on1map_kml_ref" into the DOM doc.
	 * Tags the YMarker object with a copy of the tag data in a native structure because refering to the 
	 * XML doc is too slow.
	 */
	var that = this;
	var nm;
	for(var keys in pDest){
		delete pDest[keys];
	};
	$(pKML).find('Placemark').each(function(idx, pmark){
		try{
			var spl = $(pmark).find('Point>coordinates:first').text().split(',');
			if( !(isNaN(parseFloat(spl[0])) || isNaN(spl[1])) ) {				
				/* NB!  KML says coordinates come LON,LAT */
				var geopoint = new YGeoPoint( spl[1], spl[0] );
				nm = new YMarker( geopoint );		
			} else if ( $(pmark).is("Placemark:has('ExtendedData>GeocodeAddress')") ){
				var geoaddr = $.trim( $(pmark).find('ExtendedData>GeocodeAddress:first').text() );
				nm = new YMarker(geoaddr);
			} else if( false){
				// ToDo Addr1, Addr2, State, Zip|| Postcode|| Country
			} else {
				throw 'MarkerManager: No Point.coordinates or ExtendedData.GeocodeAddress on marker data';
			}
			
			$(pmark).attr('on1map_markerid', nm.id );					
			nm.on1map_kml_ref = $(pmark);
			nm.on1map_visible = false;
			
			// Copy across tag data
			nm.on1map_tagdata = new Object();
			$(pmark).find('ExtendedData>TagSet').each(function(idx,tagsetele){
				var tagset = $(tagsetele).attr('name');
				nm.on1map_tagdata[ tagset ] = new Array();
				$(tagsetele).children('Tag').each(function(idx2, tagele){
					nm.on1map_tagdata[ tagset ].push( $(tagele).text() );
				});
			});
			YEvent.Capture( nm, EventsList.MouseClick, function(){
					/* Scope of "this" will have changed to the YMarker object by the time this gets invoked. */
					this.openSmartWindow('<blink>Loading...</blink>');
					markerMgr.setPopupLabel( this, domMgr.getPopupSelection() );
			});
			pDest[nm.id] = nm;
		} catch(e){
			jsdump(e)
		}
	});
}
MarkerManager.prototype.unfilteredMarker = function( pMarker, pFilterSets ){
	/* pFilterSets =    {  	'Tagset1': ['selected_filter1','selected_filter2','etc'],
	 * 						'Tagset2': ['another_selection1','another_selection2','etc'], 
	 * 					};
	 * run through the tagsets and look for that as a member on the marker.
	 * If any matches are found, the marker should be shown so return true.
	 * Performance critical function.
	 */
	
	var tscount = 0;
	var foundclosure = false;
	
	for(var filtagset in pFilterSets){
		tscount++;
		
		$.each(pMarker.on1map_tagdata[filtagset], function(midx, mtag){
			if( $.inArray(mtag, pFilterSets[filtagset]) >= 0 ){
				foundclosure = true;
				return false;// break out of $.each() iterating
			} else {
				return true;// $.each() should keep iterating
			}
		});
		
		if (foundclosure){
			return true;
		}
	}
	if(tscount === 0){
		// If there are no tagsets in the data, so there's no filtering
		return true;
	}	
	return foundclosure;
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
MarkerManager.prototype.setPopupLabels = function( pVisibleMarkers, pPopupAttribArr ){
	/* Takes an array of enriched markers and sets their popup contents to the
	 * on1data values named pPopupAttribArr
	 */
	 var that = this;
	 $.each( pVisibleMarkers, function(idx, marker){
		that.setPopupLabel(marker, pPopupAttribArr);
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
MarkerManager.prototype.markerInbounds = function( pMarker ){
	/* Returns a boolean indicating whether the marker is in the map bounds or not 
	 */
}






