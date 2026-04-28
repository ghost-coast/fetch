@echo off
cd /d "%~dp0"
if not exist logs mkdir logs

:run
echo [%date% %time%] starting dashboard >> logs\dashboard-server.log
"C:\Program Files\nodejs\node.exe" server.js >> logs\dashboard-server.log 2>&1
echo [%date% %time%] dashboard exited with %errorlevel%, restarting in 2 seconds >> logs\dashboard-server.log
timeout /t 2 /nobreak > nul
goto run
