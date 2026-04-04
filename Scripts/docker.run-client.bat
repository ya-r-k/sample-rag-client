@echo off
chcp 65001 >nul

REM API + deps: sibling repo semantic-kernel-sample-rag-api (same pattern as docker.run-api.bat)
set "API_SCRIPTS=%~dp0..\..\semantic-kernel-sample-rag-api\Scripts"
if not exist "%API_SCRIPTS%\docker.run-api.bat" (
  echo [ERROR] API launcher not found:
  echo         "%API_SCRIPTS%\docker.run-api.bat"
  echo         Place semantic-kernel-sample-rag-api next to sample-rag-client under the same parent folder.
  exit /b 1
)

echo.
echo --------------------------------------------------------------
echo [DEBUG] Starting API and dependencies ^(docker.run-api.bat^)
echo --------------------------------------------------------------
pushd "%API_SCRIPTS%"
call docker.run-api.bat --no-pause
set "API_EXIT=%errorlevel%"
popd

echo.
echo --------------------------------------------------------------
echo [DEBUG] Building and running SampleRag.Client in Docker
echo --------------------------------------------------------------

cd /d "%~dp0.."

docker network inspect samplerag-net >nul 2>&1
if errorlevel 1 docker network create samplerag-net >nul 2>&1

for %%C in (sampleragapi) do docker network connect samplerag-net %%C 2>nul

echo [DEBUG] docker build -t sampleragclient ...
docker build -t sampleragclient -f Dockerfile .

echo.
echo [DEBUG] Starting container sampleragclient ^(Vite dev, port 5274^)...
docker ps -a --format "{{.Names}}" | findstr /R /C:"sampleragclient" >nul
if %errorlevel%==0 (
  docker start sampleragclient >nul 2>&1
) else (
  REM VITE_* читает браузер на хосте — localhost:5234, не имя контейнера API
  docker run -d --name sampleragclient --network samplerag-net ^
    -p 5274:5274 ^
    -e VITE_API_BASE_URL=http://localhost:5234 ^
    -e VITE_AUTH_LOGIN_URL=http://localhost:5234/api/auth/login ^
    -e "VITE_APP_NAME=Sample RAG Client" ^
    sampleragclient
)

echo.
echo [DEBUG] Running containers:
docker ps
echo [DEBUG] Client: http://localhost:5274  API: http://localhost:5234
echo [DEBUG] Done. Check containers with: docker ps
set /p DUMMY=Press Enter to continue...
