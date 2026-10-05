const { app, BrowserWindow, Tray, Menu, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Esto enciende tu servidor Express de fondo automáticamente
require('./server.js');

let mainWindow;
let tray = null; 

// Función para detectar la IP local (IPv4) de tu PC
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Buscamos una dirección IPv4 que no sea interna (que no sea 127.0.0.1)
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1'; // Respaldo por si no hay conexión de red
}

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 750,
        title: "Simpl3 8uttons",
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'public/icono.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // INTERCEPTAR TODAS LAS VENTANAS NUEVAS (LINKTREE, ETC.) Y ABRIRLAS EN EL NAVEGADOR PREDETERMINADO
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Carga la interfaz
    mainWindow.loadURL('http://localhost:3000');

    // --- LÓGICA DE BIENVENIDA Y PRIMER INICIO ---
    // Creamos una ruta para un archivo "bandera" en AppData
    const flagFile = path.join(process.env.APPDATA || os.homedir(), '.simpl3_first_run');
    
    // Si el archivo no existe, es la primera vez que se abre la app
    if (!fs.existsSync(flagFile)) {
        const miIP = getLocalIP();
        
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: '¡Bienvenido a Simpl3 8uttons!',
            message: `Bienvenido a Simpl3 8uttons!\nUna botonera virtual para simplificar la vida.\n\nPara abrir la botonera en tu celular, introducí esta dirección (tu ip local): http://${miIP}:3000 en tu navegador favorito y listo!\n\nA disfrutar!`,
            buttons: ['¡Entendido!']
        });

        // Creamos el archivo para que este cuadro no vuelva a aparecer
        fs.writeFileSync(flagFile, 'iniciado');
    }

    // --- LÓGICA DE SEGUNDO PLANO (TRAY) ---
    const iconPath = path.join(__dirname, 'public/icono.png');
    tray = new Tray(iconPath);
    tray.setToolTip('Simpl3 8uttons'); 

    const contextMenu = Menu.buildFromTemplate([
        { 
            label: 'Abrir Botonera', 
            click: () => mainWindow.show() 
        },
        { type: 'separator' },
        { 
            label: 'Cerrar por completo', 
            click: () => {
                app.isQuiting = true; 
                app.quit();
            } 
        }
    ]);
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.show();
    });

    mainWindow.on('minimize', (event) => {
        event.preventDefault(); 
        mainWindow.hide();      
    });

    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
});