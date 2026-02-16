// Gestion input editeur
Editor.prototype.addEventListeners = function() {
    const container = this.canvas.parentElement || document.body;
    let isPanning = false; let panStart = null; let scrollStart = {x:0,y:0};
    const spaceHeld = { val: false };

    // --- store handlers so they can be removed later ---
    this._onKeyDown_space = (e) => { if (e.code === 'Space') spaceHeld.val = true; };
    this._onKeyUp_space = (e) => { if (e.code === 'Space') spaceHeld.val = false; };
    this._onWindowMouseUp_pan = () => { isPanning = false; panStart = null; };

    window.addEventListener('keydown', this._onKeyDown_space);
    window.addEventListener('keyup', this._onKeyUp_space);
    window.addEventListener('mouseup', this._onWindowMouseUp_pan);

    // Canvas pan handlers (named so they can be removed)
    this._onCanvas_panMouseDown = (e) => {
        if (e.button === 1 || spaceHeld.val) {
            isPanning = true;
            panStart = { x: e.clientX, y: e.clientY };
            scrollStart = { x: container.scrollLeft, y: container.scrollTop };
            e.preventDefault();
            return;
        }
    };
    this._onCanvas_panMouseMove = (e) => {
        if (isPanning && panStart) {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            container.scrollLeft = scrollStart.x - dx;
            container.scrollTop = scrollStart.y - dy;
        }
    };

    this.canvas.addEventListener('mousedown', this._onCanvas_panMouseDown);
    this.canvas.addEventListener('mousemove', this._onCanvas_panMouseMove);

    // Zoom-step input
    const inputZoomStep = document.getElementById('input-zoom-step');
    if (inputZoomStep) {
        inputZoomStep.value = this.zoomStep;
        inputZoomStep.addEventListener('change', (e)=>{
            const v = parseFloat(e.target.value)||0.25;
            this.zoomStep = Math.max(0.05, Math.min(2.0, v));
        });
    }

    // NOTE: button handlers for zoom are attached later in this function (single set) to avoid duplicates

    
    // Drawing & tool handlers (named so they can be removed later)
    this._onCanvas_toolMouseDown = (e) => {
        if (this.currentTool === 'bucket') {
            this.startBatch();
            this.fill(e);
            this.endBatch();
            return;
        }

        // Bda selection rectangle/line/stamp
        if (this.currentTool === 'select' || this.currentTool === 'rect' || this.currentTool === 'line' || this.currentTool === 'stamp-select') {
            const rect = this.canvas.getBoundingClientRect();
            const sx = Math.floor((e.clientX - rect.left) / (this.tileSize * this.zoomLevel));
            const sy = Math.floor((e.clientY - rect.top) / (this.tileSize * this.zoomLevel));
            this.selectStart = { x: sx, y: sy };
            this.selection = null;
        }
        this.isDrawing = true;
        this.startBatch();
        this.paint(e);
    };

    this._onCanvas_toolMouseMove = (e) => {
        if (this.isDrawing && this.currentTool === 'brush') {
            this.paint(e);
        } else if (this.isDrawing && (this.currentTool === 'select' || this.currentTool === 'rect' || this.currentTool === 'line' || this.currentTool === 'stamp-select')) {
            const rect = this.canvas.getBoundingClientRect();
            const ex = Math.floor((e.clientX - rect.left) / (this.tileSize * this.zoomLevel));
            const ey = Math.floor((e.clientY - rect.top) / (this.tileSize * this.zoomLevel));
            if (this.selectStart) {
                const x0 = Math.min(this.selectStart.x, ex);
                const y0 = Math.min(this.selectStart.y, ey);
                const w = Math.abs(ex - this.selectStart.x) + 1;
                const h = Math.abs(ey - this.selectStart.y) + 1;
                this.selection = { x: x0, y: y0, w, h };
                this.needsRedraw = true;
            }
        }
    };

    this._onCanvas_toolMouseUp = (e) => {
        this.isDrawing = false;
        this.endBatch();
        // Kamel stamp selection buffer
        if (this.currentTool === 'stamp-select' && this.selection) {
            const { x, y, w, h } = this.selection;
            const buf = [];
            for (let ry = 0; ry < h; ry++) {
                const row = [];
                for (let rx = 0; rx < w; rx++) {
                    row.push(this.layers[this.currentLayerIndex][y + ry]?.[x + rx] ?? TILES.EMPTY);
                }
                buf.push(row);
            }
            this.stampBuffer = { w, h, data: buf };
        }
        // Appliqui rectangle fill
        if (this.currentTool === 'rect' && this.selection) {
            this.applyRectFill(this.selection, this.selectedTile);
        }
        // Appliqui rasm 5at
        if (this.currentTool === 'line' && this.selectStart && this.selection) {
            const end = { x: this.selection.x + this.selection.w - 1, y: this.selection.y + this.selection.h - 1 };
            this.applyLineDraw(this.selectStart, end, this.selectedTile);
        }
        // Apply stamp paste at mouse up location using event coordinates
        if (this.currentTool === 'stamp-paste') {
            const rect = this.canvas.getBoundingClientRect();
            const ex = Math.floor((e.clientX - rect.left) / (this.tileSize * this.zoomLevel));
            const ey = Math.floor((e.clientY - rect.top) / (this.tileSize * this.zoomLevel));
            this.applyStampPaste(ex, ey);
        }
    };

    this._onCanvas_toolMouseLeave = () => {
        this.isDrawing = false;
        this.endBatch();
    };

    this.canvas.addEventListener('mousedown', this._onCanvas_toolMouseDown);
    this.canvas.addEventListener('mousemove', this._onCanvas_toolMouseMove);
    this.canvas.addEventListener('mouseup', this._onCanvas_toolMouseUp);
    this.canvas.addEventListener('mouseleave', this._onCanvas_toolMouseLeave);

    document.getElementById('inspector-tile-name').addEventListener('input', (e) => {
        if (this.selectedTile === null) return;
        const newName = e.target.value;
        
        if (newName.trim()) {
            this.tileNames[this.selectedTile] = newName;
        } else {
            delete this.tileNames[this.selectedTile];
        }
        
        const btn = document.querySelector(`.tile-btn[data-tile="${this.selectedTile}"]`);
        if (btn) {
            btn.title = newName || `Tile ${this.selectedTile}`;
        }
    });

    const speedInput = document.getElementById('inspector-anim-speed');
    if (speedInput) {
        speedInput.addEventListener('change', (e) => {
            if (this.selectedTile !== null && this.animatedTiles && this.animatedTiles[this.selectedTile]) {
                const newSpeed = parseInt(e.target.value) || 200;
                this.animatedTiles[this.selectedTile].speed = newSpeed;
            }
        });
    }

    document.getElementById('btn-open-import').addEventListener('click', () => {
        document.getElementById('tileset-upload').click();
    });

    document.getElementById('tileset-upload').addEventListener('change', (e) => {
        this.handleTilesetSelect(e);
    });

    document.getElementById('btn-confirm-import').addEventListener('click', () => {
        this.processImport();
    });

    ['modal-tile-w', 'modal-tile-h'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => this.updatePreview());
    });

    document.getElementById('btn-save-map').addEventListener('click', () => {
        this.saveMap();
    });

    document.getElementById('btn-import-map').addEventListener('click', () => {
        document.getElementById('map-upload').click();
    });

    document.getElementById('btn-load-demo').addEventListener('click', () => {
        if(confirm("Load demo map? This will overwrite current work.")) {
            fetch('demo_map.json')
                .then(response => response.json())
                .then(data => {
                    this.loadMapData(data);
                    alert("Demo map loaded!");
                })
                .catch(err => alert("Error loading demo map: " + err));
        }
    });

    document.getElementById('map-upload').addEventListener('change', (e) => {
        this.handleMapImport(e);
    });

    const btnToggleCollision = document.getElementById('btn-toggle-collision');
    const btnCollisionText = document.getElementById('btn-collision-text');
    const collisionTools = document.getElementById('collision-tools');
    const collisionHint = document.getElementById('collision-hint');
    
    btnToggleCollision.addEventListener('click', () => {
        this.isEditingCollisions = !this.isEditingCollisions;
        
        if (btnCollisionText) {
            btnCollisionText.textContent = this.isEditingCollisions ? 'Stop Editing' : 'Edit Collisions';
        } else {
            btnToggleCollision.textContent = this.isEditingCollisions ? 'Stop Editing' : 'Edit Collisions';
        }

        btnToggleCollision.classList.toggle('btn-outline-warning');
        btnToggleCollision.classList.toggle('btn-warning');
        
        if (this.isEditingCollisions) {
            collisionTools.classList.remove('d-none');
            if(collisionHint) collisionHint.classList.add('d-none');
        } else {
            collisionTools.classList.add('d-none');
            if(collisionHint) collisionHint.classList.remove('d-none');
            document.getElementById('chk-collision-eraser').checked = false;
        }
        
        this.draw();
    });

    document.getElementById('btn-clear-map').addEventListener('click', () => {
        if(confirm("Are you sure you want to clear the map?")) {
            this.startBatch();
            for (let l = 0; l < this.layers.length; l++) {
                for (let y = 0; y < this.mapHeight; y++) {
                    for (let x = 0; x < this.mapWidth; x++) {
                        const oldVal = this.layers[l][y][x];
                        if (oldVal !== TILES.EMPTY) {
                            this.addToBatch({
                                x, y, layerIndex: l, oldVal, newVal: TILES.EMPTY, type: 'tile'
                            });
                            this.layers[l][y][x] = TILES.EMPTY;
                        }
                    }
                }
            }
            for (let y = 0; y < this.mapHeight; y++) {
                for (let x = 0; x < this.mapWidth; x++) {
                    const oldVal = this.collisionMap[y][x];
                    if (oldVal !== 0) {
                        this.addToBatch({
                            x, y, layerIndex: 0, oldVal, newVal: 0, type: 'collision'
                        });
                        this.collisionMap[y][x] = 0;
                    }
                }
            }
            this.endBatch();
            this.draw();
        }
    });

    document.getElementById('btn-undo').addEventListener('click', () => {
        this.undo();
    });

    document.getElementById('btn-redo').addEventListener('click', () => {
        this.redo();
    });

    document.getElementById('btn-resize-map').addEventListener('click', () => {
        const w = parseInt(document.getElementById('map-w').value) || DEFAULT_WIDTH;
        const h = parseInt(document.getElementById('map-h').value) || DEFAULT_HEIGHT;
        if(confirm(`Resize map to ${w}x${h}? This will create a new empty map or crop existing data.`)) {
            this.resizeMap(w, h);
        }
    });

    document.getElementById('btn-zoom-in').addEventListener('click', () => {
        this.zoomLevel += this.zoomStep;
        this.updateCanvasSize();
        this.draw();
    });

    document.getElementById('btn-zoom-out').addEventListener('click', () => {
        if (this.zoomLevel > this.zoomStep) {
            this.zoomLevel -= this.zoomStep;
            this.updateCanvasSize();
            this.draw();
        }
    });

    document.getElementById('btn-zoom-reset').addEventListener('click', () => {
        this.zoomLevel = 1.0;
        this.updateCanvasSize();
        this.draw();
    });

    // --- undo/redo & other global handlers (store references so they can be removed) ---
    this._onWindow_keydown_undoRedo = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            this.undo();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
            e.preventDefault();
            this.redo();
        }
    };
    window.addEventListener('keydown', this._onWindow_keydown_undoRedo);

    document.getElementById('palette-select').addEventListener('change', (e) => {
        const paletteId = e.target.value;
        document.querySelectorAll('.tile-btn').forEach(btn => {
            if (paletteId === 'all' || btn.dataset.palette === paletteId) {
                btn.style.display = '';
            } else {
                btn.style.display = 'none';
            }
        });
    });

    document.getElementById('btn-add-layer').addEventListener('click', () => {
        this.addLayer();
    });

    document.getElementById('btn-remove-layer').addEventListener('click', () => {
        if(confirm("Are you sure you want to remove the current layer?")) {
            this.removeLayer();
        }
    });

    document.getElementById('btn-layer-up').addEventListener('click', () => {
        this.moveLayerUp();
    });

    document.getElementById('btn-layer-down').addEventListener('click', () => {
        this.moveLayerDown();
    });

    document.getElementById('layer-select').addEventListener('change', (e) => {
        this.currentLayerIndex = parseInt(e.target.value);
        this.draw();
    });

    document.getElementById('player-layer-select').addEventListener('change', (e) => {
        this.playerLayerIndex = parseInt(e.target.value);
    });

    document.getElementById('btn-tool-brush').addEventListener('click', () => {
        this.currentTool = 'brush';
        this.updateToolUI('btn-tool-brush');
    });

    document.getElementById('btn-tool-bucket').addEventListener('click', () => {
        this.currentTool = 'bucket';
        this.updateToolUI('btn-tool-bucket');
    });

    document.getElementById('btn-tool-spawn').addEventListener('click', () => {
        this.currentTool = 'spawn';
        this.updateToolUI('btn-tool-spawn');
        document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
    });

    document.getElementById('btn-tool-select').addEventListener('click', () => {
        this.currentTool = 'select';
        this.updateToolUI('btn-tool-select');
        document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
    });

    document.getElementById('inspector-cell-dialogue').addEventListener('input', (e) => {
        if (this.selectedCell) {
            const key = `${this.selectedCell.x},${this.selectedCell.y}`;
            const rawText = e.target.value;
            const sanitizedText = rawText.replace(/<[^>]*>?/gm, '');
            
            const text = sanitizedText.trim();
            if (text) {
                this.dialogues[key] = text;
            } else {
                delete this.dialogues[key];
            }
            this.draw();
        }
    });

    document.getElementById('inspector-cell-sound').addEventListener('change', (e) => {
        if (this.selectedCell) {
            const key = `${this.selectedCell.x},${this.selectedCell.y}`;
            const sound = e.target.value;
            if (sound) {
                this.soundTriggers[key] = sound;
            } else {
                delete this.soundTriggers[key];
            }
            this.draw();
        }
    });

    document.getElementById('btn-clear-player-sprites').addEventListener('click', () => {
        if(confirm("Reset all player animations?")) {
            this.playerAnimations = { 
                idle: { frames: [], speed: 10 }, 
                down: { frames: [], speed: 10 }, 
                up: { frames: [], speed: 10 }, 
                left: { frames: [], speed: 10 }, 
                right: { frames: [], speed: 10 } 
            };
            this.recordingState = null;
            ['idle', 'down', 'up', 'left', 'right'].forEach(state => {
                this.updateAnimationFramesUI(state);
                const speedInput = document.getElementById(`anim-speed-${state}`);
                if (speedInput) speedInput.value = 10;
            });
            document.querySelectorAll('#player-anim-controls button').forEach(b => {
                b.classList.remove('btn-danger', 'text-light');
                b.classList.add('btn-outline-info');
                b.innerHTML = '<i class="fa-solid fa-circle-dot me-1"></i> Record';
            });
        }
    });


};

// Remove all listeners that were added by addEventListeners
Editor.prototype.removeEventListeners = function() {
    try {
        if (this._onKeyDown_space) { window.removeEventListener('keydown', this._onKeyDown_space); this._onKeyDown_space = null; }
        if (this._onKeyUp_space) { window.removeEventListener('keyup', this._onKeyUp_space); this._onKeyUp_space = null; }
        if (this._onWindowMouseUp_pan) { window.removeEventListener('mouseup', this._onWindowMouseUp_pan); this._onWindowMouseUp_pan = null; }
        if (this._onWindow_keydown_undoRedo) { window.removeEventListener('keydown', this._onWindow_keydown_undoRedo); this._onWindow_keydown_undoRedo = null; }

        if (this._onCanvas_panMouseDown) { this.canvas.removeEventListener('mousedown', this._onCanvas_panMouseDown); this._onCanvas_panMouseDown = null; }
        if (this._onCanvas_panMouseMove) { this.canvas.removeEventListener('mousemove', this._onCanvas_panMouseMove); this._onCanvas_panMouseMove = null; }

        if (this._onCanvas_toolMouseDown) { this.canvas.removeEventListener('mousedown', this._onCanvas_toolMouseDown); this._onCanvas_toolMouseDown = null; }
        if (this._onCanvas_toolMouseMove) { this.canvas.removeEventListener('mousemove', this._onCanvas_toolMouseMove); this._onCanvas_toolMouseMove = null; }
        if (this._onCanvas_toolMouseUp) { this.canvas.removeEventListener('mouseup', this._onCanvas_toolMouseUp); this._onCanvas_toolMouseUp = null; }
        if (this._onCanvas_toolMouseLeave) { this.canvas.removeEventListener('mouseleave', this._onCanvas_toolMouseLeave); this._onCanvas_toolMouseLeave = null; }
    } catch (err) {
        console.warn('Error removing editor event listeners:', err);
    }
};
