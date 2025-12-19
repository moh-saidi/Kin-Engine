// Ybda l'interface mta3 l gestion audio
Editor.prototype.initAudioUI = function() {
    const btnImport = document.getElementById('btn-import-audio');
    const inputUpload = document.getElementById('audio-upload');
    const bgmSelect = document.getElementById('map-bgm-select');
    
    btnImport.addEventListener('click', () => {
        inputUpload.click();
    });

    inputUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("Audio file too large (Max 5MB).");
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const name = file.name.split('.')[0];
            const isBGM = confirm(`Is "${name}" a Background Music track?\nOK = Yes (BGM)\nCancel = No (SFX)`);
            const type = isBGM ? 'bgm' : 'sfx';

            const success = await this.audioManager.addSound(name, type, event.target.result);
            if (success) {
                this.updateAudioListUI();
            } else {
                alert("Failed to load audio.");
            }
            e.target.value = '';
        };
        reader.readAsDataURL(file);
    });

    bgmSelect.addEventListener('change', (e) => {
        this.mapBGM = e.target.value;
        if (this.mapBGM) {
            this.audioManager.playBGM(this.mapBGM);
        } else {
            this.audioManager.stopBGM();
        }
    });
};

// Yajourni l liste mta3 l fichiers audio
Editor.prototype.updateAudioListUI = function() {
    const list = document.getElementById('audio-list');
    const bgmSelect = document.getElementById('map-bgm-select');
    
    list.innerHTML = '';
    
    const currentBGM = this.mapBGM;
    
    bgmSelect.innerHTML = '<option value="">None</option>';

    const sounds = this.audioManager.sounds;
    for (const [name, sound] of Object.entries(sounds)) {
        const isPlaying = sound.type === 'bgm' && this.audioManager.isBGMPlaying(name);
        const icon = isPlaying ? 'fa-stop' : 'fa-play';
        const btnClass = isPlaying ? 'btn-light text-dark' : 'btn-outline-light';

        const item = document.createElement('div');
        item.className = 'd-flex align-items-center justify-content-between bg-dark border border-secondary p-1 rounded';
        item.innerHTML = `
            <div class="d-flex align-items-center gap-2 overflow-hidden">
                <span class="badge ${sound.type === 'bgm' ? 'bg-info' : 'bg-warning'}">${sound.type.toUpperCase()}</span>
                <span class="small text-light text-truncate" style="max-width: 100px;" title="${name}">${name}</span>
            </div>
            <div class="btn-group btn-group-sm">
                <button class="btn ${btnClass} border-0" onclick="window.editorInstance.previewAudio('${name}')">
                    <i class="fa-solid ${icon}"></i>
                </button>
                <button class="btn btn-outline-danger border-0" onclick="window.editorInstance.deleteAudio('${name}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(item);

        if (sound.type === 'bgm') {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            bgmSelect.appendChild(option);
        }
    }

    bgmSelect.value = currentBGM;
};

// Yjarreb fichier audio
Editor.prototype.previewAudio = function(name) {
    const sound = this.audioManager.sounds[name];
    if (sound) {
        if (sound.type === 'bgm') {
            if (this.audioManager.isBGMPlaying(name)) {
                this.audioManager.stopBGM();
            } else {
                this.audioManager.playBGM(name);
            }
            this.updateAudioListUI();
        } else {
            this.audioManager.playSFX(name);
        }
    }
};

// Yfassa5 fichier audio
Editor.prototype.deleteAudio = function(name) {
    if (confirm(`Delete audio "${name}"?`)) {
        if (this.mapBGM === name) {
            this.mapBGM = "";
            this.audioManager.stopBGM();
        }
        delete this.audioManager.sounds[name];
        this.updateAudioListUI();
    }
};
