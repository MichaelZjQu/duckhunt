class Game {
    static PLAYER_SIZE = 100;
    static PLAYER_SPEED = 5;
    static IT_TIME_LIMIT = 20;
    static MIN_PLAYERS = 3;

    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.players = new Map();
        this.myId = null;
        this.gameStartTime = null;
        this.isAlive = true;
        this.animationId = null;
        this.gameStarted = false;
        this.isHost = false;
        this.lastFrameTime = 0;
        this.deathMarkers = [];
        this.gameWon = false;

        this.assetLoader = new AssetLoader();
        this.ui = new UIManager(this.canvas, this.ctx, this.assetLoader);
        this.network = new NetworkManager(this);
        this.input = new InputManager(this);
        this.renderer = new Renderer(this.canvas, this.ctx, this.assetLoader);

        this.setupEventListeners();
        this.init();
    }

    setupEventListeners() {
        this.ui.setStartButtonCallback(() => this.onStartButtonClick());
        this.ui.setSelectionCallback((duckType, name) => this.onCharacterSelected(duckType, name));
        
        window.addEventListener('beforeunload', () => {
            if (this.myId) {
                this.network.send({
                    type: 'playerLeave',
                    id: this.myId
                });
            }
        });
    }

    onCharacterSelected(duckType, name) {
        // Connect to network after character selection
        this.selectedDuckType = duckType;
        this.selectedName = name;
        this.network.connect();
    }

    async init() {
        this.ui.setStatus('Loading assets...', 'orange');
        await this.assetLoader.loadAssets();
        this.ui.setStatus('Choose your character!', 'green');
        
        // Don't connect to network yet - wait for character selection
        this.gameLoop();
    }

    setMyId(id) {
        this.myId = id;
    }

    addPlayer(player) {
        this.players.set(player.id, player);
    }

    removePlayer(id) {
        this.players.delete(id);
    }

    hasPlayer(id) {
        return this.players.has(id);
    }

    getPlayer(id) {
        return this.players.get(id);
    }

    getPlayerCount() {
        return this.players.size;
    }

    addDeathMarker(x, y) {
        this.deathMarkers.push({ x, y });
    }

    onStartButtonClick() {
        console.log('Start button clicked!', this.players.size, this.isHost);
        if (this.players.size >= Game.MIN_PLAYERS && this.isHost) {
            console.log('Sending game start message');
            
            this.network.send({
                type: 'gameStart',
                hostId: this.myId
            });
            
            this.startGame(this.myId);
        }
    }

    startGame(hostId) {
        if (this.players.size >= Game.MIN_PLAYERS) {
            this.gameStarted = true;
            this.gameStartTime = Date.now();
            this.deathMarkers = [];
            this.gameWon = false;
            
            this.ui.hideLobbyInfo();
            this.ui.hideStartButton();
            this.ui.hideWinnerScreen();
            this.ui.setGameStarted(true); // Tell UI game has started
            
            this.players.forEach(player => {
                player.setGameStart();
                player.clearIt();
            });
            
            if (this.hasPlayer(hostId)) {
                this.getPlayer(hostId).setAsIt();
            }
            
            console.log('Game started successfully!');
        }
    }

    updateLobbyStatus() {
        if (!this.gameStarted) {
            const playerCount = this.players.size;
            this.ui.setPlayerCount(playerCount, Game.MIN_PLAYERS);
            this.ui.showLobbyInfo();
            
            if (playerCount < Game.MIN_PLAYERS) {
                this.ui.setStatus('Waiting for players...', 'orange');
                this.ui.hideStartButton();
                this.ui.setHostMessage(`Need ${Game.MIN_PLAYERS - playerCount} more players to start`);
                this.isHost = false;
            } else {
                this.ui.setStatus('Ready to start!', 'green');
                
                const sortedIds = Array.from(this.players.keys()).sort();
                if (sortedIds[0] === this.myId) {
                    this.isHost = true;
                    this.ui.showStartButton();
                    this.ui.setHostMessage('You are the host - click START GAME!');
                    console.log('You are now the host!');
                } else {
                    this.isHost = false;
                    this.ui.hideStartButton();
                    this.ui.setHostMessage('Waiting for host to start the game...');
                }
            }
        }
    }

    handleTag(newItId, oldItId, timestamp) {
        if (this.hasPlayer(oldItId)) {
            this.getPlayer(oldItId).clearIt();
        }
        
        if (this.hasPlayer(newItId)) {
            this.getPlayer(newItId).setAsIt();
        }
    }

    handlePlayerDeath(data) {
        if (this.hasPlayer(data.id)) {
            const deadPlayer = this.getPlayer(data.id);
            this.addDeathMarker(deadPlayer.getCenterX(), deadPlayer.getCenterY());
        }
        
        this.removePlayer(data.id);
        
        if (this.gameStarted && this.getPlayerCount() === 1) {
            const winnerId = Array.from(this.players.keys())[0];
            this.network.send({
                type: 'gameWinner',
                winnerId: winnerId
            });
            this.handleGameWin(winnerId);
            return;
        }
        
        if (this.gameStarted && this.getPlayerCount() < 2) {
            this.endGame('Not enough players left');
            return;
        }
        
        if (data.wasIt && this.getPlayerCount() > 0) {
            const alivePlayers = Array.from(this.players.keys());
            const randomPlayerId = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
            
            if (this.hasPlayer(randomPlayerId)) {
                this.getPlayer(randomPlayerId).setAsIt();
                
                this.network.send({
                    type: 'playerTag',
                    newIt: randomPlayerId,
                    oldIt: data.id,
                    timestamp: Date.now()
                });
            }
        }
    }

    handleGameWin(winnerId) {
        this.gameWon = true;
        const winner = this.getPlayer(winnerId);
        const winnerName = winner ? winner.name : null;
        this.ui.showWinnerScreen(winnerId, winnerName);
        
        setTimeout(() => {
            this.restartGame();
        }, 5000);
    }

    restartGame() {
        this.gameStarted = false;
        this.gameWon = false;
        this.isAlive = true;
        this.deathMarkers = [];
        
        this.ui.hideWinnerScreen();
        this.ui.setGameStarted(false); // Tell UI game has ended
        this.players.forEach(player => player.clearIt());
        this.updateLobbyStatus();
    }

    endGame(reason) {
        this.gameStarted = false;
        this.ui.setStatus(`Game ended: ${reason}`, 'red');
        this.ui.setGameStarted(false); // Tell UI game has ended
        
        this.players.forEach(player => player.clearIt());
        this.updateLobbyStatus();
    }

    updatePlayer() {
        if (!this.myId || !this.hasPlayer(this.myId) || !this.isAlive || !this.gameStarted || this.gameWon) return;
        
        const player = this.getPlayer(this.myId);
        let moveX = 0;
        let moveY = 0;
        
        if (this.input.isKeyPressed('ArrowUp') && player.y > 100) {
            moveY = -1;
        }
        if (this.input.isKeyPressed('ArrowDown') && player.y < this.canvas.height - Game.PLAYER_SIZE - 50) {
            moveY = 1;
        }
        if (this.input.isKeyPressed('ArrowLeft') && player.x > 0) {
            moveX = -1;
        }
        if (this.input.isKeyPressed('ArrowRight') && player.x < this.canvas.width - Game.PLAYER_SIZE) {
            moveX = 1;
        }
        
        if (moveX !== 0 && moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }
        
        const moved = moveX !== 0 || moveY !== 0;
        if (moved) {
            const newX = Math.max(0, Math.min(this.canvas.width - Game.PLAYER_SIZE, player.x + moveX * Game.PLAYER_SPEED));
            const newY = Math.max(100, Math.min(this.canvas.height - Game.PLAYER_SIZE - 50, player.y + moveY * Game.PLAYER_SPEED));
            
            player.x = newX;
            player.y = newY;
            player.updatePosition(player.x, player.y);
            
            this.network.send({
                type: 'playerMove',
                id: this.myId,
                x: player.x,
                y: player.y,
                direction: player.direction,
                animationFrame: player.animationFrame,
                isMoving: player.isMoving
            });
            
            if (player.isIt) {
                this.checkCollisions();
            }
        } else {
            player.updatePosition(player.x, player.y);
            if (player.isMoving === false && player.animationFrame === 2) {
                this.network.send({
                    type: 'playerMove',
                    id: this.myId,
                    x: player.x,
                    y: player.y,
                    direction: player.direction,
                    animationFrame: player.animationFrame,
                    isMoving: player.isMoving
                });
            }
        }
    }

    updateTimer() {
        if (!this.isAlive || !this.myId || !this.hasPlayer(this.myId) || !this.gameStarted || this.gameWon) return;
        
        const player = this.getPlayer(this.myId);
        if (player.getTimeRemaining() <= 0) {
            this.die();
        }
    }

    die() {
        this.isAlive = false;
        const player = this.getPlayer(this.myId);
        
        this.network.send({
            type: 'playerDeath',
            id: this.myId,
            x: player.getCenterX(),
            y: player.getCenterY(),
            wasIt: player.isIt
        });
        
        this.addDeathMarker(player.getCenterX(), player.getCenterY());
    }

    checkCollisions() {
        const myPlayer = this.getPlayer(this.myId);
        if (!myPlayer.isIt || !this.gameStarted || this.gameWon) return;
        
        this.players.forEach((otherPlayer, otherId) => {
            if (otherId === this.myId || otherPlayer.isIt) return;
            
            const distance = myPlayer.distanceTo(otherPlayer);
            const tagDistance = Game.PLAYER_SIZE; 
            
            if (distance < tagDistance) {
                console.log('TAG! Tagged player:', otherId);
                
                const tagTimestamp = Date.now();
                
                myPlayer.clearIt();
                otherPlayer.setAsIt();
                
                this.network.send({
                    type: 'playerTag',
                    newIt: otherId,
                    oldIt: this.myId,
                    timestamp: tagTimestamp
                });
                
                return;
            }
        });
    }

    render() {
        this.renderer.clear();
        
        this.ui.renderUI();
        
        if (this.gameWon) {
            return;
        }
        
        if (!this.gameStarted) {
            this.renderer.renderLobby(this.players, this.myId);
            return;
        }
        
        this.renderer.renderPlayers(this.players, this.myId, this.gameStarted);
        this.renderer.renderDeathMarkers(this.deathMarkers);
        
        if (!this.isAlive && this.gameStarted && !this.gameWon) {
            this.ui.showSpectatorOverlay();
        }
    }

    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        this.players.forEach(player => {
            player.updateAnimation(deltaTime);
        });
        
        this.updateTimer();
        this.updatePlayer();
        this.render();
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
}