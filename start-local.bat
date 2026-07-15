@echo off
echo ===================================================
echo               AgriBiz Startup Utility
echo ===================================================
echo.
echo [1/3] Building production package...
call npm run build
echo.
echo [2/3] Starting preview server on http://localhost:5173...
start /b npx vite preview --host --port 5173
echo.
echo [3/3] Starting Pinggy mobile tunnel...
echo (You can close this window at any time to stop the server)
echo.
ssh -F none -p 443 -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R0:127.0.0.1:5173 free.pinggy.io
pause
