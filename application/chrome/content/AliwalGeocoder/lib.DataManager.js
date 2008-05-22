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
DataManager.prototype.domLabelCensus = function( pDoc){
	/* Scans a KML DOM document and returns a census of pin labels.
	 * returned object is { labelname: count }
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
DataManager.prototype.enrichWithGeocode = function( pDoc ){
	/* Scans a KML DOM document and adds a Geocode element if there is no Point.coordinates or GeocodeAddress
	 */
	xscopeNS.flags.promptForGeocodeFields = true;
	var geofields = [];
	var dp = new DOMParser()
	var pl = $(pDoc).find('Placemark').not('Placemark:has(Point>coordinates)')
				.not('Placemark:has(ExtendedData>GeocodeAddress)');
	$(pl).each( function(idx, pointless){
			
		if(xscopeNS.flags.promptForGeocodeFields){
			// Pop up a wizard which can get the geocode fields from the user
			// Wizard should also ask if these are to be remembered 
			var params = {  KML: xscopeNS.KML,
							pointlessCount: pl.length,
							callback : function(pGeocodeArgs){ geofields = pGeocodeArgs; }
						 };
			window.openDialog("chrome://AliwalGeocoder/content/wiz.importKML.xul","importWizard","modal", params);
		}
		var geostr = '';
		for(var idx2 in geofields){
			if( geostr ){
				geostr +=', ';
			}
			geostr += $(pointless).find('ExtendedData>Data[@name="'+geofields[idx2]+'"]:first>value').text();
		}
		var fragstr = '<GeocodeAddress on1map_geocoding="generated_geocode_tag">' + geostr + '</GeocodeAddress>';
		var frag = dp.parseFromString( fragstr,'text/xml');
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
DataManager.prototype.loadFile = function(pFile, pProgressHandler, pErrorHandler, pCallback ){
	var that = this;
	var req = new XMLHttpRequest();			
	req.overrideMimeType('text/xml');	
	req.onprogress = pProgressHandler;
	req.onerror = pErrorHandler;
	req.onload = function(e){};
	req.onreadystatechange = function (aEvt) {
	  if (req.readyState == 4) {
	     if(req.status == 200 || req.status == 0){
			pCallback( req.responseXML );
	     }else{
	      jsdump("Error loading page\n");
	     }
	  }
	};				
	req.open('GET', 'file://' + pFile, true);
	req.send(null);
}
