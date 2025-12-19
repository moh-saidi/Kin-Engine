# Kin Builder

**Kin Builder** is a lightweight, web-based 2D game engine and level editor built entirely with vanilla JavaScript. It allows users to design tile-based maps, define collisions, add audio triggers, and play the created levels instantly in the browser.

## 🎮 Features

### Level Editor
*   **Tile Placement:** Draw maps using a customizable tileset.
*   **Layer System:** Support for multiple layers (background, foreground, etc.).
*   **Collision Editor:** Define complex collision shapes (full blocks, half-blocks, slopes).
*   **Audio Triggers:** Place sound effects directly onto the map.
*   **Import/Export:** Save your work as a single JSON file containing all map data, assets, and settings.

### Game Engine
*   **Physics System:** Custom AABB collision detection with support for sub-tile shapes.
*   **Rendering:** Efficient canvas-based rendering with camera follow and zoom support.
*   **Animation:** Frame-based animation system for players and tiles.
*   **Audio:** robust `AudioManager` using the Web Audio API for BGM and SFX.

## 🚀 How to Run

This project requires **no build step** or server installation.

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/kin-builder.git
    ```
2.  Open `index.html` in your web browser.
3.  Start creating!

## 🕹️ Controls

### Editor Mode
*   **Left Click:** Place tile / Select tool
*   **Right Click:** Erase tile
*   **Middle Click / Space + Drag:** Pan camera
*   **Scroll:** Zoom in/out
*   **Ctrl + Z:** Undo
*   **Ctrl + Y:** Redo

### Play Mode
*   **Arrow Keys / WASD:** Move character
*   **Space:** Interact (if configured)

## 🛠️ Technologies Used

*   **HTML5 Canvas:** For high-performance 2D rendering.
*   **Vanilla JavaScript (ES6+):** Core logic for both editor and game engine.
*   **Bootstrap 5:** UI layout and components.
*   **Font Awesome 6:** Icons.
*   **Web Audio API:** Advanced audio handling.

## 📝 License & Credits

**Developed by:** Mohamed Saidi
*Copyright (c) 2025 Mohamed Saidi. All rights reserved.*
