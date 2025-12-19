// Lawwen tiles/collisions
Editor.prototype.paint = function(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (this.tileSize * this.zoomLevel));
    const y = Math.floor((e.clientY - rect.top) / (this.tileSize * this.zoomLevel));

    if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
        if (this.currentTool === 'spawn') {
            this.playerSpawn = { x, y };
            this.isDirty = true;
            this.needsRedraw = true;
            return;
        }

        if (this.currentTool === 'select') {
            this.selectedCell = { x, y };
            this.updateInspectorCell();
            this.needsRedraw = true;
            return;
        }

        if (this.isEditingCollisions) {
            const isEraser = document.getElementById('chk-collision-eraser').checked;
            const newVal = isEraser ? COLLISION_TYPES.NONE : this.selectedCollision;
            const oldVal = this.collisionMap[y][x];
            
            if (oldVal !== newVal) {
                this.addToBatch({ x, y, layerIndex: this.currentLayerIndex, oldVal, newVal, type: 'collision' });
                this.collisionMap[y][x] = newVal;
            }
        } else {
            const oldVal = this.layers[this.currentLayerIndex][y][x];
            const newVal = this.selectedTile;
            
            if (oldVal !== newVal) {
                this.addToBatch({ x, y, layerIndex: this.currentLayerIndex, oldVal, newVal, type: 'tile' });
                this.layers[this.currentLayerIndex][y][x] = newVal;
            }
        }
        this.isDirty = true;
        this.needsRedraw = true;
    }
};

// 3abbi (bucket)
Editor.prototype.fill = function(e) {
    const rect = this.canvas.getBoundingClientRect();
    const startX = Math.floor((e.clientX - rect.left) / (this.tileSize * this.zoomLevel));
    const startY = Math.floor((e.clientY - rect.top) / (this.tileSize * this.zoomLevel));

    if (startX < 0 || startX >= this.mapWidth || startY < 0 || startY >= this.mapHeight) return;

    if (this.isEditingCollisions) {
        const isEraser = document.getElementById('chk-collision-eraser').checked;
        const targetVal = isEraser ? COLLISION_TYPES.NONE : this.selectedCollision;
        this.floodFill(startX, startY, targetVal, this.collisionMap, true);
    } else {
        this.floodFill(startX, startY, this.selectedTile, this.layers[this.currentLayerIndex], false);
    }
    this.isDirty = true;
    this.needsRedraw = true;
};

// Flood fill recursif
Editor.prototype.floodFill = function(startX, startY, newVal, layer, isCollision) {
    const oldVal = layer[startY][startX];
    if (oldVal === newVal) return;

    const stack = [[startX, startY]];
    
    while (stack.length) {
        const [x, y] = stack.pop();
        
        if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
            if (layer[y][x] === oldVal) {
                this.addToBatch({ x, y, layerIndex: this.currentLayerIndex, oldVal, newVal, type: isCollision ? 'collision' : 'tile' });
                layer[y][x] = newVal;
                stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }
        }
    }
};

// Qoss tileset
Editor.prototype.sliceTileset = function(img, w, h, paletteId) {
    if (img.width % w !== 0 || img.height % h !== 0) {
        if (this.showError) this.showError(`Tileset ${img.width}x${img.height} mch divisible b ${w}x${h}.`);
        return;
    }
    const cols = Math.floor(img.width / w);
    const rows = Math.floor(img.height / h);

    for (let y = 0; y < rows; y++) {
        for (let x = cols - 1; x >= 0; x--) {
            const tileId = this.nextTileId++;
            this.tileImages[tileId] = { source: img, x: x * w, y: y * h, width: w, height: h, isAtlas: true };
            this.addTileToPalette(tileId, null, paletteId);
        }
    }
    this.isDirty = true;
};

// Fassa5 selection
Editor.prototype.clearSelectionArea = function() {
    if (!this.selection) return;
    const { x, y, w, h } = this.selection;
    this.startBatch();
    for (let l = 0; l < this.layers.length; l++) {
        for (let ry = 0; ry < h; ry++) {
            for (let rx = 0; rx < w; rx++) {
                const tx = x + rx, ty = y + ry;
                if (tx >= 0 && tx < this.mapWidth && ty >= 0 && ty < this.mapHeight) {
                    const oldVal = this.layers[l][ty][tx];
                    if (oldVal !== TILES.EMPTY) {
                        this.addToBatch({ x: tx, y: ty, layerIndex: l, oldVal, newVal: TILES.EMPTY, type: 'tile' });
                        this.layers[l][ty][tx] = TILES.EMPTY;
                    }
                }
            }
        }
    }
    this.endBatch();
    this.isDirty = true;
    this.needsRedraw = true;
};

// Rectangle fill
Editor.prototype.applyRectFill = function(selection, tileId) {
    if (!selection) return;
    const { x, y, w, h } = selection;
    this.startBatch();
    for (let ry = 0; ry < h; ry++) {
        for (let rx = 0; rx < w; rx++) {
            const tx = x + rx, ty = y + ry;
            if (tx >= 0 && tx < this.mapWidth && ty >= 0 && ty < this.mapHeight) {
                const oldVal = this.layers[this.currentLayerIndex][ty][tx];
                if (oldVal !== tileId) {
                    this.addToBatch({ x: tx, y: ty, layerIndex: this.currentLayerIndex, oldVal, newVal: tileId, type: 'tile' });
                    this.layers[this.currentLayerIndex][ty][tx] = tileId;
                }
            }
        }
    }
    this.endBatch();
    this.isDirty = true;
    this.needsRedraw = true;
};

// Line draw (Bresenham)
Editor.prototype.applyLineDraw = function(start, end, tileId) {
    if (!start || !end) return;
    let x0 = start.x, y0 = start.y, x1 = end.x, y1 = end.y;
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    this.startBatch();
    while (true) {
        if (x0 >= 0 && x0 < this.mapWidth && y0 >= 0 && y0 < this.mapHeight) {
            const oldVal = this.layers[this.currentLayerIndex][y0][x0];
            if (oldVal !== tileId) {
                this.addToBatch({ x: x0, y: y0, layerIndex: this.currentLayerIndex, oldVal, newVal: tileId, type: 'tile' });
                this.layers[this.currentLayerIndex][y0][x0] = tileId;
            }
        }
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
    this.endBatch();
    this.isDirty = true;
    this.needsRedraw = true;
};

// Stamp paste
Editor.prototype.applyStampPaste = function(targetX, targetY) {
    if (!this.stampBuffer) return;
    const { w, h, data } = this.stampBuffer;
    this.startBatch();
    for (let ry = 0; ry < h; ry++) {
        for (let rx = 0; rx < w; rx++) {
            const tx = targetX + rx, ty = targetY + ry;
            if (tx >= 0 && tx < this.mapWidth && ty >= 0 && ty < this.mapHeight) {
                const newVal = data[ry][rx];
                const oldVal = this.layers[this.currentLayerIndex][ty][tx];
                if (oldVal !== newVal) {
                    this.addToBatch({ x: tx, y: ty, layerIndex: this.currentLayerIndex, oldVal, newVal, type: 'tile' });
                    this.layers[this.currentLayerIndex][ty][tx] = newVal;
                }
            }
        }
    }
    this.endBatch();
    this.isDirty = true;
    this.needsRedraw = true;
};
