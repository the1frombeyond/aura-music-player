Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
htmlPath = scriptDir & "\index.html"
startupPath = scriptDir & "\startup.js"

filepath = ""
If WScript.Arguments.Count > 0 Then
    filepath = WScript.Arguments(0)
End If

Set file = fso.CreateTextFile(startupPath, True)
If filepath = "" Then
    file.WriteLine("window.startupFile = null;")
Else
    filepath = Replace(filepath, "\", "\\")
    file.WriteLine("window.startupFile = """ & filepath & """;")
End If
file.Close

WshShell.Run "msedge.exe --allow-file-access-from-files --app=""" & htmlPath & """", 0, False
