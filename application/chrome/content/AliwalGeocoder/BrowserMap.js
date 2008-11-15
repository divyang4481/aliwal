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
	var _hidPins = 0;
	var _visPins = 0;
	var _geocodingErrors = 0;
	var _pinCeiling = false;

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
									'feedback_pincounts'  
								);
	
	avy.events.bind( 'ViewDrawn', function( event, eventArg ){
		_hidPins = avy.getCountHiddenPins();
		_visPins = avy.getCountVisiblePins();
		avc.drawPinCounts( _visPins, _hidPins + _visPins, _pinCeiling, _geocodingErrors );
	});
	avy.events.bind( 'ViewPinDensityCeiling', function( event, eventArg ){
		_pinCeiling = true;
		_hidPins = avy.getCountHiddenPins();
		_visPins = avy.getCountVisiblePins();
		avc.drawPinCounts( _visPins, _hidPins + _visPins, _pinCeiling, _geocodingErrors );

	});
		
	avc.events.bind( 'ViewFilterChange', function( event, eventArg ){
		_hidPins = avy.getCountHiddenPins();
		_visPins = avy.getCountVisiblePins();
		avc.drawPinCounts( _visPins, _hidPins + _visPins, _pinCeiling, _geocodingErrors );
		 
		avy.setFilterTagset( avc.getFilterTagset() );
		avy.redraw();
	});	

	avc.events.bind( 'ViewLabelChange', function( event, eventArg ){
		avy.setPinLabels( avc.getPinLabel() );
	});
	
	xscopeNS.acontroller.events.bind( 'ControllerGeocodeFail', function(event, eventArg ){ 
		_geocodingErrors++;
		_hidPins = avy.getCountHiddenPins();
		_visPins = avy.getCountVisiblePins();
		avc.drawPinCounts( _visPins, _hidPins + _visPins, _pinCeiling, _geocodingErrors );
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
	_hidPins = avy.getCountHiddenPins();
	_visPins = avy.getCountVisiblePins();
	avc.drawPinCounts( _visPins, _hidPins + _visPins, _pinCeiling, _geocodingErrors );
	avy.setPinLabels( avc.getPinLabel() );

}); 
