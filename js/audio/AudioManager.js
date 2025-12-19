// Gestion audio
class AudioManager {
    constructor() {
        this.sounds = {};
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.activeSources = {};
        this.masterVolume = 0.5;
        this.bgmVolume = 0.4;
        this.sfxVolume = 0.6;
        this.currentBgm = null;
    }

    async addSound(name, type, src) {
        try {
            let arrayBuffer;
            
            if (src.startsWith('data:')) {
                arrayBuffer = this.base64ToArrayBuffer(src.split(',')[1]);
            } else {
                const response = await fetch(src);
                arrayBuffer = await response.arrayBuffer();
            }

            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            
            this.sounds[name] = {
                buffer: audioBuffer,
                type: type,
                src: src
            };
            console.log(`Audio chargé: ${name} (${type})`);
            return true;
        } catch (e) {
            console.error(`Mochkla fi audio ${name}:`, e);
            return false;
        }
    }

    base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async playSFX(name) {
        if (!this.sounds[name]) return;
        
        try {
            if (this.ctx.state === 'suspended') await this.ctx.resume();
        } catch (e) {}

        const source = this.ctx.createBufferSource();
        source.buffer = this.sounds[name].buffer;
        
        const gainNode = this.ctx.createGain();
        gainNode.gain.value = this.sfxVolume * this.masterVolume;
        
        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        source.start(0);
    }

    async playBGM(name) {
        if (!this.sounds[name]) return;
        if (this.currentBgm === name && this.activeSources[name]) return;
        
        this.stopBGM();
        
        try {
            if (this.ctx.state === 'suspended') await this.ctx.resume();
        } catch (e) {}

        const source = this.ctx.createBufferSource();
        source.buffer = this.sounds[name].buffer;
        source.loop = true;
        
        const gainNode = this.ctx.createGain();
        gainNode.gain.value = this.bgmVolume * this.masterVolume;
        
        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        source.start(0);
        this.activeSources[name] = source;
        this.currentBgm = name;
    }

    stopBGM() {
        if (this.currentBgm && this.activeSources[this.currentBgm]) {
            try { this.activeSources[this.currentBgm].stop(); } catch (e) {}
            delete this.activeSources[this.currentBgm];
            this.currentBgm = null;
        }
    }

    isBGMPlaying(name) { return this.currentBgm === name; }
    stopAll() { this.stopBGM(); }

    exportData() {
        const data = {};
        for (const [name, sound] of Object.entries(this.sounds)) {
            data[name] = { type: sound.type, src: sound.src };
        }
        return data;
    }

    async importData(data) {
        this.sounds = {};
        this.stopAll();
        if (!data) return;

        const promises = [];
        for (const [name, soundData] of Object.entries(data)) {
            promises.push(this.addSound(name, soundData.type, soundData.src));
        }
        await Promise.all(promises);
    }
    
    getSoundNames() { return Object.keys(this.sounds); }
}
