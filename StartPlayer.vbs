Set WshShell = CreateObject("WScript.Shell")
htmlPath = WshShell.CurrentDirectory & "\index.html"
WshShell.Run "msedge.exe --app=""" & htmlPath & """", 0, False
