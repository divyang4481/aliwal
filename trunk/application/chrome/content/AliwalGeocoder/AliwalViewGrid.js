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
 * A grid view object for the MVC pattern. 
 * View AliwalPlacemark ( possibly edit) data in a grid. 	 
 */
function AliwalViewGrid( pAliwalModel, pDomGrid, pDomPager ){
		
	// Yahoo Events
	this.eventDrawn = new YAHOO.util.CustomEvent("ViewDrawn", this);
	
	// Private members
	var that = this;
	var _dataModel 	= pAliwalModel;
	var _domGrid 	= pDomGrid;
	var _domPager 	= pDomPager;
	var _rowcnt 	= 0;

	// Private member
	_makeLabelName = function( pLabel ){
		/** 
		 * Turns a label name into consistent value suitable for the grid col names
		 */
		return pLabel;
	}
	
	// Private member
	_makeTagsetName = function( pTagset, pIdx ){
		/** 
		 * Turns a tagset name into consistent value suitable for the grid col names
		 */
		return pTagset + '_' + pIdx;
	}
	
	// Private member
	_buildGridCols = function( pLabelCensus, pTagsetCensus ){
		ret = [];
	
		$.each(pLabelCensus, function( key_label, val_count ){
			ret.push( _makeLabelName(key_label) );
		});
		
		$.each(pTagsetCensus, function(key_tagset, val_tags){
			var x = 0;
			$.each(val_tags, function(key_tag, val_count){
				ret.push( _makeTagsetName(key_tagset, x) );
				x++;
			});
			
		});
		
		ret.push( 'geocodeAddress');		
		ret.push( 'latitude'  	);
		ret.push( 'longitude' 	);
		
		return ret;
	};
	
	// Private member
	_buildGridModel = function( pLabelCensus, pTagsetCensus ){
		/** 
		 * Builds the gridModel based on _buildGridCols() because it's important that the 
		 * columns and the model are in sync with each other.
		 */
		var cols = _buildGridCols( pLabelCensus, pTagsetCensus );
		var wunit = 69;
		ret = [];
		$.each(cols, function( idx, val_col){
		//	ret.push( {name: val_col, index: val_col, 				sorttype: 'text', editable: true, edittype:'text'} );
			ret.push( {name: val_col, index: val_col, width: wunit, sorttype: 'text', editable: false, edittype:'text'} );
		});
		return ret;
	};
		
	//Private method
	_buildGridRow = function( pPlacemark ){
		var pmr = {};
		
		$.each(pPlacemark.getLabelledSet(), function( key_labelname, val_labelval){
			pmr[_makeLabelName(key_labelname)] = val_labelval;
		});

		$.each(pPlacemark.getTagsets(), function( key_tagset, val_tags){
			$.each(val_tags, function(idx, tag){
				pmr[ _makeTagsetName(key_tagset, idx)] = tag;
			});
		});
		
		pmr.geocodeAddress = pPlacemark.getGeocodeAddress();
		pmr.latitude = pPlacemark.getLatitude();
		pmr.longitude = pPlacemark.getLongitude();

		return pmr;
	};
	
	//Privileged method
	this.addPlacemark = function( pPlacemark ){
		$(_domGrid).addRowData( _rowcnt, _buildGridRow( pPlacemark ));
		_rowcnt++;
	};
	
	// Privileged method
	this.redraw = function(){
		/** ToDo.
		 * A way for the controller to ask for a redraw
		 */
	}
	
	// Private members
	var _gridCols  = _buildGridCols ( _dataModel.labelCensus(), _dataModel.tagsetCensus() );
	var _gridModel = _buildGridModel( _dataModel.labelCensus(), _dataModel.tagsetCensus() );
	var lastrow;
	
	/**
	 * @Constructor
	 */
	$(_domGrid).width('99%');
	var ww = $(_domGrid).width();
    $(_domGrid).jqGrid({
    	caption		: 'Aliwal Geocoder Data',
    	colModel  	: _gridModel,
    	colNames 	: _gridCols,
        datatype 	: 'clientSide',
        editurl 	: "#",
        imgpath		: 'jqGrid/themes/basic/images',
/*		onSelectRow	: function(id){
        	if(id && id!==lastrow ){
				$(_domGrid).restoreRow(lastrow);
				$(_domGrid).editRow(id,true);
				lastrow = id;
        	}
        },
*/      
        pager		: $(_domPager),
        rowNum		: 40,
        viewrecords	: true,
        height: '90%',
        width: ww
	});
		
	$.each( _dataModel.getGeocodedPlacemarks(), function(idx, val_pm){
		try{
			that.addPlacemark( val_pm );
		} catch(e){
			throw e; 
			// ToDo:
		}
	});
	
	$.each( _dataModel.getUncodedPlacemarks(), function(idx, val_pm){
		try{
			that.addPlacemark( val_pm );
		} catch(e){
			throw e; 
			// ToDo:
		}
	});
}
