class Renderer {
    constructor(canvas, ctx, assetLoader) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.assetLoader = assetLoader;
    }

    clear() {
        // Use grass background if loaded, otherwise fallback to solid color
        if (this.assetLoader.loaded && this.assetLoader.getBackground()) {
            this.ctx.drawImage(this.assetLoader.getBackground(), 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#2C3E50';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw river spanning full width
        if (this.assetLoader.loaded && this.assetLoader.getRiver()) {
            const river = this.assetLoader.getRiver();
            const riverWidth = this.canvas.width + 200; // Full canvas width
            const riverHeight = riverWidth * (river.height / river.width); // Maintain aspect ratio
            const riverX = -100; // Start from left edge
            const riverY = (this.canvas.height - riverHeight) / 2; // Center vertically
            
            this.ctx.drawImage(river, riverX, riverY, riverWidth, riverHeight);
        }
    }

    renderLobby(players, myId) {
        let yOffset = 220;
        players.forEach((player, id) => {
            if (this.assetLoader && this.assetLoader.loaded) {
                const spriteName = `${player.duckType}_stand`;
                const sprite = this.assetLoader.getSprite(spriteName);
                
                if (sprite) {
                    const spriteSize = 100; 
                    const spriteX = this.canvas.width / 2 - 175 - spriteSize/2;
                    const spriteY = yOffset - spriteSize/2;
                    
                    this.ctx.drawImage(sprite, spriteX, spriteY, spriteSize, spriteSize);
                } else {
                    // Fallback to colored circle if sprite doesn't load
                    this.ctx.fillStyle = player.color;
                    this.ctx.beginPath();
                    this.ctx.arc(this.canvas.width / 2 - 150, yOffset, 15, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else {
                // Fallback to colored circle while assets are loading
                this.ctx.fillStyle = player.color;
                this.ctx.beginPath();
                this.ctx.arc(this.canvas.width / 2 - 150, yOffset, 15, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'left';
            const displayName = id === myId ? `${player.name} (YOU)` : player.name;
            this.ctx.fillText(displayName, this.canvas.width / 2 - 120, yOffset + 6);
            
            yOffset += 100;
        });
    }

    renderDeathMarkers(deathMarkers) {
        deathMarkers.forEach(marker => {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(marker.x, marker.y, 20, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = 'darkred';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(marker.x - 8, marker.y);
            this.ctx.lineTo(marker.x + 8, marker.y);
            this.ctx.moveTo(marker.x, marker.y - 8);
            this.ctx.lineTo(marker.x, marker.y + 8);
            this.ctx.stroke();
        });
    }

    renderPlayers(players, myId, gameStarted) {
        players.forEach((player, id) => {
            const centerX = player.getCenterX();
            const centerY = player.getCenterY();
            
            if (player.isIt && id === myId) {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, Game.PLAYER_SIZE, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.drawPlayer(player);
            
            if (gameStarted && player.gameStartTime) {
                const timeRemaining = player.getTimeRemaining();
                
                let timerColor;
                if (player.isIt) {
                    timerColor = timeRemaining <= 5 ? 'red' : 'orange';
                } else {
                    timerColor = timeRemaining <= 5 ? 'darkred' : 'lightgray';
                }
                
                this.ctx.fillStyle = timerColor;
                this.ctx.font = player.isIt ? 'bold 16px Arial' : '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`${Math.ceil(timeRemaining)}s`, centerX, player.y - 10);
            }
            
            // Show player name instead of ID
            this.ctx.fillStyle = 'white';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            const displayName = id === myId ? `${player.name} (YOU)` : player.name;
            this.ctx.fillText(displayName, centerX, player.y + Game.PLAYER_SIZE + 15);
        });
    }

    drawPlayer(player) {
        if (this.assetLoader.loaded) {
            const spriteName = player.getSpriteName();
            const sprite = this.assetLoader.getSprite(spriteName);
            
            if (sprite) {
                this.ctx.save();
                
                if (player.direction === 'left') {
                    this.ctx.scale(-1, 1);
                    this.ctx.drawImage(sprite, -(player.x + Game.PLAYER_SIZE), player.y, Game.PLAYER_SIZE, Game.PLAYER_SIZE);
                } else {
                    this.ctx.drawImage(sprite, player.x, player.y, Game.PLAYER_SIZE, Game.PLAYER_SIZE);
                }
                
                this.ctx.restore();
                
                if (player.isIt) {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    this.ctx.strokeStyle = 'black';
                    this.ctx.lineWidth = 2;
                    this.ctx.font = 'bold 14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.strokeText('IT', player.getCenterX(), player.y - 25);
                    this.ctx.fillText('IT', player.getCenterX(), player.y - 25);
                }
                return;
            }
        }
        
        // Fallback to colored circle if sprites don't load
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(player.getCenterX(), player.getCenterY(), Game.PLAYER_SIZE / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (player.isIt) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('IT', player.getCenterX(), player.y - 5);
        }
    }
}