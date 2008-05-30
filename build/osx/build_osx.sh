#!/bin/sh -x
PUSHED=`pwd`
PID=$$
cd ../../application
find . | grep -v $0 | grep -v .svn | grep -v .DS_Store | grep -v .project | cut -f 2 | zip $PUSHED/aliwal.$PID.xulapp -@
cd $PUSHED
mv aliwal.$PID.xulapp "./Aliwal Geocoder.app/Contents/Resources/"
cd "./Aliwal Geocoder.app/Contents/Resources/"
unzip aliwal.$PID.xulapp
rm aliwal.$PID.xulapp
cd $PUSHED
mkdir -p "./Aliwal Geocoder.app/Contents/Frameworks/"
cd "./Aliwal Geocoder.app/Contents/Frameworks/"
rsync -rl /Library/Frameworks/XUL.framework .
cd $PUSHED
cp "./Aliwal Geocoder.app/Contents/Frameworks/XUL.framework/Versions/Current/xulrunner"  "./Aliwal Geocoder.app/Contents/MacOS/"
