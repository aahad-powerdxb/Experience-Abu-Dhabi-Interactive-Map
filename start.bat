@echo off
:: Wait 15 seconds to ensure network connectivity
timeout /t 15 /nobreak
:: Launch the kiosk app
start "" "C:\MapKiosk\MapKiosk.exe"