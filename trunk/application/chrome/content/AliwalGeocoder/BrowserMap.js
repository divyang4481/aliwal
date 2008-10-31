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


$(document).ready(function(){

	// The model may be loaded with some geocoded placemarks at this point & they'll automatically go onto the map.
	// Uncoded placemarks in the model need to be dealt with manually
	avy = new AliwalViewYahoo( xscopeNS.amodel, 'map');
		
	xscopeNS.amodel.events.bind( 'ModelPlacemarkAdded', function(event, eventArg ){
		//console.log('ModelPlacemarkAdded received'); 
		avy.addPlacemark( eventArg );
	});

	// Drop the controls view onto the page
	avc = new AliwalViewControls( 	xscopeNS.amodel, 
									'div_filters', 
									'pin_label_selector',
									'feedback_pincounts',
									'feedback_pin_ceiling',
									'feedback_geocoding_err' );
	
	avy.events.bind( 'ViewDrawn', function( event, eventArg ){
		var hidPins = avy.getCountHiddenPins();
		var visPins = avy.getCountVisiblePins();
		avc.drawPinCounts( visPins, hidPins + visPins );
	});
		
	avc.events.bind( 'ViewFilterChange', function( event, eventArg ){
		var hidPins = avy.getCountHiddenPins();
		var visPins = avy.getCountVisiblePins();
		avc.drawPinCounts( visPins, hidPins + visPins );
		 
		avy.setFilterTagset( avc.getFilterTagset() );
		avy.redraw();
	});	
	avc.events.bind( 'ViewLabelChange', function( event, eventArg ){
		avy.setPinLabels( avc.getPinLabel() );
	});
	
	xscopeNS.acontroller.events.bind( 'ControllerGeocodeFail', function(event, eventArg ){ 
		avc.warningGeocodingError( true, eventArg.getGeocodeAddress() );
	});
	
	// Get the controller to geocode placemarks that need looking up. 
	$.each( xscopeNS.amodel.getUncodedIDs(), function(idx, val_pmid){
		xscopeNS.acontroller.geocodePlacemark( xscopeNS.amodel.getPlacemark(val_pmid), function(pm2){} );
	});
	
	// Attach an event handler to hideshow
	$('.hideshowoptions').bind( 'click', function(){
		var ctl = $(this);
		var victims = ctl.siblings();
	
		if( ctl.attr('state') === 'HIDDEN'){
			victims.slideDown(20);
			ctl.attr('state','SHOWN');
			ctl.find('#hideshowicon').attr('src','icons/maximize_option.png');
		} else{ 
			victims.slideUp(20);
			ctl.attr('state','HIDDEN');
			ctl.find('#hideshowicon').attr('src','icons/minimize_option.png');
		}
	});
	
	// The very first ViewDrawn from avy sometimes gets missed, so 
	// just do it's stuff here to be sure.
	var hidPins = avy.getCountHiddenPins();
	var visPins = avy.getCountVisiblePins();
	avc.drawPinCounts( visPins, hidPins + visPins );
	avy.setPinLabels( avc.getPinLabel() );

}); 
