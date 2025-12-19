// Rasm jeu
Game.prototype.draw = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const camXBase = Math.floor(Math.max(0, Math.min(
        this.player.x - this.canvas.width / 2,
        (this.mapWidth * this.tileSize) - this.canvas.width
    )));
    const camYBase = Math.floor(Math.max(0, Math.min(
        this.player.y - this.canvas.height / 2,
        (this.mapHeight * this.tileSize) - this.canvas.height
    )));
    const camX = camXBase + (this.camOffsetX || 0);
    const camY = camYBase + (this.camOffsetY || 0);
    
    this.ctx.save();
    // Zoom ikhtiyari
    const z = this.zoom || 1.0;
    this.ctx.scale(z, z);
    this.ctx.translate(-camX, -camY);

    const startCol = Math.floor(camX / this.tileSize);
    const endCol = startCol + (this.canvas.width / this.tileSize) + 1;
    const startRow = Math.floor(camY / this.tileSize);
    const endRow = startRow + (this.canvas.height / this.tileSize) + 1;

    const playerLayerIndex = (this.mapData && this.mapData.playerLayerIndex !== undefined) 
        ? this.mapData.playerLayerIndex 
        : (this.layers.length - 1);

    const now = Date.now();

    for (let l = 0; l < this.layers.length; l++) {
        const layer = this.layers[l];
        if (!layer) continue;
        for (let y = startRow; y <= endRow; y++) {
            if (!layer[y]) continue;
            for (let x = startCol; x <= endCol; x++) {
                if (y >= 0 && y < this.mapHeight && x >= 0 && x < this.mapWidth) {
                    const tile = layer[y][x];
                    if (tile !== TILES.EMPTY && tile !== undefined) {
                        const drawX = (x * this.tileSize) | 0;
                        const drawY = (y * this.tileSize) | 0;

                        if (this.animatedTiles && this.animatedTiles[tile]) {
                            const anim = this.animatedTiles[tile];
                            const frameCount = anim.frames.length;
                            if (frameCount > 0) {
                                const frameIndex = Math.floor(now / anim.speed) % frameCount;
                                const currentTileId = anim.frames[frameIndex];
                                
                                if (this.tileImages[currentTileId]) {
                                    const t = this.tileImages[currentTileId];
                                    if (t.isAtlas) {
                                        this.ctx.drawImage(t.source, t.x, t.y, t.width, t.height, drawX, drawY, this.tileSize, this.tileSize);
                                    } else {
                                        this.ctx.drawImage(t, drawX, drawY, this.tileSize, this.tileSize);
                                    }
                                } else {
                                    this.ctx.fillStyle = TILE_COLORS[currentTileId] || '#f0f';
                                    this.ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                                }
                            }
                        } else if (this.tileImages[tile]) {
                            const t = this.tileImages[tile];
                            if (t.isAtlas) {
                                this.ctx.drawImage(t.source, t.x, t.y, t.width, t.height, drawX, drawY, this.tileSize, this.tileSize);
                            } else {
                                this.ctx.drawImage(t, drawX, drawY, this.tileSize, this.tileSize);
                            }
                        } else {
                            this.ctx.fillStyle = TILE_COLORS[tile] || '#f0f';
                            this.ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                        }
                    }
                }
            }
        }
        
        if (l === playerLayerIndex) {
            if (this.entityManager) this.entityManager.draw(this.ctx);
            this.drawPlayer();
        }
    }

    if (playerLayerIndex >= this.layers.length) {
        if (this.entityManager) this.entityManager.draw(this.ctx);
        this.drawPlayer();
    }

    this.ctx.restore();
};

// Rasm joueur
Game.prototype.drawPlayer = function() {
    const animState = this.player.state;
    let animObj = this.playerAnimations[animState];
    
    if (!animObj || !animObj.frames || animObj.frames.length === 0) {
        animObj = this.playerAnimations['idle'];
    }

    if (animObj && animObj.frames && animObj.frames.length > 0) {
        const frames = animObj.frames;
        const frameIndex = this.player.animFrame % frames.length;
        const tileId = frames[frameIndex];
        
        const drawW = this.player.useCustomSpriteSize ? this.player.spriteWidth : this.player.width;
        const drawH = this.player.useCustomSpriteSize ? this.player.spriteHeight : this.player.height;
        
        const drawX = this.player.x + (this.player.width - drawW) / 2;
        const drawY = this.player.y + this.player.height - drawH;

        if (this.tileImages[tileId]) {
            const t = this.tileImages[tileId];
            if (t.isAtlas) this.ctx.drawImage(t.source, t.x, t.y, t.width, t.height, drawX, drawY, drawW, drawH);
            else this.ctx.drawImage(t, drawX, drawY, drawW, drawH);
        } else {
            this.ctx.fillStyle = TILE_COLORS[tileId] || '#00BFFF';
            this.ctx.fillRect(drawX, drawY, drawW, drawH);
        }
        
    } else {
        this.ctx.fillStyle = TILE_COLORS[TILES.PLAYER];
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        this.ctx.fillStyle = 'white';
        const cx = this.player.x + this.player.width/2;
        const cy = this.player.y + this.player.height/2;
        const size = 4;
        
        if (this.player.facing === 'right') this.ctx.fillRect(cx + 5, cy - 2, size, size);
        else if (this.player.facing === 'left') this.ctx.fillRect(cx - 9, cy - 2, size, size);
        else if (this.player.facing === 'up') this.ctx.fillRect(cx - 2, cy - 9, size, size);
        else if (this.player.facing === 'down') this.ctx.fillRect(cx - 2, cy + 5, size, size);
    }
};
