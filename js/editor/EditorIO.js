// Sajjel map JSON
Editor.prototype.saveMap = function() {
    const customTiles = {};
    for (const [id, tile] of Object.entries(this.tileImages)) {
        customTiles[id] = this.getTileDataURL(id);
    }

    const data = {
        layers: this.layers,
        collisions: this.collisionMap,
        playerSpawn: this.playerSpawn,
        playerLayerIndex: this.playerLayerIndex,
        customTiles: customTiles,
        playerAnimations: this.playerAnimations,
        playerSize: this.playerSize,
        playerSpriteSize: this.playerSpriteSize,
        useCustomSpriteSize: this.useCustomSpriteSize,
        controls: this.controls,
        animatedTiles: this.animatedTiles,
        tileNames: this.tileNames,
        dialogues: this.dialogues,
        tileSize: this.tileSize,
        audio: this.audioManager.exportData(),
        mapBGM: this.mapBGM
    };
    const blob = new Blob([JSON.stringify(data)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "rpg_map.json";
    a.click();
    URL.revokeObjectURL(url);
};

// Importi map
Editor.prototype.handleMapImport = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
        alert("Mochkla: Fichier kbir barcha (>10MB).");
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const parsed = JSON.parse(event.target.result);
            const validationError = this.validateMapData(parsed);
            if (validationError) {
                alert("Import fachel: " + validationError);
                e.target.value = '';
                return;
            }
            this.loadMapData(parsed);
            alert("Map importé!");
        } catch (err) {
            alert("Mochkla fi JSON: " + err.message);
        }
        e.target.value = '';
    };
    reader.readAsText(file);
};

// Validation map
Editor.prototype.validateMapData = function(data) {
    const MAX_DIM = 512;
    if (!data || typeof data !== 'object') return "Format mch s7i7.";

    let layers, width, height;
    if (Array.isArray(data)) {
        layers = [data];
        height = data.length;
        width = data[0]?.length || 0;
    } else {
        layers = data.layers || (data.map ? [data.map] : null);
        if (!layers || !Array.isArray(layers)) return "Mafeech 'layers'.";
        height = layers[0]?.length || 0;
        width = layers[0]?.[0]?.length || 0;
    }

    if (width <= 0 || height <= 0) return "Dimensions mch s7i7in.";
    if (width > MAX_DIM || height > MAX_DIM) return `Dimensions (${width}x${height}) akbar mel max ${MAX_DIM}x${MAX_DIM}.`;

    for (let i = 0; i < layers.length; i++) {
        if (!Array.isArray(layers[i])) return `Layer ${i} mch array.`;
        if (layers[i].length !== height) return `Layer ${i} height mch mtefa9.`;
        for (let y = 0; y < height; y++) {
            if (!Array.isArray(layers[i][y]) || layers[i][y].length !== width) {
                return `Layer ${i} width mch mtefa9 fi row ${y}.`;
            }
        }
    }
    return null;
};

// Chargi map data
Editor.prototype.loadMapData = function(parsed) {
    if (Array.isArray(parsed)) {
        this.layers = [parsed];
        this.mapHeight = parsed.length;
        this.mapWidth = parsed[0].length;
        this.initCollisionMap(); 
    } else {
        if (parsed.layers) {
            this.layers = parsed.layers;
        } else {
            this.layers = [parsed.map];
        }
        this.collisionMap = parsed.collisions || [];
        this.mapHeight = this.layers[0].length;
        this.mapWidth = this.layers[0][0].length;
        if (this.collisionMap.length === 0) this.initCollisionMap();
    }
    
    this.playerSpawn = parsed.playerSpawn || { x: 1, y: 1 };
    this.playerLayerIndex = parsed.playerLayerIndex !== undefined ? parsed.playerLayerIndex : (this.layers.length - 1);
    this.playerSize = parsed.playerSize || { width: 20, height: 20 };
    
    // Chargement s7i7 l 7ajm l sprite
    let loadedSpriteW = 20;
    let loadedSpriteH = 20;
    
    if (parsed.playerSpriteSize) {
        loadedSpriteW = parseInt(parsed.playerSpriteSize.width || parsed.playerSpriteSize.w) || 20;
        loadedSpriteH = parseInt(parsed.playerSpriteSize.height || parsed.playerSpriteSize.h) || 20;
    }
    
    this.playerSpriteSize = {
        width: loadedSpriteW,
        height: loadedSpriteH
    };

    this.useCustomSpriteSize = parsed.useCustomSpriteSize || false;
    this.tileSize = parsed.tileSize || 32;
    
    this.dialogues = parsed.dialogues || {};
    this.events = parsed.events || {};
    this.soundTriggers = parsed.soundTriggers || {};
    this.mapBGM = parsed.mapBGM || "";

    const sizeSelect = document.getElementById('map-tile-size');
    if (sizeSelect) sizeSelect.value = this.tileSize;

    if (parsed.playerAnimations) {
        const newAnims = {};
        for (const [key, val] of Object.entries(parsed.playerAnimations)) {
            if (Array.isArray(val)) newAnims[key] = { frames: val, speed: 10 };
            else newAnims[key] = val;
        }
        this.playerAnimations = newAnims;
    } else {
        this.playerAnimations = { idle: { frames: [], speed: 10 }, down: { frames: [], speed: 10 }, up: { frames: [], speed: 10 }, left: { frames: [], speed: 10 }, right: { frames: [], speed: 10 } };
    }
    
    ['idle', 'down', 'up', 'left', 'right'].forEach(state => {
        const speedInput = document.getElementById(`anim-speed-${state}`);
        if (speedInput && this.playerAnimations[state]) {
            speedInput.value = this.playerAnimations[state].speed || 10;
        }
    });
    
    document.getElementById('player-w').value = this.playerSize.width;
    document.getElementById('player-h').value = this.playerSize.height;
    
    const inputTilesW = document.getElementById('player-tiles-w');
    const inputTilesH = document.getElementById('player-tiles-h');
    if (inputTilesW) inputTilesW.value = (this.playerSize.width / this.tileSize).toFixed(2);
    if (inputTilesH) inputTilesH.value = (this.playerSize.height / this.tileSize).toFixed(2);

    const chkCustomSprite = document.getElementById('chk-custom-sprite-size');
    const containerCustomSprite = document.getElementById('custom-sprite-size-container');
    const inputSpriteW = document.getElementById('player-sprite-w');
    const inputSpriteH = document.getElementById('player-sprite-h');

    if (chkCustomSprite) {
        chkCustomSprite.checked = this.useCustomSpriteSize;
        if (this.useCustomSpriteSize) containerCustomSprite.classList.remove('d-none');
        else containerCustomSprite.classList.add('d-none');
        inputSpriteW.value = this.playerSpriteSize.width;
        inputSpriteH.value = this.playerSpriteSize.height;
    }

    if (parsed.controls) this.controls = parsed.controls;
    else this.controls = { up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'] };
    this.initControlsUI();

    if (parsed.animatedTiles) {
        this.animatedTiles = parsed.animatedTiles;
        for (const id of Object.keys(this.animatedTiles)) {
            const tileId = parseInt(id);
            if (tileId >= this.nextAnimTileId) this.nextAnimTileId = tileId + 1;
        }
    }

    if (parsed.tileNames) this.tileNames = parsed.tileNames;
    if (parsed.dialogues) this.dialogues = parsed.dialogues;
    else this.dialogues = {};

    if (parsed.audio) {
        this.audioManager.importData(parsed.audio).then(() => this.updateAudioListUI());
    }
    this.mapBGM = parsed.mapBGM || "";
    if (parsed.soundTriggers) this.soundTriggers = parsed.soundTriggers;
    else this.soundTriggers = {};

    const promises = [];
    
    const allBtns = document.querySelectorAll('.tile-btn');
    allBtns.forEach(btn => {
        if (btn.dataset.palette !== 'basic') btn.remove();
    });
    
    this.tileImages = {};

    if (parsed.customTiles) {
        let maxId = 99;

        for (const [id, dataUrl] of Object.entries(parsed.customTiles)) {
            const tileId = parseInt(id);
            if (tileId > maxId) maxId = tileId;

            const p = new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = this.tileSize;
                    canvas.height = this.tileSize;
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(img, 0, 0, this.tileSize, this.tileSize);
                    this.tileImages[tileId] = canvas;
                    this.addTileToPalette(tileId, canvas, 'imported');
                    resolve();
                };
                img.src = dataUrl;
            });
            promises.push(p);
        }
        this.nextTileId = maxId + 1;
    }

    Promise.all(promises).then(() => {
        if (this.animatedTiles) {
            for (const id of Object.keys(this.animatedTiles)) {
                this.addTileToPalette(parseInt(id), null, 'animated');
            }
        }
        ['idle', 'down', 'up', 'left', 'right'].forEach(state => this.updateAnimationFramesUI(state));
        this.needsRedraw = true;
    });

    document.getElementById('map-w').value = this.mapWidth;
    document.getElementById('map-h').value = this.mapHeight;
    this.updateCanvasSize();
    this.updateLayerUI();
    this.needsRedraw = true;
};

// Get map data
Editor.prototype.getMapData = function() {
    return {
        layers: this.layers,
        collisions: this.collisionMap,
        events: this.events,
        playerSpawn: this.playerSpawn,
        playerLayerIndex: this.playerLayerIndex,
        playerAnimations: this.playerAnimations,
        playerSize: this.playerSize,
        playerSpriteSize: this.playerSpriteSize,
        useCustomSpriteSize: this.useCustomSpriteSize,
        controls: this.controls,
        animatedTiles: this.animatedTiles,
        dialogues: this.dialogues,
        soundTriggers: this.soundTriggers,
        tileSize: this.tileSize,
        audio: this.audioManager ? this.audioManager.exportData() : {},
        mapBGM: this.mapBGM
    };
};

Editor.prototype.getTileImages = function() { return this.tileImages; };

// Tileset select
Editor.prototype.handleTilesetSelect = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            this.previewImage = img;
            this.importModal.show();
            setTimeout(() => this.updatePreview(), 200); 
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
};

// Process tileset import
Editor.prototype.processImport = function() {
    if (!this.previewImage) return;

    const w = parseInt(document.getElementById('modal-tile-w').value) || 32;
    const h = parseInt(document.getElementById('modal-tile-h').value) || 32;

    const paletteId = 'pal_' + Date.now();
    const paletteName = "Imported Set"; 
    
    const select = document.getElementById('palette-select');
    const option = document.createElement('option');
    option.value = paletteId;
    option.textContent = paletteName;
    select.appendChild(option);
    select.value = paletteId;

    this.sliceTileset(this.previewImage, w, h, paletteId);
    select.dispatchEvent(new Event('change'));
    this.importModal.hide();
    this.previewImage = null;
};

// Autosave localStorage
Editor.prototype.saveToStorage = function() {
    if (!this.isDirty) return;

    try {
        const data = this.getMapData();
        const customTiles = {};
        for (const [id, tile] of Object.entries(this.tileImages)) {
            customTiles[id] = this.getTileDataURL(id);
        }
        data.customTiles = customTiles;
        localStorage.setItem('rpg_map_autosave', JSON.stringify(data));
        this.isDirty = false;
    } catch (e) {
        if (e.name === 'QuotaExceededError') console.warn("Autosave fachel: storage quota.");
        else console.warn("Autosave fachel:", e);
    }
};

// Load from localStorage
Editor.prototype.loadFromStorage = function() {
    const data = localStorage.getItem('rpg_map_autosave');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            this.loadMapData(parsed);
            return true;
        } catch (e) {
            console.error("Load autosave fachel:", e);
            return false;
        }
    }
    return false;
};
