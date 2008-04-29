function DataManager(){
	/* Namespace for Data functionality */
		
	this._cacheMgr = new CacheManager();
	this._tmpList = new Array();

}
DataManager.prototype.reloadMarkers = function(pMarkers, pDestList){
	// When markers are created, the pinList is emptied to reduce memory consumption.
	// This moves the data from markers back to pinList, so that new markers can be recreated on a new map
	while ( pMarkers.length > 0){
		var tmp = pMarkers.pop()
		var dd = tmp.on1data ;
		pDestList.push( dd );
	}
}
DataManager.prototype.loadFile = function(pFile,pDestPinList,pDestPinItems,pDestPinTagSets, pDestFlags ){
	var that = this, 
		parseErrorLog = [],
		tmpPinBuffer = [];  //Pins come from the XML into here, get enriched by fnPinStackCallback and then moved back to pDestPinList.
		
	var fnPinStackCallback = (function (pOp){
		if (pOp === "PUSH"){
			while (tmpPinBuffer.length){          
				// This should only iterate once but too be sure.
				var latest = tmpPinBuffer.pop();
				that._enrichFromCache(latest);
				pDestPinList.push(latest);
			}
    	}
	});
	
	var contentHandler = {
		_characterData : "", 
		_elementStack : [], 
		_Placemark : {}, 
		_lastDataKey : "", 
		_currTagSetName :"",
		_pinList : tmpPinBuffer,
		_pinItems : pDestPinItems,		
		_pinTagSets : pDestPinTagSets,
		_pFlags : pDestFlags,
		_fnPinStackCallback : fnPinStackCallback,
		
		_handleCharacterData : (function(){
			if (this._charBuffer != ""){          
				this._fullCharacterDataReceived(this._charBuffer);
			}
			this._charBuffer = "";
		}),
		
		_fullCharacterDataReceived : (function (fullCharacterData){      
			this._characterData = "" + fullCharacterData;
		}),
		
		startDocument : (function (){
			this._handleCharacterData();
			jsdump("startDocument");
		}), 
		
		endDocument : (function (){
			this._handleCharacterData();
			jsdump("endDocument");
		}), 
	
		startElement : (function (uri,localName,qName,attributes){
			this._handleCharacterData();
		
		    //place startElement event handling code below this line
			this._elementStack.push( qName );
			switch( qName ){
				case 'Document':
					break;
				case 'name':
					break;
				case 'Placemark':
					this._Placemark = new Object();
					break;
				case 'ExtendedData':
					this._Placemark.ExtendedData = new Object();
					break;
				case 'Data': 
					for (var i = 0;i < attributes.length;i++){
						if(attributes.getQName(i) === 'name'){
							this._lastDataKey = attributes.getValue(i);
							break;
						}
					}
					if (typeof (this._pinItems[ this._lastDataKey ]) === 'undefined' ){
						this._pinItems[ this._lastDataKey ] = 1; //Initialize the counter
					} else {
						this._pinItems[ this._lastDataKey ]++;
					}
					break;
				case 'value': 
					break;
				case 'TagSet':
					for (var i = 0;i < attributes.length;i++){
						if(attributes.getQName(i) === 'name'){
							this._currTagSetName = attributes.getValue(i);
							break;
						}
					}
					if( typeof(this._Placemark.ExtendedData[ this._currTagSetName ]) === 'undefined' ){
						this._Placemark.ExtendedData[ this._currTagSetName ] = new Array();
					}
					if ( typeof(this._pinTagSets[ this._currTagSetName ]) === 'undefined' ){
						this._pinTagSets[ this._currTagSetName ] = new Object();
					}
					break;
				case 'Tag':
					break;
				case 'Point':
					this._Placemark.Point = new Object();
					break;
				case 'coordinates':
					break;
				case 'GeocodeAddress':
					break;
				case 'kml':
					break;
				default:
					break;
			}
		}), 
		
		endElement : (function (uri,localName,qName){
		    this._handleCharacterData();
		
		    //place endElement event handling code below this line
			switch( qName ){
				case 'Document':
					break;
				case 'name':
					if ( !this._Placemark['name']){
						this._Placemark['name'] = ''+this._characterData;
					}
					break;
				case 'Placemark':
					this._pinList.push( this._Placemark );
					this._fnPinStackCallback('PUSH');
					break;
				case 'ExtendedData':
					break;
				case 'Data': 
					break;
				case 'value': 
					this._Placemark.ExtendedData[this._lastDataKey] = this._characterData;
					break;
				case 'TagSet': ;
					break;
				case 'Tag':
					var tagname = this._characterData;
					this._Placemark.ExtendedData[ this._currTagSetName].push( tagname);
					if (typeof (this._pinTagSets[ this._currTagSetName ][tagname]) === 'undefined' ){
						this._pinTagSets[ this._currTagSetName ][tagname] = 1;
					} else {
						this._pinTagSets[ this._currTagSetName ][tagname]++;
					}
					break;
				case 'Point': ;
					break;
				case 'coordinates':
					this._Placemark.Point.coordinates = this._characterData;
					break;
				case 'GeocodeAddress':
					this._Placemark.ExtendedData['GeocodeAddress'] = this._characterData;
					break;
				case 'kml':
					break;
				default:
					break;
			}
		
			this._elementStack.pop();
			// Just to be safe, swallow the characters.
			this._characterData = '';
		}), 
		
		characters : (function (value){
			this._charBuffer += value;
		}), 
		
		processingInstruction : (function (target,data){
			this._handleCharacterData();
		}), 
		
		ignorableWhitespace : (function (whitespace){
			this._handleCharacterData();
		}), 
		
		startPrefixMapping : (function (prefix,uri){
			this._handleCharacterData();	
		}), 
		
		endPrefixMapping : (function (prefix){
			this._handleCharacterData();
		}), 
		
		QueryInterface : (function (iid){
			if (! iid.equals(Components.interfaces.nsISupports) && ! iid.equals(Components.interfaces.nsISAXContentHandler)){
				throw Components.results.NS_ERROR_NO_INTERFACE;
			}
			return this;
		})
	};
	
	var lexicalHandler = {
		comment 	: (function (aContents){ return }), 
		startDTD 	: (function (aName, aPublicId, aSystemId){ return }), 
		endDTD 		: (function (){ return }), 
		startCDATA 	: (function (){ return }), 
		endCDATA 	: (function (){ return }), 
		startEntity : (function (aName){ return }), 
		endEntity 	: (function (aName){ return })
	};
	
	var dtdHandler = {
		notationDecl 		: (function (aName, aPublicId, aSystemId){ return }),
		unparsedEntityDecl 	: (function (aName, aPublicId, aSystemId, aNotationName){ return })
	};
		
	var errorHandler = {
		locator: 	null,
		_error: 	null,
		
		reset 				: (function (){
			this.locator = null;
			this._error = null;
		}),
		error 				: (function (aLocator,aError){ 
			return }),
		fatalError 			: (function (aLocator,aError){
			this.locator = aLocator;
			this._error = aError;
			throw 'XML parsing fatal error';
		}),
		ignorableWarning 	: (function (aLocator,aError){ return })
	};


    try {        
        var filestream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
        var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
        var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
        var saxReader = Components.classes["@mozilla.org/saxparser/xmlreader;1"].createInstance(Components.interfaces.nsISAXXMLReader);
        try{
			saxReader.setFeature("http://xml.org/sax/features/namespace-prefixes", true);
            saxReader.setFeature("http://xml.org/sax/features/namespace", true);
		} catch (e){
        	// Ignore
        }

        saxReader.contentHandler = contentHandler;
        saxReader.lexicalHandler = lexicalHandler;
        saxReader.dtdHandler = dtdHandler;
        saxReader.errorHandler = errorHandler;

		while( pDestPinList.length > 0){ pDestPinList.pop(); };
		for(var kk in pDestPinItems){ delete pDestPinItems[kk] };
		for(var kk in pDestPinTagSets){ delete pDestPinTagSets[kk] };

        filestream.init( pFile, 1, 292, 0);
        var uri = ioService.newFileURI( pFile);
        var channel = ioService.newChannelFromURI(uri, null, null);
        var StreamChunkSize = 32768;
        var streamListener = new StreamListener(saxReader, channel);        
        saxReader.parseAsync(null);
        pump.init(filestream, - 1, - 1, StreamChunkSize, 1, false);
        pump.asyncRead(streamListener, null);
      }
    catch (e){
    	jsdump(e);
      }
    
    return parseErrorLog;
}
  
  
function Prog(){
	function onProgress(){
		return true;
	}
	onProgress:{}
}
function StreamListener(reader,channel){
	this.reader = reader;
	this.channel = channel;
}
StreamListener.prototype = {
	reader : null, 
	onStartRequest : (function (request,context){
		xscopeNS.flags.loadingData = true;
	  	this.reader.onStartRequest(this.channel, context);
	}), 
	onDataAvailable : (function (request,context,input,offset,count){
  		//jsdump("offset: " + offset + ", count: " + count + '\n, xscopeNS.flags.loadingData is ' + xscopeNS.flags.loadingData);
  		this.reader.onDataAvailable(this.channel, context, input, offset, count);
	}), 
	onStopRequest : (function (request,context,status){
		this.reader.onStopRequest(this.channel, context, status);
		xscopeNS.flags.loadingData = false;
	})
};

DataManager.prototype._enrichFromCache = function( pObj){
	var _addrMember = 'GeocodeAddress';
	if ( typeof( pObj.Point) === 'undefined' ){
		pObj.Point = new Object();
	}
	if (typeof(pObj.Point.coordinates) === 'undefined') {
		try {
			var lookup = pObj.ExtendedData[_addrMember]; //str_md5( pObj.ExtendedData[_addrMember] );
			var cachedStr = this._cacheMgr.getItem( lookup );
			pObj.Point.coordinates = ''+cachedStr;
		} catch(e) {
			jsdump('Cache unlucky. Going with file data for address:\n' + pObj.ExtendedData[_addrMember] );
		}		
	}
}

DataManager.prototype.fixedTypeOf = function(value){
/* Thanks: http://javascript.crockford.com/remedial.html
 * ps. How many wasted hours!? I miss python.
 */
    var s = typeof value;
    if (s === 'object') {
        if (value) {
            if (typeof value.length === 'number' &&
                    !(value.propertyIsEnumerable('length')) &&
                    typeof value.splice === 'function') {
                s = 'array';
            }
        } else {
            s = 'null';
        }
    }
    return s;
}