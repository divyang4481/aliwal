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

// Global scope for easier debugging

// No point creating av* views until the model is populated
var avd; // AliwalViewDataTable


$(document).ready(function(){
	// The model may be loaded with some geocoded placemarks at this point & they'll automatically go onto the map.
	// Uncoded placemarks in the model need to be dealt with manually
	avd = new AliwalViewDataTable( xscopeNS.amodel, 'divDataTable' );
	
	xscopeNS.amodel.events.bind('ModelPlacemarkAdded', function( event, eventArgs ){
		avd.redraw();
	});
	
	xscopeNS.amodel.events.bind('ModelPlacemarkDeleted', function( event, eventArgs ){
		avd.redraw();
	});
		
	xscopeNS.amodel.events.bind('ModelPlacemarkGeocoded', function( event, eventArgs ){
		avd.redraw();
	});
		
	xscopeNS.amodel.events.bind('ModelPlacemarkMoved', function( event, eventArgs ){
		avd.redraw();
	});
	xscopeNS.acontroller.events.bind('ControllerDataLoaded', function( event, eventArgs ){
		// For in-browser testing
		// ToDo: create xscopeNS.inbrowser = true; so that this can be conditional.
		// Get the controller to geocode placemarks that need looking up. 
		$.each( xscopeNS.amodel.getUncodedPlacemarks(), function(idx, val_pm){
			xscopeNS.acontroller.geocodePlacemark( val_pm, function(pm2){} );
		});
		

		avd.redraw();
	});

});
