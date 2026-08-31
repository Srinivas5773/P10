@echo off
title ApexFlow Enterprise CRM Launcher
echo ===================================================
echo   ApexFlow Enterprise Project & Client CRM Suite
echo ===================================================
echo.
echo Launching ApexFlow CRM in your default browser...
start "" "%~dp0index.html"
echo.
echo Opening standalone single-file fallback...
start "" "%~dp0crm-standalone.html"
echo.
echo CRM is now open in your browser!
pause
