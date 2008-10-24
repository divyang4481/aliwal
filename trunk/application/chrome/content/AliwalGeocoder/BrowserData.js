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

xscopeNS.acontroller.events.bind('ControllerDataLoaded', function( event, eventArgs ){
	avd = new AliwalViewDataTable( xscopeNS.amodel, 'divDataTable' );
});
$(document).ready(function(){
	avd = new AliwalViewDataTable( xscopeNS.amodel, 'divDataTable' );
});

