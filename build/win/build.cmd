@echo off
REM # Copy the application files
xcopy ..\..\application ".\Aliwal On1map" /EXCLUDE:xcopy-excludes.txt /E /I /V
REM #
REM # Copy XUL runner from 
REM #   http://ftp.mozilla.org/pub/mozilla.org/xulrunner/nightly/latest-trunk/xulrunner-1.9pre.en-US.win32.zip
REM #
xcopy .\xulrunner ".\Aliwal On1map\xulrunner" /E /I /V
REM #
REM # Need to sort out hte icon. CMDline Resource editor ?
copy  /V /Y .\xulrunner\xulrunner-stub.exe ".\Aliwal On1map\Aliwal On1map.exe"

