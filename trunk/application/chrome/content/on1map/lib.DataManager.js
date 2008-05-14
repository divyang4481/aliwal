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
DataManager.prototype.enrichFromCache = function( pDoc){
	/* Scans a KML DOM document and adds point data if it's missing from the doc but avail in cache
	 */
	var cacheMgr = new CacheManager();
	$(pDoc).find('Placemark').not('Placemark:has(Point>coordinates)').each( function(idx, pointless){
		var cachestr = $(pointless).find('ExtendedData > GeocodeAddress:first').text();
		try{
			var cacheret = cacheMgr.getItem( cachestr );
			var dp = new DOMParser();
			var frag = dp.parseFromString( '<Point on1map_geocoding="cached"><coordinates>'+cacheret+'</coordinates></Point>','text/xml');
			$(pointless).append( $(frag.documentElement) );
			//jsdump('cache HIT for address:\n' + cachestr );
		}catch(e){
			// cache miss
			//jsdump(e+'\ncache MISS for address:\n' + cachestr );
		}			
	});
}
DataManager.prototype.loadFile = function(pFile, pCallback ){
	var that = this;
	var req = new XMLHttpRequest();			
	req.overrideMimeType('text/xml');	
	req.onProgress = function onProgress(e) {
		var percentComplete = (e.position / e.totalSize)*100;
		jsdump('Progress %:' + percentageComplete);
	};
	req.onError = function onError(e) {
		alert("Error " + e.target.status + " occurred while receiving the document.");
	}
	req.onLoad = function(e){
		jsdump('Onload:e' + e);
	}
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





