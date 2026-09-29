@echo off
chcp 65001 > nul
title SIMPL3 8UTTON ALPHA 1.0 - Servidor
cd /d "%~dp0"
cls

echo =========================================================================
echo                   SIMPL3 8UTTON - GUIA DE CONFIGURACION
echo =========================================================================
echo.
echo  [1] SIMBOLOS PARA ATAJOS DE TECLADO:
echo      -----------------------------------------------------------------
echo      ^^  : Tecla Control (Ctrl)          Ej: ^^c        = Ctrl + C
echo      !  : Tecla Alt                     Ej: !{F4}     = Alt + F4
echo      +  : Tecla Shift (Mayus)           Ej: +{TAB}    = Shift + Tab
echo      #  : Tecla Windows (Win)           Ej: #d        = Win + D
echo.
echo  [2] TECLAS ESPECIALES (Siempre entre llaves {}):
echo      -----------------------------------------------------------------
echo      {F1} a {F12}   : Teclas de funcion (Ej: {F5} para refrescar)
echo      {ENTER}        : Tecla Enter
echo      {SPACE}        : Barra Espaciadora
echo      {TAB}          : Tecla Tabulador
echo      {ESC}          : Tecla Escape
echo      {DELETE}       : Tecla Suprimir / Delete
echo      {BACKSPACE}    : Tecla Retroceso
echo      {UP}/{DOWN}    : Flechas Arriba / Abajo
echo      {LEFT}/{RIGHT} : Flechas Izquierda / Derecha
echo.
echo  [3] EJEMPLOS DE PROGRAMACION DE BOTONES:
echo      -----------------------------------------------------------------
echo      - Copiar:                ^^c
echo      - Pegar:                 ^^v
echo      - Cerrar Ventana:        !{F4}
echo      - Mostrar Escritorio:    #d
echo      - Administrador Tareas:  ^^+{ESC}   (Ctrl + Shift + Esc)
echo      - Abrir Programa:        start notepad.exe
echo      - Ruta de ejecutable:    "C:\Archivos de programa\App\app.exe"
echo =========================================================================
echo.

:PREGUNTA
set /p respuesta="¿Iniciar Simpl3 8utton? (S/N): "

if /i "%respuesta%"=="S" goto INICIAR
if /i "%respuesta%"=="SI" goto INICIAR
if /i "%respuesta%"=="N" goto SALIR
if /i "%respuesta%"=="NO" goto SALIR

echo.
echo [!] Opcion no valida. Ingresa "S" para Si o "N" para No.
echo.
goto PREGUNTA

:INICIAR
echo.
if not exist "node_modules" (
    echo [INFO] Detectada primera ejecucion. Instalando librerias necesarias...
    echo        Esto puede tardar unos segundos, por favor espera.
    echo.
    call npm install
    echo.
    echo [OK] Librerias instaladas correctamente.
    echo.
)

echo Iniciando servidor de Simpl3 8utton...
echo =========================================================================
echo  Para salir, escriba "Cerrar" y presione Enter (o presione Ctrl+C)
echo =========================================================================
echo.
node server.js

echo.
echo [!] El servidor se ha detenido o ha ocurrido un error.
pause
exit

:SALIR
echo.
echo Operacion cancelada. Cerrando...
timeout /t 2 > nul
exit
