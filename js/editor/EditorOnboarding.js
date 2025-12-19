// Simple onboarding wizard and in-editor tour (no HTML required)
(function(){
    function createOverlay(id){
        let el = document.getElementById(id);
        if(el) return el;
        el = document.createElement('div');
        el.id = id;
        el.style.position = 'fixed';
        el.style.inset = '0';
        el.style.background = 'rgba(0,0,0,0.6)';
        el.style.zIndex = '9999';
        el.style.display = 'none';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.innerHTML = '<div id="onboard-card" style="max-width:520px;width:90%;background:#1e1e1e;color:#fff;border:1px solid #444;border-radius:8px;padding:16px;font-family:system-ui;">\
            <h3 style="margin:0 0 8px">New Project</h3>\
            <p style="margin:0 0 12px">Quickly set up a map: tile size, width/height, starter layers.</p>\
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">\
                <label>Tile Size <input id="wiz-tile-size" type="number" min="8" max="128" step="8" value="32" style="width:100%"></label>\
                <label>Chunk Size <input id="wiz-chunk-size" type="number" min="8" max="64" step="8" value="16" style="width:100%"></label>\
                <label>Width (tiles) <input id="wiz-map-w" type="number" min="8" max="512" step="8" value="100" style="width:100%"></label>\
                <label>Height (tiles) <input id="wiz-map-h" type="number" min="8" max="512" step="8" value="20" style="width:100%"></label>\
            </div>\
            <div style="display:flex;gap:8px;justify-content:flex-end">\
                <button id="wiz-cancel" style="padding:6px 10px;background:#333;color:#fff;border:1px solid #555;border-radius:4px">Cancel</button>\
                <button id="wiz-create" style="padding:6px 10px;background:#0d6efd;color:#fff;border:1px solid #0b5ed7;border-radius:4px">Create</button>\
            </div>\
            <hr style="border-color:#444">\
            <h4 style="margin:6px 0">Editor Tour</h4>\
            <p style="margin:0 8px 12px">Learn tilesets, layers, collisions, dialogue and play mode.</p>\
            <div style="display:flex;gap:8px;justify-content:flex-end">\
                <button id="tour-start" style="padding:6px 10px;background:#198754;color:#fff;border:1px solid #157347;border-radius:4px">Start Tour</button>\
            </div>\
        ';
        document.body.appendChild(el);
        return el;
    }

    function showOverlay(){ const el = createOverlay('onboard-overlay'); el.style.display = 'flex'; }
    function hideOverlay(){ const el = document.getElementById('onboard-overlay'); if(el) el.style.display = 'none'; }

    function runTour(){
        const steps = [
            { sel: '#tile-palette', text: 'Tileset: pick tiles to paint the map.' },
            { sel: '#collision-palette', text: 'Collisions: set walkable vs blocked areas.' },
            { sel: '#player-anim-controls', text: 'Player animations: record frames + speeds.' },
            { sel: '#controls-config', text: 'Controls: configure movement keys.' },
            { sel: '#viewport-toolbar', text: 'Toolbar: brush, bucket, spawn, select, zoom.' },
            { sel: '#btn-play-mode', text: 'Play Mode: run your map and test quickly.' },
        ];
        let i = 0;
        function tipFor(step){
            const target = document.querySelector(step.sel);
            if(!target){ i++; return next(); }
            const box = document.createElement('div');
            box.style.position = 'absolute';
            const r = target.getBoundingClientRect();
            box.style.left = (r.left + window.scrollX) + 'px';
            box.style.top = (r.top + window.scrollY - 50) + 'px';
            box.style.background = '#111';
            box.style.color = '#fff';
            box.style.border = '1px solid #444';
            box.style.borderRadius = '6px';
            box.style.padding = '8px 10px';
            box.style.zIndex = '10000';
            box.textContent = step.text + ' (Click to continue)';
            function cleanup(){ box.remove(); }
            box.addEventListener('click', ()=>{ cleanup(); i++; next(); });
            document.body.appendChild(box);
        }
        function next(){ if(i >= steps.length) return; tipFor(steps[i]); }
        next();
    }

    window.EditorOnboarding = {
        show: showOverlay,
        init(editor){
            const el = createOverlay('onboard-overlay');
            el.querySelector('#wiz-cancel').onclick = hideOverlay;
            el.querySelector('#wiz-create').onclick = ()=>{
                const tileSize = parseInt(el.querySelector('#wiz-tile-size').value)||32;
                const chunkSize = parseInt(el.querySelector('#wiz-chunk-size').value)||16;
                const w = parseInt(el.querySelector('#wiz-map-w').value)||100;
                const h = parseInt(el.querySelector('#wiz-map-h').value)||20;
                editor.tileSize = tileSize;
                editor.chunkSize = chunkSize;
                editor.resizeMap(w, h);
                editor.updateCanvasSize();
                editor.draw();
                hideOverlay();
            };
            el.querySelector('#tour-start').onclick = ()=>{ hideOverlay(); runTour(); };
        }
    };
})();
