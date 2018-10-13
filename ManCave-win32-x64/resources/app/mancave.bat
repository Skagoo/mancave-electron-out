if not exist "%USERPROFILE%\Documents\ManCave\" (
	mkdir "%USERPROFILE%\Documents\ManCave"
	cd "%USERPROFILE%\Documents\ManCave"
	if not exist "C:\Program Files\Git\cmd\" (
		"E:\Program Files (x86)\Git\cmd\git.exe" clone https://github.com/Skagoo/mancave-electron-out.git .
	) else (
		"C:\Program Files\Git\cmd\git.exe" clone https://github.com/Skagoo/mancave-electron-out.git .
	)

	powershell.exe -ExecutionPolicy Bypass -NoLogo -NonInteractive -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%USERPROFILE%\Desktop\ManCave.lnk'); $S.TargetPath = '%USERPROFILE%\Documents\ManCave\ManCave-win32-x64\ManCave.exe'; $S.Save()"
) else (
	cd "%USERPROFILE%\Documents\ManCave"
	if not exist "C:\Program Files\Git\cmd\" (
		"E:\Program Files (x86)\Git\cmd\git.exe" checkout .
		"E:\Program Files (x86)\Git\cmd\git.exe" pull
	) else (
		"C:\Program Files\Git\cmd\git.exe" checkout .
		"C:\Program Files\Git\cmd\git.exe" pull
	)
)