@echo off
chcp 65001 > nul
title Менеджер Папок Фурнітури

echo ========================================================
echo   Запуск менеджера папок фурнітури...
echo ========================================================

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Помилка: Node.js не встановлено на цьому комп'ютері.
    echo Будь ласка, встановіть Node.js з офіційного сайту: https://nodejs.org/
    pause
    exit /b 1
)

:: Install root dependencies if not present
if not exist node_modules (
    echo [1/3] Встановлення залежностей бекенду...
    call npm install
) else (
    echo [1/3] Залежності бекенду вже встановлено.
)

:: Install frontend dependencies if not present
if not exist frontend\node_modules (
    echo [2/3] Встановлення залежностей фронтенду...
    cd frontend
    call npm install
    cd ..
) else (
    echo [2/3] Залежності фронтенду вже встановлено.
)

:: Build frontend if dist doesn't exist
if not exist frontend\dist (
    echo [3/3] Складання інтерфейсу React (це займе кілька секунд)...
    cd frontend
    call npm run build
    cd ..
) else (
    echo [3/3] Інтерфейс вже зібрано.
)

echo.
echo ========================================================
echo   Додаток запускається на http://localhost:3001
echo   Відкриваємо браузер...
echo ========================================================
echo.

:: Open the browser and run the server
start http://localhost:3001
node server.js

pause
