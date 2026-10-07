# SIMPL3 8UTTONS - ALPHA 1.0

Aplicación interactiva de servidor para programación rápida de botones y automatización de atajos de teclado.

### I M P O R T A N T E ###

Para descargar el instalador: A la derecha vas a ver el apartado RELEASE que te va a descargar el instalador actualizado, hace todo automáticamente.

Para descargar el repositorio: DEBES TENER INSTALADO NODE.JS en tu PC. Sin esto, tu computadora no puede ejecutar código JavaScript.

## 🚀 Cómo Iniciar el Programa (Repositorio)

1. Descargá o cloná este repositorio en tu computadora.
2. Hacé doble clic en el archivo **`Iniciar botonera.bat`**.
3. El programa detecta si te faltan las librerías necesarias e instalará automáticamente todo lo requerido en la primera ejecución.

---
### Instalación

1. Ejecutar el .exe que descargaste.
2. Elegir la ruta donde lo quieras instalar (el programa crea su subcarpeta).
3. Iniciar el programa.

---
### Vinculación con OBS

Lo principal para que se vincule con la botonera es tener abierto OBS ANTES de iniciar la app. Para vincular:

EN OBS:
1. En la barra de arriba, vamos a Herramientas > Ajustes del Servidor WebSocket > Marcá la primera opción que dice "Habilitar servidor WebSocket" > Mostrar más información de conexión > Clickea el botón de Copiar en "Contraseña del servidor".
***NUEVO***
2. Abrí el programa, clickeá en "⚙️" y seleccioná "Conexión OBS".
3. No toques nada, está todo por default. Pegá la clave de OBS en el espacio que dice "Clave del servidor WebSocket". Dejalo vacío si no tenes clave.
4. Cuando pongas "Guardar y conectar", el estado de OBS (abajo del título) se va a poner en verde y te va a mostrar un mensaje que dice "Conectado a OBS".
5. Streameá o grabá tranquilo :)

---
### 🛠️ Solución de Problemas Comunes (General)

1. Si sos usuario de Windows 11, probablemente te salte un cartel que nos dice que el programa no se pudo ejecutar porque no tiene una firma oficial de Microsoft (no soy socio de Microsoft, no tengo eso).
SOLUCION: Click derecho al instalador > Propiedades > General, abajo del todo hay una casillita que dice "Desbloquear". Marcala, Aceptar, y listo. Si sigue saliendo el cartel y no ves un botón de "Ejecutar de todas formas", es por el "Control Inteligente de Aplicaciones" (Que tira este error porque el programa no tiene firma digital y por eso salta el aviso). Para desactivarlo buscá Seguridad de Windows > Control de aplicaciones y explorador > Configurar control inteligente de aplicaciones > Cambialo a Evaluación o Desactivado (es lo mejor). Y listo, lo vas a poder instalar tranquilamente.

2. Si sos usuario de Windows 10, probablemente te salte un cartel que nos dice que Windows protegió tu pc. Lo mismo que W11, pasa porque no tiene firma oficial de Microsoft.
SOLUCION: Clickea donde dice Mas Información y Ejecutar de todos modos.

---

## 🛠️ Solución de Problemas Comunes (Repositorio)

El archivo `.bat` se cierra solo o muestra errores de comando `cho`
Si al hacer doble clic al archivo `.bat` la consola se cierra inmediatamente o muestra textos corruptos como `"cho" no se reconoce como un comando interno`, se debe a que tu sistema operativo alteró el formato de los saltos de línea invisibles durante la descarga.
SOLUCIÓN:
1. Click derecho > Editar al archivo `Iniciar botonera.bat` con **Notepad++**.
2. En el menú superior: Edición > Conversión fin de línea (o Edit > EOL Conversion).
3. Seleccioná la opción Formato Windows (CRLF)**.
4. Guardá el archivo (Ctrl + S) y volvé a ejecutarlo.

---

### Ejemplo de comandos y funciones

El programa usa los comandos predefinidos por Windows para ejecutar acciones, programas, combinaciones de teclas o atajos. A continuación te dejo unos ejemplos:

[1] SIMBOLOS PARA ATAJOS DE TECLADO:
-----------------------------------------------------------------
^  : Tecla Control (Ctrl)          Ej: ^c        = Ctrl + C
!  : Tecla Alt                     Ej: !{F4}     = Alt + F4
+  : Tecla Shift (Mayus)           Ej: +{TAB}    = Shift + Tab
#  : Tecla Windows (Win)           Ej: #d        = Win + D
^^^^^^^^^^^^^^^^^^^^^^^^
(La tecla Windows funciona para algunos comandos, son tantos que no te puedo decir cuales sí y cuales no. Yo no lo uso, lo agrego por si a alguien le sirve saberlo).

[2] TECLAS ESPECIALES (Siempre entre llaves {}):
-----------------------------------------------------------------
{F1} a {F12}   : Teclas de funcion (Ej: {F5} para refrescar)
{ENTER}        : Tecla Enter
{SPACE}        : Barra Espaciadora
{TAB}          : Tecla Tabulador
{ESC}          : Tecla Escape
{DELETE}       : Tecla Suprimir / Delete
{BACKSPACE}    : Tecla Retroceso
{UP}/{DOWN}    : Flechas Arriba / Abajo
{LEFT}/{RIGHT} : Flechas Izquierda / Derecha

[3] EJEMPLOS DE PROGRAMACION DE BOTONES:
-----------------------------------------------------------------
- Copiar:                ^c
- Pegar:                 ^v
- Cerrar Ventana:        !{F4}
- Mostrar Escritorio:    #d
- Administrador Tareas:  ^+{ESC}   (Ctrl + Shift + Esc)
- Abrir Programa:        start notepad.exe
- Abrir una carpeta:     explorer C:\Archivos de programa\App
- Ruta de ejecutable:    "C:\Archivos de programa\App\app.exe"
=========================================================================
