#!/bin/sh

# Based on prism.sh script created by 
# Fabien Tassin <fta@sofaraway.org> in Sept 2007.

XULRUNNER=/usr/bin/xulrunner-1.9
WEBRUNNER=/usr/share/aliwal-geocoder

if [ "$1" = "-d" ] ; then
  DEBUG="-console -jsconsole"
  shift
fi

exec $XULRUNNER $WEBRUNNER/application.ini $DEBUG
