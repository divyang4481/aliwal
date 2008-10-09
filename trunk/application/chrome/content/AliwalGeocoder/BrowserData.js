// Global scope for easier debugging

// No point creating av* views until the model is populated
var avg; // AliwalViewGrid

$(document).ready(function(){
	avg = new AliwalViewGrid( xscopeNS.amodel, '#gridview', '#gridpager' );
	xscopeNS.amodel.eventPlacemarkAdded.subscribe( function( pType, pArgs ){
		avg.addPlacemark(pArgs[0]);
	});
}); 