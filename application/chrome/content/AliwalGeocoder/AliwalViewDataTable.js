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
    var _yuiDataTable;
    var _IDMap = {}; 			// A hash to map AliwalModel IDs to YUI record IDs 

	// Events
	this.events = $({
		//  eventID	      : 'eventName' // Should match
		ViewDrawn             : 'ViewDrawn'
	});

	// Private method
	_makeLabelName = function( pLabel ){
		/** 
		 * Turns a label name into consistent value suitable for the grid col names
		 */
		return pLabel;
	}
	
	// Private method
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
	
	// Private method
	_buildGridModel = function(){
		/** 
		 * It's important that _buildGridModel and _buildGridRow and _buildSourceSchema are in sync with each other.
		 */
		
		var retModel   = [];
		var retLabels  = [];
		var retTagsets = [];
		var retGeo     = [];
		
		var labelCensus = _dataModel.labelCensus()
		var tagsetMaxTagCounts = _dataModel.tagsetMaxTagCounts();
	
		$.each( labelCensus, function( key_label, val_count ){
			retLabels.push( {key: _makeLabelName(key_label), sortable: true, resizeable: true, editor:new YAHOO.widget.BaseCellEditor() } );
		});
		
		$.each( tagsetMaxTagCounts, function(key_tagset, val_numtags){
			for( var tagIdx = 0 ;tagIdx < val_numtags; tagIdx++ ){
				retTagsets.push({ key        : _makeTagsetName( key_tagset, tagIdx, tagsetMaxTagCounts), 
						sortable   : true, 
						resizeable : true, 
						editor 	   : new YAHOO.widget.BaseCellEditor() 
				});
			};
		});
		
		retGeo.push( {key: 'geocodeAddress', sortable: true, resizeable: true }); //, editor:new YAHOO.widget.BaseCellEditor() } );
		retGeo.push( {key: 'latitude',       sortable: true, resizeable: true }); //, editor:new YAHOO.widget.BaseCellEditor() } );
		retGeo.push( {key: 'longitude',      sortable: true, resizeable: true }); //, editor:new YAHOO.widget.BaseCellEditor() } );
		
		retModel = [
			//{ key: 'Select',  label:'Select: <a id="grid_select_all"href="#">All</a> <a id="grid_select_none" href="#">None</a>', resizeable:true, formatter:"checkbox"}, 
			{ key: 'Labels',    children: retLabels  },
			{ key: 'Tagsets',   children: retTagsets },
			{ key: 'Geo',       children: retGeo     },
			//
			// Disabled for readonly release
			//
			//{ key: 'DeleteRow', label:'Delete Row',
			//       formatter:function(elCell) {
			//       elCell.innerHTML = '<img src="icons/red_cross_circle.png" title="delete row" />';
			//       elCell.style.cursor = 'pointer';}
			//}
		];
		
		return retModel;
	};
		
	//Private method
	_buildRecordObject = function( pPlacemark, pTagsetMaxTagCounts ){
		/** 
		 * It's important that _buildGridModel and _buildGridRow and _buildSourceSchema are in sync with each other.
		 */
		var retRecordObj = new Object({
			'geocodeAddress': pPlacemark.getGeocodeAddress(),
			'longitude'     : pPlacemark.getLongitude(),
			'latitude'      : pPlacemark.getLatitude()
		});
		
		$.each(pPlacemark.getLabelledSet(), function( key_labelname, val_labelval){
			retRecordObj[ _makeLabelName(key_labelname) ] = val_labelval;
		});
		
		$.each(pPlacemark.getTagsets(), function( key_tagset, val_tags){
			$.each(val_tags, function(idx, tag){
				retRecordObj[ _makeTagsetName(key_tagset, idx, pTagsetMaxTagCounts) ] = tag;
			});
		});
		return retRecordObj;
	};
	
	// Private method
	_buildEmptyDataSource = function(){
		var schemaFields = _buildGridModel();
		var yuiDataSource = new YAHOO.util.DataSource( [] );
		yuiDataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
		
		yuiDataSource.responseSchema = { fields: schemaFields };
		return yuiDataSource;
	};
	
	// Private method
	_updateDataTableGeo = function( pPlacemarkID ){
		var modelPM = _dataModel.getPlacemark(pPlacemarkID);
		_yuiDataTable.getRecordSet().updateRecordValue( _IDMap[pPlacemarkID], 'geocodeAddress', modelPM.getGeocodeAddress() );
		_yuiDataTable.getRecordSet().updateRecordValue( _IDMap[pPlacemarkID], 'longitude',      modelPM.getLongitude() );
		_yuiDataTable.getRecordSet().updateRecordValue( _IDMap[pPlacemarkID], 'latitude',       modelPM.getLatitude() );		
	};
	
	//Privileged method
	this.addPlacemark = function( pPlacemarkID ){
		var tagsetMaxCounts = _dataModel.tagsetMaxTagCounts()
		var placeMark = _dataModel.getPlacemark( pPlacemarkID );
		var recordSet = _yuiDataTable.getRecordSet();
		_IDMap[pPlacemarkID] = recordSet.addRecord( _buildRecordObject(placeMark, tagsetMaxCounts) );

	};
	
	// Privileged method
	this.redraw = function(){
		_yuiDataTable.render();
	};
	
	/** @constructor 
	 */
	
	// Listen for model ( jQuery ) events
	_dataModel.events.bind( 'ModelPlacemarkAdded', function(event, eventArg ){
		that.addPlacemark( eventArg );
	});
	_dataModel.events.bind( 'ModelPlacemarkGeocoded', function(event, eventArg ){
		_updateDataTableGeo( eventArg );
		_yuiDataTable.render(); 
	});
	_dataModel.events.bind( 'ModelPlacemarkMoved', function(event, eventArg ){
		_updateDataTableGeo( eventArg );
		_yuiDataTable.render(); 
	});
	
	var placemarkIDs = _dataModel.getPlacemarkIDs();
	
	_yuiDataTable = new YAHOO.widget.DataTable( _domGrid, _buildGridModel(), _buildEmptyDataSource(), {
		caption:"Aliwal Geocoder",
		//selectionMode:"cellblock"
		paginator       : new YAHOO.widget.Paginator({ 
			rowsPerPage : 20,
			totalRecords: placemarkIDs.length 
		}) 
	});
	_yuiDataTable.subscribe("rowMouseoverEvent", _yuiDataTable.onEventHighlightRow  );
	_yuiDataTable.subscribe("rowMouseoutEvent",  _yuiDataTable.onEventUnhighlightRow);
	_yuiDataTable.subscribe("cellSelectEvent",   _yuiDataTable.clearTextSelection   );
	_yuiDataTable.subscribe("renderEvent",   	function(){
		var paginator = _yuiDataTable.get('paginator');
		paginator.set('totalRecords', _yuiDataTable.getRecordSet().getLength() );
	});
	
	
	$.each( placemarkIDs, function(idx, val_pmid){
		that.addPlacemark( val_pmid );
	});
		
	_yuiDataTable.render();
	
//
// Disabled for readonly release
//	_yuiDataTable.subscribe("cellClickEvent", function (oArgs) {
//		var target = oArgs.target;
//		var record = this.getRecord(target);
//		var column = this.getColumn(target);
//		if( column.key == 'DeleteRow'){
//			if (confirm('Are you sure?')) {
//			    _yuidataTable.deleteRow(target);
//			}				
//		} else {
//			column.editor = new YAHOO.widget.TextboxCellEditor();
//			this.showCellEditor(target);  
//		}
//		
//	});
//	
//	_yuiDataTable.subscribe("editorSaveEvent", function(oArgs){
//	/*
//	
//	Parameters:
//	    oArgs.editor <YAHOO.widget.CellEditor> The CellEditor instance. 
//	    oArgs.newData <Object> New data value from form input field. 
//	    oArgs.oldData <Object> Old data value.
//	    
//	*/
//		var x = 99;
//	}); 

}
