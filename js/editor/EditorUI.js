// UI Parametres Map
Editor.prototype.initMapSettingsUI = function() {
    const sizeSelect = document.getElementById('map-tile-size');
    if (sizeSelect) {
        sizeSelect.value = this.tileSize;
        sizeSelect.addEventListener('change', (e) => {
            const newSize = parseInt(e.target.value);
            if (newSize && newSize !== this.tileSize) {
                if (confirm("Changing tile size will resize the view. Continue?")) {
                    this.tileSize = newSize;
                    this.updateCanvasSize();
                    this.needsRedraw = true;
                    const inputTilesW = document.getElementById('player-tiles-w');
                    const inputTilesH = document.getElementById('player-tiles-h');
                    if (inputTilesW) inputTilesW.dispatchEvent(new Event('change'));
                } else {
                    sizeSelect.value = this.tileSize;
                }
            }
        });
    }

        // Zid toolbar: zoom, grid/chunks, adawet jdod
        const toolbar = document.getElementById('viewport-toolbar');
        if (toolbar) {
                // 5alli toolbar ydor
                toolbar.classList.add('flex-wrap');
                
                const wrap = document.createElement('div');
                wrap.className = 'd-flex align-items-center gap-2 flex-wrap'; // Added flex-wrap
                wrap.innerHTML = `
                        <div class="d-flex align-items-center gap-1 border-start border-secondary ps-2">
                            <small class="text-muted me-1">Zoom:</small>
                            <input id="input-zoom-step" type="number" step="0.05" min="0.05" max="2" class="form-control form-control-sm bg-dark text-light" style="width:60px" title="Zoom Step">
                        </div>
                        <div class="d-flex align-items-center gap-2 border-start border-secondary ps-2">
                            <div class="form-check form-check-inline m-0">
                                <input class="form-check-input" type="checkbox" id="chk-show-grid" checked>
                                <label class="form-check-label small" for="chk-show-grid">Grid</label>
                            </div>
                            <div class="form-check form-check-inline m-0">
                                <input class="form-check-input" type="checkbox" id="chk-show-chunks" checked>
                                <label class="form-check-label small" for="chk-show-chunks">Chunks</label>
                            </div>
                        </div>
                        <div class="btn-group btn-group-sm border-start border-secondary ps-2">
                            <button id="btn-tool-rect" class="btn btn-outline-info" title="Rectangle Fill">Rect</button>
                            <button id="btn-tool-line" class="btn btn-outline-info" title="Line Draw">Line</button>
                            <button id="btn-tool-stamp-select" class="btn btn-outline-info" title="Select Area to Copy">Stamp</button>
                            <button id="btn-tool-stamp-paste" class="btn btn-outline-success" title="Paste Copied Area">Paste</button>
                            <button id="btn-delete-selection" class="btn btn-outline-danger" title="Delete Selected Area"><i class="fa-solid fa-trash"></i></button>
                        </div>
                `;
                toolbar.appendChild(wrap);

                document.getElementById('chk-show-grid').checked = this.showGrid;
                document.getElementById('chk-show-chunks').checked = this.showChunks;
                document.getElementById('chk-show-grid').addEventListener('change', (e)=>{ this.showGrid = e.target.checked; this.needsRedraw = true; });
                document.getElementById('chk-show-chunks').addEventListener('change', (e)=>{ this.showChunks = e.target.checked; this.needsRedraw = true; });

                document.getElementById('btn-tool-rect').addEventListener('click', ()=>{ this.currentTool = 'rect'; this.updateToolUI('btn-tool-rect'); });
                document.getElementById('btn-tool-line').addEventListener('click', ()=>{ this.currentTool = 'line'; this.updateToolUI('btn-tool-line'); });
                document.getElementById('btn-tool-stamp-select').addEventListener('click', ()=>{ this.currentTool = 'stamp-select'; this.updateToolUI('btn-tool-stamp-select'); });
                document.getElementById('btn-tool-stamp-paste').addEventListener('click', ()=>{ this.currentTool = 'stamp-paste'; this.updateToolUI('btn-tool-stamp-paste'); });
                document.getElementById('btn-delete-selection').addEventListener('click', ()=>{ this.clearSelectionArea(); });
        }
};

// UI Tiles Animés
Editor.prototype.initAnimatedTilesUI = function() {
    const btnRecord = document.getElementById('btn-record-anim-tile');
    const btnSave = document.getElementById('btn-save-anim-tile');
    const previewContainer = document.getElementById('anim-tile-preview');
    
    btnRecord.onclick = () => {
        this.recordingAnimTile = !this.recordingAnimTile;
        if (this.recordingAnimTile) {
            btnRecord.classList.remove('btn-outline-info');
            btnRecord.classList.add('btn-danger', 'text-light');
            btnRecord.innerHTML = '<i class="fa-solid fa-stop me-1"></i> Stop Recording';
            this.currentAnimFrames = [];
            this.updateAnimTilePreview();
            btnSave.disabled = true;
            
            if (this.recordingState) {
                this.toggleRecording(this.recordingState, document.querySelector(`#player-anim-controls button.btn-danger`));
            }
        } else {
            btnRecord.classList.remove('btn-danger', 'text-light');
            btnRecord.classList.add('btn-outline-info');
            btnRecord.innerHTML = '<i class="fa-solid fa-circle-dot me-1"></i> Record Frames';
            btnSave.disabled = this.currentAnimFrames.length === 0;
        }
    };

    btnSave.onclick = () => {
        if (this.recordingAnimTile) {
            this.recordingAnimTile = false;
            btnRecord.classList.remove('btn-danger', 'text-light');
            btnRecord.classList.add('btn-outline-info');
            btnRecord.innerHTML = '<i class="fa-solid fa-circle-dot me-1"></i> Record Frames';
        }

        const speed = parseInt(document.getElementById('anim-tile-speed').value) || 200;
        
        if (this.currentAnimFrames.length > 1 && 
            this.currentAnimFrames[0] === this.currentAnimFrames[this.currentAnimFrames.length - 1]) {
            this.currentAnimFrames.pop();
        }

        const id = this.nextAnimTileId++;
        
        this.animatedTiles[id] = {
            frames: [...this.currentAnimFrames],
            speed: speed
        };
        
        const nameInput = document.getElementById('anim-tile-name');
        if (nameInput && nameInput.value.trim()) {
            this.tileNames[id] = nameInput.value.trim();
            nameInput.value = '';
        }
        
        this.addTileToPalette(id, null, 'animated');
        
        this.currentAnimFrames = [];
        this.updateAnimTilePreview();
        btnSave.disabled = true;
        
        document.getElementById('palette-select').value = 'animated';
        document.getElementById('palette-select').dispatchEvent(new Event('change'));
    };
};

// Controls config UI
Editor.prototype.initControlsUI = function() {
    const container = document.getElementById('controls-config');
    container.innerHTML = '';

    const actions = [
        { id: 'up', label: 'Move Up' },
        { id: 'down', label: 'Move Down' },
        { id: 'left', label: 'Move Left' },
        { id: 'right', label: 'Move Right' }
    ];

    actions.forEach(action => {
        const row = document.createElement('div');
        row.className = 'd-flex justify-content-between align-items-center bg-dark border border-secondary rounded p-2';
        
        const label = document.createElement('span');
        label.className = 'small text-muted';
        label.textContent = action.label;
        
        const keysContainer = document.createElement('div');
        keysContainer.className = 'd-flex gap-1';

        const btn1 = document.createElement('button');
        btn1.className = 'btn btn-sm btn-outline-light py-0 px-2';
        btn1.style.fontSize = '0.75rem';
        btn1.style.minWidth = '60px';
        btn1.textContent = this.formatKeyName(this.controls[action.id][0]);
        btn1.onclick = () => this.bindControl(action.id, 0, btn1);
        
        const btn2 = document.createElement('button');
        btn2.className = 'btn btn-sm btn-outline-light py-0 px-2';
        btn2.style.fontSize = '0.75rem';
        btn2.style.minWidth = '60px';
        btn2.textContent = this.formatKeyName(this.controls[action.id][1]);
        btn2.onclick = () => this.bindControl(action.id, 1, btn2);

        keysContainer.appendChild(btn1);
        keysContainer.appendChild(btn2);
        
        row.appendChild(label);
        row.appendChild(keysContainer);
        container.appendChild(row);
    });

    document.getElementById('btn-reset-controls').onclick = () => {
        if(confirm("Reset controls to default?")) {
            this.controls = {
                up: ['ArrowUp', 'KeyW'],
                down: ['ArrowDown', 'KeyS'],
                left: ['ArrowLeft', 'KeyA'],
                right: ['ArrowRight', 'KeyD']
            };
            this.initControlsUI();
        }
    };
};


Editor.prototype.formatKeyName = function(code) {
    if (!code) return '---';
    if (code.startsWith('Key')) return code.replace('Key', '');
    if (code.startsWith('Arrow')) return code.replace('Arrow', 'Arr ');
    return code;
};

Editor.prototype.bindControl = function(action, index, btn) {
    btn.textContent = 'Press...';
    btn.classList.remove('btn-outline-light');
    btn.classList.add('btn-warning');
    
    const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.code === 'Escape') {
            btn.textContent = this.formatKeyName(this.controls[action][index]);
        } else {
            this.controls[action][index] = e.code;
            btn.textContent = this.formatKeyName(e.code);
        }
        
        btn.classList.remove('btn-warning');
        btn.classList.add('btn-outline-light');
        
        window.removeEventListener('keydown', handler);
    };
    
    window.addEventListener('keydown', handler, { once: true });
};

// Player animation UI
Editor.prototype.initPlayerAnimationUI = function() {
    const container = document.getElementById('player-anim-controls');
    container.innerHTML = '';
    
    const states = [
        { id: 'idle', label: 'Idle (No Input)' },
        { id: 'down', label: 'Moving Down (↓ / S)' },
        { id: 'up', label: 'Moving Up (↑ / W)' },
        { id: 'left', label: 'Moving Left (← / A)' },
        { id: 'right', label: 'Moving Right (→ / D)' }
    ];

    states.forEach(state => {
        const wrapper = document.createElement('div');
        wrapper.className = 'mb-2 border-bottom border-secondary pb-2';
        
        const header = document.createElement('div');
        header.className = 'd-flex justify-content-between align-items-center mb-1';
        header.innerHTML = `<small class="text-muted">${state.label}</small>`;
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'd-flex gap-1 align-items-center';

        // Speed Input
        const speedInput = document.createElement('input');
        speedInput.type = 'number';
        speedInput.id = `anim-speed-${state.id}`;
        speedInput.className = 'form-control form-control-sm bg-dark text-light border-secondary py-0 px-1';
        speedInput.style.width = '40px';
        speedInput.style.fontSize = '0.7rem';
        speedInput.value = this.playerAnimations[state.id] ? (this.playerAnimations[state.id].speed || 10) : 10;
        speedInput.min = 1;
        speedInput.title = 'Anim Speed (Lower is faster)';
        
        speedInput.onchange = (e) => {
            let val = parseInt(e.target.value);
            if (val < 1) val = 1;
            if (!this.playerAnimations[state.id]) {
                this.playerAnimations[state.id] = { frames: [], speed: val };
            } else {
                this.playerAnimations[state.id].speed = val;
            }
        };

        controlsDiv.appendChild(speedInput);

        const btnRecord = document.createElement('button');
        btnRecord.className = 'btn btn-sm btn-outline-info py-0 px-2';
        btnRecord.style.fontSize = '0.7rem';
        btnRecord.innerHTML = '<i class="fa-solid fa-circle-dot me-1"></i> Record';
        btnRecord.onclick = () => this.toggleRecording(state.id, btnRecord);
        
        controlsDiv.appendChild(btnRecord);
        header.appendChild(controlsDiv);
        wrapper.appendChild(header);

        const framesContainer = document.createElement('div');
        framesContainer.id = `anim-frames-${state.id}`;
        framesContainer.className = 'd-flex gap-1 overflow-auto bg-dark p-1 rounded';
        framesContainer.style.minHeight = '34px';
        
        wrapper.appendChild(framesContainer);
        container.appendChild(wrapper);
    });

    const inputW = document.getElementById('player-w');
    const inputH = document.getElementById('player-h');
    const inputTilesW = document.getElementById('player-tiles-w');
    const inputTilesH = document.getElementById('player-tiles-h');
    
    const chkCustomSprite = document.getElementById('chk-custom-sprite-size');
    const containerCustomSprite = document.getElementById('custom-sprite-size-container');
    const inputSpriteW = document.getElementById('player-sprite-w');
    const inputSpriteH = document.getElementById('player-sprite-h');

    const updateFromPixels = () => {
        this.playerSize.width = parseInt(inputW.value) || 20;
        this.playerSize.height = parseInt(inputH.value) || 20;
        
        if (inputTilesW) inputTilesW.value = (this.playerSize.width / this.tileSize).toFixed(2);
        if (inputTilesH) inputTilesH.value = (this.playerSize.height / this.tileSize).toFixed(2);
        
        if (!this.useCustomSpriteSize) {
            this.playerSpriteSize.width = this.playerSize.width;
            this.playerSpriteSize.height = this.playerSize.height;
            inputSpriteW.value = this.playerSize.width;
            inputSpriteH.value = this.playerSize.height;
        }

        this.needsRedraw = true;
    };

    const updateFromTiles = () => {
        const tw = parseFloat(inputTilesW.value) || 1;
        const th = parseFloat(inputTilesH.value) || 1;
        
        this.playerSize.width = Math.round(tw * this.tileSize);
        this.playerSize.height = Math.round(th * this.tileSize);
        
        inputW.value = this.playerSize.width;
        inputH.value = this.playerSize.height;
        
        if (!this.useCustomSpriteSize) {
            this.playerSpriteSize.width = this.playerSize.width;
            this.playerSpriteSize.height = this.playerSize.height;
            inputSpriteW.value = this.playerSize.width;
            inputSpriteH.value = this.playerSize.height;
        }

        this.needsRedraw = true;
    };

    inputW.addEventListener('change', updateFromPixels);
    inputH.addEventListener('change', updateFromPixels);
    
    if (inputTilesW) inputTilesW.addEventListener('change', updateFromTiles);
    if (inputTilesH) inputTilesH.addEventListener('change', updateFromTiles);
    
    if (inputTilesW) inputTilesW.value = (this.playerSize.width / this.tileSize).toFixed(2);
    if (inputTilesH) inputTilesH.value = (this.playerSize.height / this.tileSize).toFixed(2);

    // Custom Sprite Size Logic
    chkCustomSprite.checked = this.useCustomSpriteSize;
    if (this.useCustomSpriteSize) {
        containerCustomSprite.classList.remove('d-none');
    } else {
        containerCustomSprite.classList.add('d-none');
    }
    inputSpriteW.value = this.playerSpriteSize.width || this.playerSize.width;
    inputSpriteH.value = this.playerSpriteSize.height || this.playerSize.height;

    chkCustomSprite.addEventListener('change', () => {
        this.useCustomSpriteSize = chkCustomSprite.checked;
        if (this.useCustomSpriteSize) {
            containerCustomSprite.classList.remove('d-none');
            // If switching to custom, init with current hitbox size if not set
            if (!this.playerSpriteSize.width) this.playerSpriteSize.width = this.playerSize.width;
            if (!this.playerSpriteSize.height) this.playerSpriteSize.height = this.playerSize.height;
            inputSpriteW.value = this.playerSpriteSize.width;
            inputSpriteH.value = this.playerSpriteSize.height;
        } else {
            containerCustomSprite.classList.add('d-none');
            // Reset to hitbox size
            this.playerSpriteSize.width = this.playerSize.width;
            this.playerSpriteSize.height = this.playerSize.height;
        }
        this.needsRedraw = true;
    });

    const updateSpriteSize = () => {
        this.playerSpriteSize.width = parseInt(inputSpriteW.value) || 20;
        this.playerSpriteSize.height = parseInt(inputSpriteH.value) || 20;
        this.needsRedraw = true;
    };

    inputSpriteW.addEventListener('change', updateSpriteSize);
    inputSpriteH.addEventListener('change', updateSpriteSize);
};

Editor.prototype.toggleRecording = function(stateId, btn) {
    if (this.recordingState === stateId) {
        this.recordingState = null;
        btn.classList.remove('btn-danger', 'text-light');
        btn.classList.add('btn-outline-info');
        btn.innerHTML = '<i class="fa-solid fa-circle-dot me-1"></i> Record';
    } else {
        document.querySelectorAll('#player-anim-controls button').forEach(b => {
            b.classList.remove('btn-danger', 'text-light');
            b.classList.add('btn-outline-info');
            b.innerHTML = '<i class="fa-solid fa-circle-dot me-1"></i> Record';
        });
        
        this.recordingState = stateId;
        btn.classList.remove('btn-outline-info');
        btn.classList.add('btn-danger', 'text-light');
        btn.innerHTML = '<i class="fa-solid fa-stop me-1"></i> Stop';
        
        // Preserve speed when clearing frames
        const currentSpeed = (this.playerAnimations[stateId] && this.playerAnimations[stateId].speed) || 10;
        this.playerAnimations[stateId] = { frames: [], speed: currentSpeed };
        this.updateAnimationFramesUI(stateId);
    }
};

Editor.prototype.updateAnimationFramesUI = function(stateId) {
    const container = document.getElementById(`anim-frames-${stateId}`);
    container.innerHTML = '';
    
    if (this.playerAnimations[stateId] && this.playerAnimations[stateId].frames) {
        this.playerAnimations[stateId].frames.forEach(tileId => {
            const thumb = document.createElement('div');
            thumb.style.width = '24px';
            thumb.style.height = '24px';
            thumb.style.flexShrink = '0';
            thumb.style.border = '1px solid #555';
            
            if (this.tileImages[tileId]) {
                thumb.style.backgroundImage = `url(${this.getTileDataURL(tileId)})`;
                thumb.style.backgroundSize = 'cover';
            } else {
                thumb.style.backgroundColor = TILE_COLORS[tileId] || '#f0f';
            }
            
            container.appendChild(thumb);
        });
    }
};

Editor.prototype.updateLayerUI = function() {
    const select = document.getElementById('layer-select');
    select.innerHTML = '';
    this.layers.forEach((_, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Layer ${index + 1}`;
        if (index === this.currentLayerIndex) option.selected = true;
        select.appendChild(option);
    });

    const playerSelect = document.getElementById('player-layer-select');
    if (playerSelect) {
        playerSelect.innerHTML = '';
        this.layers.forEach((_, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Layer ${index + 1}`;
            if (index === this.playerLayerIndex) option.selected = true;
            playerSelect.appendChild(option);
        });
    }
};

// Basic tiles palette
Editor.prototype.initPalette = function() {
    Object.keys(TILES).forEach(key => {
        if (key === 'EMPTY' || key === 'PLAYER') return;
        
        const tileId = TILES[key];
        const btn = document.createElement('div');
        btn.className = 'tile-btn';
        btn.style.backgroundColor = TILE_COLORS[tileId];
        btn.title = key;
        btn.dataset.tile = tileId;
        btn.dataset.palette = 'basic';
        
        btn.addEventListener('click', () => {
            const tid = parseInt(btn.dataset.tile);
            
            if (this.recordingState) {
                if (this.playerAnimations[this.recordingState] && this.playerAnimations[this.recordingState].frames) {
                    this.playerAnimations[this.recordingState].frames.push(tid);
                    this.updateAnimationFramesUI(this.recordingState);
                }
            } else if (this.recordingAnimTile) {
                this.currentAnimFrames.push(tid);
                this.updateAnimTilePreview();
                document.getElementById('btn-save-anim-tile').disabled = false;
            } else {
                this.selectedTile = tid;
                this.currentTool = 'brush';
                document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('btn-tool-brush').classList.add('active');
                document.getElementById('btn-tool-bucket').classList.remove('active');
                document.getElementById('btn-tool-spawn').classList.remove('active');
            }
        });

        this.paletteContainer.appendChild(btn);
    });

    const eraser = document.createElement('div');
    eraser.className = 'tile-btn';
    eraser.style.backgroundColor = TILE_COLORS[TILES.EMPTY];
    eraser.title = "Eraser";
    eraser.dataset.tile = TILES.EMPTY;
    eraser.dataset.palette = 'basic';
    eraser.innerHTML = 'X';
    eraser.style.color = 'white';
    eraser.style.display = 'flex';
    eraser.style.alignItems = 'center';
    eraser.style.justifyContent = 'center';
    
    eraser.addEventListener('click', () => {
        this.selectedTile = TILES.EMPTY;
        document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
        eraser.classList.add('active');
        this.updateSelectedTileUI();
    });
    this.paletteContainer.appendChild(eraser);
};

// Collision palette
Editor.prototype.initCollisionPalette = function() {
    const shapes = [
        { id: COLLISION_TYPES.FULL, label: 'Full', icon: '■' },
        { id: COLLISION_TYPES.HALF_TOP, label: 'Top ½', icon: '▀' },
        { id: COLLISION_TYPES.HALF_BOTTOM, label: 'Bot ½', icon: '▄' },
        { id: COLLISION_TYPES.HALF_LEFT, label: 'L ½', icon: '▌' },
        { id: COLLISION_TYPES.HALF_RIGHT, label: 'R ½', icon: '▐' },
        { id: COLLISION_TYPES.QUARTER_TL, label: 'TL ¼', icon: '▛' },
        { id: COLLISION_TYPES.QUARTER_TR, label: 'TR ¼', icon: '▜' },
        { id: COLLISION_TYPES.QUARTER_BL, label: 'BL ¼', icon: '▙' },
        { id: COLLISION_TYPES.QUARTER_BR, label: 'BR ¼', icon: '▟' },
        { id: COLLISION_TYPES.THIRD_TOP, label: 'Top ⅓', icon: 'T⅓' },
        { id: COLLISION_TYPES.THIRD_BOTTOM, label: 'Bot ⅓', icon: 'B⅓' },
        { id: COLLISION_TYPES.THIRD_LEFT, label: 'L ⅓', icon: 'L⅓' },
        { id: COLLISION_TYPES.THIRD_RIGHT, label: 'R ⅓', icon: 'R⅓' }
    ];

    shapes.forEach(shape => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-outline-danger';
        btn.innerHTML = shape.icon;
        btn.title = shape.label;
        btn.style.width = '30px';
        btn.style.height = '30px';
        btn.style.padding = '0';
        
        btn.addEventListener('click', () => {
            this.selectedCollision = shape.id;
            Array.from(this.collisionPaletteContainer.children).forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('chk-collision-eraser').checked = false;
        });

        this.collisionPaletteContainer.appendChild(btn);
    });
    
    if(this.collisionPaletteContainer.children.length > 0) {
        this.collisionPaletteContainer.children[0].classList.add('active');
    }
};

// Zid tile lel palette
Editor.prototype.addTileToPalette = function(tileId, imageSource, paletteId = 'custom') {
    const btn = document.createElement('div');
    btn.className = 'tile-btn';
    const name = this.tileNames[tileId] || `Tile ${tileId}`;
    btn.title = name;
    btn.dataset.tile = tileId;
    btn.dataset.palette = paletteId;
    
    if (imageSource) {
        btn.style.backgroundImage = `url(${imageSource.toDataURL()})`;
        btn.style.backgroundSize = 'cover';
    } else if (this.tileImages[tileId]) {
        const tile = this.tileImages[tileId];
        if (tile.isAtlas) {
            btn.style.backgroundImage = `url(${tile.source.src})`;
            btn.style.backgroundImage = `url(${this.getTileDataURL(tileId)})`;
            btn.style.backgroundSize = 'cover';
        } else {
             btn.style.backgroundImage = `url(${tile.toDataURL()})`;
             btn.style.backgroundSize = 'cover';
        }
    } else if (this.animatedTiles[tileId]) {
            const firstFrameId = this.animatedTiles[tileId].frames[0];
            if (this.tileImages[firstFrameId]) {
                btn.style.backgroundImage = `url(${this.getTileDataURL(firstFrameId)})`;
                btn.style.backgroundSize = 'cover';
            } else {
                btn.style.backgroundColor = TILE_COLORS[firstFrameId] || '#f0f';
            }
            const indicator = document.createElement('div');
            indicator.style.position = 'absolute';
            indicator.style.bottom = '0';
            indicator.style.right = '0';
            indicator.style.width = '8px';
            indicator.style.height = '8px';
            indicator.style.backgroundColor = '#00ff00';
            indicator.style.borderRadius = '50%';
            btn.appendChild(indicator);
    }
    
    btn.addEventListener('click', () => {
        const tid = parseInt(btn.dataset.tile);
        
        if (this.recordingState) {
            if (this.playerAnimations[this.recordingState] && this.playerAnimations[this.recordingState].frames) {
                this.playerAnimations[this.recordingState].frames.push(tid);
                this.updateAnimationFramesUI(this.recordingState);
            }
        } else if (this.recordingAnimTile) {
            this.currentAnimFrames.push(tid);
            this.updateAnimTilePreview();
            document.getElementById('btn-save-anim-tile').disabled = false;
        } else {
            this.selectedTile = tid;
            document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.updateSelectedTileUI();
        }
    });

    this.paletteContainer.appendChild(btn);
};

// Update inspector tile preview
Editor.prototype.updateSelectedTileUI = function() {
    const preview = document.getElementById('inspector-tile-preview');
    const idLabel = document.getElementById('inspector-tile-id');
    const nameInput = document.getElementById('inspector-tile-name');
    const speedContainer = document.getElementById('inspector-anim-speed-container');
    const speedInput = document.getElementById('inspector-anim-speed');
    
    if (this.selectedTile === null) {
        preview.style.backgroundImage = '';
        preview.style.backgroundColor = 'transparent';
        idLabel.textContent = 'ID: -';
        nameInput.value = '';
        nameInput.disabled = true;
        if (speedContainer) speedContainer.classList.add('d-none');
        return;
    }

    const tid = this.selectedTile;
    idLabel.textContent = `ID: ${tid}`;
    nameInput.value = this.tileNames[tid] || '';
    nameInput.disabled = false;
    
    if (this.animatedTiles && this.animatedTiles[tid]) {
        if (speedContainer) {
            speedContainer.classList.remove('d-none');
            speedInput.value = this.animatedTiles[tid].speed;
        }
    } else {
        if (speedContainer) speedContainer.classList.add('d-none');
    }
    
    if (this.tileImages[tid]) {
        preview.style.backgroundImage = `url(${this.getTileDataURL(tid)})`;
        preview.style.backgroundSize = 'cover';
        preview.style.backgroundColor = 'transparent';
    } else if (this.animatedTiles[tid]) {
            const firstFrameId = this.animatedTiles[tid].frames[0];
            if (this.tileImages[firstFrameId]) {
                preview.style.backgroundImage = `url(${this.getTileDataURL(firstFrameId)})`;
                preview.style.backgroundSize = 'cover';
            } else {
                preview.style.backgroundColor = TILE_COLORS[firstFrameId] || '#f0f';
                preview.style.backgroundImage = '';
            }
    } else {
        preview.style.backgroundColor = TILE_COLORS[tid] || '#f0f';
        preview.style.backgroundImage = '';
    }
};

// Tool UI update
Editor.prototype.updateToolUI = function(activeId) {
    ['btn-tool-brush', 'btn-tool-bucket', 'btn-tool-spawn', 'btn-tool-select'].forEach(id => {
        const btn = document.getElementById(id);
        if (id === activeId) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const cellProps = document.getElementById('inspector-cell-properties');
    if (activeId === 'btn-tool-select') {
        cellProps.classList.remove('d-none');
    } else {
        cellProps.classList.add('d-none');
        this.selectedCell = null;
        this.draw();
    }
};

// Update inspector cell properties
Editor.prototype.updateInspectorCell = function() {
    if (!this.selectedCell) return;
    const { x, y } = this.selectedCell;
    document.getElementById('inspector-cell-coords').textContent = `X: ${x} , Y: ${y}`;
    
    const key = `${x},${y}`;
    
    // Load Event Data
    const event = this.events[key] || {};
    const eventTypeSelect = document.getElementById('inspector-event-type');
    
    // Backwards compatibility with dialogues
    if (!event.type && this.dialogues[key]) {
        event.type = 'sign';
        event.text = this.dialogues[key];
    }
    
    eventTypeSelect.value = event.type || '';
    
    // Show/Hide property sections based on type
    document.getElementById('props-sign').classList.add('d-none');
    document.getElementById('props-chest').classList.add('d-none');
    document.getElementById('props-teleport').classList.add('d-none');
    document.getElementById('props-script')?.classList.add('d-none');
    
    if (event.type === 'sign') {
        document.getElementById('props-sign').classList.remove('d-none');
        document.getElementById('inspector-cell-dialogue').value = event.text || '';
    } else if (event.type === 'chest') {
        document.getElementById('props-chest').classList.remove('d-none');
        document.getElementById('inspector-chest-item').value = event.item || '';
        document.getElementById('inspector-chest-tile').value = event.openTileId || '';
    } else if (event.type === 'teleport') {
        document.getElementById('props-teleport').classList.remove('d-none');
        document.getElementById('inspector-teleport-x').value = (event.target ? event.target.x : 0);
        document.getElementById('inspector-teleport-y').value = (event.target ? event.target.y : 0);
    } else if (event.type === 'script') {
        const scriptArea = document.getElementById('inspector-script-content');
        document.getElementById('props-script').classList.remove('d-none');
        scriptArea.value = event.script || '';

        scriptArea.onchange = (e) => {
            if (!this.events[key]) this.events[key] = { type: 'script' };
            this.events[key].script = e.target.value;
            this.isDirty = true;
        };

        document.getElementById('inspector-script-run').onclick = () => {
            // Run script in editor context with limited API for quick testing
            const src = scriptArea.value || '';
            try {
                const api = {
                    showDialogue: (t) => alert(String(t)),
                    playSFX: (n) => this.audioManager && this.audioManager.playSFX(n),
                    playBGM: (n) => this.audioManager && this.audioManager.playBGM(n),
                    setTile: (x, y, id, layer = this.currentLayerIndex) => { if (this.layers[layer] && this.layers[layer][y]) { this.layers[layer][y][x] = id; this.needsRedraw = true; } },
                    getTile: (x, y, layer = this.currentLayerIndex) => { return (this.layers[layer] && this.layers[layer][y]) ? this.layers[layer][y][x] : null; },
                    teleportPlayer: (x, y) => { this.playerSpawn = { x, y }; this.needsRedraw = true; },
                    spawnEntity: (type, x, y) => { /* editor: no-op / preview only */ console.log('spawnEntity preview:', type, x, y); }
                };
                const fn = new Function('api', src);
                fn(api);
            } catch (err) {
                alert('Script error: ' + err.message);
                console.error('Inspector script error:', err);
            }
        };

        document.getElementById('inspector-script-insert-teleport').onclick = () => {
            const s = "api.teleportPlayer(10,5); // example";
            scriptArea.value = (scriptArea.value ? scriptArea.value + '\n' : '') + s;
            scriptArea.dispatchEvent(new Event('change'));
        };
    }


    // Sound Trigger Logic
    const soundSelect = document.getElementById('inspector-cell-sound');
    soundSelect.innerHTML = '<option value="">None</option>';
    
    if (this.audioManager) {
        const sounds = this.audioManager.getSoundNames();
        sounds.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            soundSelect.appendChild(option);
        });
    }
    
    const currentSound = this.soundTriggers[key] || '';
    soundSelect.value = currentSound;
    
    // Setup Event Listeners for Inputs (Debounced or on change)
    // Note: In a real app, we should remove old listeners to avoid duplicates, 
    // but for simplicity we'll just re-assign onchange which overwrites the old one.
    
    eventTypeSelect.onchange = (e) => {
        const type = e.target.value;
        if (!this.events[key]) this.events[key] = {};
        
        if (type === '') {
            delete this.events[key];
            delete this.dialogues[key]; // Cleanup legacy
        } else {
            this.events[key].type = type;
        }
        this.updateInspectorCell(); // Refresh UI
        this.isDirty = true;
    };
    
    document.getElementById('inspector-cell-dialogue').onchange = (e) => {
        if (!this.events[key]) this.events[key] = { type: 'sign' };
        this.events[key].text = e.target.value;
        this.dialogues[key] = e.target.value; // Keep legacy sync
        this.isDirty = true;
    };
    
    document.getElementById('inspector-chest-item').onchange = (e) => {
        if (!this.events[key]) this.events[key] = { type: 'chest' };
        this.events[key].item = e.target.value;
        this.isDirty = true;
    };
    
    document.getElementById('inspector-chest-tile').onchange = (e) => {
        if (!this.events[key]) this.events[key] = { type: 'chest' };
        this.events[key].openTileId = parseInt(e.target.value);
        this.isDirty = true;
    };
    
    const updateTeleport = () => {
        if (!this.events[key]) this.events[key] = { type: 'teleport' };
        const tx = parseInt(document.getElementById('inspector-teleport-x').value) || 0;
        const ty = parseInt(document.getElementById('inspector-teleport-y').value) || 0;
        this.events[key].target = { x: tx, y: ty };
        this.isDirty = true;
    };
    
    document.getElementById('inspector-teleport-x').onchange = updateTeleport;
    document.getElementById('inspector-teleport-y').onchange = updateTeleport;
    
    soundSelect.onchange = (e) => {
        if (e.target.value) {
            this.soundTriggers[key] = e.target.value;
        } else {
            delete this.soundTriggers[key];
        }
        this.isDirty = true;
    };
};
