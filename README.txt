# SIMPL3 8UTTON - ALPHA 1.0

Aplicación interactiva de servidor para programación rápida de botones y automatización de atajos de teclado.

## 🚀 Cómo Iniciar el Programa

1. Descarga o clona este repositorio en tu computadora.
2. Haz doble clic en el archivo **`Iniciar botonera.bat`**.
3. El programa detectará si te faltan las librerías necesarias e instalará automáticamente todo lo requerido en la primera ejecución.

---

## 🛠️ Solución de Problemas Comunes

### El archivo `.bat` se cierra solo o muestra errores de comando `cho`
Si al hacer doble clic al archivo `.bat` la consola se cierra inmediatamente o muestra textos corruptos como `"cho" no se reconoce como un comando interno`, se debe a que tu sistema operativo alteró el formato de los saltos de línea invisibles durante la descarga.

**Para solucionarlo en 5 segundos:**
1. Abre el archivo `Iniciar botonera.bat` con **Notepad++**.
2. En el menú superior ve a: **Edición** -> **Conversión fin de línea** (o *Edit* -> *EOL Conversion*).
3. Selecciona la opción **Formato Windows (CRLF)**.
4. Guarda el archivo (**Ctrl + S**) y vuelve a ejecutarlo.
