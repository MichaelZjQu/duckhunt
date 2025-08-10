class UIManager {
    constructor(canvas, ctx, assetLoader) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.assetLoader = assetLoader;
        this.status = 'Connecting...';
        this.statusColor = 'orange';
        this.showLobby = false;
        this.playerCount = 0;
        this.minPlayers = 3;
        this.hostMessage = '';
        this.showButton = false;
        this.buttonHovered = false;
        this.showWinner = false;
        this.winnerMessage = '';
        this.gameStarted = false;
        
        // Character selection
        this.showCharacterSelect = true;
        this.selectedDuck = 'goose';
        this.playerName = '';
        this.nameInput = '';
        this.isTyping = false;
        this.characterOptions = ['goose', 'duck', 'mallard'];
        this.hoveredCharacter = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (this.showCharacterSelect) {
                // Check character selection boxes
                this.characterOptions.forEach((duckType, index) => {
                    const boxX = this.canvas.width / 2 - 150 + (index * 100);
                    const boxY = 300;
                    const boxSize = 80;
                    
                    if (x >= boxX && x <= boxX + boxSize && y >= boxY && y <= boxY + boxSize) {
                        this.selectedDuck = duckType;
                    }
                });
                
                // Check name input area
                const nameInputX = this.canvas.width / 2 - 100;
                const nameInputY = 220;
                const nameInputWidth = 200;
                const nameInputHeight = 30;
                
                if (x >= nameInputX && x <= nameInputX + nameInputWidth && 
                    y >= nameInputY && y <= nameInputY + nameInputHeight) {
                    this.isTyping = true;
                    this.canvas.style.cursor = 'text';
                } else {
                    this.isTyping = false;
                    this.canvas.style.cursor = 'default';
                }
                
                // Check confirm button
                const confirmX = this.canvas.width / 2 - 60;
                const confirmY = 450;
                const confirmWidth = 120;
                const confirmHeight = 40;
                
                if (x >= confirmX && x <= confirmX + confirmWidth && 
                    y >= confirmY && y <= confirmY + confirmHeight && 
                    this.nameInput.trim().length > 0) {
                    this.confirmSelection();
                }
            } else if (this.showButton) {
                // Start game button
                const buttonX = this.canvas.width / 2 - 100;
                const buttonY = 550;
                const buttonWidth = 200;
                const buttonHeight = 50;
                
                if (x >= buttonX && x <= buttonX + buttonWidth && 
                    y >= buttonY && y <= buttonY + buttonHeight) {
                    this.onStartClick();
                }
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (this.showCharacterSelect) {
                // Check character hover
                this.hoveredCharacter = null;
                this.characterOptions.forEach((duckType, index) => {
                    const boxX = this.canvas.width / 2 - 150 + (index * 100);
                    const boxY = 300;
                    const boxSize = 80;
                    
                    if (x >= boxX && x <= boxX + boxSize && y >= boxY && y <= boxY + boxSize) {
                        this.hoveredCharacter = duckType;
                    }
                });
                
                this.canvas.style.cursor = this.hoveredCharacter ? 'pointer' : 'default';
            } else if (this.showButton) {
                const buttonX = this.canvas.width / 2 - 100;
                const buttonY = 550;
                const buttonWidth = 200;
                const buttonHeight = 50;
                
                this.buttonHovered = (x >= buttonX && x <= buttonX + buttonWidth && 
                                    y >= buttonY && y <= buttonY + buttonHeight);
                this.canvas.style.cursor = this.buttonHovered ? 'pointer' : 'default';
            } else {
                this.canvas.style.cursor = 'default';
            }
        });

        // Keyboard input for name
        document.addEventListener('keydown', (e) => {
            if (this.showCharacterSelect && this.isTyping) {
                if (e.key === 'Backspace') {
                    this.nameInput = this.nameInput.slice(0, -1);
                } else if (e.key === 'Enter' && this.nameInput.trim().length > 0) {
                    this.confirmSelection();
                } else if (e.key.length === 1 && this.nameInput.length < 12) {
                    this.nameInput += e.key;
                }
                e.preventDefault();
            }
        });
    }

    confirmSelection() {
        this.playerName = this.nameInput.trim();
        this.showCharacterSelect = false;
        this.isTyping = false;
        
        // Notify game that selection is complete
        if (this.onSelectionComplete) {
            this.onSelectionComplete(this.selectedDuck, this.playerName);
        }
    }

    setSelectionCallback(callback) {
        this.onSelectionComplete = callback;
    }

    getSelectedDuck() {
        return this.selectedDuck;
    }

    getPlayerName() {
        return this.playerName;
    }

    setStatus(text, color) {
        this.status = text;
        this.statusColor = color;
    }

    setGameStarted(started) {
        this.gameStarted = started;
    }

    showLobbyInfo() {
        this.showLobby = true;
    }

    hideLobbyInfo() {
        this.showLobby = false;
    }

    setPlayerCount(current, max) {
        this.playerCount = current;
        this.minPlayers = max;
    }

    setHostMessage(message) {
        this.hostMessage = message;
    }

    showStartButton() {
        this.showButton = true;
    }

    hideStartButton() {
        this.showButton = false;
    }

    setStartButtonCallback(callback) {
        this.onStartClick = callback;
    }

    showWinnerScreen(winnerId, winnerName) {
        this.showWinner = true;
        this.winnerMessage = `${winnerName || `Player ${winnerId.slice(-3)}`} Wins!`;
    }

    hideWinnerScreen() {
        this.showWinner = false;
        this.winnerMessage = '';
    }

    renderUI() {
        // Winner screen overlay
        if (this.showWinner) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 72px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🏆 WINNER! 🏆', this.canvas.width / 2, this.canvas.height / 2 - 80);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.fillText(this.winnerMessage, this.canvas.width / 2, this.canvas.height / 2 - 10);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Game will restart in a few seconds...', this.canvas.width / 2, this.canvas.height / 2 + 40);
            return;
        }

        // Character selection screen
        if (this.showCharacterSelect) {
            // Title
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Duck Hunt', this.canvas.width / 2, 60);

            // Status
            this.ctx.fillStyle = this.statusColor;
            this.ctx.font = '24px Arial';
            this.ctx.fillText(this.status, this.canvas.width / 2, 100);

            // Name input
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Enter your name:', this.canvas.width / 2, 200);

            // Name input box
            const nameInputX = this.canvas.width / 2 - 100;
            const nameInputY = 220;
            const nameInputWidth = 200;
            const nameInputHeight = 30;

            this.ctx.fillStyle = this.isTyping ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)';
            this.ctx.fillRect(nameInputX, nameInputY, nameInputWidth, nameInputHeight);
            
            this.ctx.strokeStyle = this.isTyping ? '#3498db' : 'white';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(nameInputX, nameInputY, nameInputWidth, nameInputHeight);

            this.ctx.fillStyle = 'black';
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'left';
            const displayText = this.nameInput || (this.isTyping ? '|' : 'Click to type...');
            this.ctx.fillText(displayText, nameInputX + 10, nameInputY + 22);

            // Character selection
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Choose your character:', this.canvas.width / 2, 280);

            // Character boxes
            this.characterOptions.forEach((duckType, index) => {
                const boxX = this.canvas.width / 2 - 150 + (index * 100);
                const boxY = 300;
                const boxSize = 80;

                // Box background
                if (this.selectedDuck === duckType) {
                    this.ctx.fillStyle = 'rgba(52, 152, 219, 0.8)';
                } else if (this.hoveredCharacter === duckType) {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                } else {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                }
                this.ctx.fillRect(boxX, boxY, boxSize, boxSize);

                // Box border
                this.ctx.strokeStyle = this.selectedDuck === duckType ? '#3498db' : 'white';
                this.ctx.lineWidth = this.selectedDuck === duckType ? 3 : 1;
                this.ctx.strokeRect(boxX, boxY, boxSize, boxSize);

                // Character name
                this.ctx.fillStyle = 'white';
                this.ctx.font = '14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(duckType.toUpperCase(), boxX + boxSize/2, boxY + boxSize + 15);

                // Character sprite preview
                if (this.assetLoader && this.assetLoader.loaded) {
                    const spriteName = `${duckType}_stand`;
                    const sprite = this.assetLoader.getSprite(spriteName);
                    
                    if (sprite) {
                        const spriteSize = 60; // Size of sprite in selection box
                        const spriteX = boxX + (boxSize - spriteSize) / 2;
                        const spriteY = boxY + (boxSize - spriteSize) / 2;
                        
                        this.ctx.drawImage(sprite, spriteX, spriteY, spriteSize, spriteSize);
                    } else {
                        // fallback
                        this.ctx.fillStyle = this.selectedDuck === duckType ? '#3498db' : '#bdc3c7';
                        this.ctx.font = '24px Arial';
                        this.ctx.fillText('🦆', boxX + boxSize/2, boxY + boxSize/2 + 8);
                    }
                } else {
                    // fallback while loading
                    this.ctx.fillStyle = this.selectedDuck === duckType ? '#3498db' : '#bdc3c7';
                    this.ctx.font = '24px Arial';
                    this.ctx.fillText('🦆', boxX + boxSize/2, boxY + boxSize/2 + 8);
                }
            });

            // Confirm button
            const confirmX = this.canvas.width / 2 - 60;
            const confirmY = 450;
            const confirmWidth = 120;
            const confirmHeight = 40;
            const canConfirm = this.nameInput.trim().length > 0;

            this.ctx.fillStyle = canConfirm ? '#27ae60' : '#7f8c8d';
            this.ctx.fillRect(confirmX, confirmY, confirmWidth, confirmHeight);
            
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(confirmX, confirmY, confirmWidth, confirmHeight);

            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CONFIRM', confirmX + confirmWidth/2, confirmY + 26);

            return;
        }

        // Only show title and status when not in game
        if (!this.gameStarted) {
            // Title
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Duck Hunt', this.canvas.width / 2, 60);

            // Status
            this.ctx.fillStyle = this.statusColor;
            this.ctx.font = '24px Arial';
            this.ctx.fillText(this.status, this.canvas.width / 2, 100);

            // Lobby info
            if (this.showLobby) {
                this.ctx.fillStyle = 'white';
                this.ctx.font = '20px Arial';
                this.ctx.fillText(`Players: ${this.playerCount}`, this.canvas.width / 2, 140);
                
                this.ctx.font = '16px Arial';
                this.ctx.fillText(this.hostMessage, this.canvas.width / 2, 170);
            }

            // Start button
            if (this.showButton) {
                const buttonX = this.canvas.width / 2 - 100;
                const buttonY = 550;
                const buttonWidth = 200;
                const buttonHeight = 50;

                this.ctx.fillStyle = this.buttonHovered ? '#27ae60' : '#2ecc71';
                this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
                
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 20px Arial';
                this.ctx.fillText('START GAME', this.canvas.width / 2, buttonY + 32);
            }

            // Instructions (only show in lobby)
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = '14px Arial';
            this.ctx.fillText('Use arrow keys to move • Tag other players • Don\'t be IT for 20 seconds or you die!', 
                             this.canvas.width / 2, this.canvas.height - 20);
        }
    }

    showSpectatorOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, 100);
        
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('💀 YOU DIED - SPECTATING 💀', this.canvas.width / 2, 35);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Watching until there\'s a winner...', this.canvas.width / 2, 65);
    }
}