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

function AliwalViewMapstraction( pAliwalModel, pDomMap ){
	/* A map view object for the MVC pattern that uses the mapstraction API.
	 * View AliwalPlacemark data on a map.
	 * Defaults Yahoo maps for now.
	 */
	
	//Private members
	var _dataModel = pAliwalModel;
	var _domMap = pDomMap;
	var _map;
	
	// Private method
	_buildInfoWindow = function( pPlacemark ){
		/* Build the contents of a marker popup window from an AliwalPlacemark
		 * returns html.
		 */
		var html;
	
		html = '<table class="marker_popup_table"><caption class="marker_popup_caption"></caption>';
		html += '<colgroup><col class="marker_popup_labelcol"/><col class="marker_popup_datacol"/></colgroup>';
		html += '<thead></thead><tfooter></tfooter><tbody class="marker_popup_tbody">';
		$.each( pPlacemark.getLabelledSet(), function(key_label, val_data){
			html += '<tr><th class="marker_popup_th">' + key_label + '&nbsp;</th>\n';
			html += '<td>' + val_data + '</td></tr>';
		});
		html += '</tbody></table>';	

		return html;
	}
	
	//Privileged method
	this.addPlacemark = function( pIdx, pPlacemark ){
		var mm = new Marker( new LatLonPoint(pPlacemark.latitude, pPlacemark.longitude ));
		mm.setLabel('labelText');
		mm.setInfoBubble( _buildInfoWindow(pPlacemark) ); 
		_map.addMarker( mm );
	} 
		
	// Constructor
	_map = new Mapstraction( _domMap, 'yahoo');
	_map.addControls({
    	pan: true, 
    	zoom: 'small',
    	map_type: true 
	});
	
	var _center = new LatLonPoint(51.513696, -0.049777); // create a lat/lon object over Commercial Road, London, UK
	_map.setCenterAndZoom(_center, 10);
}



