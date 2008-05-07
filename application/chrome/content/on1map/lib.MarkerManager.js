function MarkerManager(){
	/* Namespace for for markers functions */
}
MarkerManager.prototype.createMarkersFromDom = function( pKML, pDest, pClickEventHandler ){
	/* Populates a hash of marker objects ready to be dropped onto the map.
	 * The hash is keyed by the YMarker.id
	 * Tags the DOM document Placemark element with attribute "on1map_markerid", the ID of the created marker.
	 * Tags the YMarker object with a jquery reference "on1map_kml_ref" into the DOM doc.
	 */
	var that = this;
	for(var keys in pDest){
		delete pDest[keys];
	};
	$(pKML).find('Placemark').each(function(idx, pmark){
		try{	
			var nm;
			if ( $(pmark).is('Placemark:has(Point>coordinates)') ) {
				var spl = $(pmark).children('Point>coordinates:first').text().split(',');
				var geopoint = new YGeoPoint( spl[0], spl[1] );
				nm = new YMarker( geopoint );		
			} else if ( $(pmark).is(":contains('ExtendedData>GeocodeAddress')") ){
				var geoaddr = $(pmark).children('ExtendedData>GeocodeAddress:first').text().trim();
				nm = new YMarker(geoaddr);		
			} else {
				throw 'MarkerManager: No Point.coordinates or ExtendedData.GeocodeAddress on marker data';
			}
			
			$(pmark).attr('on1map_markerid', nm.id );		
			pDest[nm.id] = nm;
			YEvent.Capture( pDest[nm.id], EventsList.MouseClick, pClickEventHandler );
			nm.on1map_kml_ref = $(pmark);
		} catch(e){
			jsdump(e)
		}
	});
}
MarkerManager.prototype.unfilteredMarker = function( pMarker, pFilterSets ){
	/* pFilterSets =    {  	'Tagset1': ['selected_filter1','selected_filter2','etc'],
	 * 						'Tagset2': ['another_selection1','another_selection2','etc'], 
	 * 					};
	 * run thorugh the tagsets and look for that as a member on the marker.
	 * If any matches are found, the marker should be shown so return true
	 */
	var ret = false;
//	jsdump('uneval(pFilterSets):'+uneval(pFilterSets));
	for(var tagset in pFilterSets){
		for(var idx in pFilterSets[tagset]){
			var filterval = pFilterSets[tagset][idx];
			var ll = $(pMarker.on1map_kml_ref).find('ExtendedData>TagSet[name="'+tagset+'"]')
											.find('Tag:contains("'+filterval+'")').length;
			if ( ll > 0 ) {
				ret = true;
				break;
			};
		};
	}
//	jsdump( 'unfilteredMarker returning:' + ret +'\nll=' + ll );
	return ret;
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
	var html = '<table class="marker_popup_table"><caption class="marker_popup_caption"></caption>';
	html += '<colgroup><col class="marker_popup_labelcol"/><col class="marker_popup_datacol"/></colgroup>';
	html += '<thead></thead><tfooter></tfooter><tbody class="marker_popup_tbody">';
	$.each( pPopupAttribArr, function(idx, val){
		html += '<tr><th class="marker_popup_th">' + val + '&nbsp;</th>\n';
		html += '<td>' + $(pMarker.on1map_kml_ref).find('ExtendedData>Data[name="'+val+'"]>value').text() + '</td></tr>';
	});
	html += '</tbody></table>';	
	pMarker.updateSmartWindow( html );
}
MarkerManager.prototype.markerInbounds = function( pMarker ){
	/* Returns a boolean indicating whether the marker is in the map bounds or not 
	 */
}






