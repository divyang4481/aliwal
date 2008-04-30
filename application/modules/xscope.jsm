EXPORTED_SYMBOLS = [ "xscopeNS" ]

var xscopeNS = {
	markers 	: [],
	raw_data 	: [],
	
	pinList 	: [],
	pinItems 	: {},	// A census of the labels found on pins and count of pins with that data item
	pinTagSets 	: {},   // A census of Tagsets, their tags and the count of pins with that tag.
	
	flags		: {loadingData : false} // Not a boolean because of pass by reference requirement
};
