@echo off
echo Testing PDF Upload Endpoint
echo ============================
echo.
echo Make sure the server is running on port 8080
echo.
echo Replace YOUR_PROJECT_ID with an actual project ID from your database
echo.
pause

curl -X POST http://localhost:8080/import/pdf ^
  -F "pdf=@Reference/2025 08 factiva supplementary data.pdf" ^
  -F "projectId=YOUR_PROJECT_ID"

echo.
echo.
echo Check the terminal where the server is running for detailed logs
pause

