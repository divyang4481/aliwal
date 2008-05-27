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
/* Loads a KML File into a DOM document and passes that to pCallback
 */
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
DataManager.prototype.importDelimitedFile = function(pFile,pDelimiters,
													pIgnoreHeaderLines, pIgnoreFooterLines,
													pColHeadings, 
													pDataCols, pTagCols, pGeocodeAddressCols, pLonLatCols,
													pLoadHandler, pProgressHandler, pErrorHandler, 
													pCallback ){
/* Loads a CSV file into a DOM document and passes that to pCallback 
 */
	var that = this;
	var headerline={};
	var dataline = {};
	var hasmore = true;

	//this.reCSV = /,(?=([^"]*"[^"]*")*(?![^"]*"))/g; 							// Thanks: http://blogs.infosupport.com/raimondb/archive/2005/04/27/199.aspx
	//this.reCSV = /,(?=([^\"]*\"[^\"]*\")*(?![^\"]*\"))/g;   					// Thanks: http://weblogs.asp.net/prieck/archive/2004/01/16/59457.aspx
	//this.reCSV = /("(?:[^"]|"")*"|[^",\r\n]*)(,|\r\n?|\n)?/g; 				// Thanks: http://www.bennadel.com/blog/978-Steven-Levithan-Rocks-Hardcore-Regular-Expression-Optimization-Case-Study-.htm
	//this.reCSV = /\G(,|\r?\n|\r|^)(?:"([^"]*+(?>""[^"]*+)*)"|([^",\r\n]*+))/g; // Thanks: http://www.bennadel.com/blog/978-Steven-Levithan-Rocks-Hardcore-Regular-Expression-Optimization-Case-Study-.htm
	var reCSV       = /"?,"?(?=(?:[^"]*"[^"]*")*(?![^"]*"))"?/g; 						//Thanks:http://rebelnation.com/
																				//Thanks: http://regexpal.com/
	/* OR together all of the delimiters with regex syntax */
	var ds = '';
	$.each(pDelimiters, function(idx, val){
		if(ds){
			ds +='|';
		}
		ds += val;
	});
	if(ds){
		ds = '(?:'+ds+')';
	} else{
		throw 'DataManager.importDelimitedFile. Missing delimiters.\nAborting file import.'
	}
	
	var regex = new RegExp( '"?'+ds+'"?(?=(?:[^"]*"[^"]*")*(?![^"]*"))"?', 'g');
/*
	jsdump('DataManager.prototype.importDelimitedFile');
	jsdump('uneval(pFile): '+ uneval(pFile));
	jsdump('uneval(pIgnoreHeaderLines): '+ uneval(pIgnoreHeaderLines));
	jsdump('uneval(pIgnoreFooterLines): '+ uneval(pIgnoreFooterLines));
	jsdump('uneval(pColHeadings): '+ uneval(pColHeadings));
	jsdump('uneval(pDataCols): '+ uneval(pDataCols));
	jsdump('uneval(pTagCols): '+ uneval(pTagCols));
	jsdump('uneval(pGeocodeAddressCols): '+ uneval(pGeocodeAddressCols));
	jsdump('uneval(pLonLatCols): '+ uneval(pLonLatCols));
*/
	try {
		var file = Components.classes["@mozilla.org/file/local;1"]
	                     .createInstance(Components.interfaces.nsILocalFile);
		file.initWithPath(pFile);
		// open an input stream from file
		var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
		                        .createInstance(Components.interfaces.nsIFileInputStream);
		istream.init(file, 0x01, 0444, 0);
		istream.QueryInterface(Components.interfaces.nsILineInputStream);
		for(var ign=0;ign<pIgnoreHeaderLines;ign++){
			hasmore = istream.readLine(headerline);
			if(!hasmore){
				break;
			}
		}	

		var doc = document.implementation.createDocument("","",null);
		var docu = doc.createElementNS('http://earth.google.com/kml/2.2','kml');
		
		while(hasmore){
			var placemark = doc.createElement('Placemark');
			var extendedData = doc.createElement('ExtendedData');
			hasmore = istream.readLine(dataline);
			// Split the line up
			linesplit = dataline.value.split( regex );
			
			// Create XML nodes for the data columns
			$.each( pDataCols, function(idx,colid){
				var nn1 = doc.createElement('Data');
				nn1.setAttribute('name', pColHeadings[ colid ] );
				var nn2 = doc.createElement('value');
				var nn3 = doc.createTextNode( linesplit[colid] );
				nn2.appendChild(nn3);
				nn1.appendChild(nn2);
				extendedData.appendChild(nn1);
			});
			
			// Create XML nodes for the tag columns
			$.each( pTagCols, function(idx,colid){
				var nn1 = doc.createElement('TagSet');
				nn1.setAttribute('name', pColHeadings[ colid ] );
				var nn2 = doc.createElement('Tag');
				var nn3 = doc.createTextNode( linesplit[colid] );
				nn2.appendChild(nn3);
				nn1.appendChild(nn2);
				extendedData.appendChild(nn1);
			});
			
			// Create XML nodes for the GeocodeAddress
			var addrstr = '';
			$.each( pGeocodeAddressCols, function(idx,colid){
				if(addrstr.length > 0){ addrstr += ', '; }
				addrstr += linesplit[colid];
			});
			if 	(addrstr){
				var nn1 = doc.createElement('GeocodeAddress');
				var nn2 = doc.createTextNode( addrstr );
				nn1.appendChild(nn2);
				extendedData.appendChild(nn1);
			}
	
	
			// Create XML node for Long&Latitude
			if ( pLonLatCols.length === 2){
				if( !(isNaN(parseFloat(linesplit[pLonLatCols[0]])) || isNaN(parseFloat(linesplit[pLonLatCols[1]]))) ) {
					nn1 = doc.createElement('Point');
					nn2 = doc.createElement('coordinates');
					// Remember KML wants Lon then Lat.
					nn3 = doc.createTextNode( linesplit[pLonLatCols[0]]+','+linesplit[pLonLatCols[1]] );
					nn2.appendChild(nn3);
					nn1.appendChild(nn2);
					placemark.appendChild(nn1);
				}
			}
			
			placemark.appendChild(extendedData);
			docu.appendChild(placemark);
		};
		
		istream.close();
		doc.appendChild(docu);		
		pCallback(doc);
	} catch(e){
		jsdump(e);
		throw e;
	}
}
