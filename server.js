const express = require('express');
const { exec } = require('child_process');
const { OBSWebSocket } = require('obs-websocket-js');
const fs = require('fs');

const app = express();
const PORT = 3000;
const obs = new OBSWebSocket();
const DATA_FILE = './decks.json';

// Conexión con OBS
async function connectOBS() {
    try {
        await obs.connect('ws://127.0.0.1:4455', 'TU CLAVE DE OBS ACÁ');
        console.log('✅ Conectado a OBS WebSocket con éxito');
    } catch (error) {
        console.log('⚠️ OBS no está abierto o WebSocket no respondió.');
    }
}
connectOBS();

app.use(express.static('public'));
app.use(express.json());

// Cargar o inicializar la base de datos de botones
let decks = {};
if (fs.existsSync(DATA_FILE)) {
    decks = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
} else {
    decks = {
        main: [
            { id: 'f_funciones', text: '📁 Funciones', color: '#2c3e50', type: 'folder', target: 'funciones' },
            { id: 'f_premiere', text: '📁 Premiere', color: '#3e1f47', type: 'folder', target: 'premiere' },
            { id: 'f_photoshop', text: '📁 Photoshop', color: '#1c2d42', type: 'folder', target: 'photoshop' },
            { id: 'f_audacity', text: '🎙️ Audacity', color: '#1a3a5f', type: 'folder', target: 'audacity' },
            { id: 'f_obs', text: '🎥 OBS Studio', color: '#0f4c81', type: 'folder', target: 'obs' },
            { id: 'btn_recortes', text: '✂️ Recortes', color: '#b33939', type: 'programa', command: 'explorer ms-screenclip:' }
        ]
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(decks, null, 4));
}

function saveDecks() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(decks, null, 4));
}

// NUEVA FUNCIÓN: Busca el primer espacio vacío en la cuadrícula
function getFirstEmptyIndex(folderArray) {
    if (!folderArray) return 0;
    for (let i = 0; i < folderArray.length; i++) {
        // Si la casilla no existe o está marcada como 'empty', ese es el lugar
        if (!folderArray[i] || folderArray[i].type === 'empty') {
            return i;
        }
    }
    // Si no hay huecos vacíos en el medio, devolvemos el siguiente número al final
    return folderArray.length;
}

app.get('/api/buttons', (req, res) => res.json(decks));

// GUARDAR LA ESTRUCTURA COMPLETA (REORDENAMIENTO / DRAG & DROP)
app.post('/api/save-deck', (req, res) => {
    const { folderId, buttons } = req.body;
    if (!folderId) return res.status(400).send('Carpeta inválida');
    decks[folderId] = buttons;
    saveDecks();
    res.json({ success: true });
});

// CREAR CARPETA (Ahora usa orden secuencial)
app.post('/api/add-folder', (req, res) => {
    try {
        const { parentFolder, folderId, text, color, targetIndex } = req.body;
        
        if (!decks[parentFolder]) return res.status(400).send('Carpeta padre no encontrada');

        // 1. Crear el contenido de la NUEVA carpeta (con su botón de volver)
        decks[folderId] = [
            { id: `back_${folderId}`, text: '⬅️ Volver', color: '#444444', type: 'folder', target: parentFolder }
        ];
        
        // 2. Crear el BOTÓN que abre esa nueva carpeta
        const newFolderBtn = { id: `f_${folderId}`, text: `📁 ${text}`, color: color, type: 'folder', target: folderId };
        
        // 3. Decidir dónde colocar el botón
        let idx = parseInt(targetIndex, 10);
        
        // Si no mandaron un lugar específico, o si el lugar pedido ya está ocupado por algo que NO es vacío, 
        // usamos nuestra función inteligente para buscar el primer casillero libre.
        if (isNaN(idx) || idx < 0 || (decks[parentFolder][idx] && decks[parentFolder][idx].type !== 'empty')) {
            idx = getFirstEmptyIndex(decks[parentFolder]);
        }
        
        // Guardamos el botón en ese casillero exacto
        decks[parentFolder][idx] = newFolderBtn;
        
        console.log(`Nueva carpeta '${text}' creada en el espacio ${idx} de '${parentFolder}'`);
        saveDecks();
        res.json({ success: true });
    } catch (error) {
        console.error('Error interno al crear carpeta:', error);
        res.status(500).send('Error en el servidor');
    }
});

// CREAR BOTÓN (También actualizado para usar orden secuencial)
app.post('/api/add-button', (req, res) => {
    const { folderId, button, targetIndex } = req.body;
    
    let idx = parseInt(targetIndex, 10);
    
    // Misma lógica: si no hay un índice válido o está ocupado, busca el primer espacio libre.
    if (isNaN(idx) || idx < 0 || (decks[folderId][idx] && decks[folderId][idx].type !== 'empty')) {
        idx = getFirstEmptyIndex(decks[folderId]);
    }

    decks[folderId][idx] = button;
    console.log(`Nuevo botón '${button.text}' creado en el espacio ${idx} de '${folderId}'`);
    saveDecks();
    res.json({ success: true });
});

// MODIFICAR
app.post('/api/update-button', (req, res) => {
    const { folderId, button } = req.body;
    if (!decks[folderId]) return res.status(400).send('Carpeta no encontrada');

    const index = decks[folderId].findIndex(b => b && b.id === button.id);
    if (index !== -1) {
        decks[folderId][index] = { ...decks[folderId][index], ...button };
        saveDecks();
        return res.json({ success: true });
    }
    res.status(404).send('Botón no encontrado');
});

// ELIMINAR
app.post('/api/delete-button', (req, res) => {
    const { folderId, buttonId } = req.body;
    if (!decks[folderId]) return res.status(400).send('Carpeta no encontrada');

    const index = decks[folderId].findIndex(b => b && b.id === buttonId);
    if (index !== -1) {
        const btnToDelete = decks[folderId][index];
        // Si borramos una carpeta, eliminamos también su contenido
        if (btnToDelete && btnToDelete.type === 'folder' && btnToDelete.target && btnToDelete.target !== 'main') {
            delete decks[btnToDelete.target];
        }
        // Dejamos la posición como un casillero vacío para no romper la cuadrícula
        decks[folderId][index] = { id: `empty_${Date.now()}`, type: 'empty' };
        saveDecks();
    }
    res.json({ success: true });
});

// ESTADOS Y EJECUCIÓN
app.get('/api/obs-status', async (req, res) => {
    const status = { connected: true, currentScene: 'Desconocida', micMuted: false, desktopMuted: false };
    try {
        const sceneRes = await obs.call('GetCurrentProgramScene');
        status.currentScene = sceneRes.currentProgramSceneName;
    } catch (e) { }
    try {
        const micRes = await obs.call('GetInputMute', { inputName: 'Microfono' });
        status.micMuted = micRes.inputMuted;
    } catch (e) { }
    try {
        const desktopRes = await obs.call('GetInputMute', { inputName: 'windows' });
        status.desktopMuted = desktopRes.inputMuted;
    } catch (e) { }
    res.json(status);
});

app.post('/api/execute', async (req, res) => {
    const { type, command, keys, action, inputName } = req.body;
    
    if (type === 'programa') {
        exec(command, (error) => { if (error) console.error(error.message); });
        res.sendStatus(200);
    } else if (type === 'atajo') {
        const psCommand = `powershell -c "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('${keys}')"`;
        exec(psCommand, (error) => { if (error) console.error(error.message); });
        res.sendStatus(200);
    } else if (type === 'obs') {
        try {
            if (action === 'toggle_scene') {
                const sceneRes = await obs.call('GetCurrentProgramScene');
                const nextScene = (sceneRes.currentProgramSceneName === 'Escena') ? 'Juego' : 'Escena';
                await obs.call('SetCurrentProgramScene', { sceneName: nextScene });
            } else if (action === 'mute') {
                await obs.call('ToggleInputMute', { inputName: inputName });
            }
            res.sendStatus(200);
        } catch (err) {
            res.status(500).send(err.message);
        }
    } else {
        res.sendStatus(400);
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Botonera lista en el puerto ${PORT}`);
});

// Escuchar la consola para apagar el servidor al escribir "Cerrar"
process.stdin.on('data', (data) => {
    if (data.toString().trim().toLowerCase() === 'cerrar') {
        console.log('\nCerrando Simpl3 8utton... ¡Hasta luego!');
        process.exit();
    }
});