@echo off
setlocal

cd /d "%~dp0"

set "NODE_EXE=C:\Users\Home\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if exist "%NODE_EXE%" (
  "%NODE_EXE%" server.js
  goto :done
)

where node >nul 2>nul
if %errorlevel%==0 (
  node server.js
  goto :done
)

echo Node.js was not found.
echo Install Node.js from https://nodejs.org/ or run this app from Codex.
pause

:done
endlocal
