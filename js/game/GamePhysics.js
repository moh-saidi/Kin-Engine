// Chouf Collision
Game.prototype.checkCollision = function(axis) {
    const startX = Math.floor(this.player.x / this.tileSize);
    const endX = Math.floor((this.player.x + this.player.width) / this.tileSize);
    const startY = Math.floor(this.player.y / this.tileSize);
    const endY = Math.floor((this.player.y + this.player.height) / this.tileSize);

    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            if (y >= 0 && y < this.mapHeight && x >= 0 && x < this.mapWidth) {
                
                if (this.collisionMap && this.collisionMap[y] && this.collisionMap[y][x] > 0) {
                    this.resolveCollision(x, y, axis, this.collisionMap[y][x]);
                }
                
                for (let l = 0; l < this.layers.length; l++) {
                    if (!this.layers[l] || !this.layers[l][y]) continue;
                    const tile = this.layers[l][y][x];
                    if (tile === TILES.COIN) {
                        this.layers[l][y][x] = TILES.EMPTY;
                    } else if (tile === TILES.FINISH) {
                        alert("You Win!");
                        this.stop();
                    } else if (tile === TILES.ENEMY) {
                        this.findPlayerStart();
                    }
                }
            }
        }
    }
};

// Riguel Collision
Game.prototype.resolveCollision = function(tileX, tileY, axis, type = COLLISION_TYPES.FULL) {
    let tileRect = {
        x: tileX * this.tileSize,
        y: tileY * this.tileSize,
        width: this.tileSize,
        height: this.tileSize
    };

    const half = this.tileSize / 2;

    switch(type) {
        case COLLISION_TYPES.HALF_TOP:
            tileRect.height = half;
            break;
        case COLLISION_TYPES.HALF_BOTTOM:
            tileRect.y += half;
            tileRect.height = half;
            break;
        case COLLISION_TYPES.HALF_LEFT:
            tileRect.width = half;
            break;
        case COLLISION_TYPES.HALF_RIGHT:
            tileRect.x += half;
            tileRect.width = half;
            break;
        case COLLISION_TYPES.QUARTER_TL:
            tileRect.width = half;
            tileRect.height = half;
            break;
        case COLLISION_TYPES.QUARTER_TR:
            tileRect.x += half;
            tileRect.width = half;
            tileRect.height = half;
            break;
        case COLLISION_TYPES.QUARTER_BL:
            tileRect.y += half;
            tileRect.width = half;
            tileRect.height = half;
            break;
        case COLLISION_TYPES.QUARTER_BR:
            tileRect.x += half;
            tileRect.y += half;
            tileRect.width = half;
            tileRect.height = half;
            break;
        case COLLISION_TYPES.THIRD_TOP:
            tileRect.height = this.tileSize / 3;
            break;
        case COLLISION_TYPES.THIRD_BOTTOM:
            tileRect.y += (this.tileSize * 2/3);
            tileRect.height = this.tileSize / 3;
            break;
        case COLLISION_TYPES.THIRD_LEFT:
            tileRect.width = this.tileSize / 3;
            break;
        case COLLISION_TYPES.THIRD_RIGHT:
            tileRect.x += (this.tileSize * 2/3);
            tileRect.width = this.tileSize / 3;
            break;
    }

    if (this.player.x < tileRect.x + tileRect.width &&
        this.player.x + this.player.width > tileRect.x &&
        this.player.y < tileRect.y + tileRect.height &&
        this.player.y + this.player.height > tileRect.y) {
        
        const overlapX = Math.min(this.player.x + this.player.width, tileRect.x + tileRect.width) - Math.max(this.player.x, tileRect.x);
        const overlapY = Math.min(this.player.y + this.player.height, tileRect.y + tileRect.height) - Math.max(this.player.y, tileRect.y);
        
        const threshold = Math.min(6, this.tileSize / 4);
        if (axis === 'x' && overlapY < threshold) return; 
        if (axis === 'y' && overlapX < threshold) return;

        if (axis === 'x') {
            const playerCenter = this.player.x + this.player.width / 2;
            const tileCenter = tileRect.x + tileRect.width / 2;
            
            if (this.player.vx > 0 && playerCenter < tileCenter) {
                this.player.x = tileRect.x - this.player.width - 0.01;
                this.player.vx = 0;
                if (this.audioManager) this.audioManager.playSFX('bump');
            } else if (this.player.vx < 0 && playerCenter > tileCenter) {
                this.player.x = tileRect.x + tileRect.width + 0.01;
                this.player.vx = 0;
                if (this.audioManager) this.audioManager.playSFX('bump');
            }
        } else {
            const playerCenter = this.player.y + this.player.height / 2;
            const tileCenter = tileRect.y + tileRect.height / 2;

            if (this.player.vy > 0 && playerCenter < tileCenter) {
                this.player.y = tileRect.y - this.player.height - 0.01;
                this.player.vy = 0;
                if (this.audioManager) this.audioManager.playSFX('bump');
            } else if (this.player.vy < 0 && playerCenter > tileCenter) {
                this.player.y = tileRect.y + tileRect.height + 0.01;
                this.player.vy = 0;
                if (this.audioManager) this.audioManager.playSFX('bump');
            }
        }
    }
};

// Check interactions
Game.prototype.checkInteractions = function() {
    const p = this.player;
    const cx = p.x + p.width / 2;
    const cy = p.y + p.height / 2;
    
    const reach = this.tileSize * 1.2;
    const sensorWidth = this.tileSize * 0.8;
    
    let sensorX = cx, sensorY = cy, sensorW = 0, sensorH = 0;

    if (p.facing === 'left') { sensorX = cx - reach; sensorY = cy - sensorWidth/2; sensorW = reach; sensorH = sensorWidth; }
    else if (p.facing === 'right') { sensorX = cx; sensorY = cy - sensorWidth/2; sensorW = reach; sensorH = sensorWidth; }
    else if (p.facing === 'up') { sensorX = cx - sensorWidth/2; sensorY = cy - reach; sensorW = sensorWidth; sensorH = reach; }
    else if (p.facing === 'down') { sensorX = cx - sensorWidth/2; sensorY = cy; sensorW = sensorWidth; sensorH = reach; }

    const startTileX = Math.floor(sensorX / this.tileSize);
    const endTileX = Math.floor((sensorX + sensorW) / this.tileSize);
    const startTileY = Math.floor(sensorY / this.tileSize);
    const endTileY = Math.floor((sensorY + sensorH) / this.tileSize);

    let foundDialogue = null;

    const currentTileX = Math.floor(cx / this.tileSize);
    const currentTileY = Math.floor(cy / this.tileSize);
    if (this.dialogues[`${currentTileX},${currentTileY}`]) {
        foundDialogue = this.dialogues[`${currentTileX},${currentTileY}`];
    }

    if (!foundDialogue) {
        for (let y = startTileY; y <= endTileY; y++) {
            for (let x = startTileX; x <= endTileX; x++) {
                const key = `${x},${y}`;
                if (this.dialogues[key]) {
                    foundDialogue = this.dialogues[key];
                    break;
                }
            }
            if (foundDialogue) break;
        }
    }
    
    if (foundDialogue) {
        this.nearbyDialogue = foundDialogue;
        if (this.interactionPrompt && this.interactionPrompt.classList.contains('d-none')) {
            this.interactionPrompt.classList.remove('d-none');
        }
    } else {
        this.nearbyDialogue = null;
        if (this.interactionPrompt && !this.interactionPrompt.classList.contains('d-none')) {
            this.interactionPrompt.classList.add('d-none');
        }
    }
};
