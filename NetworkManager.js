class NetworkManager {
    constructor(game) {
        this.game = game;
        this.ws = null;
    }

    connect() {
        // Use dynamic WebSocket URL for deployment
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => this.onOpen();
        this.ws.onmessage = (event) => this.onMessage(event);
        this.ws.onclose = () => this.onClose();
        this.ws.onerror = () => this.onError();
    }

    onOpen() {
        this.game.ui.setStatus('Connected! Waiting for players...', 'green');
        
        const myId = Date.now().toString();
        this.game.setMyId(myId);
        
        const initialData = {
            type: 'playerJoin',
            id: myId,
            x: Math.random() * (this.game.canvas.width - Game.PLAYER_SIZE - 200) + 100,
            y: Math.random() * (this.game.canvas.height - Game.PLAYER_SIZE - 300) + 200,
            color: this.getRandomColor(),
            duckType: this.game.selectedDuckType || 'goose',
            name: this.game.selectedName || 'Player',
            isIt: false
        };
        
        this.game.addPlayer(new Player(initialData.id, initialData.x, initialData.y, initialData.color, initialData.isIt, initialData.duckType, initialData.name));
        this.send(initialData);
    }

    async onMessage(event) {
        try {
            let messageData = event.data;
            if (messageData instanceof Blob) {
                messageData = await messageData.text();
            }
            
            const data = JSON.parse(messageData);
            console.log('Received message:', data);
            this.handleMessage(data);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    onClose() {
        this.game.ui.setStatus('Disconnected. Refresh to reconnect.', 'red');
    }

    onError() {
        this.game.ui.setStatus('Connection error. Please refresh.', 'red');
    }

    handleMessage(data) {
        switch(data.type) {
            case 'playerJoin':
                this.game.addPlayer(new Player(data.id, data.x, data.y, data.color, data.isIt, data.duckType, data.name));
                this.game.updateLobbyStatus();
                
                if (data.id !== this.game.myId && this.game.myId && this.game.hasPlayer(this.game.myId)) {
                    const myPlayer = this.game.getPlayer(this.game.myId);
                    this.send({
                        type: 'playerData',
                        id: myPlayer.id,
                        x: myPlayer.x,
                        y: myPlayer.y,
                        color: myPlayer.color,
                        duckType: myPlayer.duckType,
                        name: myPlayer.name,
                        isIt: myPlayer.isIt,
                        totalItTime: myPlayer.totalItTime,
                        currentItStart: myPlayer.currentItStart,
                        gameStartTime: myPlayer.gameStartTime,
                        direction: myPlayer.direction,
                        animationFrame: myPlayer.animationFrame,
                        isMoving: myPlayer.isMoving
                    });
                }
                break;
                
            case 'playerData':
                if (data.id !== this.game.myId) {
                    const player = new Player(data.id, data.x, data.y, data.color, data.isIt, data.duckType, data.name);
                    player.totalItTime = data.totalItTime || 0;
                    player.currentItStart = data.currentItStart;
                    player.gameStartTime = data.gameStartTime;
                    player.direction = data.direction || 'right';
                    player.animationFrame = data.animationFrame || 2;
                    player.isMoving = data.isMoving || false;
                    this.game.addPlayer(player);
                    this.game.updateLobbyStatus();
                }
                break;
                
            case 'gameStart':
                console.log('Game start received:', data);
                this.game.startGame(data.hostId);
                break;
                
            case 'playerMove':
                if (this.game.gameStarted && this.game.hasPlayer(data.id)) {
                    const player = this.game.getPlayer(data.id);
                    player.updatePosition(data.x, data.y);
                    if (data.direction) {
                        player.direction = data.direction;
                    }
                    if (data.animationFrame !== undefined) {
                        player.animationFrame = data.animationFrame;
                    }
                    if (data.isMoving !== undefined) {
                        player.isMoving = data.isMoving;
                    }
                }
                break;
                
            case 'playerTag':
                if (this.game.gameStarted) {
                    this.game.handleTag(data.newIt, data.oldIt, data.timestamp);
                }
                break;
                
            case 'playerLeave':
                this.game.removePlayer(data.id);
                this.game.updateLobbyStatus();
                
                if (!this.game.gameStarted && this.game.getPlayerCount() < Game.MIN_PLAYERS) {
                    this.game.ui.hideStartButton();
                }
                break;
                
            case 'playerDeath':
                this.game.handlePlayerDeath(data);
                break;
                
            case 'gameWinner':
                this.game.handleGameWin(data.winnerId);
                break;
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getRandomDuckType() {
        const duckTypes = ['goose', 'duck', 'mallard'];
        return duckTypes[Math.floor(Math.random() * duckTypes.length)];
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}