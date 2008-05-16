Components.utils.import("resource://app/modules/xscope.jsm");

// create a namespace
function ImportKMLWizard(){
	/* Read a KML doc and ask the user which Data elements constitute an address suitable for geocoding 
	 */
	if("arguments" in window && window.arguments.length > 0) {
		this.impKML = window.arguments[0].KML;
		this.callback = window.arguments[0].callback;
	} else {
		throw 'ImportKMLWizard constructor couldn\'t find window.arguments[0].KML';
	}
	
	xscopeNS.flags.promptForGeocodeFields = false;
	this.impGeocodeAddressCols 	= [];
}

//onwizardback, onwizardnext and onwizardcancel
ImportKMLWizard.prototype.onWizardLoad = function(){
	var that = this;
	that.drawGeoColumns();
}
ImportKMLWizard.prototype.onWizardFinished = function(){
	var that = this;
	try{
		that.callback( that.impGeocodeAddressCols );
		return true; // Allow the wizard to close
	} catch(e){
		jsdump(e);
		return false; //Keep the wizard open
	}	
}
ImportKMLWizard.prototype.grabGeoSelections = function(){
	var that = this;
	lb = document.getElementById('lb_geo_cols');
	that.impGeocodeAddressCols = [];
	for(var idx = 0; idx < lb.itemCount; idx++ ){
		that.impGeocodeAddressCols.push( lb.getItemAtIndex(idx).label ); 
	}
}
ImportKMLWizard.prototype.drawGeoColumns = function(){
	/* needs this.impGeocodeAddressCols */
	var that = this;
	
	var poss = {};
	// Build a hash that counts all of the data names in the doc.
	// Keys are then a distinct list of data fields
	$(that.impKML).find('Placemark>ExtendedData>Data[name]').each(function(idx, val){
		if (typeof(poss[$(val).attr('name')] ) === 'undefined'){
			poss[$(val).attr('name')] = 1;
		} else {
			poss[$(val).attr('name')] ++;
		}
	});
	
	var opts = document.getElementById('lb_address_cols');
	var geo = document.getElementById('lb_geo_cols');
	$(geo).empty();
	$(opts).empty();
	
	for(var key in poss){
		var li = document.createElement('listitem');
		li.setAttribute('label',key);
		if( key.toUpperCase().substring(0,4) === 'ADDR' || 
			key.toUpperCase() === 'STREET' || 
			key.toUpperCase() === 'CITY' || 
			key.toUpperCase() === 'TOWN' || 
			key.toUpperCase() === 'ZIPCODE' || 
			key.toUpperCase() === 'POSTCODE' || 
			key.toUpperCase() === 'COUNTRY' || 
			key.toUpperCase() === 'STATE' ){
				geo.appendChild(li);
		} else {
			opts.appendChild(li);
		}
	}
}
ImportKMLWizard.prototype.drawMoveListItem = function(pSourceListBoxId, pDestListBoxId ){
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










// Global namespace
function jsdump(str){
	/* Thanks: http://developer.mozilla.org/en/docs/Debugging_a_XULRunner_Application */
  Components.classes['@mozilla.org/consoleservice;1']
            .getService(Components.interfaces.nsIConsoleService)
            .logStringMessage(str);
}
