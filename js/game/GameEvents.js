// Modir l Ahdeth
class EventManager {
    constructor(game) {
        this.game = game;
        this.events = {};
        this.lastStepX = -1;
        this.lastStepY = -1;
        this._scriptVars = {}; // persistent storage for scripts
    }

    // Build the limited runtime API exposed to event scripts
    _buildScriptAPI() {
        const game = this.game;
        const self = this;
        return {
            playSFX: (name) => game.audioManager && game.audioManager.playSFX(name),
            playBGM: (name) => game.audioManager && game.audioManager.playBGM(name),
            setTile: (x, y, tileId, layer = 0) => {
                if (!game.layers[layer] || !game.layers[layer][y]) return false;
                game.layers[layer][y][x] = tileId;
                return true;
            },
            getTile: (x, y, layer = 0) => {
                if (!game.layers[layer] || !game.layers[layer][y]) return null;
                return game.layers[layer][y][x];
            },
            teleportPlayer: (x, y) => { game.player.x = x * game.tileSize; game.player.y = y * game.tileSize; },
            spawnEntity: (type, x, y) => { if (type === 'enemy') game.entityManager.add(new Enemy(game, x * game.tileSize, y * game.tileSize)); },
            showDialogue: (text) => { this.showDialogue(text); },
            setVar: (k, v) => { self._scriptVars[k] = v; },
            getVar: (k) => self._scriptVars[k]
        };
    }

    // Chargi l Ahdeth
    loadEvents(mapData) {
        this.events = mapData.events || {};
        
        if (mapData.dialogues) {
            for (const key in mapData.dialogues) {
                if (!this.events[key]) {
                    this.events[key] = {
                        type: 'sign',
                        text: mapData.dialogues[key]
                    };
                }
            }
        }
    }

    // Tafa3ol (E)
    handleInteraction(x, y) {
        const tileX = Math.floor((x + this.game.player.width/2) / this.game.tileSize);
        const tileY = Math.floor((y + this.game.player.height/2) / this.game.tileSize);
        
        let targetX = tileX;
        let targetY = tileY;
        
        if (this.game.player.facing === 'up') targetY--;
        if (this.game.player.facing === 'down') targetY++;
        if (this.game.player.facing === 'left') targetX--;
        if (this.game.player.facing === 'right') targetX++;
        
        const key = `${targetX},${targetY}`;
        const event = this.events[key];
        
        if (event) {
            this.triggerEvent(event, targetX, targetY);
            return true;
        }
        
        const currentKey = `${tileX},${tileY}`;
        const currentEvent = this.events[currentKey];
        
        if (currentEvent) {
             this.triggerEvent(currentEvent, tileX, tileY);
             return true;
        }
        
        return false;
    }
    
    // Declencheur 5atwa
    checkStepTriggers(x, y) {
        const tileX = Math.floor((x + this.game.player.width/2) / this.game.tileSize);
        const tileY = Math.floor((y + this.game.player.height/2) / this.game.tileSize);
        
        if (tileX === this.lastStepX && tileY === this.lastStepY) return;
        
        this.lastStepX = tileX;
        this.lastStepY = tileY;
        
        const key = `${tileX},${tileY}`;
        const event = this.events[key];
        
        if (event && (event.trigger === 'step' || event.type === 'teleport')) {
            this.triggerEvent(event, tileX, tileY);
        }
    }

    // Declenchi hadeth
    triggerEvent(event, x, y) {
        switch (event.type) {
            case 'sign':
                this.showDialogue(event.text);
                break;
                
            case 'teleport':
                if (event.target) {
                    this.lastStepX = event.target.x;
                    this.lastStepY = event.target.y;
                    this.game.player.x = event.target.x * this.game.tileSize;
                    this.game.player.y = event.target.y * this.game.tileSize;
                }
                break;
                
            case 'chest':
                if (!event.opened) {
                    event.opened = true;
                    
                    if (event.openTileId !== undefined) {
                        for (let l = this.game.layers.length - 1; l >= 0; l--) {
                            if (this.game.layers[l][y][x] !== 0) {
                                this.game.layers[l][y][x] = event.openTileId;
                                break;
                            }
                        }
                    }
                    
                    this.showDialogue(`You found: ${event.item || 'Item'}!`);
                } else {
                    this.showDialogue("It's empty.");
                }
                break;
                
            case 'script':
                // Support either a pre-compiled function (event.action) or a string script (event.script).
                if (typeof event.action === 'function') {
                    try {
                        event.action(this.game);
                    } catch (err) {
                        console.error('Script event threw an error:', err);
                    }
                } else if (typeof event.script === 'string' && event.script.trim().length > 0) {
                    // compile on first use and cache
                    if (!event._compiledScript) {
                        try {
                            // function signature: (game, event, api)
                            event._compiledScript = new Function('game','event','api', event.script);
                        } catch (err) {
                            console.error('Script event compile error:', err);
                            return;
                        }
                    }

                    try {
                        const api = this._buildScriptAPI();
                        event._compiledScript(this.game, event, api);
                    } catch (err) {
                        console.error('Script event runtime error:', err);
                    }
                } else {
                    console.warn('Script event has no executable action or script.');
                }
                break;
        }
    }
    
    // Affichi dialogue
    showDialogue(text) {
        const dialogueBox = document.getElementById('game-dialogue-box');
        const dialogueText = document.getElementById('game-dialogue-text');
        const prompt = document.getElementById('game-interaction-prompt');
        
        if (dialogueBox && dialogueText) {
            this.game.activeDialoguePages = [text];
            this.game.activeDialogueIndex = 0;
            dialogueText.textContent = text;
            dialogueBox.classList.remove('d-none');
            if (prompt) prompt.classList.add('d-none');
            this.game.running = false;
        } else {
            alert(text);
        }
    }
}
