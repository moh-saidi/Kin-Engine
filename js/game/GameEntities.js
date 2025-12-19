// Asl Entity
class Entity {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = game.tileSize;
        this.height = game.tileSize;
        this.vx = 0;
        this.vy = 0;
        this.speed = 1;
        this.isDead = false;
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 10;
        this.direction = 'down';
        this.state = 'idle';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x > this.game.mapWidth * this.game.tileSize - this.width) 
            this.x = this.game.mapWidth * this.game.tileSize - this.width;
        if (this.y > this.game.mapHeight * this.game.tileSize - this.height) 
            this.y = this.game.mapHeight * this.game.tileSize - this.height;
            
        this.updateAnimation();
    }

    updateAnimation() {
        this.animTimer++;
        if (this.animTimer > this.animSpeed) {
            this.animFrame++;
            this.animTimer = 0;
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    getRect() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
}

// 3dou (Dawriya)
class Enemy extends Entity {
    constructor(game, x, y) {
        super(game, x, y, 'enemy');
        this.speed = 0.5;
        this.patrolStart = { x, y };
        this.patrolRange = 100;
        this.movingRight = true;
        this.color = '#FF4500';
    }

    update() {
        if (this.movingRight) {
            this.vx = this.speed;
            if (this.x > this.patrolStart.x + this.patrolRange) this.movingRight = false;
        } else {
            this.vx = -this.speed;
            if (this.x < this.patrolStart.x - this.patrolRange) this.movingRight = true;
        }
        
        super.update();
        
        if (this.checkPlayerCollision()) {
            const dx = this.game.player.x - this.x;
            const dy = this.game.player.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 0) {
                this.game.player.x += (dx/dist) * 20;
                this.game.player.y += (dy/dist) * 20;
            }
        }
    }
    
    checkPlayerCollision() {
        const p = this.game.player;
        return (this.x < p.x + p.width && this.x + this.width > p.x && this.y < p.y + p.height && this.y + this.height > p.y);
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + 4, this.y + 4, 8, 8);
        ctx.fillRect(this.x + 20, this.y + 4, 8, 8);
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 6, this.y + 6, 4, 4);
        ctx.fillRect(this.x + 22, this.y + 6, 4, 4);
    }
}

// Personnage
class NPC extends Entity {
    constructor(game, x, y, dialogueId) {
        super(game, x, y, 'npc');
        this.dialogueId = dialogueId;
        this.color = '#00FF7F';
    }

    update() {
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        if (Math.abs(dx) > Math.abs(dy)) this.direction = dx > 0 ? 'right' : 'left';
        else this.direction = dy > 0 ? 'down' : 'up';
        super.update();
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('NPC', this.x + this.width/2, this.y - 5);
    }
    
    interact() {
        if (this.dialogueId) alert(this.dialogueId);
    }
}

// Modir l Entities
class EntityManager {
    constructor(game) {
        this.game = game;
        this.entities = [];
    }

    add(entity) { this.entities.push(entity); }

    update() {
        this.entities.forEach(e => e.update());
        this.entities = this.entities.filter(e => !e.isDead);
    }

    draw(ctx) {
        this.entities.sort((a, b) => a.y - b.y);
        this.entities.forEach(e => e.draw(ctx));
    }
    
    checkInteraction(interactRect) {
        for (const e of this.entities) {
            if (e.interact && 
                e.x < interactRect.x + interactRect.width &&
                e.x + e.width > interactRect.x &&
                e.y < interactRect.y + interactRect.height &&
                e.y + e.height > interactRect.y) {
                e.interact();
                return true;
            }
        }
        return false;
    }
}
