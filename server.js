const express = require('express');
const { exec } = require('child_process');
const { OBSWebSocket } = require('obs-websocket-js');
const fs = require('fs');
const os = require('os');
const path = require('path');

const app = express();
const PORT = 3000;
const obs = new OBSWebSocket();

// 1. Ruta en AppData donde el usuario guardará sus botones
const DATA_FILE = path.join(process.env.APPDATA || os.homedir(), 'botones_simpl3.json');
// 2. Ruta de tu archivo original empaquetado
const DEFAULT_DATA_FILE = path.join(__dirname, 'decks.json');

// 3. Ruta del archivo de configuración en AppData para la clave de OBS
const CONFIG_FILE = path.join(process.env.APPDATA || os.homedir(), 'simpl3_config.json');

// Configuración por defecto
let appConfig = {
    obs_ip: '127.0.0.1',
    obs_port: 4455,
    obs_password: 'TU CLAVE DE OBS ACÁ'
};

// Cargar la configuración de AppData si existe, o crearla con la clave predeterminada
if (fs.existsSync(CONFIG_FILE)) {
    try {
        appConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
        console.error('Error leyendo simpl3_config.json, usando valores predeterminados.');
    }
} else {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(appConfig, null, 4));
    } catch (e) {
        console.error('Error al crear el archivo simpl3_config.json:', e.message);
    }
}

// Conexión con OBS utilizando la configuración dinámica
async function connectOBS() {
    try {
        const { obs_ip, obs_port, obs_password } = appConfig;
        await obs.connect(`ws://${obs_ip}:${obs_port}`, obs_password);
        console.log('✅ Conectado a OBS WebSocket con éxito');
    } catch (error) {
        console.log('⚠ OBS no está abierto o WebSocket no respondió.');
    }
}
connectOBS();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Cargar o inicializar la base de datos de botones
let decks = {};

if (fs.existsSync(DATA_FILE)) {
    try {
        decks = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        decks = {};
    }
}

// Si el archivo no existe o está vacío (no tiene la sección 'main'), cargamos los botones por defecto
if (!decks.main || Object.keys(decks).length === 0) {
    decks = {
        main: [
            { id: 'f_funciones', text: '📁 Funciones', color: '#2c3e50', type: 'folder', target: 'funciones' },
            { id: 'f_premiere', text: '📁 Premiere', color: '#3e1f47', type: 'folder', target: 'premiere' },
            { id: 'f_photoshop', text: '📁 Photoshop', color: '#1c2d42', type: 'folder', target: 'photoshop' },
            { id: 'f_audacity', text: '🎙 Audacity', color: '#1a3a5f', type: 'folder', target: 'audacity' },
            { id: 'f_obs', text: '🎥 OBS Studio', color: '#0f4c81', type: 'folder', target: 'obs' },
            { id: 'btn_recortes', text: '✂️ Recortes', color: '#b33939', type: 'programa', command: 'explorer ms-screenclip:' }
        ],
        funciones: [ { id: 'back_funciones', text: '⬅️️ Volver', color: '#444444', type: 'folder', target: 'main' } ],
        premiere:  [ { id: 'back_premiere',  text: '⬅️ Volver', color: '#444444', type: 'folder', target: 'main' } ],
        photoshop: [ { id: 'back_photoshop', text: '⬅️ Volver', color: '#444444', type: 'folder', target: 'main' } ],
        audacity:  [ { id: 'back_audacity',  text: '⬅️ Volver', color: '#444444', type: 'folder', target: 'main' } ],
        obs:       [ { id: 'back_obs',       text: '⬅️ Volver', color: '#444444', type: 'folder', target: 'main' } ]
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(decks, null, 4));
}

// Cargamos la base de datos en memoria para que funcione la app
decks = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

function saveDecks() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(decks, null, 4));
}

// Busca el primer espacio vacío en la cuadrícula
function getFirstEmptyIndex(folderArray) {
    if (!folderArray) return 0;
    for (let i = 0; i < folderArray.length; i++) {
        if (!folderArray[i] || folderArray[i].type === 'empty') {
            return i;
        }
    }
    return folderArray.length;
}

// Enviar los botones asegurando que las subcarpetas SIEMPRE tengan su botón de volver
app.get('/api/buttons', (req, res) => {
    // Lista de subcarpetas conocidas y sus nombres padres
    const subfolders = ['funciones', 'premiere', 'photoshop', 'audacity', 'obs'];
    
    subfolders.forEach(folder => {
        if (!decks[folder]) {
            decks[folder] = [];
        }
        // Verificamos si ya tiene un botón de tipo 'folder' o id que empiece con 'back_'
        const hasBack = decks[folder].some(b => b && (b.id.startsWith('back_') || b.target === 'main'));
        if (!hasBack) {
            // Si no lo tiene, lo insertamos obligatoriamente en la primera posición
            decks[folder].unshift({
                id: `back_${folder}`,
                text: '⬅️ Volver',
                color: '#444444',
                type: 'folder',
                target: 'main'
            });
        }
    });

    res.json(decks);
});

// GUARDAR LA ESTRUCTURA COMPLETA
app.post('/api/save-deck', (req, res) => {
    const { folderId, buttons } = req.body;
    if (!folderId) return res.status(400).send('Carpeta inválida');
    decks[folderId] = buttons;
    saveDecks();
    res.json({ success: true });
});

// CREAR CARPETA
app.post('/api/add-folder', (req, res) => {
    try {
        const { parentFolder, folderId, text, color, targetIndex } = req.body;
        
        if (!decks[parentFolder]) return res.status(400).send('Carpeta padre no encontrada');

        decks[folderId] = [
            { id: `back_${folderId}`, text: '⬅️ Volver', color: '#444444', type: 'folder', target: parentFolder }
        ];
        
        const newFolderBtn = { id: `f_${folderId}`, text: `📁 ${text}`, color: color, type: 'folder', target: folderId };
        
        let idx = parseInt(targetIndex, 10);
        if (isNaN(idx) || idx < 0 || (decks[parentFolder][idx] && decks[parentFolder][idx].type !== 'empty')) {
            idx = getFirstEmptyIndex(decks[parentFolder]);
        }
        
        decks[parentFolder][idx] = newFolderBtn;
        
        console.log(`Nueva carpeta '${text}' creada en el espacio ${idx} de '${parentFolder}'`);
        saveDecks();
        res.json({ success: true });
    } catch (error) {
        console.error('Error interno al crear carpeta:', error);
        res.status(500).send('Error en el servidor');
    }
});

// CREAR BOTÓN
app.post('/api/add-button', (req, res) => {
    const { folderId, button, targetIndex } = req.body;
    
    let idx = parseInt(targetIndex, 10);
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
        if (btnToDelete && btnToDelete.type === 'folder' && btnToDelete.target && btnToDelete.target !== 'main') {
            delete decks[btnToDelete.target];
        }
        decks[folderId][index] = { id: `empty_${Date.now()}`, type: 'empty' };
        saveDecks();
    }
    res.json({ success: true });
});

// AUTODETECCIÓN INTELIGENTE DE AUDIO
async function getAudioDeviceName(type, preferredName = '') {
    try {
        const inputList = await obs.call('GetInputList');
        const inputs = inputList.inputs || [];
        const prefLower = (preferredName || '').toLowerCase();

        if (preferredName) {
            const exactMatch = inputs.find(i => i.inputName.toLowerCase() === prefLower);
            if (exactMatch) return exactMatch.inputName;
        }

        const specialInputs = await obs.call('GetSpecialInputs');
        if (type === 'mic' && specialInputs.mic1) return specialInputs.mic1;
        if (type === 'desktop' && specialInputs.desktop1) return specialInputs.desktop1;

        if (type === 'mic') {
            const micInput = inputs.find(i => 
                i.inputKind === 'wasapi_input_capture' || 
                i.inputKind === 'dshow_input' ||
                i.inputName.toLowerCase().includes('mic') ||
                i.inputName.toLowerCase().includes('microfono')
            );
            if (micInput) return micInput.inputName;
        }

        if (type === 'desktop') {
            const desktopInput = inputs.find(i => 
                i.inputKind === 'wasapi_output_capture' || 
                i.inputKind === 'wasapi_process_output_capture' ||
                i.inputName.toLowerCase().includes('windows') ||
                i.inputName.toLowerCase().includes('desktop') ||
                i.inputName.toLowerCase().includes('escritorio') ||
                i.inputName.toLowerCase().includes('audio') ||
                i.inputName.toLowerCase().includes('sistema')
            );
            if (desktopInput) return desktopInput.inputName;
        }
    } catch (e) {
        console.error(`Error al detectar dispositivo de tipo [${type}]:`, e.message);
    }

    return null;
}

// ESTADOS Y EJECUCIÓN
// Obtener estado actual (Escena, Micrófono principal y Audio principal de OBS)
app.get('/api/obs/status', async (req, res) => {
    try {
        if (!obs || !obs.socket || obs.socket.readyState !== 1) {
            return res.json({ connected: false, state: { micMuted: true, desktopMuted: true, currentScene: '' } });
        }

        // 1. Obtener la escena activa
        const sceneRes = await obs.call('GetCurrentProgramScene');
        const currentScene = sceneRes.currentProgramSceneName;

        // 2. Obtener fuentes especiales e insumos de audio de OBS
        const special = await obs.call('GetSpecialInputs').catch(() => ({}));
        const inputsRes = await obs.call('GetInputList').catch(() => ({ inputs: [] }));
        const inputs = inputsRes.inputs || [];

        // Identificar la fuente de Micrófono
        let micName = special.mic1 || special.mic2;
        if (!micName) {
            const micInput = inputs.find(i => 
                i.inputKind.includes('input_capture') || 
                i.inputKind.includes('dshow') || 
                i.inputName.toLowerCase().includes('mic') ||
                i.inputName.toLowerCase().includes('entrada')
            );
            if (micInput) micName = micInput.inputName;
        }

        // Identificar la fuente de Audio de Escritorio / Sistema
        let desktopName = special.desktop1 || special.desktop2;
        if (!desktopName) {
            const desktopInput = inputs.find(i => 
                i.inputKind.includes('output_capture') || 
                i.inputName.toLowerCase().includes('desktop') || 
                i.inputName.toLowerCase().includes('escritorio') ||
                i.inputName.toLowerCase().includes('audio')
            );
            if (desktopInput) desktopName = desktopInput.inputName;
        }

        // Obtener estado de silencio (mute)
        let micMuted = false;
        if (micName) {
            const mRes = await obs.call('GetInputMute', { inputName: micName }).catch(() => ({ inputMuted: false }));
            micMuted = mRes.inputMuted;
        }

        let desktopMuted = false;
        if (desktopName) {
            const dRes = await obs.call('GetInputMute', { inputName: desktopName }).catch(() => ({ inputMuted: false }));
            desktopMuted = dRes.inputMuted;
        }

        res.json({
            connected: true,
            state: {
                currentScene,
                micMuted,
                desktopMuted
            }
        });
    } catch (error) {
        res.json({ connected: false, state: { micMuted: true, desktopMuted: true, currentScene: '' } });
    }
});

app.post('/api/execute', async (req, res) => {
    const { type, command, keys, action, inputName, sceneName, duration, seconds } = req.body;
    
    if (type === 'programa') {
        exec(command, (error) => { 
            // Ignoramos el error falso positivo de Windows al usar "explorer"
            if (error && !command.toLowerCase().startsWith('explorer')) {
                console.error('Error al ejecutar programa:', error.message); 
            }
        });
        return res.sendStatus(200);
    }
    
    if (type === 'atajo') {
        const psCommand = `powershell -c "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('${keys}')"`;
        exec(psCommand, (error) => { if (error) console.error(error.message); });
        return res.sendStatus(200);
    } 
    
    if (type === 'obs') {
        try {
            // Consultar a OBS por sus fuentes de audio globales nativas
            const specialInputs = await obs.call('GetSpecialInputs').catch(() => ({}));

            const nameLower = (inputName || '').toLowerCase();

            const isDesktopAction = action === 'mute_desktop' || 
                                    action === 'toggle_desktop' || 
                                    (action === 'mute' && (
                                        nameLower.includes('windows') || 
                                        nameLower.includes('desktop') || 
                                        nameLower.includes('escritorio') || 
                                        nameLower.includes('pc') || 
                                        nameLower.includes('sistema')
                                    ));

            const isMicAction = action === 'mute_mic' || 
                                action === 'toggle_mic' || 
                                (action === 'mute' && !isDesktopAction);

            if (isMicAction) {
                // Prioriza la fuente nativa de micrófono de OBS (mic1 / mic2)
                let targetMic = specialInputs.mic1 || specialInputs.mic2;
                
                // Si no hay especial, recurre al buscador de dispositivos
                if (!targetMic && typeof getAudioDeviceName === 'function') {
                    targetMic = await getAudioDeviceName('mic', inputName);
                }

                if (targetMic) {
                    await obs.call('ToggleInputMute', { inputName: targetMic });
                    console.log(`🎤 Micrófono muteado/desmuteado en OBS: "${targetMic}"`);
                    return res.sendStatus(200);
                } else {
                    console.log('⚠ No se encontró ningún micrófono en OBS.');
                    return res.status(404).send('No se encontró micrófono en OBS');
                }
            }

            if (isDesktopAction) {
                // Prioriza la fuente nativa de audio de PC de OBS (desktop1 / desktop2)
                let targetDesktop = specialInputs.desktop1 || specialInputs.desktop2;
                
                // Si no hay especial, recurre al buscador de dispositivos
                if (!targetDesktop && typeof getAudioDeviceName === 'function') {
                    targetDesktop = await getAudioDeviceName('desktop', inputName);
                }

                if (targetDesktop) {
                    await obs.call('ToggleInputMute', { inputName: targetDesktop });
                    console.log(`🔊 Audio de PC/Escritorio muteado/desmuteado en OBS: "${targetDesktop}"`);
                    return res.sendStatus(200);
                } else {
                    console.log('⚠️ No se encontró audio de PC/Escritorio en OBS.');
                    return res.status(404).send('No se encontró audio de PC en OBS');
                }
            }

            if (action === 'toggle_scene' || action === 'set_scene') {
                const sceneListRes = await obs.call('GetSceneList');
                const scenes = (sceneListRes.scenes || []).map(s => s.sceneName);

                if (scenes.length === 0) {
                    console.log('⚠ No se encontraron escenas en OBS.');
                    return res.status(404).send('No hay escenas en OBS');
                }

                let targetScene = sceneName;

                if (action === 'toggle_scene' || !targetScene || !scenes.includes(targetScene)) {
                    const currentSceneName = sceneListRes.currentProgramSceneName;
                    const currentIndex = scenes.indexOf(currentSceneName);
                    const nextIndex = (currentIndex + 1) % scenes.length;
                    targetScene = scenes[nextIndex];
                }

                await obs.call('SetCurrentProgramScene', { sceneName: targetScene });
                console.log(`🎬 Escena cambiada en OBS a: "${targetScene}"`);
                return res.sendStatus(200);
            }

            if (action === 'toggle_stream') {
                await obs.call('ToggleStream');
                return res.sendStatus(200);
            }

            if (action === 'toggle_record') {
                await obs.call('ToggleRecord');
                return res.sendStatus(200);
            }

            // GUARDAR CLIP O INICIAR BÚFER
            if (action === 'save_replay' || action === 'clip') {
                const replayStatus = await obs.call('GetReplayBufferStatus');

                if (!replayStatus.outputActive) {
                    await obs.call('StartReplayBuffer');
                    console.log('▶️ Buffer de repetición iniciado en OBS.');
                    return res.status(200).json({ 
                        status: 'started', 
                        message: 'Buffer de repetición iniciado en OBS.' 
                    });
                }

                await obs.call('SaveReplayBuffer');
                console.log('🎬 ¡Clip guardado correctamente en OBS!');
                return res.status(200).json({ 
                    status: 'saved', 
                    message: '¡Clip guardado correctamente!' 
                });
            }

            console.log('Acción de OBS no reconocida:', action);
            return res.sendStatus(400);

        } catch (err) {
            console.error('Error en OBS WebSocket:', err.message);
            return res.status(500).send(err.message);
        }
    }

    res.sendStatus(400);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Botonera lista en el puerto ${PORT}`);
});

process.stdin.on('data', (data) => {
    if (data.toString().trim().toLowerCase() === 'cerrar') {
        console.log('\nCerrando Simpl3 8uttons... ¡Hasta luego!');
        process.exit();
    }

});