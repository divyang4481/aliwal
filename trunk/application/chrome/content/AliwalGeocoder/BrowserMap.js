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


// Global scope for easier debugging.
// No point creating a*v views until the model is populated, 
// which is done by the fake module in AliwalXscopeNS.js
// The controller is also created in AliwalXscopeNS.js

var avy; // AliwalViewYahoo
var avc; // AliwalViewControls
var domMgr = new DomManager();

$(document).ready(function(){

	// Attach an event handler to hideshow2
	$('.div_hideshow_option').bind( 'click', function(e){
		domMgr.hideShow2( this.id );
	});	


	// Drop the filter and label selector controls onto the page
	avc = new AliwalViewControls( 	xscopeNS.amodel, 
									'div_filters', 
									'pin_label_selector' );	
	
	
	// The model may be loaded with some geocoded placemarks at this point & they'll automatically go onto the map.
	// Uncoded placemarks in the model need to be dealt with manually
	
	avy = new AliwalViewYahoo( xscopeNS.amodel, 'map');
	xscopeNS.amodel.addedListener( avy, avy.addPlacemark );	
	xscopeNS.amodel.addedListener( avc, avc.addPlacemark );

	// Make the map view respond to changes in the controls view	
	avc.bindFilterChange(	function(p){ // pfilterCallback
								avy.setFilterTagset(p);
								avy.redraw();
								var vp = avy.getCountVisiblePins();
								var tp = vp + avy.getCountHiddenPins() + avy.getCountErrorPins();
								domMgr.drawPinCounts( vp, tp );
							});

	// Make the map view respond to changes in the controls view
	avc.bindLabelChange(	function(p){ //pLabelCallback
								avy.setPinLabels(p);
							});
	
	// Get the controller to geocode placemarks that need looking up 
	// and add them to the map too 
	$.each( xscopeNS.amodel.getUncodedPlacemarks(), function(idx, val_pm){
		try{
			xscopeNS.acontroller.geocodePlacemark( val_pm, function(pm2){
				// This anon function is called async when the geocoding returns successful.
				avy.addPlacemark(pm2);
				avy.redraw();
			});
		} catch(e){
			// Geocoding may throw exceptions
			domMgr.warningGeocodingError(true, e);
		}
	});
	
}); 
