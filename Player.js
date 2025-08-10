class Player {
    constructor(id, x, y, color, isIt = false, duckType = 'goose', name = '') {
        this.id = id;
        this.x = x;
        this.y = y;
        this.color = color;
        this.isIt = isIt;
        this.duckType = duckType;
        this.name = name || `Player${id.slice(-3)}`;
        this.gameStartTime = null;
        this.totalItTime = 0;
        this.currentItStart = null;
        this.animationFrame = 0;
        this.animationTime = 0;
        this.isMoving = false;
        this.lastX = x;
        this.lastY = y;
        this.direction = 'right'; 
    }

    getCenterX() {
        return this.x + Game.PLAYER_SIZE / 2;
    }

    getCenterY() {
        return this.y + Game.PLAYER_SIZE / 2;
    }

    distanceTo(otherPlayer) {
        const dx = this.getCenterX() - otherPlayer.getCenterX();
        const dy = this.getCenterY() - otherPlayer.getCenterY();
        return Math.sqrt(dx * dx + dy * dy);
    }

    setGameStart() {
        this.gameStartTime = Date.now();
        this.totalItTime = 0;
        this.currentItStart = null;
    }

    setAsIt() {
        if (!this.isIt) {
            this.isIt = true;
            this.currentItStart = Date.now();
        }
    }

    clearIt() {
        if (this.isIt && this.currentItStart) {
            this.totalItTime += (Date.now() - this.currentItStart) / 1000;
            this.currentItStart = null;
        }
        this.isIt = false;
    }

    getTotalItTime() {
        let total = this.totalItTime;
        if (this.isIt && this.currentItStart) {
            total += (Date.now() - this.currentItStart) / 1000;
        }
        return total;
    }

    getTimeRemaining() {
        return Math.max(0, Game.IT_TIME_LIMIT - this.getTotalItTime());
    }

    updatePosition(newX, newY) {
        this.isMoving = (newX !== this.lastX || newY !== this.lastY);
        
        if (newX > this.lastX) {
            this.direction = 'right';
        } else if (newX < this.lastX) {
            this.direction = 'left';
        }
        
        this.lastX = this.x;
        this.lastY = this.y;
        this.x = newX;
        this.y = newY;
    }

    updateAnimation(deltaTime) {
        if (this.isMoving) {
            this.animationTime += deltaTime;
            if (this.animationTime >= 200) {
                this.animationFrame = (this.animationFrame + 1) % 2;
                this.animationTime = 0;
            }
        } else {
            this.animationFrame = 2;
            this.animationTime = 0;
        }
    }

    getSpriteName() {
        if (this.animationFrame === 2) {
            return `${this.duckType}_stand`;
        } else {
            return `${this.duckType}_${this.animationFrame}`;
        }
    }
}