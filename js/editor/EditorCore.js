const DEFAULT_WIDTH = 100;
const DEFAULT_HEIGHT = 20;

// Editeur mta3 l map
class Editor {
    constructor() {
        this.tileSize = 32;
        this.canvas = document.getElementById('editor-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.paletteContainer = document.getElementById('tile-palette');
        this.collisionPaletteContainer = document.getElementById('collision-palette');
        
        this.mapWidth = DEFAULT_WIDTH;
        this.mapHeight = DEFAULT_HEIGHT;

        this.layers = [];
        this.currentLayerIndex = 0;
        this.collisionMap = [];
        this.tileImages = {};
        this.nextTileId = 100;
        this.selectedTile = TILES.GROUND;
        this.selectedCollision = COLLISION_TYPES.FULL;
        this.currentTool = 'brush';
        this.playerSpawn = { x: 1, y: 1 };
        this.playerLayerIndex = 0;
        this.playerSize = { width: 20, height: 20 };
        this.playerSpriteSize = { width: 20, height: 20 };
        this.useCustomSpriteSize = false;
        this.playerAnimations = {
            idle: { frames: [], speed: 10 },
            down: { frames: [], speed: 10 },
            up: { frames: [], speed: 10 },
            left: { frames: [], speed: 10 },
            right: { frames: [], speed: 10 }
        };
        this.controls = {
            up: ['ArrowUp', 'KeyW'],
            down: ['ArrowDown', 'KeyS'],
            left: ['ArrowLeft', 'KeyA'],
            right: ['ArrowRight', 'KeyD']
        };
        this.animatedTiles = {};
        this.nextAnimTileId = 10000;
        this.recordingAnimTile = false;
        this.currentAnimFrames = [];
        
        this.dialogues = {};
        this.events = {}; // Jdid: 5abbi l ahdeth
        this.soundTriggers = {};
        this.selectedCell = null;

        this.tileNames = {};
        Object.keys(TILES).forEach(key => {
            this.tileNames[TILES[key]] = key.charAt(0) + key.slice(1).toLowerCase();
        });

        this.recordingState = null;
        this.zoomLevel = 1.0;
        this.isDrawing = false;
        this.isEditingCollisions = false;
        this.isDirty = false;
        this.needsRedraw = true;

        this.history = [];
        this.historyIndex = -1;
        this.currentBatch = null;
        this.maxHistory = 50;
        
        this.previewImage = null;
        this.previewCanvas = document.getElementById('tileset-preview-canvas');
        this.previewCtx = this.previewCanvas.getContext('2d');
        this.importModal = new bootstrap.Modal(document.getElementById('tilesetModal'));

        this.audioManager = new AudioManager();
        window.audioManager = this.audioManager;
        this.mapBGM = "";

        // Parametres Camera/Editeur
        this.zoomStep = 0.25; // configurable zoom increment
        this.chunkSize = 16;  // chunk grid size for guidelines
        this.showGrid = true;
        this.showChunks = true;
        this.gridColor = 'rgba(255,255,255,0.08)';
        this.chunkColor = 'rgba(0,200,255,0.12)';

        // Selection / Stamping
        this.selectStart = null;
        this.selectEnd = null;
        this.selection = null; // {x,y,w,h}
        this.stampBuffer = null; // {w,h,data: number[][]}

        this.initMap();
        this.initPalette();
        this.initCollisionPalette();
        this.addEventListeners();
        this.updateCanvasSize();
        this.updateLayerUI();
        this.initPlayerAnimationUI();
        this.initControlsUI();
        this.initAnimatedTilesUI();
        this.initAudioUI();
        this.initMapSettingsUI();
        if (window.EditorOnboarding) {
            window.EditorOnboarding.init(this);
            // Show onboarding if first run (no autosave)
            setTimeout(() => {
                const hasAuto = !!localStorage.getItem('rpg_map_autosave');
                if (!hasAuto) window.EditorOnboarding.show();
            }, 300);
        }
        this.draw();
        
        if (!this.loadFromStorage()) {
            console.log("No autosave found, starting fresh.");
        }

        this.autosaveInterval = setInterval(() => this.saveToStorage(), 10000);
        window.addEventListener('beforeunload', () => {
            this.saveToStorage();
        });

        this.isRunning = true;
        this.animate();
    }

    showError(msg) {
        alert("Error: " + msg);
        try { console.error(msg); } catch (_) {}
    }

    startBatch() { this.currentBatch = []; }

    addToBatch(change) {
        if (this.currentBatch) {
            const existing = this.currentBatch.find(c => 
                c.x === change.x && c.y === change.y && 
                c.layerIndex === change.layerIndex && c.type === change.type
            );
            if (!existing) this.currentBatch.push(change);
            else existing.newVal = change.newVal;
        }
    }

    endBatch() {
        if (this.currentBatch && this.currentBatch.length > 0) {
            if (this.historyIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.historyIndex + 1);
            }
            this.history.push(this.currentBatch);
            if (this.history.length > this.maxHistory) this.history.shift();
            else this.historyIndex++;
        }
        this.currentBatch = null;
    }

    undo() {
        if (this.historyIndex >= 0) {
            const batch = this.history[this.historyIndex];
            this.historyIndex--;
            
            if (batch.length === 1 && batch[0].type === 'resize') {
                const cmd = batch[0];
                this.mapWidth = cmd.oldWidth;
                this.mapHeight = cmd.oldHeight;
                this.layers = JSON.parse(JSON.stringify(cmd.oldLayers));
                this.collisionMap = JSON.parse(JSON.stringify(cmd.oldCollision));
                this.updateCanvasSize();
            } else {
                batch.forEach(change => {
                    if (change.type === 'collision') {
                        this.collisionMap[change.y][change.x] = change.oldVal;
                    } else {
                        this.layers[change.layerIndex][change.y][change.x] = change.oldVal;
                    }
                });
            }
            this.isDirty = true;
            this.draw();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const batch = this.history[this.historyIndex];
            
            if (batch.length === 1 && batch[0].type === 'resize') {
                const cmd = batch[0];
                this.resizeMap(cmd.newWidth, cmd.newHeight, true);
            } else {
                batch.forEach(change => {
                    if (change.type === 'collision') {
                        this.collisionMap[change.y][change.x] = change.newVal;
                    } else {
                        this.layers[change.layerIndex][change.y][change.x] = change.newVal;
                    }
                });
            }
            this.isDirty = true;
            this.draw();
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.autosaveInterval = setInterval(() => this.saveToStorage(), 10000);
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.autosaveInterval) {
            clearInterval(this.autosaveInterval);
            this.autosaveInterval = null;
        }
    }

    cleanup() { this.stop(); }

    animate() {
        if (!this.isRunning) return;
        const hasAnimatedTiles = this.animatedTiles && Object.keys(this.animatedTiles).length > 0;
        
        if (this.needsRedraw || hasAnimatedTiles) {
            this.draw();
            this.needsRedraw = false;
        }
        
        requestAnimationFrame(() => this.animate());
    }

    initMap() { this.createEmptyMap(DEFAULT_WIDTH, DEFAULT_HEIGHT); }

    createEmptyMap(w, h) {
        this.mapWidth = w;
        this.mapHeight = h;
        this.layers = [];
        this.addLayer(w, h);
        this.collisionMap = [];
        for (let y = 0; y < h; y++) {
            const colRow = [];
            for (let x = 0; x < w; x++) colRow.push(0);
            this.collisionMap.push(colRow);
        }
    }

    addLayer(w = this.mapWidth, h = this.mapHeight) {
        const newLayer = [];
        for (let y = 0; y < h; y++) {
            const row = [];
            for (let x = 0; x < w; x++) {
                row.push(TILES.EMPTY);
            }
            newLayer.push(row);
        }
        this.layers.push(newLayer);
        this.currentLayerIndex = this.layers.length - 1;
        this.updateLayerUI();
        this.isDirty = true;
        this.draw();
    }

    removeLayer() {
        if (this.layers.length > 1) {
            this.layers.splice(this.currentLayerIndex, 1);
            if (this.currentLayerIndex >= this.layers.length) {
                this.currentLayerIndex = this.layers.length - 1;
            }
            this.updateLayerUI();
            this.isDirty = true;
            this.draw();
        } else {
            alert("Ma tnajamch tfassa5 l layer le5er!");
        }
    }

    moveLayerUp() {
        if (this.currentLayerIndex < this.layers.length - 1) {
            const temp = this.layers[this.currentLayerIndex];
            this.layers[this.currentLayerIndex] = this.layers[this.currentLayerIndex + 1];
            this.layers[this.currentLayerIndex + 1] = temp;
            this.currentLayerIndex++;
            this.updateLayerUI();
            this.isDirty = true;
            this.draw();
        }
    }

    moveLayerDown() {
        if (this.currentLayerIndex > 0) {
            const temp = this.layers[this.currentLayerIndex];
            this.layers[this.currentLayerIndex] = this.layers[this.currentLayerIndex - 1];
            this.layers[this.currentLayerIndex - 1] = temp;
            this.currentLayerIndex--;
            this.updateLayerUI();
            this.isDirty = true;
            this.draw();
        }
    }

    initCollisionMap() {
        this.collisionMap = [];
        for (let y = 0; y < this.mapHeight; y++) {
            const row = [];
            for (let x = 0; x < this.mapWidth; x++) row.push(0);
            this.collisionMap.push(row);
        }
    }

    resizeMap(newW, newH, suppressHistory = false) {
        const MAX_DIM = 512;
        
        if (newW <= 0 || newH <= 0) {
            alert("Map dimensions must be positive integers.");
            return;
        }
        if (newW > MAX_DIM || newH > MAX_DIM) {
            alert(`Map dimensions cannot exceed ${MAX_DIM}x${MAX_DIM}.`);
            return;
        }

        if (!suppressHistory) {
            const undoState = {
                type: 'resize',
                oldWidth: this.mapWidth,
                oldHeight: this.mapHeight,
                oldLayers: JSON.parse(JSON.stringify(this.layers)),
                oldCollision: JSON.parse(JSON.stringify(this.collisionMap)),
                newWidth: newW,
                newHeight: newH
            };
            if (this.historyIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.historyIndex + 1);
            }
            this.history.push([undoState]);
            this.historyIndex++;
        }

        const newLayers = [];
        const newColMap = [];

        for (let l = 0; l < this.layers.length; l++) {
            const newLayer = [];
            for (let y = 0; y < newH; y++) {
                const row = [];
                for (let x = 0; x < newW; x++) {
                    if (y < this.mapHeight && x < this.mapWidth) {
                        row.push(this.layers[l][y][x]);
                    } else {
                        row.push(TILES.EMPTY);
                    }
                }
                newLayer.push(row);
            }
            newLayers.push(newLayer);
        }

        for (let y = 0; y < newH; y++) {
            const colRow = [];
            for (let x = 0; x < newW; x++) {
                if (y < this.mapHeight && x < this.mapWidth) {
                    colRow.push(this.collisionMap[y][x]);
                } else {
                    colRow.push(0);
                }
            }
            newColMap.push(colRow);
        }

        this.layers = newLayers;
        this.collisionMap = newColMap;
        this.mapWidth = newW;
        this.mapHeight = newH;
        this.updateCanvasSize();
        this.isDirty = true;
        this.draw();
    }

    updateCanvasSize() {
        this.canvas.width = this.mapWidth * this.tileSize * this.zoomLevel;
        this.canvas.height = this.mapHeight * this.tileSize * this.zoomLevel;
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.scale(this.zoomLevel, this.zoomLevel);
    }

    getTileDataURL(tileId) {
        const tile = this.tileImages[tileId];
        if (!tile) return null;

        if (tile.isAtlas) {
            const canvas = document.createElement('canvas');
            canvas.width = tile.width;
            canvas.height = tile.height;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(tile.source, tile.x, tile.y, tile.width, tile.height, 0, 0, tile.width, tile.height);
            return canvas.toDataURL();
        } else {
            return tile.toDataURL();
        }
    }

    drawTileToContext(ctx, tileId, dx, dy, dw, dh) {
        const tile = this.tileImages[tileId];
        if (!tile) {
            ctx.fillStyle = TILE_COLORS[tileId] || '#f0f';
            ctx.fillRect(dx, dy, dw, dh);
            return;
        }

        if (tile.isAtlas) {
            ctx.drawImage(tile.source, tile.x, tile.y, tile.width, tile.height, dx, dy, dw, dh);
        } else {
            ctx.drawImage(tile, dx, dy, dw, dh);
        }
    }
}
