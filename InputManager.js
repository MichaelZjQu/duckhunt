class InputManager {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.game.isAlive || !this.game.gameStarted) return;
            this.keys[e.key] = true;
        });

        document.addEventListener('keyup', (e) => {
            if (!this.game.isAlive || !this.game.gameStarted) return;
            this.keys[e.key] = false;
        });
    }

    isKeyPressed(key) {
        return this.keys[key] || false;
    }
}