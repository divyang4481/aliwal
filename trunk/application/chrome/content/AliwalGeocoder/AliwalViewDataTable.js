/** @class AliwalViewDataTable
 *
 * Subscribes to events: 
 *  * ModelPlacemarkAdded
 *  * ModelPlacemarkGeocoded
 *  * ModelPlacemarkMoved
 *
 */

function AliwalViewDataTable( pAliwalModel, pDomGrid ){


	// Private members
	var that = this;
	var _dataModel 	= pAliwalModel;
	var _domGrid 	= pDomGrid;
	var _rowcnt     = 0;
	var _gridData   = [];
	var _yuiDataSource;
        var _yuiDataTable;

	// Events
	this.events = $({
		//  eventID	      : 'eventName' // Should match
		ViewDrawn             : 'ViewDrawn'
	});

	// Private member
	_makeLabelName = function( pLabel ){
		/** 
		 * Turns a label name into consistent value suitable for the grid col names
		 */
		return pLabel;
	}
	
	// Private member
	_makeTagsetName = function( pTagset, pTagIdx, pTagsetMaxTagCounts ){
		/** 
		 * Since a tagset can have several tags, this decides when numbered suffixes are appropriate.
		 */
		if( pTagsetMaxTagCounts[pTagset] <=1 ){
			return pTagset;
		} else {
			return pTagset + ': Tag ' + ( pTagIdx + 1 );
		}
		
	}
	
	// Private member
	_buildGridModel = function(){
		/** 
		 * It's important that _buildGridModel and _buildGridRow are in sync with each other.
		 */
		var retModel = [];
		var labelCensus = _dataModel.labelCensus()
		var tagsetMaxTagCounts = _dataModel.tagsetMaxTagCounts();
	
		$.each( labelCensus, function( key_label, val_count ){
			retModel.push( {key: _makeLabelName(key_label), sortable: true, resizeable: true, editor:new YAHOO.widget.BaseCellEditor() } );
		});
		
		$.each( tagsetMaxTagCounts, function(key_tagset, val_numtags){
			for( var tagIdx = 0 ;tagIdx < val_numtags; tagIdx++ ){
				retModel.push({ key        : _makeTagsetName( key_tagset, tagIdx, tagsetMaxTagCounts), 
						sortable   : true, 
						resizeable : true, 
						editor 	   : new YAHOO.widget.BaseCellEditor() 
				});
			};
		});
		
		retModel.push( {key: 'geocodeAddress', sortable: true, resizeable: true, editor:new YAHOO.widget.BaseCellEditor() } );
		retModel.push( {key: 'latitude',       sortable: true, resizeable: true, editor:new YAHOO.widget.BaseCellEditor() } );
		retModel.push( {key: 'longitude',      sortable: true, resizeable: true, editor:new YAHOO.widget.BaseCellEditor() } );
		
		return retModel;
	};
		
	//Private method
	_buildGridRow = function( pPlacemark, pTagsetMaxTagCounts ){
		/** 
		 * It's important that _buildGridModel and _buildGridRow are in sync with each other.
		 */
		var retRowData = new Object();
		
		$.each(pPlacemark.getLabelledSet(), function( key_labelname, val_labelval){
			retRowData[_makeLabelName(key_labelname)] = val_labelval;
		});
		
		$.each(pPlacemark.getTagsets(), function( key_tagset, val_tags){
			$.each(val_tags, function(idx, tag){
				retRowData[ _makeTagsetName(key_tagset, idx, pTagsetMaxTagCounts)] = tag;
			});
		});

		retRowData[ 'geocodeAddress' ] = pPlacemark.getGeocodeAddress();
		retRowData[ 'longitude'      ] = pPlacemark.getLongitude();
		retRowData[ 'latitude'       ] = pPlacemark.getLatitude();
		
		return retRowData;
		
	};

	//Privileged method
	this.addPlacemark = function( pPlacemark ){
		var tagsetMaxCounts = _dataModel.tagsetMaxTagCounts()
		_gridData.push( _buildGridRow(pPlacemark, tagsetMaxCounts) );
		_rowcnt++;
	};
	
	// Privileged method
	this.redraw = function(){
		/** ToDo.
		 * A way for the controller to ask for a redraw
		 */
	}

	// Listen for model ( jQuery ) events
	_dataModel.events.bind( 'ModelPlacemarkAdded', function(event, eventArg ){
		// console.log('ModelPlacemarkAdded received');
		that.addPlacemark( eventArg );
		that.redraw();  
	});
	_dataModel.events.bind( 'ModelPlacemarkGeocoded', function(event, eventArg ){
		// console.log('ModelPlacemarkGeocoded received');
		that.addPlacemark( eventArg );
		that.redraw();  
	});
	_dataModel.events.bind( 'ModelPlacemarkMoved', function(event, eventArg ){
		// console.log('ModelPlacemarkMoved received here 001');
		that.redraw(); 
	});
	
	
	/** @constructor 
	 */
	
        var _gridModel = _buildGridModel();
        
	$.each( _dataModel.getGeocodedPlacemarks(), function(idx, val_pm){
		that.addPlacemark( val_pm );
	});
	
	$.each( _dataModel.getUncodedPlacemarks(), function(idx, val_pm){
		that.addPlacemark( val_pm );
	});

	_yuiDataSource = new YAHOO.util.DataSource( _gridData );
	_yuiDataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
	_yuiDataSource.responseSchema = { fields: _gridModel };
	
	_yuiDataTable = new YAHOO.widget.DataTable("basic", _gridModel, _yuiDataSource, {
		caption:"DataTable Caption",
//		selectionMode:"cellblock"
	});
	
        // Subscribe to events for cell selection
        _yuiDataTable.subscribe("rowMouseoverEvent", _yuiDataTable.onEventHighlightRow  );
        _yuiDataTable.subscribe("rowMouseoutEvent",  _yuiDataTable.onEventUnhighlightRow);
        _yuiDataTable.subscribe("cellSelectEvent",   _yuiDataTable.clearTextSelection   );
        
	_yuiDataTable.subscribe("cellClickEvent", function (oArgs) {
		var target = oArgs.target;
		var record = this.getRecord(target);
		var column = this.getColumn(target);
		column.editor = new YAHOO.widget.TextboxCellEditor();
		this.showCellEditor(target);  
	});
	
	
	
	_yuiDataTable.subscribe("editorSaveEvent", function(oArgs){
	/*
	
	Parameters:
	    oArgs.editor <YAHOO.widget.CellEditor> The CellEditor instance. 
	    oArgs.newData <Object> New data value from form input field. 
	    oArgs.oldData <Object> Old data value.
	    
	*/
		var x = 99;
	}); 

	return _yuiDataTable;
}