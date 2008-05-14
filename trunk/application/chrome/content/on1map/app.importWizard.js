Components.utils.import("resource://app/modules/xscope.jsm");

// create a namespace
function ImportWizard(){
	if("arguments" in window && window.arguments.length > 0) {
		this.impFilename = window.arguments[0].filename;
		this.callback = window.arguments[0].callback;
	} else {
		throw 'ImportWizard constructor couldn\'t find window.arguments[0].filename';
	}
	
	this.impLayout 				= 'delimited';
	this.impDelimiter 			= ',';
	this.impHeaderRows 			= 1;
	this.impLonLatCols 			= [];
	this.impGeocodeAddressCols 	= [];
	this.impDataCols 			= [];
	this.impTagCols 			= [];
	
	this._headerCache 			= undefined;
	
	//this.reCSV = /,(?=([^"]*"[^"]*")*(?![^"]*"))/g; 							// Thanks: http://blogs.infosupport.com/raimondb/archive/2005/04/27/199.aspx
	//this.reCSV = /,(?=([^\"]*\"[^\"]*\")*(?![^\"]*\"))/g;   					// Thanks: http://weblogs.asp.net/prieck/archive/2004/01/16/59457.aspx
	//this.reCSV = /("(?:[^"]|"")*"|[^",\r\n]*)(,|\r\n?|\n)?/g; 				// Thanks: http://www.bennadel.com/blog/978-Steven-Levithan-Rocks-Hardcore-Regular-Expression-Optimization-Case-Study-.htm
	//this.reCSV = /\G(,|\r?\n|\r|^)(?:"([^"]*+(?>""[^"]*+)*)"|([^",\r\n]*+))/g; // Thanks: http://www.bennadel.com/blog/978-Steven-Levithan-Rocks-Hardcore-Regular-Expression-Optimization-Case-Study-.htm
	this.reCSV = /"?,"?(?=(?:[^"]*"[^"]*")*(?![^"]*"))"?/g; 					//Thanks:http://rebelnation.com/
																				//Thanks: http://regexpal.com/
	this.impRegex 				= this.reCSV;							
																				
				
}

//onwizardback, onwizardnext and onwizardcancel
ImportWizard.prototype.onWizardLoad = function(){
	var that = this;
	that.drawLonLatColumns();
	that.drawGeoColumns();
	that.drawDataColumns();
	that.drawTagColumns();
}
ImportWizard.prototype.checkCode = function(){
	// Allow the wizard to advance
	return true;
	document.getElementById('importwizard').canAdvance = true;
}
ImportWizard.prototype.onWizardFinished = function(){
	var that = this;
	try{
		that.doImport();
		return true; // Allow the wizard to close
	} catch(e){
		jsdump(e);
		return false; //Keep the wizard open
	}
	
}
ImportWizard.prototype.importHeadings = function(){
	/* Returns an array of column heading from cache or pFile.
	 * Needs this.impFilename, this.impHeaderRows, this.regex to be set correctly
	 */

	var that = this;
	var hasmore = true;
	var ret = [];
	var headerline = {};
	var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
	                        .createInstance(Components.interfaces.nsIFileInputStream);
	
	if (typeof(ImportWizard.prototype._headerCache) === 'undefined'){
		try{
			var file = Components.classes["@mozilla.org/file/local;1"]
		                     .createInstance(Components.interfaces.nsILocalFile);
			file.initWithPath(that.impFilename);
			// open an input stream from file

			istream.init(file, 0x01, 0444, 0);
			istream.QueryInterface(Components.interfaces.nsILineInputStream);
			
			
			// Skip past header row(s), last one is headings
			for(var rr = 0; rr < that.impHeaderRows; rr++){
				hasmore = istream.readLine(headerline);
				if(!hasmore){
					break;
				}
			}
			jsdump('Splitting headerline');
			if(headerline.value){
				ret = headerline.value.split( that.impRegex );
			}
		}catch(e){
			throw e;
		} finally{
			istream.close();
		}
		ImportWizard.prototype._headerCache = ret;
	}
	return ImportWizard.prototype._headerCache;
}
ImportWizard.prototype.grabLayoutSelection = function(){
	jsdump('grabLayoutSelection not implemented ');
	return 'delimited';
}
ImportWizard.prototype.grabDelimiterSelection = function(){
	jsdump('grabDelimiterSelection not implemented');
	return ',';
}
ImportWizard.prototype.grabLonLatSelections = function(){
	/* Puts selected column numbers - from importHeadings() - into impXXX.
	 */
	var that = this;
	lb = document.getElementById('lb_lonlat_cols');
	if( lb.itemCount === 2 ){
		that.impLonLatCols = [];
		that.impLonLatCols[0] = $.inArray(lb.getItemAtIndex(0).label, that.importHeadings() );
		that.impLonLatCols[1] = $.inArray(lb.getItemAtIndex(1).label, that.importHeadings() );
	} else{
		// Nothing. Dud selection
	}
}
ImportWizard.prototype.grabGeoSelections = function(){
	/* Puts selected column numbers - from importHeadings() - into impXXX.
	 */
	var that = this;
	lb = document.getElementById('lb_geo_cols');
	that.impGeocodeAddressCols = [];
	for(var idx = 0; idx < lb.itemCount; idx++ ){
		that.impGeocodeAddressCols.push( $.inArray(lb.getItemAtIndex(idx).label, that.importHeadings()) ); 
	}
}
ImportWizard.prototype.grabDataSelections = function(){
	/* Puts selected column numbers - from importHeadings() - into impXXX.
	 */
	var that = this;
	lb = document.getElementById('lb_data_cols');
	that.impDataCols = [];
	for(var idx = 0; idx < lb.itemCount; idx++ ){
		that.impDataCols.push( $.inArray(lb.getItemAtIndex(idx).label, that.importHeadings()) ); 
	}
}
ImportWizard.prototype.grabTagSelections = function(){
	/* Puts selected column numbers - from importHeadings() - into impXXX.
	 */
	var that = this;
	lb = document.getElementById('lb_tag_cols');
	that.impTagCols = [];
	for(var idx = 0; idx < lb.itemCount; idx++ ){
		that.impTagCols.push( $.inArray(lb.getItemAtIndex(idx).label, that.importHeadings()) ); 
	}
}

ImportWizard.prototype.drawHeaderPreview = function(){
	var that = this;
	var headers = that.importHeadings();
	
	var grid = document.getElementById("gd_header_preview");
	var table = document.createElement('html:table');
	table.setAttribute('style','border-width: 1px 1px 1px 1px;border-spacing: 2px;border-style: outset outset outset outset;');
	var hrow = document.createElement('html:tr');
	var erow = document.createElement('html:tr');

	for(var idx in headers){
		var txt1 = document.createTextNode(headers[idx]);
		var th = document.createElement('html:th');
		th.setAttribute('style','background-color:gray;font-style:bold;padding: 3px 3px 3px 3px;');
		th.appendChild(txt1);
		hrow.appendChild(th);
		// Create and empty data row just to make table look better
		var td = document.createElement('html:td');
		td.setAttribute('style','background-color:white;');
		var txt2 = document.createTextNode('&nbsp;FRED');
		td.appendChild(txt2);
		erow.appendChild(td);
	}
	while(grid.hasChildNodes()){
		grid.removeChild(grid.firstChild);
	}	
	table.appendChild(hrow);
//	table.appendChild(erow);
	grid.appendChild(table);
}
ImportWizard.prototype.drawLonLatColumns = function(){
	/* needs this.impLonLatCols */
	var that = this;
	var headers = that.importHeadings();
	
	var opts = document.getElementById('lb_posslonlat_cols');
	var lonlat = document.getElementById('lb_lonlat_cols');
	var lonidx;
	var latidx;
	$(lonlat).empty();
	$(opts).empty();
	for(var idx in headers){
		li = document.createElement('listitem');
		li.setAttribute('label',headers[idx]);
		// If no selections, guess
		if( headers[idx].toUpperCase() === 'LONGITUDE' || 
				headers[idx].toUpperCase() === 'LONG' ){
			lonlat.appendChild(li);
			lonidx = idx;
			break;
		}
	}
	for(var idx in headers){
		li = document.createElement('listitem');
		li.setAttribute('label',headers[idx]);
		// If no selections, guess
		if( headers[idx].toUpperCase() === 'LATITUDE' || 
				headers[idx].toUpperCase() === 'LAT' ){ 
			lonlat.appendChild(li);
			latidx = idx;
			break;
		}
	}
	for(var idx in headers){
		li = document.createElement('listitem');
		li.setAttribute('label',headers[idx]);
		// If no selections, guess
		if( idx !== lonidx && idx !== latidx ){
			opts.appendChild(li);
		}
	}
}
ImportWizard.prototype.drawGeoColumns = function(){
	/* needs this.impGeocodeAddressCols */
	var that = this;
	var headers = that.importHeadings();
	
	var opts = document.getElementById('lb_address_cols');
	var geo = document.getElementById('lb_geo_cols');
	$(geo).empty();
	$(opts).empty();
	for(var idx in headers){
		li = document.createElement('listitem');
		li.setAttribute('label',headers[idx]);
		if( that.impGeocodeAddressCols.length === 0 ){
			if( headers[idx].toUpperCase().substring(0,4) === 'ADDR' || 
				headers[idx].toUpperCase() === 'STREET' || 
				headers[idx].toUpperCase() === 'CITY' || 
				headers[idx].toUpperCase() === 'TOWN' || 
				headers[idx].toUpperCase() === 'ZIPCODE' || 
				headers[idx].toUpperCase() === 'POSTCODE' || 
				headers[idx].toUpperCase() === 'COUNTRY' || 
				headers[idx].toUpperCase() === 'STATE' ){
					geo.appendChild(li);
			} else {
				opts.appendChild(li);
			}
		}
	}
}
ImportWizard.prototype.drawDataColumns = function(){
	/* needs this.impGeocodeAddressCols */
	var that = this;
	var headers = that.importHeadings();
	
	var opts = document.getElementById('lb_possdata_cols');
	var data = document.getElementById('lb_data_cols');
	$(data).empty();
	$(opts).empty();
	for(var idx in headers){
		li = document.createElement('listitem');
		li.setAttribute('label',headers[idx]);
		
		// If no data cols have been selected, suggest everything except geoaddress cols,
		// othherwise go with previous selection
		if(that.impDataCols.length === 0){
			if( headers[idx].toUpperCase() === 'LONGITUDE' || 
					headers[idx].toUpperCase() === 'LONG' || 
					headers[idx].toUpperCase() === 'LATITUDE' || 
					headers[idx].toUpperCase() === 'LAT' || 
					headers[idx].toUpperCase().substring(0,4) === 'ADDR' || 
					headers[idx].toUpperCase() === 'STREET' || 
					headers[idx].toUpperCase() === 'CITY' || 
					headers[idx].toUpperCase() === 'TOWN' || 
					headers[idx].toUpperCase() === 'ZIPCODE' || 
					headers[idx].toUpperCase() === 'POSTCODE' || 
					headers[idx].toUpperCase() === 'COUNTRY' || 
					headers[idx].toUpperCase() === 'STATE' || 
					headers[idx].toUpperCase().substring(0,3) === 'TAG' ){
				opts.appendChild(li);
			} else {
				data.appendChild(li);
			}
		}
	}
}
ImportWizard.prototype.drawTagColumns = function(){
	/* needs this.impGeocodeAddressCols */
	var that = this;
	var headers = that.importHeadings();
	
	var opts = document.getElementById('lb_posstag_cols');
	var tag = document.getElementById('lb_tag_cols');
	$(tag).empty();
	$(opts).empty();
	for(var idx in headers){
		li = document.createElement('listitem');
		li.setAttribute('label',headers[idx]);
		if( that.impTagCols.length === 0 ){
			if( headers[idx].toUpperCase().substring(0,3) === 'TAG'){
				tag.appendChild(li);
			} else {
				opts.appendChild(li);
			}
		}
	}
}
ImportWizard.prototype.drawMoveListItem = function(pSourceListBoxId, pDestListBoxId ){
	/* Moves selected options from listbox pSourceListBoxId to pDestListBoxId */
	var source = document.getElementById(pSourceListBoxId);
	var dest = document.getElementById(pDestListBoxId);
	for(var idx in source.selectedItems ){
		dest.appendItem( source.getItemAtIndex(source.getIndexOfItem(source.selectedItems[idx])).label, 
						 source.getItemAtIndex(source.getIndexOfItem(source.selectedItems[idx])).value );
	}
	while(source.selectedItems.length > 0){
		source.removeItemAt(source.getIndexOfItem(source.selectedItems[0]));
	}
}


ImportWizard.prototype.doImport = function(){
	var that = this;
	var headerline={};
	var dataline = {};
	var hasmore = true;
	var colheadings = [];
	
	try {
		xscopeNS.flags.loadingData = true;
		
		if( that.impLayout !== 'delimited') {
			throw 'Unrecognized import layout option: ' + that.impLayout;
		}

		colheadings = that.importHeadings();
		
		var file = Components.classes["@mozilla.org/file/local;1"]
	                     .createInstance(Components.interfaces.nsILocalFile);
		file.initWithPath(that.impFilename);
		// open an input stream from file
		var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
		                        .createInstance(Components.interfaces.nsIFileInputStream);
		istream.init(file, 0x01, 0444, 0);
		istream.QueryInterface(Components.interfaces.nsILineInputStream);

		var doc = document.implementation.createDocument("","",null);
		var docu = doc.createElementNS('http://earth.google.com/kml/2.2','kml');
		
		do{
			var placemark = doc.createElement('Placemark');
			var extendedData = doc.createElement('ExtendedData');
			hasmore = istream.readLine(dataline);
			// Split the line up
			linesplit = dataline.value.split( that.impRegex);
			
			// Create XML nodes for the data columns
			$.each( that.impDataCols, function(idx,colid){
				var nn1 = doc.createElement('Data');
				nn1.setAttribute('name', colheadings[ colid ] );
				var nn2 = doc.createElement('value');
				var nn3 = doc.createTextNode( linesplit[colid] );
				nn2.appendChild(nn3);
				nn1.appendChild(nn2);
				extendedData.appendChild(nn1);
			});
			
			// Create XML nodes for the tag columns
			$.each( that.impTagCols, function(idx,colid){
				var nn1 = doc.createElement('TagSet');
				nn1.setAttribute('name', colheadings[ colid ] );
				var nn2 = doc.createElement('Tag');
				var nn3 = doc.createTextNode( linesplit[colid] );
				nn2.appendChild(nn3);
				nn1.appendChild(nn2);
				extendedData.appendChild(nn1);
			});
			
			// Create XML nodes for the GeocodeAddress
			var addrstr = '';
			$.each( that.impGeocodeAddressCols, function(idx,colid){
				if(addrstr.length > 0){ addrstr += ', '; }
				addrstr += linesplit[colid];
			});
			if 	(addrstr){
				var nn1 = doc.createElement('GeocodeAddress');
				var nn2 = doc.createTextNode( addrstr );
				nn1.appendChild(nn2);
				extendedData.appendChild(nn1);
			}
	
	
			// Create XML node for Lat&Longitude
			if ( that.impLonLatCols.length === 2){
				nn1 = doc.createElement('Point');
				nn2 = doc.createElement('coordinates');
				nn3 = doc.createTextNode( linesplit[that.impLonLatCols[0]]+','+linesplit[that.impLonLatCols[1]] );
				nn2.appendChild(nn3);
				nn1.appendChild(nn2);
				placemark.appendChild(nn1);
			}
			
			placemark.appendChild(extendedData);
			docu.appendChild(placemark);
		} while(hasmore);
		
		istream.close();
		doc.appendChild(docu);		
		that.callback(doc);
	} catch(e){
		jsdump(e);
		throw e;
	}
}

ImportWizard.prototype.checkDelimiter = function(){
	document.getElementById('importwizard').canAdvance = document.getElementById('cb_delimiter_comma').checked;
}









// Global namespace
function jsdump(str){
	/* Thanks: http://developer.mozilla.org/en/docs/Debugging_a_XULRunner_Application */
  Components.classes['@mozilla.org/consoleservice;1']
            .getService(Components.interfaces.nsIConsoleService)
            .logStringMessage(str);
}
