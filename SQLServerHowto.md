# Aliwal Geocoder SQL #

A walkthrough showing how to get your data from SQL Server into Aliwal Geocoder.

## About ##
The file format for Aliwal Geocoder is [KML](http://code.google.com/apis/kml/documentation/) with a few conventions.
Use SQLCMD or an SSIS package to run the query below and put the results into an XML file named _something.**o1m**_ .

  1. Addresses which need to be geocoded are put into an 

&lt;ExtendedData&gt;

_child node called_

&lt;GeocodeAddress&gt;

_1. Data which could be used for pin labels or in the pin popups are_

&lt;ExtendedData&gt;

_child nodes called_

&lt;Data&gt;

_1. Data for tags are_

&lt;ExtendedData&gt;

_child nodes called_

&lt;TagSet&gt;

_with child nodes for the tags called_

&lt;Tag&gt;



This query only produces an XML fragment, not the full document.
To turn this fragment into a proper _**.o1m**_ file, add these two opening tags:
```
         <kml xmlns="http://earth.google.com/kml/2.2">
                 <Document>
```
to the very beginning of the results.
Then close those tags at the end of the document with:
```
                 </Document>
          </kml>
```
Remember, case is important for XML tags.


## Source Table or View ##
Assuming the database doesn't have coordinate data, an element called _GeocodeAddress_ is built up from the address fields available.
Source data in a table or view like this, one row per record / map pin:
```
CREATE TABLE vwSalesData(
  CompanyID         int         NOT NULL PRIMARY KEY,
  Addr1             varchar(64) NOT NULL,
  TownName          varchar(64) NOT NULL,
  PostalCode        varchar(64) NOT NULL,
  CountryCode       varchar(64) NOT NULL,
  CompanyName       varchar(64) NOT NULL,
  SalesPerson       varchar(64) NOT NULL,
  CompanyType       varchar(64) NOT NULL,
  SomethingElse     varchar(64) NOT NULL
)
go
```


## SQL Server 2005 Query ##
```
SELECT 
	4 					as Tag
	,NULL 					as Parent
	,[CompanyID] 				as [Placemark!4!SortKey!hide]
	,NULL 					as [Placemark!4]
	,NULL 					as [ExtendedData!5]
	,NULL 					as [GeocodeAddress!100]
	,NULL 					as [Data!200!name]
	,NULL 					as [Data!200!value!element]
	,NULL 					as [TagSet!300!name]
	,NULL 					as [TagSet!300!Tag!element]
FROM 
	vwSalesData
UNION ALL
SELECT
	5 					-- Tag
	,4 					-- Parent
	,[CompanyID] 				-- hidden sortkey
	,NULL
	,NULL
	,NULL
	,NULL
	,NULL
	,NULL
	,NULL
FROM 
	vwSalesData
UNION ALL
/* GeocodeAddress string goes here.
 */
SELECT
	100 					-- Tag
	,5 					-- Parent
	,[CompanyID] 				-- hidden sortkey
	,NULL
	,NULL
	, 	isnull([Addr1],'') 	+ ', ' +
		isnull([TownName],'')	+ ', ' +
		isnull([PostalCode],'')	+ '  ' +
		isnull([CountryCode],'') 	-- [GeocodeAddress!100]
		
	,NULL
	,NULL
	,NULL
	,NULL
FROM
	vwSalesData
UNION ALL
/* Pin Labels start here.
 * To add another label, copy a UNION ALL SELECT FROM statement, then
 * change the column name literal and source column to the new pin label
 */
SELECT
	200 					-- Tag
	,5 					-- Parent
	,[CompanyID] 				-- hidden sortkey
	,NULL 		
	,NULL 		
	,NULL		
	,'CompanyName' 				-- [Data!200!name]
	,[CompanyName] 				-- [Data!200!value!element]
	,NULL 	
	,NULL	
FROM
	vwSalesData
UNION ALL
SELECT
	200 					-- Tag
	,5 					-- Parent
	,[CompanyID] 				-- hidden sortkey
	,NULL 		
	,NULL 		
	,NULL		
	,'Company Id' 				-- [Data!200!name]
	,convert(varchar(128),[CompanyID]) 	-- [Data!200!value!element]
	,NULL 		
	,NULL
FROM
	vwSalesData
UNION ALL
SELECT
	200 					-- Tag
	,5 					-- Parent
	,[CompanyID] 				-- hidden sortkey
	,NULL 		
	,NULL 		
	,NULL		
	,'Contact' 				-- [Data!200!name]
	,[Contact] 				-- [Data!200!value!element]
	,NULL 		
	,NULL
FROM
	vwSalesData
UNION ALL
SELECT
	200 					-- Tag
	,5 					-- Parent
	,[CompanyID] 				-- hidden sortkey
	,NULL 		
	,NULL 		
	,NULL		
	,'Tel' 					-- [Data!200!name]
	,[Tel] 					-- [Data!200!value!element]
	,NULL 		
	,NULL
FROM
	vwSalesData
UNION ALL
SELECT
	200 					-- Tag
	,5 					-- Parent
	,[CompanyID] 				-- hidden sortkey
	,NULL 		
	,NULL 		
	,NULL		
	,'Address' 				-- [Data!200!name]
	,isnull([Addr1],'') 	+ ', ' +
		isnull([TownName],'')	+ ', ' +
		isnull([PostalCode],'')	+ '  ' +
		isnull([CountryCode],'') 	-- [Data!200!value!element]
	,NULL 		
	,NULL
FROM
	vwSalesData
UNION ALL
/* 
 * Tagsets start here.
 * To add another TagSet, copy a UNION ALL SELECT FROM statement, then
 * change the column name literal and source column to the new TagSet
 */
SELECT
	300 					-- Tag
	,5 					-- Parent
	,[CompanyID] 				-- hidden sortkey
	,NULL 		
	,NULL 		
	,NULL		
	,NULL 		
	,NULL 		
	,'SalesPerson' 				-- [TagSet!300!name]
	,[SalesPerson] 				-- [TagSet!300!Tag!element]
FROM
	vwSalesData
UNION ALL	
SELECT
	300 					-- Tag
	,5 					-- Parent
	,[CompanyID] 				-- hidden sortkey
	,NULL 		
	,NULL 		
	,NULL		
	,NULL 		
	,NULL 		
	,'Type of Company' 			-- [TagSet!300!name]
	,[CompanyType] 				-- [TagSet!300!Tag!element]
FROM
	vwSalesData
	
/* Order is very important. 
 * Don't alter without good reason 
 */
ORDER BY
	3,1,2
FOR XML EXPLICIT
go	
```