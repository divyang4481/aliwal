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

/**
 * @class
 * A map view - for the MVC pattern - that uses the Yahoo map API
 * Views AliwalPlacemark data on a Yahoo map.
 * Mapstraction not rich enough for current requirements
 * Creates the map markers and shuffles them between _hidMarkers & _visMarkers
 * 
 * Subscribes to events: 
 *  * ModelPlacemarkAdded
 *  * ModelPlacemarkGeocoded
 *  * ModelPlacemarkMoved
 *  
 */
function AliwalViewYahoo( pAliwalModel, pDomMap ){

	// Private members
	var _dataModel = pAliwalModel;
	var _map;
	var _lastBounds;
	var _labelSel;
	var that = this;
						  // Hashes of YMarker objects with an additional member "placemark" of
						  // type AliwalPlacemark pointing back to the placemark the Marker represents.
						  // Addressed by the API assigned Marker.id 	
	var _hidMarkers = []; // YMarkers not in bounds or filtered off of map.
	var _visMarkers = []; // YMarkers that are currently visible, i.e. Not filtered and in map bounds.
	
	var _errPlacemarks = []; // Type: AliwalPlacemark. Special case for markers not yet geocoded.  
	
	var _filterTagsets = {}; // Type AliwalTagset
	var _popupColourMap;
	var _pinColourMap;

	// Events
	this.events = $({
	//  eventID:  'eventName' // Should match
		ViewDrawn             : 'ViewDrawn',
		ViewPinDensityCeiling : 'ViewPinDensityCeiling'
    });

	// Private method
	_buildPopupContents = function( pPlacemark ){
		/** 
		 * Build the contents of a marker popup window from an AliwalPlacemark
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
	
	// Private method
	_isMarkerUnfiltered = function(pPlacemark, pFilterSets){
		/** 
		 * pFilterSets =    {  	'Tagset1': ['selected_filter1','selected_filter2','etc'],
		 * 						'Tagset2': ['another_selection1','another_selection2','etc'], 
		 * 					};
		 * Changed to AND tagsets but OR individual tags within a set
		 * If all tags present, the marker should, be shown so return true.
		 * Performance critical function.
		 */
		
		var tscount = 0;
		var foundOuter = true;
		var tsdata = pPlacemark.getTagsets(); // type is AliwalTagSet
		
		$.each(pFilterSets, function( filtagset, filtags ){
			tscount++;
			var foundInner = false;
			$.each(filtags, function(idx, itag ){
				if( typeof(tsdata[filtagset]) !== 'undefined'){
					if( $.inArray(itag, tsdata[filtagset]) >= 0 ){
						foundInner = true;
						return false ;// Found a tag for this set so break out of $.each(filtags, ...)
					}
				} else {
					return false; // marker doesn't have the necessary tagset, break out of $.each(filtags, ...)
				}
			});
			foundOuter = foundOuter && foundInner;
			return foundOuter; // Keep iterating through pFilterSets ?
		 });
		if(tscount === 0){
			// If there are no tagsets in the data, so there's no filtering
			return true;
		}
		//jsdump('Checking '+uneval(pFilterSets) +'\n against marker with tagdata: ' + uneval(pPlacemark.on1map_tagdata) + '\nreturning: ' + foundOuter );
		return foundOuter;
	}
	
	// Private method
	_tagsetColourMap = function(){
		var colours = ['orange', 'blue', 'lightblue', 'brown', 'green', 'lightgreen', 'grey', 'black', 'maroon', 'ocre', 'purple'];
		var tsc = eval(uneval(_dataModel.tagsetCensus())); // Create a copy 
		if( $(tsc).length > 0){
			// Re-purpose the census results, replace the counts with a colour
			$.each( tsc, function(key_tagset, val_tags){
				var x = 0;
				$.each(val_tags, function(key_tag, val_count){
					tsc[key_tagset][key_tag] = colours[x];
					if(x<colours.length){
						x++;
					} else {
						x = 0;
					}
				});
			});
		};
		return tsc;
	}
	
	
	// Private method
	_getPopupColour = function(pPlacemark){
		/**
		 * Based on the tags of a placemark return what colour a map pin should be.
		 */
		var ret = 'orange'; 
		var _pts = pPlacemark.getTagsets()
		
		if( $(_popupColourMap).length > 0 ){
			$.each(_popupColourMap, function(key_tagset, val_tags){
				$.each(val_tags, function(key_tag, val_colour){
					if( typeof (_pts[key_tagset][0] ) != 'undefined'){
						var firstTag = _pts[key_tagset][0];
						ret = _popupColourMap[key_tagset][firstTag];
					};
					return false; //break
				});
				return false; //break
			});
		}
		
		return ret;
	};
	
	// Private method
	_getPinImage = function(pPlacemark){
		/**
		 * Based on the tags of a placemark return what image the map pin should be.
		 */
		return new YImage('icons/pin_' + _getPopupColour(pPlacemark) + '.png');
	}
	

	// Private method
	_drawMarkers = function( pBounds ){
		var visicount = 0;
		var errcount = 0;
		var totcount = 0;
		
		for( var idx = 0; idx < _errPlacemarks.length; idx++ ){ // The length of _errPlacemarks could be changed in-loop
			totcount++;
			// Run through _errPlacemarks to see if any are ready for promotion to Markers.
			if( _errPlacemarks[idx].isGeocoded() ){
				// Move them to _hidMarkers
				addPlacemark( _errPlacemarks[idx] );
				_errPlacemarks.splice(idx, 1); 
				idx--; //End of array has moved closer so loop's idx should miss an increment
			}
		}
		
		for( var idx = 0; idx < _visMarkers.length; idx++ ){	// The length of _visMakers could be changed in-loop
			if( _visMarkers[idx].placemark.inBounds(pBounds)  
			  && _isMarkerUnfiltered(_visMarkers[idx].placemark, _filterTagsets) ){
				// leave already visible,inBounds&unfiltered alone
				visicount++;
			} else {
				// Remove visible&(filtered or out of bounds ) to hidden
				//jsdump('Moving from visible to hidden: ' + _visMarkers[key].id );
				_hidMarkers.push(_visMarkers[idx]);
				_map.removeOverlay(_visMarkers[idx]);
				_visMarkers.splice(idx,1);
				idx--; //End of array has moved closer so loop's idx should miss an increment
			}
		}
		_scatterHidMarkers(); // So that the map shows a good distibution of markers
		try{	
			for( var idx = 0; idx < _hidMarkers.length; idx++){ // length of _hidMarkers could change in-loop
				if( _hidMarkers[idx].placemark.isGeocoded()  
			  		&& _hidMarkers[idx].placemark.inBounds(pBounds) ){
					if( _isMarkerUnfiltered(_hidMarkers[idx].placemark, _filterTagsets) ){
						if ( visicount < 200 ){
							//jsdump('Moving from hidden to visible: ' + _hidMarkers[key].id );
							visicount++;
							_visMarkers.push(_hidMarkers[idx]);
							_map.addOverlay(_visMarkers[_visMarkers.length - 1]);
							_hidMarkers.splice(idx,1);	
							idx--; //End of array has moved closer so loop's idx should miss an increment
						} else {
							throw 'Map density ceiling';
					 	}
					}
				}
			}
		} catch(e){
			that.events.triggerHandler( that.events.attr('ViewPinDensityCeiling') );
			that.events.triggerHandler( that.events.attr('ViewDrawn') );
		}
		that.events.triggerHandler( that.events.attr('ViewDrawn') );
	}
	
	// Private method
	_setPinLabel = function( pMarker){
		return; 
		// Popups are breaking smartWindows
		if(!( _labelSel)){
			// Just use the 1st label for now
			var pml = _dataModel.labelCensus();
			for( _labelSel in pml ){
				break;
			}
		};
		var labelstr = '<div class="marker_label">' + pMarker.placemark.getLabelledData(_labelSel) + '</div>';
		pMarker.addAutoExpand(labelstr);
	}
	_scatterHidMarkers = function(){
		/**
		 * Shuffle _hidMarkers so that _hidMarkers[x] is geograhically distant from _hidMarkers[x+1].
		 * Sorts the array to get them geographically close and then interleaves the 1st half with second half of the array.
		 */
		this._clusterHidMarkers();
		
		var _backwards = _hidMarkers.length;
		var _halfway = parseInt(_backwards/2);
		var popped;
		
		for(var _forwards = 1; _forwards < _halfway; _forwards+=2 ){
			popped = _hidMarkers.pop();
			_hidMarkers.splice( _forwards, 0, popped);
		}
	}
	_clusterHidMarkers = function(){
		/**
		 * Shuffle _hidMarkers so that _hidMarkers[x] is geograhically close to _hidMarkers[x+1]
		 */
		
		_hidMarkers.sort( function( pLeft, pRight){
		
			if ( pLeft.placemark.geoHash() <  pRight.placemark.geoHash() )
				return -1;
			else if (pLeft.placemark.geoHash() >  pRight.placemark.geoHash())
				return 1;
			else 
				return 0;
		});
	}
	
	// Privileged method
	this.setPinLabels = function( pLabelAttrib ){
		/** 
		 * Takes a hash of enriched markers and sets their autoexpand / label to the
		 * AliwalPlacemark value named by pLabelAttrib
		 */
		_labelSel = pLabelAttrib;
		 
		$.each(_hidMarkers, function(idx, val_marker){
			_setPinLabel(val_marker);
		});
		$.each(_visMarkers, function(idx, val_marker){
			_setPinLabel(val_marker);
		});
	}
	
	//Privileged method
	this.addPlacemark = function( pPlacemarkID ){
		/** 
		 * Put an AliwalPlacemark into _hidMarkers.
		 * If it's missing coordinates, stick it into _errPlacemarks
		 */
		var placeMark = _dataModel.getPlacemark( pPlacemarkID )
		var geopoint;
		if( placeMark.isGeocoded() ) { 
			geopoint = new YGeoPoint( placeMark.getLatitude(), placeMark.getLongitude() );
			nm = new YMarker( geopoint );
			nm.placemark = placeMark;
			
			var pmcol =  _getPopupColour( placeMark );
			nm.setSmartWindowColor( pmcol);			
			nm.smartWindowHtml = _buildPopupContents( placeMark );
			
			var pmImage = _getPinImage(placeMark);
			nm.changeImage( pmImage );
			_hidMarkers.push(nm);

			// Sort out the marker popup window
			YEvent.Capture( nm, EventsList.MouseClick, function(){
				/* Scope of "this" will have changed to the YMarker object by the time this gets invoked. */ 
				this.openSmartWindow('<blink>Loading...</blink>');
				this.updateSmartWindow( this.smartWindowHtml );
			});
			
			// Sort out the marker hover label
			//_setPinLabel(nm); // This is now breaking the popup for no good reason. 

			  		
				
		} else {
			_errPlacemarks.push( placeMark );
		}
	}
	
	// Privileged method
	this.getCountVisiblePins = function(){
		return _visMarkers.length;
	}
	// Privileged method
	this.getCountHiddenPins = function(){
		/**
		 * Returns the number of Yahoo Markers not shown on the map, i.e out of bounds or filtered
		 */
		 return _hidMarkers.length;
	}
	// Privileged method
	this.getCountErrorPins = function(){
		/**
		 * Return the number of AliwalPlacemarks that haven't been made into Markers and shown on 
		 * the map because of an error like missing coordinates. 
		 */
		return _errPlacemarks.length;
	}
	
	// Privileged method
	this.redraw = function(){
		/**
		 * A way for the controller to ask for a redraw
		 */
		_drawMarkers( _map.getBoundsLatLon() );
	}
	
	// Privileged method
	this.setFilterTagset = function( pAliwalTagset){
		/**
		 * Set the filters used to decide if a marker should be drawn.
		 * AliwalTagset members are named after the tagsets, their value is the array of selected tags 
		 * An empty array indicates a tagset with no selections. No tagsets implies no filtering at all.
		 */

		_filterTagsets = pAliwalTagset;
	}
		
	/** @constructor
	 * No point triggering events here because nothing could be listening 
	 */
	_map = new YMap(document.getElementById(pDomMap));	// Will throw "YMap not defined" if internet not available.
														// ToDo: Catch and error msg, maybe alert('Check proxy settings');

	_map.addTypeControl(); 	
	_map.addZoomLong();    		
	_map.addPanControl();
	
	// It's important to center the map [some|any]where before adding any markers.
	var homeloc = new YGeoPoint(51.496439,-0.244269); //Goldhawk Road, London
	_map.drawZoomAndCenter( homeloc, 7);
	
	_popupColourMap = _tagsetColourMap();
	
	// Prime _hidMarkers from _dataModel ready for _drawMarkers
	$.each( _dataModel.getGeocodedIDs(), function(idx, val_pmid){
		try{
			that.addPlacemark( val_pmid );
		} catch(e){
			throw e; 
			// ToDo:
			// Probably AliwalPlacemarks that are not yet geocoded
		}
	});

	_lastBounds = _map.getBoundsLatLon();
	_drawMarkers( _map.getBoundsLatLon() );
	
	// Lsiten for YUI events that require drawing
	YEvent.Capture(_map, EventsList.endMapDraw, function(resultObj) { 
		_drawMarkers( _map.getBoundsLatLon() );
	});
	YEvent.Capture(_map, EventsList.endPan, function(resultObj) { 
		_drawMarkers( _map.getBoundsLatLon() );
	});
	YEvent.Capture(_map, EventsList.endAutoPan, function(resultObj) { 
		var currb = _map.getBoundsLatLon();
		/* endAutoPan fires by popups even if the map hasn't moved when no need to redraw */
		if (uneval(_lastBounds) !== uneval(currb)){ 
			_drawMarkers( currb );
			_lastBounds = currb;
		}
	});
	
	// Listen for model ( jQuery ) events
	_dataModel.events.bind( 'ModelPlacemarkAdded', function(event, eventArg ){
		that.addPlacemark( eventArg );
		that.redraw();  
	});
	_dataModel.events.bind( 'ModelPlacemarkGeocoded', function(event, eventArg ){
		that.addPlacemark( eventArg );
		that.redraw();  
	});
	_dataModel.events.bind( 'ModelPlacemarkMoved', function(event, eventArg ){
		that.redraw(); 
	});
	
}
