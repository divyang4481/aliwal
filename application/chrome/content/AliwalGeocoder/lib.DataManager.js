function DataManager(){
	/* Namespace for Data functionality */
}
DataManager.prototype.emptyObj = function( pObj){
	for(var key in pObj ){
		delete pObj[key];
	}
}
DataManager.prototype.emptyArray = function( pArr){
	while( pArr.length ){
		pArr.pop();
	}
}
DataManager.prototype.domTagSetCensus = function( pDoc ){
	/* Scans a KML DOM document and returns a census of tagsets.
	 * returned object is 	{ tagsetname: { tagname: count },
	 * 									  { tagname: count } }
	 */
	var ret = new Object();
	$(pDoc).find('Placemark > ExtendedData > TagSet').each( function(idx, tagset_element){
		var tagsetname = $(tagset_element).attr('name');
		if (typeof(ret[tagsetname]) === 'undefined'){
			ret[tagsetname] = new Object();
		}
		var dups = new Object();
		$.each($(tagset_element).children('tag'), function(ii, tag_element){
			var tag = $.trim( $(tag_element).text() );
			if( typeof( dups[tag] ) === 'undefined' ){
				dups[tag] = 1;
			} else {
				dups[tag]++;
			}
		});
		for(key in dups){
			if( typeof( ret[tagsetname][key] ) === 'undefined' ){
				ret[tagsetname][key] = 1;
			} else {
				ret[tagsetname][key]++;
			}
			
		}
	});
	return ret;
}
DataManager.prototype.domDataCensus = function( pDoc){
	/* Scans a KML DOM document and returns a census of Placemark>ExtendedData>Data elements, 
	 * aka pin labels.
	 * Returned object is { elementname: count }
	 */
	var ret = new Object();
	$(pDoc).find('Placemark > ExtendedData > Data').each( function(idx, data_element ){
		var label_name = $(data_element).attr('name');
		if ( typeof(ret[label_name]) === 'undefined' ){
			ret[label_name] = 1;
		} else {
			ret[label_name]++;
		}
	});
	return ret;
}
DataManager.prototype.domMissingGeocode = function( pDoc ){
	/* Takes a KML doc and returns the Placemark elements that don't have coordinates or GeocodeAddress elements */
	return $(pDoc).find('Placemark').not('Placemark:has(Point>coordinates)')
				.not('Placemark:has(ExtendedData>GeocodeAddress)');
}
DataManager.prototype.enrichWithGeocode = function( pPlacemarks, pGeoElements ){
	/* Scans a JQuery list of Placemarks from the DOM and adds a Geocode element if there is no Point.coordinates or GeocodeAddress
	 */
	var that = this;
	var domp = new DOMParser()
	$(pPlacemarks).each( function(idx, pointless){
		var geostr = '';
		for(var idx2 in pGeoElements){
			if( geostr ){
				geostr +=', ';
			}
			geostr += $(pointless).find('ExtendedData>Data[@name="'+pGeoElements[idx2]+'"]:first>value').text();
		}

		var fragstr = '<GeocodeAddress on1map_geocoding="generated_geocode_tag">' + geostr + '</GeocodeAddress>';
		var frag = domp.parseFromString( fragstr,'text/xml');
		$(pointless).children('ExtendedData:first').append( $(frag.documentElement) );
	});
}
DataManager.prototype.enrichFromCache = function( pDoc){
	/* Scans a KML DOM document and adds point data if it's missing from the doc but avail in cache
	 */
	var cacheMgr = new CacheManager();
	$(pDoc).find('Placemark').not('Placemark:has(Point>coordinates)').each( function(idx, pointless){
		var cachestr = $(pointless).find('ExtendedData > GeocodeAddress:first').text();
		try{
			var cacheret = cacheMgr.getItem( cachestr );
			var dp = new DOMParser();
			var frag = dp.parseFromString( '<Point on1map_geocoding="point_from_cache"><coordinates>'+cacheret+'</coordinates></Point>','text/xml');
			$(pointless).append( $(frag.documentElement) );
			//jsdump('cache HIT for address:\n' + cachestr );
		}catch(e){
			// cache miss
			//jsdump(e+'\ncache MISS for address:\n' + cachestr );
		}			
	});
}
DataManager.prototype.loadFile = function(pFile, pLoadHandler, pProgressHandler, pErrorHandler, pCallback ){
	var that = this;
	var req = new XMLHttpRequest();			
	req.overrideMimeType('text/xml');	
	req.onprogress = pProgressHandler;
	req.onerror = pErrorHandler;
	req.onload = pLoadHandler;
	req.onreadystatechange = function (aEvt) {
		if (req.readyState == 4) {
	    	if(req.status == 200 || req.status == 0){

				var inter = document.implementation.createDocument("","",null);
				var clonedNode = inter.importNode( req.responseXML.firstChild , true );
				inter.appendChild( clonedNode );
				pCallback(inter);
			}else{
				throw 'DataManager: Error loading file.';
			}
		}
	};				
	req.open('GET', 'file://' + pFile, true);
	req.send(null);
}
