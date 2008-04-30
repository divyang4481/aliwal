#!/bin/sh -x
find ../../../application | grep -v $0 | grep -v .svn | grep -v .DS_Store | grep -v .project | cut -f 2 | zip aliwal.xulapp -@

