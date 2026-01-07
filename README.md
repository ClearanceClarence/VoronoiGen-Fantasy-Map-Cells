# RealmForge - Fantasy Map Generator

A sophisticated procedural fantasy map generator that creates detailed, realistic worlds with terrain, climate, kingdoms, cities, and road networks. Built entirely in vanilla JavaScript with no external dependencies except for D3-Delaunay for Voronoi tessellation.

![RealmForge Screenshot](screenshot.png)

## Features

### Terrain Generation
- **Voronoi-based cells**: Irregular polygonal cells create natural-looking landmasses
- **Multi-octave noise**: Layered Perlin noise for realistic elevation variation
- **Tectonic simulation**: Optional plate boundaries influence mountain placement
- **Erosion modeling**: Hydraulic erosion creates valleys and smooths terrain
- **Configurable parameters**: Cell count, land percentage, sea level, mountain height

### Climate & Water
- **Precipitation simulation**: Rain shadows, moisture from oceans
- **River generation**: Rivers flow from high elevation to sea following realistic paths
- **River confluence**: Multiple tributaries merge naturally
- **Lakes**: Endorheic basins where water cannot reach the sea
- **Coastal smoothing**: Bezier-curved coastlines for organic appearance

### Political Features
- **Kingdom generation**: Automatic territory division using flood-fill from seed points
- **Natural borders**: Kingdoms prefer rivers and mountains as boundaries
- **Capitol cities**: Strategically placed in optimal locations (coastal, river access)
- **Secondary cities**: Ports, fortresses, and towns placed based on terrain
- **Road networks**: A* pathfinding creates realistic road connections between cities
- **Procedural naming**: Fantasy names for kingdoms, cities, and geographic features

### Visual Rendering
- **Multiple view modes**:
  - Political Map (default)
  - Terrain/Landmass
  - Heightmap
  - Precipitation
  - Flow Arrows (debug)
  - Cells Only (debug)
- **Contour lines**: Marching squares algorithm for smooth elevation contours
- **Smooth coastlines**: Catmull-Rom spline interpolation
- **Dashed borders**: Optional dashed kingdom borders
- **Fantasy styling**: Parchment colors, serif fonts, medieval aesthetic

### User Interface
- **Pan & Zoom**: Mouse drag and scroll wheel navigation
- **Real-time controls**: Sliders for all generation parameters
- **Live preview**: Changes reflect immediately
- **Export options**: PNG image and JSON data export
- **Responsive design**: Modern sidebar-based layout

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for development)

### Installation

1. Clone or download the project files
2. Serve the directory with any HTTP server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

3. Open `http://localhost:8000` in your browser

### Quick Start

1. Click **"Generate World"** to create a new map
2. Adjust parameters in the sidebar panels:
   - **World**: Seed, cell count, dimensions
   - **Terrain**: Land percentage, sea level, mountains
   - **Climate**: Precipitation, rivers
   - **Nations**: Kingdom count, road density
   - **Display**: Contour smoothing, visual options
3. Use mouse wheel to zoom, drag to pan
4. Export your map as PNG or JSON

## Configuration Options

### World Panel
| Parameter | Range | Description |
|-----------|-------|-------------|
| Seed | 1-999999 | Random seed for reproducible generation |
| Cell Count | 1000-50000 | Number of Voronoi cells (detail level) |
| Width/Height | 512-4096 | Map dimensions in pixels |

### Terrain Panel
| Parameter | Range | Description |
|-----------|-------|-------------|
| Land % | 20-80 | Percentage of map that is land |
| Sea Level | 0-500 | Base elevation for ocean |
| Mountain Height | 1000-5000 | Maximum elevation |
| Noise Scale | 0.5-5.0 | Terrain feature size |
| Octaves | 1-8 | Noise detail layers |

### Climate Panel
| Parameter | Range | Description |
|-----------|-------|-------------|
| Precipitation | 0-100 | Global rainfall amount |
| Rivers | 0-100 | Number of major rivers |
| Erosion | 0-10 | Terrain smoothing passes |

### Nations Panel
| Parameter | Range | Description |
|-----------|-------|-------------|
| Kingdoms | 3-30 | Number of political entities |
| Road Density | 0-10 | City and road frequency |
| Dashed Borders | Toggle | Use dashed lines for borders |

## Technical Architecture

### File Structure
```
realmforge/
├── index.html           # Main HTML structure
├── styles.css           # UI styling
├── app.js               # Application logic & UI binding
├── voronoi-generator.js # Core generation algorithms
├── rendering-methods.js # Canvas rendering functions
├── map-constants.js     # Color palettes & constants
├── name-generator.js    # Procedural naming system
├── noise.js             # Perlin noise implementation
├── prng.js              # Seeded random number generator
└── README.md            # This file
```

### Core Classes

#### VoronoiGenerator
Main generator class handling all procedural generation:
- `generate(options)` - Full world generation
- `generateKingdoms(count, roadDensity)` - Political division
- `render()` - Canvas rendering dispatch

#### Key Algorithms

**Voronoi Tessellation**
Uses D3-Delaunay for O(n log n) Voronoi diagram computation.

**Height Generation**
```javascript
height = Σ(amplitude[i] * noise(x * frequency[i], y * frequency[i]))
```
Multiple octaves with decreasing amplitude create fractal terrain.

**River Pathfinding**
Downhill flow using steepest descent with momentum for natural meandering.

**A* Road Pathfinding**
Weighted graph search preferring:
- Flat terrain (low cost)
- Existing roads (reduced cost)
- Avoiding water (high cost, bridges allowed)

**Marching Squares Contours**
Grid-based contour extraction with 16-case lookup table for smooth isolines.

### Performance Considerations

- **Culling**: Only visible cells are rendered
- **Caching**: Coastline loops cached between renders
- **Typed Arrays**: Float32Array for height data
- **Spatial Indexing**: Delaunay.find() for O(log n) point location
- **Batched Drawing**: Single stroke() calls for road/contour networks

## Customization

### Color Palettes
Edit `map-constants.js` to customize:
```javascript
export const POLITICAL_COLORS = [
    "#E6DABC", // Kingdom color 1
    "#D4C4A0", // Kingdom color 2
    // ... up to 30 colors
];

export const POLITICAL_OCEAN = "#C4CBBE";
export const POLITICAL_BORDER = "#6B5344";
```

### Name Generation
Modify `name-generator.js` to add custom:
- Syllable patterns
- Prefix/suffix rules
- Cultural name styles

### Contour Levels
In `rendering-methods.js`, adjust the contour intervals:
```javascript
const contourLevels = [100, 175, 250, 350, 450, 550, 700, 850, 1000, 1200, 1400, 1700, 2000, 2400, 2800];
```

## Export Formats

### PNG Export
Full-resolution rasterized map image suitable for printing or digital use.

### JSON Export
Complete world data including:
```json
{
  "seed": 12345,
  "dimensions": { "width": 2048, "height": 2048 },
  "cells": [...],
  "heights": [...],
  "kingdoms": [...],
  "cities": [...],
  "roads": [...],
  "rivers": [...]
}
```

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 80+ | ✅ Full support |
| Firefox | 75+ | ✅ Full support |
| Safari | 13+ | ✅ Full support |
| Edge | 80+ | ✅ Full support |

## Known Limitations

- Very high cell counts (>30000) may cause performance issues
- Mobile devices may struggle with complex maps
- Export resolution limited by browser canvas size limits

## Credits

- **Voronoi/Delaunay**: [D3-Delaunay](https://github.com/d3/d3-delaunay) by Mike Bostock
- **Noise Algorithm**: Based on Ken Perlin's improved noise
- **Inspiration**: Azgaar's Fantasy Map Generator, Martin O'Leary's map generation

## License

MIT License - Free for personal and commercial use.

---

*RealmForge - Craft Your World*
