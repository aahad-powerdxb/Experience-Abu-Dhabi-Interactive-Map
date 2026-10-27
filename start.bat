@echo off
setlocal

:: Define the path where the final executable should be installed
set "INSTALLED_EXE=%LOCALAPPDATA%\Programs\experience-abu-dhabi-interactive-map\experience-abu-dhabi-interactive-map.exe"

:: Check if the app is already installed
if exist "%INSTALLED_EXE%" (
    echo Application found. Launching now...
    start "" "%INSTALLED_EXE%"
) else (
    echo Application not found. Starting installation...
    
    :: Run the installer from the same directory and wait for the extraction to finish
    start /wait "" "%~dp0experience-abu-dhabi-interactive-map Setup 1.0.0.exe"
    
    echo Installation complete! The installer will automatically launch the app.
)

:: Optional: Wait a moment so you can read the output before the console closes
timeout /t 3