# define name of installer
outFile "Aliwal On1map Installer.exe"
 
# define installation directory
installDir "$PROGRAMFILES\Aliwal On1map"
 
# start default section
section
    # set the installation directory as the destination for the following actions
    setOutPath $INSTDIR
 
    # create the uninstaller
    writeUninstaller "$INSTDIR\uninstall.exe"
    
    # create a shortcut in the start menu programs directory
    # point the new shortcut at the program
    createDirectory "$SMPROGRAMS\Aliwal On1map"
    createShortCut  "$SMPROGRAMS\Aliwal On1map\Aliwal On1map.lnk" "$INSTDIR\Aliwal On1map.exe"
    createShortCut  "$SMPROGRAMS\Aliwal On1map\Uninstall Aliwal On1map.lnk" "$INSTDIR\uninstall.exe"
    
    # Define which files to install
    file /r ".\Aliwal On1map\*.*"
sectionEnd
 
# uninstaller section start
section "uninstall"
 
	RMDir /r "$INSTDIR"
 
    # second, remove the link from the start menu
    RmDir /r "$SMPROGRAMS\Aliwal On1map"
 
# uninstaller section end
sectionEnd
