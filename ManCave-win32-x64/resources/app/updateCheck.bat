@ECHO OFF
cd "%USERPROFILE%\Documents\ManCave"
if not exist "C:\Program Files\Git\cmd\" (
	"E:\Program Files (x86)\Git\cmd\git.exe" fetch
	"E:\Program Files (x86)\Git\cmd\git.exe" status
) else (
	"C:\Program Files\Git\cmd\git.exe" fetch
	"C:\Program Files\Git\cmd\git.exe" status --porcelain
)

EXIT /B 1
