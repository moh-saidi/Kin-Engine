// Rasm editeur
Editor.prototype.draw = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const now = Date.now();

    for (let l = 0; l < this.layers.length; l++) {
        const layer = this.layers[l];
        this.ctx.globalAlpha = (l === this.currentLayerIndex) ? 1.0 : 0.5;
        
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = layer[y][x];
                if (tile !== TILES.EMPTY) {
                    if (this.animatedTiles && this.animatedTiles[tile]) {
                        const anim = this.animatedTiles[tile];
                        const frameCount = anim.frames.length;
                        if (frameCount > 0) {
                            const frameIndex = Math.floor(now / anim.speed) % frameCount;
                            const currentTileId = anim.frames[frameIndex];
                            
                            if (this.tileImages[currentTileId]) {
                                this.drawTileToContext(this.ctx, currentTileId, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                            } else {
                                this.ctx.fillStyle = TILE_COLORS[currentTileId] || '#f0f';
                                this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                            }
                        }
                    } else if (this.tileImages[tile]) {
                        this.drawTileToContext(this.ctx, tile, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    } else {
                        this.ctx.fillStyle = TILE_COLORS[tile] || '#f0f';
                        this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    }
                }
            }
        }
    }
    this.ctx.globalAlpha = 1.0;
    
    // Blasset l joueur
    if (this.playerSpawn) {
        const px = this.playerSpawn.x * this.tileSize;
        const py = this.playerSpawn.y * this.tileSize;
        
        const idleAnim = this.playerAnimations['idle'];
        if (idleAnim && idleAnim.frames && idleAnim.frames.length > 0) {
            const tileId = idleAnim.frames[0];
            const drawW = this.useCustomSpriteSize ? this.playerSpriteSize.width : this.playerSize.width;
            const drawH = this.useCustomSpriteSize ? this.playerSpriteSize.height : this.playerSize.height;
            
            const tileCenterX = px + this.tileSize / 2;
            const tileCenterY = py + this.tileSize / 2;
            
            const hitW = this.playerSize.width;
            const hitH = this.playerSize.height;
            const hitX = tileCenterX - hitW / 2;
            const hitY = tileCenterY - hitH / 2;

            const drawX = tileCenterX - drawW / 2;
            const drawY = (hitY + hitH) - drawH;

            if (this.tileImages[tileId]) {
                const t = this.tileImages[tileId];
                if (t.isAtlas) {
                    this.ctx.drawImage(t.source, t.x, t.y, t.width, t.height, drawX, drawY, drawW, drawH);
                } else {
                    this.ctx.drawImage(t, drawX, drawY, drawW, drawH);
                }
            } else {
                this.ctx.fillStyle = TILE_COLORS[tileId] || '#00BFFF';
                this.ctx.fillRect(drawX, drawY, drawW, drawH);
            }
            
            this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(hitX, hitY, hitW, hitH);

        } else {
            const drawW = this.useCustomSpriteSize ? this.playerSpriteSize.width : this.tileSize;
            const drawH = this.useCustomSpriteSize ? this.playerSpriteSize.height : this.tileSize;
            
            const tileCenterX = px + this.tileSize / 2;
            const tileCenterY = py + this.tileSize / 2;
            
            const hitW = this.playerSize.width;
            const hitH = this.playerSize.height;
            const hitX = tileCenterX - hitW / 2;
            const hitY = tileCenterY - hitH / 2;

            const drawX = tileCenterX - drawW / 2;
            const drawY = (hitY + hitH) - drawH;

            this.ctx.fillStyle = 'rgba(0, 191, 255, 0.5)';
            this.ctx.fillRect(drawX, drawY, drawW, drawH);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('P', tileCenterX, tileCenterY);

            if (this.useCustomSpriteSize) {
                this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(hitX, hitY, hitW, hitH);
            }
        }
    }

    // Grid w chunks
    if (this.showGrid || this.showChunks) {
        this.ctx.save();
        if (this.showGrid) {
            this.ctx.strokeStyle = this.gridColor;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            for (let x = 0; x <= this.mapWidth; x++) {
                this.ctx.moveTo(x * this.tileSize + 0.5, 0);
                this.ctx.lineTo(x * this.tileSize + 0.5, this.mapHeight * this.tileSize);
            }
            for (let y = 0; y <= this.mapHeight; y++) {
                this.ctx.moveTo(0, y * this.tileSize + 0.5);
                this.ctx.lineTo(this.mapWidth * this.tileSize, y * this.tileSize + 0.5);
            }
            this.ctx.stroke();
        }
        if (this.showChunks && this.chunkSize > 0) {
            this.ctx.strokeStyle = this.chunkColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            const cx = this.chunkSize;
            for (let x = 0; x <= this.mapWidth; x += cx) {
                this.ctx.moveTo(x * this.tileSize + 0.5, 0);
                this.ctx.lineTo(x * this.tileSize + 0.5, this.mapHeight * this.tileSize);
            }
            for (let y = 0; y <= this.mapHeight; y += cx) {
                this.ctx.moveTo(0, y * this.tileSize + 0.5);
                this.ctx.lineTo(this.mapWidth * this.tileSize, y * this.tileSize + 0.5);
            }
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    if (this.isEditingCollisions) {
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const type = this.collisionMap[y][x];
                if (type !== COLLISION_TYPES.NONE) {
                    const tx = x * this.tileSize;
                    const ty = y * this.tileSize;
                    const half = this.tileSize / 2;
                    
                    switch(type) {
                        case COLLISION_TYPES.FULL:
                            this.ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
                            break;
                        case COLLISION_TYPES.HALF_TOP:
                            this.ctx.fillRect(tx, ty, this.tileSize, half);
                            break;
                        case COLLISION_TYPES.HALF_BOTTOM:
                            this.ctx.fillRect(tx, ty + half, this.tileSize, half);
                            break;
                        case COLLISION_TYPES.HALF_LEFT:
                            this.ctx.fillRect(tx, ty, half, this.tileSize);
                            break;
                        case COLLISION_TYPES.HALF_RIGHT:
                            this.ctx.fillRect(tx + half, ty, half, this.tileSize);
                            break;
                        case COLLISION_TYPES.QUARTER_TL:
                            this.ctx.fillRect(tx, ty, half, half);
                            break;
                        case COLLISION_TYPES.QUARTER_TR:
                            this.ctx.fillRect(tx + half, ty, half, half);
                            break;
                        case COLLISION_TYPES.QUARTER_BL:
                            this.ctx.fillRect(tx, ty + half, half, half);
                            break;
                        case COLLISION_TYPES.QUARTER_BR:
                            this.ctx.fillRect(tx + half, ty + half, half, half);
                            break;
                        case COLLISION_TYPES.THIRD_TOP:
                            this.ctx.fillRect(tx, ty, this.tileSize, this.tileSize / 3);
                            break;
                        case COLLISION_TYPES.THIRD_BOTTOM:
                            this.ctx.fillRect(tx, ty + (this.tileSize * 2/3), this.tileSize, this.tileSize / 3);
                            break;
                        case COLLISION_TYPES.THIRD_LEFT:
                            this.ctx.fillRect(tx, ty, this.tileSize / 3, this.tileSize);
                            break;
                        case COLLISION_TYPES.THIRD_RIGHT:
                            this.ctx.fillRect(tx + (this.tileSize * 2/3), ty, this.tileSize / 3, this.tileSize);
                            break;
                    }
                }

                // Selection rectangle
                if (this.selection) {
                    const { x, y, w, h } = this.selection;
                    this.ctx.save();
                    this.ctx.strokeStyle = 'rgba(0,150,255,0.9)';
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([6,4]);
                    this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, w * this.tileSize, h * this.tileSize);
                    this.ctx.restore();
                }
            }
        }
    }

    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Event Markers
    for (const key in this.events) {
        const [x, y] = key.split(',').map(Number);
        const px = x * this.tileSize;
        const py = y * this.tileSize;
        const event = this.events[key];
        
        this.ctx.beginPath();
        this.ctx.arc(px + this.tileSize - 8, py + 8, 6, 0, Math.PI * 2);
        
        if (event.type === 'sign') {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fill();
            this.ctx.fillStyle = '#000';
            this.ctx.fillText('...', px + this.tileSize - 8, py + 8);
        } else if (event.type === 'chest') {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            this.ctx.fill();
            this.ctx.fillStyle = '#000';
            this.ctx.fillText('$', px + this.tileSize - 8, py + 8);
        } else if (event.type === 'teleport') {
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
            this.ctx.fill();
            this.ctx.fillStyle = '#000';
            this.ctx.fillText('T', px + this.tileSize - 8, py + 8);
        }
    }
    
    // Legacy Dialogue Markers
    for (const key in this.dialogues) {
        if (this.events[key]) continue; // Don't draw twice
        const [x, y] = key.split(',').map(Number);
        const px = x * this.tileSize;
        const py = y * this.tileSize;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(px + this.tileSize - 8, py + 8, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillText('...', px + this.tileSize - 8, py + 8);
    }

    if (this.selectedCell) {
        const { x, y } = this.selectedCell;
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        this.ctx.lineWidth = 1;
    }
};


Editor.prototype.updatePreview = function() {
    if (!this.previewImage) return;

    const w = parseInt(document.getElementById('modal-tile-w').value) || 32;
    const h = parseInt(document.getElementById('modal-tile-h').value) || 32;

    this.previewCanvas.width = this.previewImage.width;
    this.previewCanvas.height = this.previewImage.height;

    this.previewCtx.drawImage(this.previewImage, 0, 0);

    this.previewCtx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
    this.previewCtx.lineWidth = 1;
    this.previewCtx.beginPath();

    const cols = Math.floor(this.previewImage.width / w);
    const rows = Math.floor(this.previewImage.height / h);

    for (let x = 0; x <= cols; x++) {
        this.previewCtx.moveTo(x * w, 0);
        this.previewCtx.lineTo(x * w, rows * h);
    }

    for (let y = 0; y <= rows; y++) {
        this.previewCtx.moveTo(0, y * h);
        this.previewCtx.lineTo(cols * w, y * h);
    }

    this.previewCtx.stroke();

    document.getElementById('modal-grid-info').textContent = 
        `${cols} Columns x ${rows} Rows (${cols * rows} Tiles)`;
};


Editor.prototype.updateAnimTilePreview = function() {
    const container = document.getElementById('anim-tile-preview');
    container.innerHTML = '';
    
    this.currentAnimFrames.forEach(tileId => {
        const thumb = document.createElement('div');
        thumb.style.width = '24px';
        thumb.style.height = '24px';
        thumb.style.flexShrink = '0';
        thumb.style.border = '1px solid #555';
        
        if (this.tileImages[tileId]) {
            thumb.style.backgroundImage = `url(${this.tileImages[tileId].toDataURL()})`;
            thumb.style.backgroundSize = 'cover';
        } else {
            thumb.style.backgroundColor = TILE_COLORS[tileId] || '#f0f';
        }
        container.appendChild(thumb);
    });
};
