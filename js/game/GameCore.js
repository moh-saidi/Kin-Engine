// Jeu
class Game {
    constructor(mapData, tileImages = {}) {
        this.mapData = mapData;
        this.tileSize = mapData.tileSize || 32;
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        if (Array.isArray(mapData)) {
            this.layers = [JSON.parse(JSON.stringify(mapData))];
            this.collisionMap = [];
        } else {
            if (mapData && mapData.layers && Array.isArray(mapData.layers)) {
                this.layers = JSON.parse(JSON.stringify(mapData.layers));
            } else if (mapData && mapData.map && Array.isArray(mapData.map)) {
                this.layers = [JSON.parse(JSON.stringify(mapData.map))];
            } else {
                this.layers = [];
            }
            
            if (mapData && mapData.collisions) {
                this.collisionMap = JSON.parse(JSON.stringify(mapData.collisions));
            } else {
                this.collisionMap = [];
            }
        }
        
        if (this.layers.length > 0 && this.layers[0] && this.layers[0].length > 0 && this.layers[0][0] && Array.isArray(this.layers[0][0])) {
            this.mapWidth = this.layers[0][0].length;
            this.mapHeight = this.layers[0].length;
        } else {
            this.mapWidth = 100;
            this.mapHeight = 20;
            if (this.layers.length === 0) {
                this.layers.push(Array(20).fill().map(() => Array(100).fill(TILES.EMPTY)));
            }
        }

        this.tileImages = tileImages;
        this.running = false;
        this.time = 0;
        
        this.audioManager = window.audioManager;
        this.mapBGM = mapData.mapBGM || "";
        this.soundTriggers = mapData.soundTriggers || {};
        this.lastTileX = -1;
        this.lastTileY = -1;

        this.playerAnimations = {
            idle: { frames: [], speed: 10 },
            down: { frames: [], speed: 10 },
            up: { frames: [], speed: 10 },
            left: { frames: [], speed: 10 },
            right: { frames: [], speed: 10 }
        };
        if (mapData.playerAnimations) {
            const anims = mapData.playerAnimations;
            for (const key in anims) {
                if (Array.isArray(anims[key])) this.playerAnimations[key] = { frames: anims[key], speed: 10 };
                else this.playerAnimations[key] = anims[key];
            }
        }

        this.animatedTiles = mapData.animatedTiles || {};

        this.dialogues = mapData.dialogues || {};
        this.activeDialoguePages = null;
        this.activeDialogueIndex = 0;
        this.nearbyDialogue = null;

        this.controls = mapData.controls || {
            up: ['ArrowUp', 'KeyW'],
            down: ['ArrowDown', 'KeyS'],
            left: ['ArrowLeft', 'KeyA'],
            right: ['ArrowRight', 'KeyD']
        };

        this.player = {
            x: 50,
            y: 50,
            width: (mapData.playerSize && mapData.playerSize.width) ? mapData.playerSize.width : 20,
            height: (mapData.playerSize && mapData.playerSize.height) ? mapData.playerSize.height : 20,
            spriteWidth: (mapData.playerSpriteSize && mapData.playerSpriteSize.width) ? mapData.playerSpriteSize.width : 20,
            spriteHeight: (mapData.playerSpriteSize && mapData.playerSpriteSize.height) ? mapData.playerSpriteSize.height : 20,
            useCustomSpriteSize: mapData.useCustomSpriteSize || false,
            animSpeed: mapData.playerAnimSpeed || 10,
            vx: 0,
            vy: 0,
            speed: this.tileSize / 8,
            state: 'idle',
            facing: 'down',
            animFrame: 0,
            animTimer: 0
        };

        this.friction = 0.8;
        this.activeKeys = {};
        this.interactionPrompt = document.getElementById('game-interaction-prompt');

        this.findPlayerStart();

        this.handleInput = this.handleInput.bind(this);
        this.update = this.update.bind(this);
        this.draw = this.draw.bind(this);
        this.loop = this.loop.bind(this);
        this.handleInteraction = this.handleInteraction.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        
        this.setupInputListeners();

        document.getElementById('btn-restart').onclick = () => {
            if (Array.isArray(mapData)) {
                this.layers = [JSON.parse(JSON.stringify(mapData))];
            } else {
                if (mapData.layers) {
                    this.layers = JSON.parse(JSON.stringify(mapData.layers));
                } else {
                    this.layers = [JSON.parse(JSON.stringify(mapData.map))];
                }
                this.collisionMap = JSON.parse(JSON.stringify(mapData.collisions));
            }
            
            this.findPlayerStart();
            this.player.vx = 0;
            this.player.vy = 0;
            this.canvas.focus();
        };

        // Tahakkoum Camera
        this.camOffsetX = 0;
        this.camOffsetY = 0;
        this.zoom = 1.0;
        this.zoomStep = 0.1;

        // Bda Systems
        this.entityManager = new EntityManager(this);
        this.eventManager = new EventManager(this);
        this.eventManager.loadEvents(mapData);
        this.scanForEntities();
    }

    scanForEntities() {
        const ENTITY_TILES = { [TILES.ENEMY]: 'enemy' };

        for (let l = 0; l < this.layers.length; l++) {
            const layer = this.layers[l];
            if (!layer) continue;
            for (let y = 0; y < this.mapHeight; y++) {
                if (!layer[y]) continue;
                for (let x = 0; x < this.mapWidth; x++) {
                    const tile = layer[y][x];
                    if (typeof tile === 'undefined') continue;
                    if (ENTITY_TILES[tile]) {
                        if (ENTITY_TILES[tile] === 'enemy') {
                            this.entityManager.add(new Enemy(this, x * this.tileSize, y * this.tileSize));
                        }
                        layer[y][x] = TILES.EMPTY;
                    }
                }
            }
        }
    }

    setupInputListeners() {
        window.addEventListener('keydown', this.handleInteraction);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('blur', this.handleBlur);
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);
    }

    removeInputListeners() {
        window.removeEventListener('keydown', this.handleInteraction);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('blur', this.handleBlur);
    }

    handleKeyDown(e) { this.activeKeys[e.code] = true; }
    handleKeyUp(e) { this.activeKeys[e.code] = false; }
    handleBlur() { this.activeKeys = {}; }

    findPlayerStart() {
        if (this.mapData && this.mapData.playerSpawn) {
            this.player.x = this.mapData.playerSpawn.x * this.tileSize + (this.tileSize - this.player.width)/2;
            this.player.y = this.mapData.playerSpawn.y * this.tileSize + (this.tileSize - this.player.height)/2;
            return;
        }

        let found = false;
        for (let l = 0; l < this.layers.length; l++) {
            const layer = this.layers[l];
            if (!layer) continue;
            for (let y = 0; y < layer.length; y++) {
                for (let x = 0; x < layer[y].length; x++) {
                    if (layer[y][x] === TILES.PLAYER) {
                        this.player.x = x * this.tileSize + (this.tileSize - this.player.width)/2;
                        this.player.y = y * this.tileSize + (this.tileSize - this.player.height)/2;
                        layer[y][x] = TILES.EMPTY; 
                        found = true;
                    }
                }
            }
        }
        if (!found) {
            this.player.x = 100;
            this.player.y = 100;
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.loop();
        if (this.mapBGM && this.audioManager) this.audioManager.playBGM(this.mapBGM);
    }

    stop() {
        this.running = false;
        this.removeInputListeners();
        if (this.audioManager) this.audioManager.stopBGM();
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }

    update() {
        this.time += 0.01;
        this.handleInput();

        // Mise a jour Entities
        if (this.entityManager) this.entityManager.update();

        const animState = this.player.state;
        const currentAnim = this.playerAnimations[animState];
        const hasAnim = currentAnim && currentAnim.frames && currentAnim.frames.length > 0;
        
        if (hasAnim) {
            this.player.animTimer++;
            const speed = currentAnim.speed || 10;
            if (this.player.animTimer > speed) {
                this.player.animFrame++;
                this.player.animTimer = 0;
            }
        } else {
            this.player.animFrame = 0;
        }

        this.player.vx *= this.friction;
        this.player.vy *= this.friction;

        this.player.x += this.player.vx;
        this.checkCollision('x');

        this.player.y += this.player.vy;
        this.checkCollision('y');
        
        this.checkInteractions();
        this.checkSoundTriggers();
        
        // Chouf Event Triggers (5atwa)
        if (this.eventManager) {
            this.eventManager.checkStepTriggers(this.player.x, this.player.y);
        }

        if(this.player.x < 0) this.player.x = 0;
        if(this.player.y < 0) this.player.y = 0;
        if(this.player.x > this.mapWidth * this.tileSize - this.player.width) this.player.x = this.mapWidth * this.tileSize - this.player.width;
        if(this.player.y > this.mapHeight * this.tileSize - this.player.height) this.player.y = this.mapHeight * this.tileSize - this.player.height;
    }

    checkSoundTriggers() {
        const tileX = Math.floor((this.player.x + this.player.width / 2) / this.tileSize);
        const tileY = Math.floor((this.player.y + this.player.height / 2) / this.tileSize);

        if (tileX !== this.lastTileX || tileY !== this.lastTileY) {
            this.lastTileX = tileX;
            this.lastTileY = tileY;
            
            const key = `${tileX},${tileY}`;
            if (this.soundTriggers && this.soundTriggers[key]) {
                const soundName = this.soundTriggers[key];
                if (this.audioManager) {
                    this.audioManager.playSFX(soundName);
                }
            }
        }
    }
}
