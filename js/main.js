/* Copyright (c) 2025 Mohamed Saidi. Kol el 7uquq ma7foudha. */
console.log("%c Developed by Mohamed Saidi | Kol el 7uquq ma7foudha ", "background: #222; color: #bada55; padding: 4px; border-radius: 4px;");
window.editorInstance = new Editor();

const btnEditMode = document.getElementById('btn-edit-mode');
const btnPlayMode = document.getElementById('btn-play-mode');
const editorContainer = document.getElementById('editor-container');
const gameContainer = document.getElementById('game-container');
const panelLeft = document.getElementById('panel-left');
const panelRight = document.getElementById('panel-right');
const viewportToolbar = document.getElementById('viewport-toolbar');

let currentMode = 'edit';

btnEditMode.addEventListener('click', () => {
    switchMode('edit');
});

btnPlayMode.addEventListener('click', () => {
    switchMode('play');
});

// Baddel bin edit w play
function switchMode(mode) {
    currentMode = mode;
    if (mode === 'edit') {
        editorContainer.classList.remove('d-none');
        gameContainer.classList.add('d-none');
        
        panelLeft.classList.remove('d-none');
        panelRight.classList.remove('d-none');
        viewportToolbar.classList.remove('d-none');

        btnEditMode.classList.add('active');
        btnPlayMode.classList.remove('active');
        if (window.gameInstance) {
            window.gameInstance.stop();
        }
        if (window.editorInstance) {
            window.editorInstance.start();
        }
    } else {
        editorContainer.classList.add('d-none');
        gameContainer.classList.remove('d-none');
        
        panelLeft.classList.add('d-none');
        panelRight.classList.add('d-none');
        viewportToolbar.classList.add('d-none');

        btnEditMode.classList.remove('active');
        btnPlayMode.classList.add('active');

        if (window.gameInstance) {
            window.gameInstance.stop();
        }
        
        if (window.editorInstance) {
            window.editorInstance.stop();
        }

        const mapData = window.editorInstance.getMapData();
        const tileImages = window.editorInstance.getTileImages();
        window.gameInstance = new Game(mapData, tileImages);
        window.gameInstance.start();
    }
}