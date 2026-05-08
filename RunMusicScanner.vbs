Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where the script is located
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

' Start the Node.js backend server hidden in the background
WshShell.Run "cmd.exe /c ""C:\Program Files\nodejs\node.exe"" server.js", 0, False

' Give the server 1 second to start up
WScript.Sleep 1000

' Launch the UI in Edge App Mode pointing to our local server
WshShell.Run "msedge.exe --app=http://localhost:8080/", 0, False
