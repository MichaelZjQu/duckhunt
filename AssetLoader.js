class AssetLoader {
    constructor() {
        this.sprites = {};
        this.background = null;
        this.river = null;
        this.loaded = false;
    }

    async loadAssets() {
        const duckTypes = ['goose', 'duck', 'mallard'];
        const frameTypes = ['0', '1', 'stand'];
        
        const spriteNames = [];
        duckTypes.forEach(duckType => {
            frameTypes.forEach(frameType => {
                spriteNames.push(`${duckType}_${frameType}`);
            });
        });
        
        const loadPromises = spriteNames.map(name => this.loadSprite(name));
        
        // Add background and river loading
        loadPromises.push(this.loadBackground());
        loadPromises.push(this.loadRiver());
        
        try {
            await Promise.all(loadPromises);
            this.loaded = true;
            console.log('All sprites, background, and river loaded successfully');
        } catch (error) {
            console.error('Error loading sprites:', error);
            this.loaded = false;
        }
    }

    loadSprite(name) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sprites[name] = img;
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load sprite: assets/${name}.png`);
                reject(new Error(`Failed to load ${name}`));
            };
            img.src = `assets/${name}.png`;
        });
    }

    loadBackground() {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.background = img;
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load background: assets/grass.jpg`);
                reject(new Error(`Failed to load grass background`));
            };
            img.src = `assets/grass.jpg`;
        });
    }

    loadRiver() {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.river = img;
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load river: assets/river.png`);
                reject(new Error(`Failed to load river`));
            };
            img.src = `assets/river.png`;
        });
    }

    getSprite(name) {
        return this.sprites[name];
    }

    getBackground() {
        return this.background;
    }

    getRiver() {
        return this.river;
    }
}