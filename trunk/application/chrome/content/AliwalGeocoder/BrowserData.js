// Global scope for easier debugging

// No point creating av* views until the model is populated
var avg; // AliwalViewGrid

jQuery(document).ready(function(){
	avg = new AliwalViewGrid( xscopeNS.amodel, '#gridview', '#gridpager' );
	xscopeNS.amodel.addedListener( avg, avg.addPlacemark );

}); 