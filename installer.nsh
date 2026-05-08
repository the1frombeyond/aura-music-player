; installer.nsh - NSIS script to set AURA as default music player

!macro customInstall
  ; Register as default music player for supported file types
  WriteRegStr HKCU "Software\Classes\Applications\AURAMusicPlayer.exe\Capabilities" "ApplicationName" "AURA Music Player"
  WriteRegStr HKCU "Software\Classes\Applications\AURAMusicPlayer.exe\Capabilities" "ApplicationDescription" "AURA CoverFlow Music Player"

  ; Register file associations
  WriteRegStr HKCU "Software\Classes\.mp3" "" "AURAMusicPlayer.mp3"
  WriteRegStr HKCU "Software\Classes\.wav" "" "AURAMusicPlayer.wav"
  WriteRegStr HKCU "Software\Classes\.flac" "" "AURAMusicPlayer.flac"
  WriteRegStr HKCU "Software\Classes\.m4a" "" "AURAMusicPlayer.m4a"
  WriteRegStr HKCU "Software\Classes\.aac" "" "AURAMusicPlayer.aac"

  ; Create file type entries
  WriteRegStr HKCU "Software\Classes\AURAMusicPlayer.mp3" "" "MP3 Audio File"
  WriteRegStr HKCU "Software\Classes\AURAMusicPlayer.mp3\DefaultIcon" "" "$INSTDIR\AURA Music Player.exe,0"
  WriteRegStr HKCU "Software\Classes\AURAMusicPlayer.mp3\shell\open\command" "" '"$INSTDIR\AURA Music Player.exe" "%1"'

  WriteRegStr HKCU "Software\Classes\AURAMusicPlayer.wav" "" "WAV Audio File"
  WriteRegStr HKCU "Software\Classes\AURAMusicPlayer.wav\DefaultIcon" "" "$INSTDIR\AURA Music Player.exe,0"
  WriteRegStr HKCU "Software\Classes\AURAMusicPlayer.wav\shell\open\command" "" '"$INSTDIR\AURA Music Player.exe" "%1"'

  WriteRegStr HKCU "Software\Classes\AURAMusicPlayer.flac" "" "FLAC Audio File"
  WriteRegStr HKCU "Software\Classes\AURAMusicPlayer.flac\DefaultIcon" "" "$INSTDIR\AURA Music Player.exe,0"
  WriteRegStr HKCU "Software\Classes\AURAMusicPlayer.flac\shell\open\command" "" '"$INSTDIR\AURA Music Player.exe" "%1"'

  WriteRegStr HKCU "Software\Classes\AURAMusicPlayer.m4a" "" "M4A Audio File"
  WriteRegStr HKCU "Software\Classes\AURAMusicPlayer.m4a\DefaultIcon" "" "$INSTDIR\AURA Music Player.exe,0"
  WriteRegStr HKCU "Software\Classes\AURAMusicPlayer.m4a\shell\open\command" "" '"$INSTDIR\AURA Music Player.exe" "%1"'

  WriteRegStr HKCU "Software\Classes\AURAMusicPlayer.aac" "" "AAC Audio File"
  WriteRegStr HKCU "Software\Classes\AURAMusicPlayer.aac\DefaultIcon" "" "$INSTDIR\AURA Music Player.exe,0"
  WriteRegStr HKCU "Software\Classes\AURAMusicPlayer.aac\shell\open\command" "" '"$INSTDIR\AURA Music Player.exe" "%1"'

  ; Set as default player in Windows 10/11
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\audio" "Default" "AURA Music Player"

  ; Notify Windows of the change
  System::Call "Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)"
!macroend

!macro customUnInstall
  ; Remove file associations
  DeleteRegKey HKCU "Software\Classes\AURAMusicPlayer.mp3"
  DeleteRegKey HKCU "Software\Classes\AURAMusicPlayer.wav"
  DeleteRegKey HKCU "Software\Classes\AURAMusicPlayer.flac"
  DeleteRegKey HKCU "Software\Classes\AURAMusicPlayer.m4a"
  DeleteRegKey HKCU "Software\Classes\AURAMusicPlayer.aac"
  DeleteRegKey HKCU "Software\Classes\Applications\AURAMusicPlayer.exe"
!macroend
