@echo off
echo Starting Redis server...

if exist "redis\redis-server.exe" (
    echo Found Redis server, starting...
    start /B redis\redis-server.exe redis\redis.windows.conf
    echo Redis server started on port 6379
    timeout /t 2 >nul
) else (
    echo Redis server not found in redis\ directory
    echo The application will continue without Redis caching
)

echo.
echo Redis startup complete.
pause