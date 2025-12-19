// Input joueur
Game.prototype.handleInput = function() {
    let moving = false;

    const isPressed = (action) => {
        return this.controls[action].some(key => this.activeKeys[key]);
    };

    const accel = this.player.speed * 0.25;

    if (isPressed('right')) {
        this.player.vx += accel;
        this.player.facing = 'right';
        moving = true;
    }
    if (isPressed('left')) {
        this.player.vx -= accel;
        this.player.facing = 'left';
        moving = true;
    }

    if (isPressed('down')) {
        this.player.vy += accel;
        this.player.facing = 'down';
        moving = true;
    }
    if (isPressed('up')) {
        this.player.vy -= accel;
        this.player.facing = 'up';
        moving = true;
    }

    if (moving) {
        this.player.state = this.player.facing;
        
        if (this.audioManager) {
            if (!this.player.stepTimer) this.player.stepTimer = 0;
            this.player.stepTimer++;
            if (this.player.stepTimer > 20) {
                if (this.audioManager.sounds['step']) this.audioManager.playSFX('step');
                else if (this.audioManager.sounds['footstep']) this.audioManager.playSFX('footstep');
                
                this.player.stepTimer = 0;
            }
        }
    } else {
        this.player.state = 'idle';
        this.player.stepTimer = 20;
    }

    const currentSpeed = Math.sqrt(this.player.vx * this.player.vx + this.player.vy * this.player.vy);
    if (currentSpeed > this.player.speed) {
        const ratio = this.player.speed / currentSpeed;
        this.player.vx *= ratio;
        this.player.vy *= ratio;
    }
};

// Tafa3olat
Game.prototype.handleInteraction = function(e) {
    // Tahakkoum Zoom
    if (e.code === 'Equal' || e.code === 'NumpadAdd') { // +
        this.zoom = Math.min(2.0, this.zoom + (this.zoomStep || 0.1));
    }
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') { // -
        this.zoom = Math.max(0.5, this.zoom - (this.zoomStep || 0.1));
    }
    if (e.code === 'Digit0' || e.code === 'Numpad0') {
        this.zoom = 1.0;
    }
    if (e.code === 'Space' || e.code === 'KeyE') {
        if (this.activeDialoguePages) {
            this.activeDialogueIndex++;
            if (this.activeDialogueIndex < this.activeDialoguePages.length) {
                document.getElementById('game-dialogue-text').textContent = this.activeDialoguePages[this.activeDialogueIndex];
            } else {
                this.activeDialoguePages = null;
                this.activeDialogueIndex = 0;
                document.getElementById('game-dialogue-box').classList.add('d-none');
                this.running = true;
                this.loop();
            }
            return;
        }
        
        // Chouf Event Manager (Chests, Signs, etc)
        if (this.eventManager && this.eventManager.handleInteraction(this.player.x, this.player.y)) {
            return;
        }

        // Chouf Tafa3ol Entity
        if (this.entityManager) {
            // Define interaction rect in front of player
            let ix = this.player.x;
            let iy = this.player.y;
            const range = this.tileSize;
            
            if (this.player.facing === 'up') iy -= range;
            if (this.player.facing === 'down') iy += range;
            if (this.player.facing === 'left') ix -= range;
            if (this.player.facing === 'right') ix += range;
            
            if (this.entityManager.checkInteraction({x: ix, y: iy, width: this.player.width, height: this.player.height})) {
                return;
            }
        }

        if (this.nearbyDialogue) {
            this.activeDialoguePages = this.nearbyDialogue.split('|');
            this.activeDialogueIndex = 0;
            document.getElementById('game-dialogue-text').textContent = this.activeDialoguePages[0];
            document.getElementById('game-dialogue-box').classList.remove('d-none');
            document.getElementById('game-interaction-prompt').classList.add('d-none');
            this.running = false;
        }
    }
};

// Mouse drag panning
Game.prototype.handleMouseDown = function(e) {
    if (e.button === 1) {
        this._panStart = { x: e.clientX, y: e.clientY };
        this._camStart = { x: this.camOffsetX || 0, y: this.camOffsetY || 0 };
        e.preventDefault();
    }
};
Game.prototype.handleMouseMove = function(e) {
    if (this._panStart) {
        const dx = (e.clientX - this._panStart.x) / (this.zoom || 1.0);
        const dy = (e.clientY - this._panStart.y) / (this.zoom || 1.0);
        this.camOffsetX = this._camStart.x + dx;
        this.camOffsetY = this._camStart.y + dy;
    }
};
Game.prototype.handleMouseUp = function(e) {
    if (this._panStart) {
        this._panStart = null;
    }
};
