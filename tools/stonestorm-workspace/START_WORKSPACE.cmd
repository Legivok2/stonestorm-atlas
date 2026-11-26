@echo off
setlocal
set "ELECTRON_RUN_AS_NODE="
set "NODE_OPTIONS="
if not exist "%~dp0dist\0.3.0\StoneStorm Workspace-win32-x64\StoneStorm Workspace.exe" (
  echo The portable Windows build is missing. See README.md for source build steps.
  pause
  exit /b 1
)
start "" "%~dp0dist\0.3.0\StoneStorm Workspace-win32-x64\StoneStorm Workspace.exe"
endlocal
