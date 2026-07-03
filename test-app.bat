@echo off
echo Starting development server...
npm run dev > dev-server.log 2>&1
echo Development server started on http://localhost:5173
echo.
echo You can now open the application in your browser:
echo http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
pause