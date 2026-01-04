/**
 * VORONOI MAP GENERATOR - CORE ENGINE
 * Optimized for 20k-100k cells
 * Uses flat Float64Array for maximum performance
 */

import { PRNG } from './prng.js';
import { Noise } from './noise.js';
import { NameGenerator } from './name-generator.js';

// Elevation color gradient (green = low/sea level, red = high mountains)
// Index 0 = sea level (0m), Index 255 = max height (6000m)
const LAND_COLORS = [
    "#006837","#016a38","#026c39","#036e3a","#04703b","#05713c","#06733d","#07753e",
    "#08773f","#0a7940","#0b7b41","#0c7d42","#0d7e43","#0e8044","#108245","#118446",
    "#128646","#148747","#158948","#178b49","#188d4a","#1a8f4b","#1c904c","#1e924d",
    "#1f944e","#21954f","#23974f","#259950","#289a51","#2a9c52","#2c9d53","#2e9f54",
    "#31a154","#33a255","#36a456","#38a557","#3ba757","#3da858","#40aa59","#43ab5a",
    "#46ad5a","#48ae5b","#4baf5c","#4eb15c","#51b25d","#53b45e","#56b55e","#59b65f",
    "#5cb85f","#5eb960","#61ba60","#64bc61","#67bd62","#69be62","#6cbf62","#6fc063",
    "#71c263","#74c364","#77c464","#79c565","#7cc665","#7fc866","#81c966","#84ca66",
    "#86cb67","#89cc67","#8bcd68","#8ece68","#90cf69","#92d069","#95d16a","#97d26b",
    "#99d36b","#9cd56c","#9ed66c","#a0d76d","#a3d86e","#a5d86f","#a7d970","#a9da70",
    "#acdb71","#aedc72","#b0dd73","#b2de74","#b4df75","#b6e076","#b8e178","#bae279",
    "#bce37a","#bee47b","#c0e47c","#c2e57e","#c4e67f","#c6e780","#c8e882","#cae983",
    "#cce985","#ceea86","#d0eb88","#d2ec89","#d3ec8b","#d5ed8d","#d7ee8e","#d9ef90",
    "#daef92","#dcf093","#def195","#dff297","#e1f298","#e2f39a","#e4f39c","#e6f49d",
    "#e7f59f","#e8f5a1","#eaf6a2","#ebf6a4","#edf6a5","#eef7a6","#eff7a8","#f0f7a9",
    "#f1f8aa","#f3f8ab","#f4f8ab","#f5f8ac","#f6f8ad","#f7f8ad","#f7f8ad","#f8f7ae",
    "#f9f7ae","#faf7ad","#faf6ad","#fbf6ad","#fbf5ac","#fcf5ab","#fcf4ab","#fcf3aa",
    "#fdf2a9","#fdf1a7","#fdf0a6","#fdefa5","#feeea3","#feeda2","#feeca0","#feeb9f",
    "#feea9d","#fee89b","#fee79a","#fee698","#fee496","#fee394","#fee192","#fee090",
    "#fede8f","#fedd8d","#fedb8b","#feda89","#fed887","#fed685","#fed584","#fed382",
    "#fed180","#fecf7e","#fecd7d","#fecc7b","#fdca79","#fdc878","#fdc676","#fdc474",
    "#fdc273","#fdc071","#fdbe70","#fdbc6e","#fdba6d","#fdb86b","#fcb56a","#fcb368",
    "#fcb167","#fcaf65","#fcad64","#fcaa62","#fba861","#fba660","#fba35e","#fba15d",
    "#fa9f5b","#fa9c5a","#fa9a59","#f99858","#f99556","#f99355","#f89054","#f88e53",
    "#f88b51","#f78950","#f7864f","#f6844e","#f6824d","#f57f4b","#f57d4a","#f47a49",
    "#f37848","#f37547","#f27346","#f17044","#f16e43","#f06b42","#ef6941","#ee6640",
    "#ed643f","#ed613e","#ec5f3d","#eb5d3c","#ea5a3a","#e95839","#e85538","#e75337",
    "#e55136","#e44e35","#e34c34","#e24a33","#e14733","#e04532","#de4331","#dd4030",
    "#dc3e2f","#da3c2e","#d93a2e","#d7382d","#d6352c","#d4332c","#d3312b","#d12f2b",
    "#d02d2a","#ce2b2a","#cc2929","#cb2729","#c92529","#c72328","#c52128","#c41f28",
    "#c21d28","#c01b27","#be1927","#bc1727","#ba1527","#b81327","#b61127","#b50f26",
    "#b30d26","#b10b26","#af0926","#ad0826","#ab0626","#a90426","#a70226","#a50026"
];

// Ocean colors: light blue (shallow/0m) to dark blue (deep/-4000m)
// Index 0 = sea level (0m), Index 60 = max depth (-4000m)
const OCEAN_COLORS = [
    "#5ea3cc","#5ba1cb","#599fca","#569dc9","#549bc8","#5199c7","#4f98c6","#4d96c5",
    "#4b94c4","#4892c3","#4690c2","#448ec1","#428cc0","#408bbf","#3e89be","#3d87bd",
    "#3b85bc","#3983bb","#3781ba","#3680b9","#347eb7","#337cb6","#317ab5","#3078b4",
    "#2e76b2","#2d75b1","#2c73b0","#2a71ae","#296fad","#286dab","#266baa","#2569a8",
    "#2467a6","#2365a4","#2164a2","#2062a0","#1f609e","#1e5e9c","#1d5c9a","#1b5a98",
    "#1a5895","#195693","#185490","#17528e","#164f8b","#154d89","#134b86","#124983",
    "#114781","#10457e","#0f437b","#0e4178","#0d3f75","#0c3d73","#0a3b70","#09386d",
    "#08366a","#073467","#063264","#053061"
];

// Precipitation colors: red (dry/0) to blue (wet/1)
// 64-value gradient
const PRECIP_COLORS = [
    "#67001f","#73021f","#7e041f","#8a061f","#95081f","#a00b1f","#ab0d20","#b51020",
    "#be1321","#c61621","#ce1a22","#d51e23","#dc2224","#e22726","#e72c28","#ec322a",
    "#f0382d","#f33f30","#f64633","#f84d37","#fa553b","#fb5d3f","#fc6544","#fd6d49",
    "#fd764f","#fe7f55","#fe875b","#fe9062","#fe9969","#fea170","#feaa78","#feb280",
    "#febb88","#fec390","#fecb99","#fed2a1","#fedaaa","#fee1b3","#fee8bc","#feeec5",
    "#fef4ce","#fef9d8","#fefde1","#f9fee9","#f2fef0","#eafdf6","#e1fcfb","#d7faff",
    "#cdf7ff","#c2f4ff","#b6f0ff","#aaecff","#9de8ff","#90e3ff","#82deff","#74d9ff",
    "#66d3ff","#58cdff","#4ac6ff","#3cbfff","#2fb8fe","#23b0fc","#18a8fa","#0e9ff7"
];

// Political map colors - diffuse varied pastels
const POLITICAL_COLORS = [
    "#E8B4B8", // Dusty rose
    "#A7C7E7", // Powder blue
    "#B5D8B5", // Sage green
    "#F5DEB3", // Wheat
    "#D4A5D9", // Orchid
    "#F7C59F", // Apricot
    "#98D1C4", // Seafoam
    "#E6A8D7", // Pink lavender
    "#C5E1A5", // Light olive
    "#B8C5D6", // Steel blue
    "#FADADD", // Pale pink
    "#C9E4DE", // Mint cream
    "#EDE7B1", // Pale goldenrod
    "#D7BDE2", // Thistle
    "#F0E68C", // Khaki
    "#B0E0E6", // Powder blue light
    "#DEB887", // Burlywood
    "#E0BBE4", // Pale plum
    "#98FB98", // Pale green
    "#FFE4B5", // Moccasin
    "#D8BFD8", // Lavender
    "#AFEEEE", // Pale turquoise
    "#F5F5DC", // Beige
    "#E6E6FA", // Lavender mist
    "#FFEFD5", // Papaya whip
    "#D0F0C0", // Tea green
    "#FFB6C1", // Light pink
    "#B0C4DE", // Light steel blue
    "#FFFACD", // Lemon chiffon
    "#C8A2C8"  // Lilac
];

// Ocean color for political map
const POLITICAL_OCEAN = "#87CEEB";

// Border color for kingdoms
const POLITICAL_BORDER = "#3a3a3a";

// Elevation constants (in meters)
const ELEVATION = {
    MAX: 6000,      // Highest mountain peaks
    MIN: -4000,     // Deepest ocean trenches
    SEA_LEVEL: 0,   // Sea level
    RANGE: 10000    // Total range (6000 - (-4000))
};

export class VoronoiGenerator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Core data structures
        this.points = null;      // Float64Array [x0, y0, x1, y1, ...]
        this.delaunay = null;    // d3.Delaunay instance
        this.voronoi = null;     // Voronoi diagram
        this.cellCount = 0;
        
        // Heightmap data
        this.heights = null;     // Float32Array of elevation values in meters (-4000 to 6000)
        this.elevations = null;  // Alias for heights (elevation in meters)
        this.terrain = null;     // Uint8Array of terrain type (0=water, 1=land)
        
        // Precipitation data
        this.precipitation = null;  // Float32Array of precipitation values (0-1)
        this.windDirection = 270;   // Wind direction in degrees (270 = from west)
        this.windStrength = 0.8;    // Wind strength (0-1)
        
        // River data
        this.rivers = [];           // Array of river paths [{path: [cellIndices], flow: number}]
        this.riverFlow = null;      // Float32Array of accumulated water flow per cell
        this.lakes = [];            // Array of lake cells [{cells: [indices], elevation: number}]
        this.lakeCells = null;      // Set of cell indices that are lakes
        this.lakeDepths = null;     // Map of cell index to lake depth
        this.drainage = null;       // Int32Array - which cell does each cell drain to (-1 = ocean/lake)
        
        // Hover state
        this.hoveredCell = -1;
        
        // Dimensions
        this.width = 0;
        this.height = 0;
        this.dpr = window.devicePixelRatio || 1;
        
        // Viewport / Camera system
        this.viewport = {
            x: 0,           // Pan offset X
            y: 0,           // Pan offset Y
            zoom: 1,        // Zoom level (1 = 100%)
            minZoom: 0.5,
            maxZoom: 20,
            targetZoom: 1,  // For smooth zoom animation
        };
        
        // Interaction state
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.lastPan = { x: 0, y: 0 };
        
        // Display options
        this.showEdges = true;
        this.showCenters = false;
        this.showDelaunay = false;
        this.showRivers = true;  // Show rivers on terrain
        this.showRiverSources = false;  // Show river start points
        this.renderMode = 'political'; // 'cells', 'heightmap', 'terrain', 'precipitation', 'political'
        this.seaLevel = 0.4;
        this.subdivisionLevel = 2;  // 0 = no subdivision, 1-4 = subdivision levels
        
        // Colors
        this.colors = {
            bg: '#0c0c0e',
            edge: '#1a1a20',
            edgeWater: '#1a2a3a',
            edgeLand: '#2a3020',
            center: '#22d3ee',
            delaunay: '#1a1a1e',
        };
        
        // Performance metrics
        this.metrics = {
            genTime: 0,
            renderTime: 0,
            heightmapTime: 0,
            visibleCells: 0
        };
        
        // Name generator for kingdoms, counties, etc.
        this.nameGenerator = new NameGenerator();
        
        // Contour cache for fast rendering
        this._contourCache = null;
        
        // Debounce timers
        this._renderDebounceTimer = null;
        this._zoomDebounceTimer = null;
        
        // Bind event handlers
        this._onWheel = this._onWheel.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        
        this.resize();
        this._setupEventListeners();
    }
    
    /**
     * Setup zoom and pan event listeners
     */
    _setupEventListeners() {
        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
        
        // Mouse drag pan
        this.canvas.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);
        
        // Touch support
        this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this._onTouchEnd);
    }
    
    /**
     * Remove event listeners (cleanup)
     */
    destroy() {
        this.canvas.removeEventListener('wheel', this._onWheel);
        this.canvas.removeEventListener('mousedown', this._onMouseDown);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
        this.canvas.removeEventListener('touchstart', this._onTouchStart);
        this.canvas.removeEventListener('touchmove', this._onTouchMove);
        this.canvas.removeEventListener('touchend', this._onTouchEnd);
    }
    
    /**
     * Mouse wheel zoom handler
     */
    _onWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate zoom
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(this.viewport.minZoom, 
                        Math.min(this.viewport.maxZoom, 
                        this.viewport.zoom * zoomFactor));
        
        if (newZoom !== this.viewport.zoom) {
            // Zoom toward mouse position
            const worldX = (mouseX - this.viewport.x) / this.viewport.zoom;
            const worldY = (mouseY - this.viewport.y) / this.viewport.zoom;
            
            this.viewport.zoom = newZoom;
            
            this.viewport.x = mouseX - worldX * newZoom;
            this.viewport.y = mouseY - worldY * newZoom;
            
            this._debouncedRender();
            this._onZoomChange();
        }
    }
    
    /**
     * Mouse down - start pan
     */
    _onMouseDown(e) {
        if (e.button !== 0) return; // Left click only
        
        this.isDragging = true;
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
        this.lastPan.x = this.viewport.x;
        this.lastPan.y = this.viewport.y;
        this.canvas.style.cursor = 'grabbing';
    }
    
    /**
     * Mouse move - pan
     */
    _onMouseMove(e) {
        if (!this.isDragging) return;
        
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        
        this.viewport.x = this.lastPan.x + dx;
        this.viewport.y = this.lastPan.y + dy;
        
        this._debouncedRender();
    }
    
    /**
     * Mouse up - end pan
     */
    _onMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        }
    }
    
    /**
     * Touch start
     */
    _onTouchStart(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            const touch = e.touches[0];
            this.isDragging = true;
            this.dragStart.x = touch.clientX;
            this.dragStart.y = touch.clientY;
            this.lastPan.x = this.viewport.x;
            this.lastPan.y = this.viewport.y;
        }
    }
    
    /**
     * Touch move
     */
    _onTouchMove(e) {
        if (e.touches.length === 1 && this.isDragging) {
            e.preventDefault();
            const touch = e.touches[0];
            const dx = touch.clientX - this.dragStart.x;
            const dy = touch.clientY - this.dragStart.y;
            
            this.viewport.x = this.lastPan.x + dx;
            this.viewport.y = this.lastPan.y + dy;
            
            this._debouncedRender();
        }
    }
    
    /**
     * Touch end
     */
    _onTouchEnd(e) {
        this.isDragging = false;
    }
    
    /**
     * Debounced render for smooth interaction
     */
    _debouncedRender(delay = 16) {
        if (this._renderDebounceTimer) {
            cancelAnimationFrame(this._renderDebounceTimer);
        }
        this._renderDebounceTimer = requestAnimationFrame(() => {
            this.render();
        });
    }
    
    /**
     * Called when zoom level changes significantly
     */
    _onZoomChange() {
        // Debounce zoom change callback for expensive operations
        if (this._zoomDebounceTimer) {
            clearTimeout(this._zoomDebounceTimer);
        }
        this._zoomDebounceTimer = setTimeout(() => {
            // Emit zoom change event for UI updates
            const event = new CustomEvent('zoomchange', { 
                detail: { zoom: this.viewport.zoom } 
            });
            this.canvas.dispatchEvent(event);
        }, 150);
    }
    
    /**
     * Zoom to specific level
     */
    setZoom(zoom, centerX = null, centerY = null) {
        const newZoom = Math.max(this.viewport.minZoom, 
                        Math.min(this.viewport.maxZoom, zoom));
        
        if (centerX === null) centerX = this.width / 2;
        if (centerY === null) centerY = this.height / 2;
        
        const worldX = (centerX - this.viewport.x) / this.viewport.zoom;
        const worldY = (centerY - this.viewport.y) / this.viewport.zoom;
        
        this.viewport.zoom = newZoom;
        
        this.viewport.x = centerX - worldX * newZoom;
        this.viewport.y = centerY - worldY * newZoom;
        
        this.render();
        this._onZoomChange();
    }
    
    /**
     * Reset zoom and pan
     */
    resetView() {
        this.viewport.x = 0;
        this.viewport.y = 0;
        this.viewport.zoom = 1;
        this.render();
        this._onZoomChange();
    }
    
    /**
     * Fit content to view
     */
    fitToView() {
        this.viewport.x = 0;
        this.viewport.y = 0;
        this.viewport.zoom = 1;
        this.render();
        this._onZoomChange();
    }
    
    /**
     * Get visible bounds in world coordinates
     */
    getVisibleBounds() {
        const invZoom = 1 / this.viewport.zoom;
        return {
            left: -this.viewport.x * invZoom,
            top: -this.viewport.y * invZoom,
            right: (this.width - this.viewport.x) * invZoom,
            bottom: (this.height - this.viewport.y) * invZoom
        };
    }
    
    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.viewport.x) / this.viewport.zoom,
            y: (screenY - this.viewport.y) / this.viewport.zoom
        };
    }
    
    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX * this.viewport.zoom + this.viewport.x,
            y: worldY * this.viewport.zoom + this.viewport.y
        };
    }
    
    /**
     * Store the current visible region bounds for redraw
     */
    captureVisibleRegion() {
        return {
            bounds: this.getVisibleBounds(),
            zoom: this.viewport.zoom
        };
    }
    
    /**
     * Regenerate cells at enhanced resolution for current viewport
     * Redraws with more cells to fill the zoomed-in view
     */
    redrawAtResolution(options = {}) {
        const {
            cellCount = null,       // Target cell count, null = auto-calculate
            distribution = null,    // null = keep current
            seed = null,            // null = keep current
            regenerateHeightmap = true
        } = options;
        
        const bounds = this.getVisibleBounds();
        const zoom = this.viewport.zoom;
        
        // If not zoomed in, nothing to enhance
        if (zoom <= 1.0) {
            console.log('Redraw skipped: not zoomed in');
            return null;
        }
        
        // Calculate visible region dimensions
        const visibleWidth = bounds.right - bounds.left;
        const visibleHeight = bounds.bottom - bounds.top;
        const visibleArea = visibleWidth * visibleHeight;
        const totalArea = this.width * this.height;
        
        // Store current settings
        const currentSeed = this._lastSeed || 12345;
        const currentDistribution = this._lastDistribution || 'jittered';
        const heightmapOptions = this._lastHeightmapOptions || null;
        
        // Calculate new cell count to maintain visual density
        // More zoom = we're seeing less area, so we need more cells per unit area
        const baseDensity = this.cellCount / totalArea;
        const targetCellCount = cellCount || Math.min(
            150000, 
            Math.max(5000, Math.round(totalArea * baseDensity * zoom))
        );
        
        // Store region info for the generation
        this._redrawRegion = {
            left: bounds.left,
            top: bounds.top, 
            right: bounds.right,
            bottom: bounds.bottom,
            originalWidth: this.width,
            originalHeight: this.height
        };
        
        // Generate new cells focused on visible region
        const result = this.generate({
            cellCount: targetCellCount,
            distribution: distribution || currentDistribution,
            seed: seed || currentSeed,
            region: this._redrawRegion
        });
        
        // Reset viewport since we regenerated for this view
        this.viewport.x = 0;
        this.viewport.y = 0;
        this.viewport.zoom = 1;
        
        // Regenerate heightmap if requested and we had one
        if (regenerateHeightmap && heightmapOptions) {
            this.generateHeightmap(heightmapOptions);
        }
        
        this._onZoomChange();
        
        return {
            previousZoom: zoom,
            previousBounds: bounds,
            newCellCount: targetCellCount,
            metrics: result
        };
    }
    
    /**
     * Get suggested cell count for current zoom level
     */
    getSuggestedCellCount() {
        const zoom = this.viewport.zoom;
        const baseDensity = (this.cellCount || 50000) / (this.width * this.height);
        return Math.min(150000, Math.max(5000, Math.round(this.width * this.height * baseDensity * zoom)));
    }
    
    /**
     * Resize canvas to container
     */
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        
        // Regenerate if we have points
        if (this.points && this.cellCount > 0) {
            this.updateDiagram();
            this.render();
        }
    }
    
    /**
     * Generate points with specified distribution
     */
    generate(count, distribution = 'jittered', seed = 12345) {
        const start = performance.now();
        
        // Store settings for potential redraw
        this._lastSeed = seed;
        this._lastDistribution = distribution;
        this._lastCellCount = count;
        
        PRNG.setSeed(seed);
        this.cellCount = count;
        
        // Allocate flat array for points
        this.points = new Float64Array(count * 2);
        
        // Clear heightmap, precipitation, rivers and contour cache
        this.heights = null;
        this.terrain = null;
        this.precipitation = null;
        this.rivers = [];
        this.lakes = [];
        this.lakeCells = null;
        this.lakeDepths = null;
        this.riverFlow = null;
        this.drainage = null;
        this._contourCache = null;
        
        const margin = 1;
        const w = this.width - margin * 2;
        const h = this.height - margin * 2;
        
        switch (distribution) {
            case 'random':
                this._generateRandom(margin, w, h);
                break;
            case 'jittered':
                this._generateJittered(margin, w, h);
                break;
            case 'poisson':
                this._generatePoisson(margin, w, h);
                break;
            case 'relaxed':
                this._generateJittered(margin, w, h);
                this._relaxPoints(3); // 3 iterations of Lloyd relaxation
                break;
            default:
                this._generateJittered(margin, w, h);
        }
        
        this.updateDiagram();
        this.metrics.genTime = performance.now() - start;
        
        this.render();
        
        return this.metrics;
    }
    
    /**
     * Generate heightmap using noise
     */
    generateHeightmap(options = {}) {
        const start = performance.now();
        
        const {
            seed = 12345,
            algorithm = 'fbm',
            frequency = 3,
            octaves = 6,
            seaLevel = 0.4,      // 0-1, determines what fraction of cells are water
            falloff = 'radial',
            falloffStrength = 0.7,
            smoothing = 0,       // Number of smoothing iterations (0 = none)
            smoothingStrength = 0.6  // How much to blend with neighbors (0-1)
        } = options;
        
        // Store settings for potential redraw
        this._lastHeightmapOptions = { seed, algorithm, frequency, octaves, seaLevel, falloff, falloffStrength, smoothing, smoothingStrength };
        
        this.seaLevel = seaLevel;
        
        // Initialize noise
        Noise.init(seed);
        
        // Allocate arrays
        this.heights = new Float32Array(this.cellCount);  // Elevation in meters
        this.elevations = this.heights;  // Alias
        this.terrain = new Uint8Array(this.cellCount);
        
        const cx = this.width / 2;
        const cy = this.height / 2;
        
        // Generate height for each cell
        for (let i = 0; i < this.cellCount; i++) {
            const x = this.points[i * 2];
            const y = this.points[i * 2 + 1];
            
            // Normalize coordinates
            const nx = x / this.width;
            const ny = y / this.height;
            
            // Get noise value based on algorithm (returns -1 to 1)
            let h;
            switch (algorithm) {
                case 'simplex':
                    h = Noise.simplex2(nx * frequency, ny * frequency);
                    break;
                case 'ridged':
                    h = Noise.ridged(nx, ny, { frequency, octaves });
                    h = h * 0.5; // Scale down ridged noise
                    break;
                case 'warped':
                    h = Noise.warped(nx, ny, { frequency, octaves, warpStrength: 0.4 });
                    break;
                case 'valleys':
                    h = Noise.valleys(nx, ny, { frequency, octaves, sharpness: 1.5, depth: 0.7 });
                    break;
                case 'eroded':
                    h = Noise.eroded(nx, ny, { frequency, octaves, erosionStrength: 0.5 });
                    break;
                case 'multiwarp':
                    h = Noise.multiWarp(nx, ny, { frequency, octaves, warpIterations: 3, warpStrength: 0.5 });
                    break;
                case 'swiss':
                    h = Noise.swiss(nx, ny, { frequency, octaves, warpStrength: 0.35 });
                    break;
                case 'terraced':
                    h = Noise.terraced(nx, ny, { frequency, octaves, levels: 10, sharpness: 0.6 });
                    break;
                case 'continental':
                    h = Noise.continental(nx, ny, { frequency, octaves, continentSize: 0.6, coastComplexity: 0.5 });
                    break;
                case 'fbm':
                default:
                    h = Noise.fbm(nx, ny, { frequency, octaves });
                    break;
            }
            
            // Convert from [-1, 1] to [0, 1]
            h = (h + 1) / 2;
            
            // Apply falloff for island effect
            if (falloff !== 'none' && falloffStrength > 0) {
                const dx = (x - cx) / cx;
                const dy = (y - cy) / cy;
                let falloffValue;
                
                if (falloff === 'radial') {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    falloffValue = this._smoothstep(0.3, 1.0, dist);
                } else { // square
                    falloffValue = Math.max(Math.abs(dx), Math.abs(dy));
                    falloffValue = this._smoothstep(0.4, 1.0, falloffValue);
                }
                
                h = h * (1 - falloffValue * falloffStrength);
            }
            
            // Clamp to 0-1
            h = Math.max(0, Math.min(1, h));
            
            // Convert to elevation in meters
            // seaLevel determines the cutoff point
            // Below seaLevel -> ocean (0m to -4000m)
            // Above seaLevel -> land (0m to 6000m)
            let elevation;
            if (h <= seaLevel) {
                // Ocean: map [0, seaLevel] to [-4000, 0]
                const t = h / seaLevel;  // 0 to 1
                elevation = ELEVATION.MIN * (1 - t);  // -4000 to 0
            } else {
                // Land: map [seaLevel, 1] to [0, 6000]
                const t = (h - seaLevel) / (1 - seaLevel);  // 0 to 1
                elevation = ELEVATION.MAX * t;  // 0 to 6000
            }
            
            this.heights[i] = elevation;
            this.terrain[i] = elevation >= ELEVATION.SEA_LEVEL ? 1 : 0;
        }
        
        // Apply smoothing passes if requested
        if (smoothing > 0) {
            this.smoothHeights(smoothing, smoothingStrength);
        }
        
        // Clear contour cache so it regenerates with new heights
        this.clearContourCache();
        
        this.metrics.heightmapTime = performance.now() - start;
        this.render();
        
        return this.metrics;
    }
    
    /**
     * Smooth heights by averaging with neighbors
     * @param {number} iterations - Number of smoothing passes
     * @param {number} strength - Blend factor (0-1), higher = more smoothing
     */
    smoothHeights(iterations = 2, strength = 0.5) {
        if (!this.heights || !this.voronoi) return;
        
        const clampedStrength = Math.max(0, Math.min(1, strength));
        
        for (let iter = 0; iter < iterations; iter++) {
            const newHeights = new Float32Array(this.cellCount);
            
            for (let i = 0; i < this.cellCount; i++) {
                const neighbors = Array.from(this.voronoi.neighbors(i));
                
                if (neighbors.length === 0) {
                    newHeights[i] = this.heights[i];
                    continue;
                }
                
                // Calculate weighted average with neighbors
                let sum = 0;
                let totalWeight = 0;
                
                // Add neighbor contributions
                for (const n of neighbors) {
                    // Weight by inverse distance for smoother results
                    const dx = this.points[i * 2] - this.points[n * 2];
                    const dy = this.points[i * 2 + 1] - this.points[n * 2 + 1];
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const weight = 1 / (dist + 1);
                    
                    sum += this.heights[n] * weight;
                    totalWeight += weight;
                }
                
                const neighborAvg = sum / totalWeight;
                
                // Blend between original and neighbor average
                newHeights[i] = this.heights[i] * (1 - clampedStrength) + neighborAvg * clampedStrength;
            }
            
            // Copy back
            this.heights.set(newHeights);
        }
        
        // Reclassify terrain after smoothing
        for (let i = 0; i < this.cellCount; i++) {
            this.terrain[i] = this.heights[i] >= ELEVATION.SEA_LEVEL ? 1 : 0;
        }
    }
    
    /**
     * Generate precipitation based on wind direction and terrain
     * Windward slopes (facing wind) get rain, leeward slopes (behind mountains) are dry
     */
    generatePrecipitation(options = {}) {
        if (!this.heights || this.cellCount === 0) return;
        
        const {
            windDirection = this.windDirection,  // degrees, 0=N, 90=E, 180=S, 270=W
            windStrength = this.windStrength,    // 0-1
            basePrecip = 0.5,                    // base precipitation level
            orographicStrength = 2.0             // how much slopes affect rain
        } = options;
        
        this.windDirection = windDirection;
        this.windStrength = windStrength;
        
        // Wind blows FROM the specified direction
        // Wind FROM north (0°) means air moves southward (+Y in screen coords)
        // Wind FROM west (270°) means air moves eastward (+X)
        const windRad = windDirection * Math.PI / 180;
        const windToX = Math.sin(windRad);   // Direction wind blows TO
        const windToY = Math.cos(windRad);   // +Y is down on screen
        
        // Allocate array
        this.precipitation = new Float32Array(this.cellCount);
        
        // For each cell, calculate precipitation based on slope relative to wind
        for (let i = 0; i < this.cellCount; i++) {
            const x = this.points[i * 2];
            const y = this.points[i * 2 + 1];
            const elevation = this.heights[i];
            const isOcean = elevation < ELEVATION.SEA_LEVEL;
            
            // Calculate elevation gradient in wind direction
            const neighbors = Array.from(this.voronoi.neighbors(i));
            
            let upwindElev = 0;
            let upwindCount = 0;
            let downwindElev = 0; 
            let downwindCount = 0;
            
            for (const n of neighbors) {
                const nx = this.points[n * 2];
                const ny = this.points[n * 2 + 1];
                const nElev = this.heights[n];
                
                // Vector from this cell to neighbor
                const toNeighborX = nx - x;
                const toNeighborY = ny - y;
                
                // Dot product with wind direction
                // Positive = neighbor is in downwind direction
                // Negative = neighbor is in upwind direction
                const dot = toNeighborX * windToX + toNeighborY * windToY;
                
                if (dot < -5) {  // Neighbor is upwind
                    upwindElev += nElev;
                    upwindCount++;
                } else if (dot > 5) {  // Neighbor is downwind
                    downwindElev += nElev;
                    downwindCount++;
                }
            }
            
            // Calculate slope in wind direction
            // Positive slope = terrain rises in wind direction (windward slope)
            // Negative slope = terrain falls in wind direction (leeward slope)
            let slope = 0;
            
            if (upwindCount > 0 && downwindCount > 0) {
                upwindElev /= upwindCount;
                downwindElev /= downwindCount;
                // Slope from upwind to this cell, normalized
                slope = (elevation - upwindElev) / 1000;
            } else if (upwindCount > 0) {
                upwindElev /= upwindCount;
                slope = (elevation - upwindElev) / 1000;
            }
            
            let precip;
            
            if (isOcean) {
                // Ocean has moderate, steady precipitation  
                precip = basePrecip * 1.1;
            } else {
                if (slope > 0.05) {
                    // WINDWARD slope - air rises, cools, releases moisture = HIGH rain
                    // The steeper the upward slope, the more rain
                    const lift = Math.min(1.5, slope * orographicStrength);
                    precip = basePrecip + lift * windStrength * 0.5;
                } else if (slope < -0.05) {
                    // LEEWARD slope - air descends, warms = LOW rain (rain shadow)
                    // The steeper the downward slope, the drier
                    const shadow = Math.min(1, Math.abs(slope) * orographicStrength);
                    precip = basePrecip - shadow * windStrength * 0.4;
                } else {
                    // Relatively flat area
                    precip = basePrecip;
                }
                
                // Very high elevations can still catch some moisture if windward
                if (slope > 0 && elevation > 2000) {
                    precip += 0.05 * (elevation / ELEVATION.MAX);
                }
            }
            
            this.precipitation[i] = Math.max(0.05, Math.min(1, precip));
        }
        
        // Smooth precipitation for more natural look
        this._smoothPrecipitation(3);
        
        // Normalize to use full color range
        let minP = Infinity, maxP = -Infinity;
        for (let i = 0; i < this.cellCount; i++) {
            minP = Math.min(minP, this.precipitation[i]);
            maxP = Math.max(maxP, this.precipitation[i]);
        }
        
        const range = maxP - minP || 1;
        for (let i = 0; i < this.cellCount; i++) {
            this.precipitation[i] = (this.precipitation[i] - minP) / range;
        }
        
        this.clearContourCache();
        
        return this.precipitation;
    }
    
    /**
     * Smooth precipitation values
     */
    _smoothPrecipitation(iterations = 1) {
        for (let iter = 0; iter < iterations; iter++) {
            const newPrecip = new Float32Array(this.cellCount);
            
            for (let i = 0; i < this.cellCount; i++) {
                const neighbors = Array.from(this.voronoi.neighbors(i));
                let sum = this.precipitation[i];
                
                for (const n of neighbors) {
                    sum += this.precipitation[n];
                }
                
                newPrecip[i] = sum / (neighbors.length + 1);
            }
            
            this.precipitation.set(newPrecip);
        }
    }
    
    /**
     * Calculate drainage direction for each cell (for flow visualization)
     * Uses precipitation to calculate flow accumulation which affects lake formation
     */
    calculateDrainage(options = {}) {
        if (!this.heights || this.cellCount === 0) {
            return;
        }
        
        const {
            fillInlandSeas = true,
            numberOfRivers = 30
        } = options;
        
        // Step 1: Fill inland seas (ocean cells not connected to map edge)
        if (fillInlandSeas) {
            this._fillInlandSeas();
        }
        
        // Step 2: Fill depressions so rivers flow straight to ocean
        this._fillDepressions();
        
        // Clear all previous data - NO LAKES
        this.rivers = [];
        this.lakes = [];
        this.lakeCells = new Set();
        this.lakeDepths = new Map();
        this.riverStartPoints = [];
        
        // Find all land cells
        const landCells = [];
        for (let i = 0; i < this.cellCount; i++) {
            if (this.heights[i] >= ELEVATION.SEA_LEVEL) {
                landCells.push(i);
            }
        }
        
        if (landCells.length === 0) return;
        
        // Place river start points randomly across high elevation areas
        const startCells = this._selectRiverStartPoints(landCells, numberOfRivers);
        
        // Store start points for visualization
        this.riverStartPoints = startCells.map(cell => ({
            cell: cell,
            x: this.points[cell * 2],
            y: this.points[cell * 2 + 1],
            elevation: this.heights[cell]
        }));
        
        console.log(`=== RIVER v11 (Independent rivers): Tracing ${startCells.length} rivers ===`);
        
        // Trace each river to ocean
        let reachedOcean = 0;
        for (const startCell of startCells) {
            const river = this._traceRiverToOcean(startCell);
            if (river.path.length >= 5) {  // Minimum 5 cells for a river
                this.rivers.push(river);
                reachedOcean++;
            }
        }
        
        console.log(`Created ${reachedOcean} rivers (from ${startCells.length} starts)`);
    }
    
    /**
     * Generate political kingdoms/states from land cells
     * Uses competitive flood fill from random seed points
     * Islands are assigned to nearest kingdom by distance
     */
    generateKingdoms(numKingdoms = 12) {
        if (!this.heights) {
            console.warn('No heightmap - generate terrain first');
            return;
        }
        
        console.log(`Generating ${numKingdoms} kingdoms...`);
        
        // Get all land cells
        const landCells = [];
        for (let i = 0; i < this.cellCount; i++) {
            if (this.heights[i] >= ELEVATION.SEA_LEVEL) {
                landCells.push(i);
            }
        }
        
        if (landCells.length === 0) {
            console.warn('No land cells found');
            return;
        }
        
        // Initialize kingdom data
        this.kingdoms = new Int16Array(this.cellCount).fill(-1); // -1 = no kingdom (ocean)
        this.kingdomCount = numKingdoms;
        this.kingdomCapitals = [];
        this.kingdomNames = [];
        this.kingdomCentroids = [];
        this.kingdomCells = []; // Array of arrays - cells per kingdom
        
        // Select kingdom capitals (seed points) - spread across land
        const capitals = this._selectKingdomCapitals(landCells, numKingdoms);
        this.kingdomCapitals = capitals;
        
        // Initialize queues for competitive flood fill
        const queues = capitals.map((capital, idx) => {
            this.kingdoms[capital] = idx;
            return [capital];
        });
        
        // Competitive flood fill - each kingdom expands simultaneously
        let iterations = 0;
        const maxIterations = this.cellCount * 2;
        
        while (iterations < maxIterations) {
            let anyExpanded = false;
            
            for (let k = 0; k < numKingdoms; k++) {
                if (queues[k].length === 0) continue;
                
                // Process one cell from this kingdom's queue
                const current = queues[k].shift();
                
                // Try to claim neighbors
                for (const neighbor of this.voronoi.neighbors(current)) {
                    // Skip if already claimed or is ocean
                    if (this.kingdoms[neighbor] >= 0) continue;
                    if (this.heights[neighbor] < ELEVATION.SEA_LEVEL) continue;
                    
                    // Claim this cell
                    this.kingdoms[neighbor] = k;
                    queues[k].push(neighbor);
                    anyExpanded = true;
                }
            }
            
            if (!anyExpanded) break;
            iterations++;
        }
        
        // Handle islands - assign unclaimed land cells to nearest kingdom capital
        let islandCells = 0;
        for (let i = 0; i < this.cellCount; i++) {
            if (this.heights[i] >= ELEVATION.SEA_LEVEL && this.kingdoms[i] < 0) {
                // This is an unclaimed land cell (island)
                const x = this.points[i * 2];
                const y = this.points[i * 2 + 1];
                
                // Find nearest capital
                let nearestKingdom = 0;
                let nearestDistSq = Infinity;
                
                for (let k = 0; k < capitals.length; k++) {
                    const cx = this.points[capitals[k] * 2];
                    const cy = this.points[capitals[k] * 2 + 1];
                    const distSq = (x - cx) ** 2 + (y - cy) ** 2;
                    if (distSq < nearestDistSq) {
                        nearestDistSq = distSq;
                        nearestKingdom = k;
                    }
                }
                
                this.kingdoms[i] = nearestKingdom;
                islandCells++;
            }
        }
        
        if (islandCells > 0) {
            console.log(`Assigned ${islandCells} island cells to kingdoms`);
        }
        
        // Collect cells per kingdom and calculate centroids
        for (let k = 0; k < numKingdoms; k++) {
            this.kingdomCells[k] = [];
        }
        
        for (let i = 0; i < this.cellCount; i++) {
            const k = this.kingdoms[i];
            if (k >= 0) {
                this.kingdomCells[k].push(i);
            }
        }
        
        // Calculate centroid for each kingdom
        for (let k = 0; k < numKingdoms; k++) {
            const cells = this.kingdomCells[k];
            if (cells.length === 0) {
                this.kingdomCentroids[k] = { x: 0, y: 0 };
                continue;
            }
            
            let sumX = 0, sumY = 0;
            for (const cell of cells) {
                sumX += this.points[cell * 2];
                sumY += this.points[cell * 2 + 1];
            }
            this.kingdomCentroids[k] = {
                x: sumX / cells.length,
                y: sumY / cells.length
            };
        }
        
        // Generate names for kingdoms using NameGenerator
        this.nameGenerator.reset();
        this.kingdomNames = this.nameGenerator.generateNames(numKingdoms, 'kingdom');
        
        console.log(`Kingdoms generated: ${this.kingdomNames.join(', ')}`);
        
        // Generate counties within each kingdom
        this._generateCounties();
    }
    
    /**
     * Generate counties within each kingdom
     */
    _generateCounties() {
        if (!this.kingdoms || !this.kingdomCells) return;
        
        // Counties array - stores county ID for each cell
        this.counties = new Int16Array(this.cellCount).fill(-1);
        this.countyCount = 0;
        
        const countiesPerKingdom = 4; // Average counties per kingdom
        
        for (let k = 0; k < this.kingdomCount; k++) {
            const kingdomCells = this.kingdomCells[k];
            if (!kingdomCells || kingdomCells.length < 10) {
                // Too small for counties, assign all to one county
                for (const cell of kingdomCells) {
                    this.counties[cell] = this.countyCount;
                }
                this.countyCount++;
                continue;
            }
            
            // Number of counties based on kingdom size
            const numCounties = Math.max(2, Math.min(8, Math.floor(Math.sqrt(kingdomCells.length / 200) * countiesPerKingdom)));
            
            // Select county capitals within this kingdom
            const kingdomSet = new Set(kingdomCells);
            const shuffled = [...kingdomCells];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            
            // Min distance between county capitals
            const minDistSq = (this.width / Math.sqrt(this.kingdomCount * numCounties * 4)) ** 2;
            
            const countyCapitals = [];
            for (const cell of shuffled) {
                if (countyCapitals.length >= numCounties) break;
                
                const x = this.points[cell * 2];
                const y = this.points[cell * 2 + 1];
                
                let tooClose = false;
                for (const cap of countyCapitals) {
                    const cx = this.points[cap * 2];
                    const cy = this.points[cap * 2 + 1];
                    if ((x - cx) ** 2 + (y - cy) ** 2 < minDistSq) {
                        tooClose = true;
                        break;
                    }
                }
                
                if (!tooClose) {
                    countyCapitals.push(cell);
                }
            }
            
            // Flood fill from county capitals within kingdom only
            const queues = countyCapitals.map((cap, idx) => {
                const countyId = this.countyCount + idx;
                this.counties[cap] = countyId;
                return [cap];
            });
            
            let iterations = 0;
            const maxIter = kingdomCells.length * 2;
            
            while (iterations < maxIter) {
                let expanded = false;
                
                for (let c = 0; c < queues.length; c++) {
                    if (queues[c].length === 0) continue;
                    
                    const current = queues[c].shift();
                    const countyId = this.countyCount + c;
                    
                    for (const neighbor of this.voronoi.neighbors(current)) {
                        // Must be in same kingdom and unclaimed
                        if (!kingdomSet.has(neighbor)) continue;
                        if (this.counties[neighbor] >= 0) continue;
                        
                        this.counties[neighbor] = countyId;
                        queues[c].push(neighbor);
                        expanded = true;
                    }
                }
                
                if (!expanded) break;
                iterations++;
            }
            
            this.countyCount += countyCapitals.length;
        }
        
        // Collect cells per county and calculate centroids
        this.countyCells = [];
        this.countyCentroids = [];
        
        for (let c = 0; c < this.countyCount; c++) {
            this.countyCells[c] = [];
        }
        
        for (let i = 0; i < this.cellCount; i++) {
            const c = this.counties[i];
            if (c >= 0) {
                this.countyCells[c].push(i);
            }
        }
        
        // Calculate centroid for each county
        for (let c = 0; c < this.countyCount; c++) {
            const cells = this.countyCells[c];
            if (cells.length === 0) {
                this.countyCentroids[c] = { x: 0, y: 0 };
                continue;
            }
            
            let sumX = 0, sumY = 0;
            for (const cell of cells) {
                sumX += this.points[cell * 2];
                sumY += this.points[cell * 2 + 1];
            }
            this.countyCentroids[c] = {
                x: sumX / cells.length,
                y: sumY / cells.length
            };
        }
        
        // Generate names for counties using NameGenerator
        this.countyNames = this.nameGenerator.generateNames(this.countyCount, 'county');
        
        console.log(`Generated ${this.countyCount} counties`);
    }
    
    /**
     * Select kingdom capital locations - spread across land
     */
    _selectKingdomCapitals(landCells, count) {
        // Shuffle land cells
        const shuffled = [...landCells];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Minimum distance between capitals
        const minDistSq = (this.width / Math.sqrt(count * 2)) ** 2;
        
        const capitals = [];
        for (const cell of shuffled) {
            if (capitals.length >= count) break;
            
            const x = this.points[cell * 2];
            const y = this.points[cell * 2 + 1];
            
            // Check distance from existing capitals
            let tooClose = false;
            for (const existing of capitals) {
                const ex = this.points[existing * 2];
                const ey = this.points[existing * 2 + 1];
                const distSq = (x - ex) ** 2 + (y - ey) ** 2;
                if (distSq < minDistSq) {
                    tooClose = true;
                    break;
                }
            }
            
            if (!tooClose) {
                capitals.push(cell);
            }
        }
        
        // If we couldn't find enough spread capitals, just take what we can
        if (capitals.length < count) {
            for (const cell of shuffled) {
                if (capitals.length >= count) break;
                if (!capitals.includes(cell)) {
                    capitals.push(cell);
                }
            }
        }
        
        return capitals;
    }
    
    /**
     * Fill depressions using Priority-Flood algorithm
     * This ensures every land cell can drain to ocean
     */
    _fillDepressions() {
        console.log('Filling depressions with Priority-Flood...');
        
        // Create filled heights array
        this.filledHeights = new Float32Array(this.heights);
        
        // Priority queue - array of [elevation, cellIndex], sorted by elevation
        const pq = [];
        const inQueue = new Uint8Array(this.cellCount);
        
        // Add all ocean cells to queue
        for (let i = 0; i < this.cellCount; i++) {
            if (this.heights[i] < ELEVATION.SEA_LEVEL) {
                pq.push([this.heights[i], i]);
                inQueue[i] = 1;
            }
        }
        
        // Sort by elevation (lowest first)
        pq.sort((a, b) => a[0] - b[0]);
        
        let fillCount = 0;
        
        // Process cells in elevation order
        while (pq.length > 0) {
            const [elev, current] = pq.shift();
            
            // Process all neighbors
            for (const neighbor of this.voronoi.neighbors(current)) {
                if (inQueue[neighbor]) continue;
                inQueue[neighbor] = 1;
                
                // If neighbor is lower than current cell's filled height, raise it
                if (this.filledHeights[neighbor] <= this.filledHeights[current]) {
                    this.filledHeights[neighbor] = this.filledHeights[current] + 0.1;
                    fillCount++;
                }
                
                // Add to queue with its new elevation
                pq.push([this.filledHeights[neighbor], neighbor]);
                
                // Re-sort (inefficient but correct - could use proper heap)
                pq.sort((a, b) => a[0] - b[0]);
            }
        }
        
        console.log(`Filled ${fillCount} depression cells`);
    }
    
    /**
     * Select river start points from high elevations
     */
    _selectRiverStartPoints(landCells, count) {
        // Sort by FILLED elevation (highest first)
        const sorted = [...landCells].sort((a, b) => this.filledHeights[b] - this.filledHeights[a]);
        
        // Take from upper 15% of elevations for longer rivers
        const upperPortion = sorted.slice(0, Math.floor(sorted.length * 0.15));
        
        if (upperPortion.length === 0) return [];
        
        // Shuffle
        for (let i = upperPortion.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [upperPortion[i], upperPortion[j]] = [upperPortion[j], upperPortion[i]];
        }
        
        // Minimum distance between river starts
        const minDistSq = (this.width / Math.sqrt(count * 6)) ** 2;
        
        const starts = [];
        for (const cell of upperPortion) {
            if (starts.length >= count) break;
            
            const x = this.points[cell * 2];
            const y = this.points[cell * 2 + 1];
            
            let tooClose = false;
            for (const existing of starts) {
                const ex = this.points[existing * 2];
                const ey = this.points[existing * 2 + 1];
                const distSq = (x - ex) ** 2 + (y - ey) ** 2;
                if (distSq < minDistSq) {
                    tooClose = true;
                    break;
                }
            }
            
            if (!tooClose) {
                starts.push(cell);
            }
        }
        
        console.log(`Selected ${starts.length} river start points (requested ${count})`);
        return starts;
    }
    
    /**
     * Trace river using filled heights - guaranteed no loops
     * Extends one cell into ocean (will be clipped during render)
     */
    _traceRiverToOcean(startCell) {
        const path = [];
        let current = startCell;
        const visited = new Set();
        
        while (path.length < 3000) {
            const x = this.points[current * 2];
            const y = this.points[current * 2 + 1];
            const elevation = this.heights[current];
            
            const isOcean = this.heights[current] < ELEVATION.SEA_LEVEL;
            path.push({ cell: current, x, y, elevation, isOcean });
            
            // If we just added an ocean cell, stop
            if (isOcean) {
                break;
            }
            
            visited.add(current);
            
            // Find lowest neighbor using FILLED heights
            let bestNeighbor = -1;
            let bestElevation = Infinity;
            
            for (const n of this.voronoi.neighbors(current)) {
                if (visited.has(n)) continue;
                const nElev = this.filledHeights[n];
                if (nElev < bestElevation) {
                    bestElevation = nElev;
                    bestNeighbor = n;
                }
            }
            
            if (bestNeighbor < 0) {
                break;
            }
            
            current = bestNeighbor;
        }
        
        return { path };
    }
    
    /**
     * Carve a river into the heightmap
     */
    _carveRiver(river, depth) {
        for (const point of river.path) {
            if (point.cell < 0) continue;
            if (this.heights[point.cell] < ELEVATION.SEA_LEVEL) continue;  // Don't carve ocean
            if (this.lakeCells && this.lakeCells.has(point.cell)) continue;  // Don't carve lakes
            
            // Carve depth based on flow (more flow = deeper carving)
            const flowFactor = Math.min(2, 1 + point.flow);
            const carveAmount = depth * flowFactor;
            this.heights[point.cell] -= carveAmount;
        }
    }
    
    /**
     * Fill inland seas - convert ocean cells not connected to map edge to land
     */
    _fillInlandSeas() {
        const edgeConnected = new Set();
        const queue = [];
        
        // Find edge ocean cells
        const margin = 10;
        for (let i = 0; i < this.cellCount; i++) {
            if (this.heights[i] >= ELEVATION.SEA_LEVEL) continue;
            
            const x = this.points[i * 2];
            const y = this.points[i * 2 + 1];
            
            if (x < margin || x > this.width - margin || 
                y < margin || y > this.height - margin) {
                queue.push(i);
                edgeConnected.add(i);
            }
        }
        
        // BFS to find all ocean connected to edge
        while (queue.length > 0) {
            const current = queue.shift();
            const neighbors = Array.from(this.voronoi.neighbors(current));
            
            for (const n of neighbors) {
                if (edgeConnected.has(n)) continue;
                if (this.heights[n] >= ELEVATION.SEA_LEVEL) continue;
                
                edgeConnected.add(n);
                queue.push(n);
            }
        }
        
        // Convert inland seas to low land
        let filledCount = 0;
        for (let i = 0; i < this.cellCount; i++) {
            if (this.heights[i] < ELEVATION.SEA_LEVEL && !edgeConnected.has(i)) {
                this.heights[i] = 50 + Math.random() * 100;
                this.terrain[i] = 1;
                filledCount++;
            }
        }
        
        if (filledCount > 0) {
            console.log(`Filled ${filledCount} inland sea cells`);
        }
    }
    
    /**
     * Generate rivers based on terrain and precipitation
     * Water flows downhill, accumulating into rivers and lakes
     */
    generateRivers(options = {}) {
        if (!this.heights || !this.precipitation || this.cellCount === 0) {
            console.warn('Need heightmap and precipitation to generate rivers');
            return;
        }
        
        const {
            flowThreshold = 0.02,      // Minimum flow to be considered a river
            lakeThreshold = 0.005,     // Minimum flow to form a lake
            minRiverLength = 3         // Minimum cells for a river
        } = options;
        
        // Calculate drainage if not already done
        if (!this.drainage) {
            this.calculateDrainage();
        }
        
        // Initialize flow array
        this.riverFlow = new Float32Array(this.cellCount);
        this.rivers = [];
        
        // Accumulate flow - process cells from high to low elevation
        const sortedCells = [];
        for (let i = 0; i < this.cellCount; i++) {
            sortedCells.push({ index: i, elevation: this.heights[i] });
        }
        sortedCells.sort((a, b) => b.elevation - a.elevation);
        
        // Each cell starts with precipitation as its initial water
        for (let i = 0; i < this.cellCount; i++) {
            this.riverFlow[i] = this.precipitation[i] * 0.1;
        }
        
        // Flow accumulation - process from highest to lowest
        for (const { index: i } of sortedCells) {
            const drainTo = this.drainage[i];
            if (drainTo >= 0 && drainTo < this.cellCount) {
                this.riverFlow[drainTo] += this.riverFlow[i];
            }
        }
        
        // Extract river paths from high-flow cells
        const visited = new Set();
        const riverStarts = [];
        
        // Find cells with high flow that aren't already part of a river
        for (let i = 0; i < this.cellCount; i++) {
            if (this.riverFlow[i] >= flowThreshold && 
                this.heights[i] >= ELEVATION.SEA_LEVEL &&
                !visited.has(i)) {
                riverStarts.push(i);
            }
        }
        
        // Sort by flow descending to trace main rivers first
        riverStarts.sort((a, b) => this.riverFlow[b] - this.riverFlow[a]);
        
        // Trace each river
        for (const start of riverStarts) {
            if (visited.has(start)) continue;
            
            const river = this._traceRiver(start, visited, flowThreshold);
            if (river.path.length >= minRiverLength) {
                this.rivers.push(river);
            }
        }
        
        this.render();
        return { rivers: this.rivers.length, lakes: this.lakes.length };
    }
    
    /**
     * Create a lake using simple flood fill
     * Expand from depression to all connected cells within an elevation band
     */
    _createLake(startCell, processed, minLakeDepth = 30, maxLakeSize = 100) {
        const startElevation = this.heights[startCell];
        
        // Find all contiguous cells that could be part of this lake's basin
        // A cell is in the basin if we can reach it by only going through cells 
        // that are below a rising "water level"
        
        const basin = new Set([startCell]);
        const queue = [startCell];
        let waterLevel = startElevation;
        
        // Track the rim (cells adjacent to basin but not in basin)
        const rim = new Map(); // cell -> elevation
        
        // Initialize rim with neighbors
        for (const n of this.voronoi.neighbors(startCell)) {
            const nElev = this.heights[n];
            if (nElev < ELEVATION.SEA_LEVEL) {
                processed.add(startCell);
                return null;
            }
            rim.set(n, nElev);
        }
        
        // Expand basin by adding the lowest rim cell if it would be flooded
        while (rim.size > 0 && basin.size < maxLakeSize) {
            // Find lowest rim cell
            let lowestRimCell = null;
            let lowestRimElev = Infinity;
            for (const [cell, elev] of rim) {
                if (elev < lowestRimElev) {
                    lowestRimElev = elev;
                    lowestRimCell = cell;
                }
            }
            
            if (lowestRimCell === null) break;
            
            // Water rises to reach this cell
            // If it has to rise too much (> 200m above start), stop
            if (lowestRimElev > startElevation + 200) break;
            
            // Add to basin
            rim.delete(lowestRimCell);
            basin.add(lowestRimCell);
            waterLevel = Math.max(waterLevel, lowestRimElev);
            
            // Add its neighbors to rim
            for (const n of this.voronoi.neighbors(lowestRimCell)) {
                if (basin.has(n) || rim.has(n)) continue;
                const nElev = this.heights[n];
                if (nElev < ELEVATION.SEA_LEVEL) {
                    // Hit ocean
                    for (const c of basin) processed.add(c);
                    return null;
                }
                rim.set(n, nElev);
            }
        }
        
        // Mark basin as processed
        for (const c of basin) processed.add(c);
        
        // Spill point is lowest remaining rim cell
        let spillElevation = Infinity;
        let spillCell = -1;
        for (const [cell, elev] of rim) {
            if (elev < spillElevation) {
                spillElevation = elev;
                spillCell = cell;
            }
        }
        
        // If no rim left, check neighbors of basin
        if (spillCell < 0) {
            for (const cell of basin) {
                for (const n of this.voronoi.neighbors(cell)) {
                    if (basin.has(n)) continue;
                    const nElev = this.heights[n];
                    if (nElev >= ELEVATION.SEA_LEVEL && nElev < spillElevation) {
                        spillElevation = nElev;
                        spillCell = n;
                    }
                }
            }
        }
        
        if (spillCell < 0 || spillElevation === Infinity) return null;
        
        // Find lowest elevation in basin
        let lowestElevation = Infinity;
        for (const c of basin) {
            if (this.heights[c] < lowestElevation) {
                lowestElevation = this.heights[c];
            }
        }
        
        // Calculate depth
        const depth = spillElevation - lowestElevation;
        
        if (depth < minLakeDepth) return null;
        
        // Lake cells = basin cells below spill elevation
        const lakeCells = [];
        for (const c of basin) {
            if (this.heights[c] < spillElevation) {
                lakeCells.push(c);
            }
        }
        
        // Limit size
        if (lakeCells.length > maxLakeSize) {
            lakeCells.sort((a, b) => this.heights[a] - this.heights[b]);
            lakeCells.length = maxLakeSize;
        }
        
        if (lakeCells.length === 0) return null;
        
        // Check not adjacent to ocean
        for (const cell of lakeCells) {
            for (const n of this.voronoi.neighbors(cell)) {
                if (this.heights[n] < ELEVATION.SEA_LEVEL) {
                    return null;
                }
            }
        }
        
        // Check for internal islands - reject lakes with too many
        const lakeSet = new Set(lakeCells);
        let islandCells = 0;
        for (const cell of lakeCells) {
            for (const n of this.voronoi.neighbors(cell)) {
                if (lakeSet.has(n)) continue;
                // This neighbor is not in lake - check if it's surrounded by lake
                const nNeighbors = Array.from(this.voronoi.neighbors(n));
                let surroundedByLake = true;
                for (const nn of nNeighbors) {
                    if (!lakeSet.has(nn) && this.heights[nn] >= ELEVATION.SEA_LEVEL) {
                        surroundedByLake = false;
                        break;
                    }
                }
                if (surroundedByLake) {
                    islandCells++;
                }
            }
        }
        
        // Reject if more than 2 island cells or more than 10% of lake is islands
        if (islandCells > 2 || (islandCells > 0 && islandCells / lakeCells.length > 0.1)) {
            return null;
        }
        
        // Update drainage for lake cells to point to spillCell
        for (const cell of lakeCells) {
            this.drainage[cell] = spillCell;
        }
        
        // CRITICAL: Update spillCell's drainage to point AWAY from lake
        // The spillCell might currently drain into the lake, which is wrong
        let bestOutflow = -1;
        let lowestOutflowElev = Infinity;
        for (const n of this.voronoi.neighbors(spillCell)) {
            if (lakeSet.has(n)) continue; // Skip lake cells
            const nElev = this.heights[n];
            if (nElev < lowestOutflowElev) {
                lowestOutflowElev = nElev;
                bestOutflow = n;
            }
        }
        
        if (bestOutflow >= 0) {
            this.drainage[spillCell] = bestOutflow;
        }
        
        return {
            cells: lakeCells,
            surfaceElevation: spillElevation,
            lowestElevation: lowestElevation,
            depth: depth,
            outlet: spillCell
        };
    }
    
    /**
     * Trace a river from start cell to ocean/lake
     */
    _traceRiver(start, visited, threshold) {
        const path = [];
        let current = start;
        let totalFlow = 0;
        
        while (current >= 0 && !visited.has(current)) {
            // Only include cells with significant flow
            if (this.riverFlow[current] >= threshold * 0.5) {
                path.push(current);
                visited.add(current);
                totalFlow += this.riverFlow[current];
            }
            
            // Stop if we reach ocean
            if (this.heights[current] < ELEVATION.SEA_LEVEL) {
                break;
            }
            
            current = this.drainage[current];
            
            // Prevent infinite loops
            if (path.length > 1000) break;
        }
        
        return {
            path: path,
            flow: totalFlow / Math.max(1, path.length)
        };
    }
    
    /**
     * Get color for precipitation value (0-1)
     * Red (dry) to Blue (wet)
     */
    _getPrecipitationColor(precip) {
        // Handle NaN or undefined
        if (precip === undefined || precip === null || isNaN(precip)) {
            return PRECIP_COLORS[0]; // Return dry color as fallback
        }
        const t = Math.max(0, Math.min(1, precip));
        const index = Math.min(PRECIP_COLORS.length - 1, Math.floor(t * (PRECIP_COLORS.length - 1)));
        return PRECIP_COLORS[index];
    }
    
    /**
     * Smooth interpolation
     */
    _smoothstep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }
    
    /**
     * Get color for elevation value (in meters)
     * Uses LAND_COLORS for elevations >= 0m
     * Uses single OCEAN_COLOR for elevations < 0m
     */
    _getElevationColor(elevation) {
        if (elevation >= ELEVATION.SEA_LEVEL) {
            // Land: map 0-6000m to color index 0-255
            const t = Math.min(1, elevation / ELEVATION.MAX);
            const index = Math.min(255, Math.floor(t * 255));
            return LAND_COLORS[index];
        } else {
            // Ocean: single color for all depths
            return OCEAN_COLORS[0];
        }
    }
    
    /**
     * Legacy function for compatibility
     */
    _getHeightColor(height, seaLevel) {
        // Convert 0-1 height to elevation if using legacy format
        const elevation = this._normalizedToElevation(height);
        return this._getElevationColor(elevation);
    }
    
    /**
     * Convert normalized height (0-1) to elevation in meters
     */
    _normalizedToElevation(normalizedHeight) {
        // Map 0-1 to MIN-MAX range
        return ELEVATION.MIN + normalizedHeight * ELEVATION.RANGE;
    }
    
    /**
     * Convert elevation in meters to normalized height (0-1)
     */
    _elevationToNormalized(elevation) {
        return (elevation - ELEVATION.MIN) / ELEVATION.RANGE;
    }
    
    /**
     * Linear interpolate between two hex colors
     */
    _lerpColor(color1, color2, t) {
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);
        
        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);
        
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        
        return `rgb(${r},${g},${b})`;
    }
    
    /**
     * Get grayscale color for elevation (maps -4000 to 6000 -> 0 to 255)
     */
    _getGrayscale(elevation) {
        const normalized = this._elevationToNormalized(elevation);
        const v = Math.floor(Math.max(0, Math.min(1, normalized)) * 255);
        return `rgb(${v},${v},${v})`;
    }

    /**
     * Random uniform distribution
     */
    _generateRandom(margin, w, h) {
        for (let i = 0; i < this.cellCount; i++) {
            this.points[i * 2] = margin + PRNG.random() * w;
            this.points[i * 2 + 1] = margin + PRNG.random() * h;
        }
    }
    
    /**
     * Jittered grid - more uniform than random
     * Good for fantasy maps
     */
    _generateJittered(margin, w, h) {
        const cols = Math.ceil(Math.sqrt(this.cellCount * (w / h)));
        const rows = Math.ceil(this.cellCount / cols);
        const cellW = w / cols;
        const cellH = h / rows;
        const jitter = 0.4; // Jitter amount (0-0.5)
        
        let idx = 0;
        for (let row = 0; row < rows && idx < this.cellCount; row++) {
            for (let col = 0; col < cols && idx < this.cellCount; col++) {
                const baseX = margin + (col + 0.5) * cellW;
                const baseY = margin + (row + 0.5) * cellH;
                
                this.points[idx * 2] = baseX + (PRNG.random() - 0.5) * cellW * jitter * 2;
                this.points[idx * 2 + 1] = baseY + (PRNG.random() - 0.5) * cellH * jitter * 2;
                idx++;
            }
        }
    }
    
    /**
     * Poisson disk sampling - maintains minimum distance between points
     * Slower but very uniform distribution
     */
    _generatePoisson(margin, w, h) {
        const minDist = Math.sqrt((w * h) / this.cellCount) * 0.8;
        const cellSize = minDist / Math.SQRT2;
        const gridW = Math.ceil(w / cellSize);
        const gridH = Math.ceil(h / cellSize);
        const grid = new Int32Array(gridW * gridH).fill(-1);
        
        const active = [];
        let pointCount = 0;
        const maxAttempts = 30;
        
        // Start with a random point
        const startX = margin + PRNG.random() * w;
        const startY = margin + PRNG.random() * h;
        this.points[0] = startX;
        this.points[1] = startY;
        
        const gx = Math.floor((startX - margin) / cellSize);
        const gy = Math.floor((startY - margin) / cellSize);
        grid[gy * gridW + gx] = 0;
        active.push(0);
        pointCount = 1;
        
        while (active.length > 0 && pointCount < this.cellCount) {
            const randIdx = PRNG.int(0, active.length - 1);
            const parentIdx = active[randIdx];
            const px = this.points[parentIdx * 2];
            const py = this.points[parentIdx * 2 + 1];
            
            let found = false;
            
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const angle = PRNG.random() * Math.PI * 2;
                const dist = minDist + PRNG.random() * minDist;
                const nx = px + Math.cos(angle) * dist;
                const ny = py + Math.sin(angle) * dist;
                
                // Check bounds
                if (nx < margin || nx > margin + w || ny < margin || ny > margin + h) {
                    continue;
                }
                
                const ngx = Math.floor((nx - margin) / cellSize);
                const ngy = Math.floor((ny - margin) / cellSize);
                
                // Check neighbors
                let valid = true;
                for (let dy = -2; dy <= 2 && valid; dy++) {
                    for (let dx = -2; dx <= 2 && valid; dx++) {
                        const cx = ngx + dx;
                        const cy = ngy + dy;
                        if (cx >= 0 && cx < gridW && cy >= 0 && cy < gridH) {
                            const neighborIdx = grid[cy * gridW + cx];
                            if (neighborIdx >= 0) {
                                const ex = this.points[neighborIdx * 2];
                                const ey = this.points[neighborIdx * 2 + 1];
                                const d = Math.hypot(nx - ex, ny - ey);
                                if (d < minDist) valid = false;
                            }
                        }
                    }
                }
                
                if (valid) {
                    this.points[pointCount * 2] = nx;
                    this.points[pointCount * 2 + 1] = ny;
                    grid[ngy * gridW + ngx] = pointCount;
                    active.push(pointCount);
                    pointCount++;
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                active.splice(randIdx, 1);
            }
        }
        
        // Fill remaining with random points if needed
        while (pointCount < this.cellCount) {
            this.points[pointCount * 2] = margin + PRNG.random() * w;
            this.points[pointCount * 2 + 1] = margin + PRNG.random() * h;
            pointCount++;
        }
        
        this.cellCount = pointCount;
    }
    
    /**
     * Lloyd relaxation - moves points toward cell centroids
     */
    _relaxPoints(iterations) {
        for (let iter = 0; iter < iterations; iter++) {
            this.updateDiagram();
            
            for (let i = 0; i < this.cellCount; i++) {
                const cell = this.voronoi.cellPolygon(i);
                if (!cell || cell.length < 3) continue;
                
                // Calculate centroid
                let cx = 0, cy = 0, area = 0;
                for (let j = 0; j < cell.length - 1; j++) {
                    const cross = cell[j][0] * cell[j + 1][1] - cell[j + 1][0] * cell[j][1];
                    area += cross;
                    cx += (cell[j][0] + cell[j + 1][0]) * cross;
                    cy += (cell[j][1] + cell[j + 1][1]) * cross;
                }
                
                area /= 2;
                if (Math.abs(area) > 1e-10) {
                    cx /= (6 * area);
                    cy /= (6 * area);
                    
                    // Clamp to bounds
                    this.points[i * 2] = Math.max(1, Math.min(this.width - 1, cx));
                    this.points[i * 2 + 1] = Math.max(1, Math.min(this.height - 1, cy));
                }
            }
        }
    }
    
    /**
     * Update Delaunay triangulation and Voronoi diagram
     */
    updateDiagram() {
        // Use flat array constructor for best performance
        this.delaunay = new d3.Delaunay(this.points);
        this.voronoi = this.delaunay.voronoi([0, 0, this.width, this.height]);
    }
    
    /**
     * Main render function - optimized for high cell counts
     */
    render() {
        const start = performance.now();
        const ctx = this.ctx;
        
        // Clear
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(0, 0, this.width, this.height);
        
        if (!this.voronoi) {
            this.metrics.renderTime = performance.now() - start;
            this.metrics.visibleCells = 0;
            return;
        }
        
        // Apply viewport transform
        ctx.save();
        ctx.translate(this.viewport.x, this.viewport.y);
        ctx.scale(this.viewport.zoom, this.viewport.zoom);
        
        // Get visible bounds for culling
        const bounds = this.getVisibleBounds();
        
        // Render terrain-colored cells if heightmap exists
        if (this.heights && (this.renderMode === 'heightmap' || this.renderMode === 'terrain')) {
            this._renderTerrainCells(ctx, bounds);
            // Draw rivers on terrain
            if (this.showRivers && this.rivers && this.rivers.length > 0) {
                this._renderRivers(ctx, bounds);
            }
            // Draw river source points
            if (this.showRiverSources && this.riverStartPoints && this.riverStartPoints.length > 0) {
                this._renderRiverSources(ctx, bounds);
            }
        }
        
        // Render precipitation if data exists
        if (this.renderMode === 'precipitation') {
            if (this.precipitation) {
                this._renderPrecipitationCells(ctx, bounds);
            } else if (this.heights) {
                // Fallback: show terrain until precipitation is generated
                this._renderTerrainCells(ctx, bounds);
            }
        }
        
        // Render political map (kingdoms)
        if (this.renderMode === 'political') {
            this._renderPoliticalMap(ctx, bounds);
            // Draw rivers on political map
            if (this.showRivers && this.rivers && this.rivers.length > 0) {
                this._renderRivers(ctx, bounds);
            }
            // Draw county borders first (most subtle)
            if (this.counties && this.countyCount > 0) {
                this._renderCountyBorders(ctx, bounds);
            }
            // Draw kingdom borders over county borders
            if (this.kingdoms && this.kingdomCount > 0) {
                this._renderKingdomBorders(ctx, bounds);
            }
            // Draw county names (small, subtle)
            if (this.counties && this.countyCount > 0 && this.countyNames && this.countyCentroids) {
                this._renderCountyNames(ctx, bounds);
            }
            // Draw kingdom names on top of everything
            if (this.kingdoms && this.kingdomCount > 0 && this.kingdomNames && this.kingdomCentroids) {
                this._renderKingdomNames(ctx, bounds);
            }
        }
        
        // Render flow mode (terrain + flow direction arrows + rivers)
        if (this.renderMode === 'rivers') {
            if (this.heights) {
                this._renderTerrainCells(ctx, bounds);
            }
            // Always draw rivers in rivers mode
            if (this.rivers && this.rivers.length > 0) {
                this._renderRivers(ctx, bounds);
            }
            // Draw river source points
            if (this.showRiverSources && this.riverStartPoints && this.riverStartPoints.length > 0) {
                this._renderRiverSources(ctx, bounds);
            }
            // Draw flow direction arrows
            if (this.drainage) {
                this._renderFlowArrows(ctx, bounds);
            }
        }
        
        // Render Delaunay triangulation (behind)
        if (this.showDelaunay) {
            ctx.strokeStyle = this.colors.delaunay;
            ctx.lineWidth = 0.5 / this.viewport.zoom;
            ctx.beginPath();
            this.delaunay.render(ctx);
            ctx.stroke();
        }
        
        // Render Voronoi edges
        if (this.showEdges) {
            ctx.strokeStyle = this.colors.edge;
            ctx.lineWidth = Math.max(0.25, 0.5 / this.viewport.zoom);
            ctx.beginPath();
            this.voronoi.render(ctx);
            ctx.stroke();
        }
        
        // Render cell centers (only when zoomed in enough)
        if (this.showCenters) {
            ctx.fillStyle = this.colors.center;
            const radius = Math.max(1, 1.5 / this.viewport.zoom);
            ctx.beginPath();
            
            for (let i = 0; i < this.cellCount; i++) {
                const x = this.points[i * 2];
                const y = this.points[i * 2 + 1];
                
                // Frustum culling
                if (x < bounds.left || x > bounds.right || 
                    y < bounds.top || y > bounds.bottom) continue;
                
                ctx.moveTo(x + radius, y);
                ctx.arc(x, y, radius, 0, Math.PI * 2);
            }
            ctx.fill();
        }
        
        // Render hovered cell outline
        if (this.hoveredCell >= 0 && this.hoveredCell < this.cellCount) {
            this._renderHoveredCell(ctx);
        }
        
        ctx.restore();
        
        // Draw zoom indicator
        this._drawZoomIndicator(ctx);
        
        this.metrics.renderTime = performance.now() - start;
    }
    
    /**
     * Draw zoom level indicator
     */
    _drawZoomIndicator(ctx) {
        const zoom = this.viewport.zoom;
        const text = `${Math.round(zoom * 100)}%`;
        
        ctx.save();
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.textAlign = 'right';
        ctx.fillText(text, this.width - 10, this.height - 10);
        ctx.restore();
    }
    
    /**
     * Render terrain-colored cells with frustum culling and optional contour smoothing
     */
    _renderTerrainCells(ctx, bounds) {
        const isGrayscale = this.renderMode === 'heightmap';
        
        // Use contour rendering if enabled (faster than subdivision)
        if (this.subdivisionLevel > 0 && this.heights) {
            this._renderContourTerrain(ctx, bounds, isGrayscale);
            return;
        }
        
        // Standard rendering (no subdivision)
        const colorBatches = new Map();
        let visibleCount = 0;
        
        for (let i = 0; i < this.cellCount; i++) {
            const x = this.points[i * 2];
            const y = this.points[i * 2 + 1];
            
            const margin = 50;
            if (x < bounds.left - margin || x > bounds.right + margin || 
                y < bounds.top - margin || y > bounds.bottom + margin) continue;
            
            visibleCount++;
            const elevation = this.heights[i];
            
            // Render all cells with terrain color - lakes will be drawn on top
            const color = isGrayscale ? this._getGrayscale(elevation) : this._getElevationColor(elevation);
            
            if (!colorBatches.has(color)) {
                colorBatches.set(color, []);
            }
            colorBatches.get(color).push(i);
        }
        
        // Fill and thin stroke with same color to eliminate gaps
        ctx.lineJoin = 'round';
        ctx.lineWidth = 0.5 / this.viewport.zoom;
        
        for (const [color, indices] of colorBatches) {
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            ctx.beginPath();
            
            for (const i of indices) {
                const cell = this.voronoi.cellPolygon(i);
                if (!cell || cell.length < 3) continue;
                
                ctx.moveTo(cell[0][0], cell[0][1]);
                for (let j = 1; j < cell.length; j++) {
                    ctx.lineTo(cell[j][0], cell[j][1]);
                }
                ctx.closePath();
            }
            
            ctx.fill();
            ctx.stroke();
        }
        
        // Render smooth lakes on top
        if (this.lakeCells && this.lakeCells.size > 0) {
            this._renderSmoothLakes(ctx, bounds);
        }
        
        this.metrics.visibleCells = visibleCount;
    }
    
    /**
     * Render lakes as filled cells
     */
    _renderSmoothLakes(ctx, bounds) {
        if (!this.lakes || this.lakes.length === 0) return;
        
        // Use shallow ocean color to match ocean
        const lakeColor = OCEAN_COLORS[0];  // Shallow ocean blue
        
        for (const lake of this.lakes) {
            if (!lake.cells || lake.cells.length === 0) continue;
            
            // Draw all lake cells as filled polygons
            ctx.fillStyle = lakeColor;
            for (const cellIndex of lake.cells) {
                const cell = this.voronoi.cellPolygon(cellIndex);
                if (!cell || cell.length < 3) continue;
                
                ctx.beginPath();
                ctx.moveTo(cell[0][0], cell[0][1]);
                for (let j = 1; j < cell.length; j++) {
                    ctx.lineTo(cell[j][0], cell[j][1]);
                }
                ctx.closePath();
                ctx.fill();
            }
        }
    }
    
    /**
     * Render political map showing kingdoms with old map style
     * Only renders cells - borders and names are drawn separately for layering
     */
    _renderPoliticalMap(ctx, bounds) {
        if (!this.heights) return;
        
        const hasKingdoms = this.kingdoms && this.kingdomCount > 0;
        const zoom = this.viewport.zoom;
        
        // Batch cells by kingdom for efficient rendering
        const kingdomBatches = new Map();
        const oceanCells = [];
        let visibleCount = 0;
        
        for (let i = 0; i < this.cellCount; i++) {
            const x = this.points[i * 2];
            const y = this.points[i * 2 + 1];
            
            const margin = 50;
            if (x < bounds.left - margin || x > bounds.right + margin || 
                y < bounds.top - margin || y > bounds.bottom + margin) continue;
            
            visibleCount++;
            
            // Check if ocean
            if (this.heights[i] < ELEVATION.SEA_LEVEL) {
                oceanCells.push(i);
                continue;
            }
            
            // Get kingdom ID
            const kingdomId = hasKingdoms ? this.kingdoms[i] : 0;
            
            if (!kingdomBatches.has(kingdomId)) {
                kingdomBatches.set(kingdomId, []);
            }
            kingdomBatches.get(kingdomId).push(i);
        }
        
        // Draw ocean cells first
        ctx.fillStyle = POLITICAL_OCEAN;
        ctx.beginPath();
        for (const i of oceanCells) {
            const cell = this.voronoi.cellPolygon(i);
            if (!cell || cell.length < 3) continue;
            
            ctx.moveTo(cell[0][0], cell[0][1]);
            for (let j = 1; j < cell.length; j++) {
                ctx.lineTo(cell[j][0], cell[j][1]);
            }
            ctx.closePath();
        }
        ctx.fill();
        
        // Draw each kingdom with its color
        for (const [kingdomId, indices] of kingdomBatches) {
            const colorIndex = kingdomId % POLITICAL_COLORS.length;
            const color = hasKingdoms ? POLITICAL_COLORS[colorIndex] : POLITICAL_COLORS[0];
            
            ctx.fillStyle = color;
            ctx.beginPath();
            
            for (const i of indices) {
                const cell = this.voronoi.cellPolygon(i);
                if (!cell || cell.length < 3) continue;
                
                ctx.moveTo(cell[0][0], cell[0][1]);
                for (let j = 1; j < cell.length; j++) {
                    ctx.lineTo(cell[j][0], cell[j][1]);
                }
                ctx.closePath();
            }
            
            ctx.fill();
        }
        
        // Draw lakes on top with political ocean color
        if (this.lakeCells && this.lakeCells.size > 0) {
            ctx.fillStyle = POLITICAL_OCEAN;
            for (const cellIndex of this.lakeCells) {
                const cell = this.voronoi.cellPolygon(cellIndex);
                if (!cell || cell.length < 3) continue;
                
                ctx.beginPath();
                ctx.moveTo(cell[0][0], cell[0][1]);
                for (let j = 1; j < cell.length; j++) {
                    ctx.lineTo(cell[j][0], cell[j][1]);
                }
                ctx.closePath();
                ctx.fill();
            }
        }
        
        this.metrics.visibleCells = visibleCount;
    }
    
    /**
     * Lighten a hex color by a factor
     */
    _lightenColor(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const newR = Math.min(255, Math.round(r + (255 - r) * factor));
        const newG = Math.min(255, Math.round(g + (255 - g) * factor));
        const newB = Math.min(255, Math.round(b + (255 - b) * factor));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    
    /**
     * Render kingdom names at their centroids with collision detection
     */
    _renderKingdomNames(ctx, bounds) {
        if (!this.kingdomNames || !this.kingdomCentroids || !this.kingdomCells) return;
        
        const zoom = this.viewport.zoom;
        const baseFontSize = 18 / zoom;
        
        // Sort kingdoms by size (largest first get label priority)
        const kingdomOrder = [];
        for (let k = 0; k < this.kingdomCount; k++) {
            const cellCount = this.kingdomCells[k] ? this.kingdomCells[k].length : 0;
            kingdomOrder.push({ index: k, size: cellCount });
        }
        kingdomOrder.sort((a, b) => b.size - a.size);
        
        // Track placed label bounding boxes for collision detection
        const placedLabels = [];
        
        for (const kingdom of kingdomOrder) {
            const k = kingdom.index;
            const centroid = this.kingdomCentroids[k];
            const name = this.kingdomNames[k];
            const cellCount = kingdom.size;
            
            if (!centroid || !name || cellCount === 0) continue;
            
            // Skip if centroid is outside view
            if (centroid.x < bounds.left || centroid.x > bounds.right ||
                centroid.y < bounds.top || centroid.y > bounds.bottom) continue;
            
            // Scale font size based on kingdom size
            const sizeScale = Math.min(2.2, Math.max(0.65, Math.sqrt(cellCount / 500)));
            const fontSize = baseFontSize * sizeScale;
            
            // Use italic style for elegance
            ctx.font = `italic ${fontSize}px 'Times New Roman', 'Garamond', 'Baskerville', serif`;
            
            // Measure text
            const metrics = ctx.measureText(name);
            const totalWidth = metrics.width;
            const totalHeight = fontSize * 1.2;
            
            // Calculate label bounding box
            const labelBox = {
                left: centroid.x - totalWidth / 2 - fontSize * 0.3,
                right: centroid.x + totalWidth / 2 + fontSize * 0.3,
                top: centroid.y - totalHeight / 2 - fontSize * 0.2,
                bottom: centroid.y + totalHeight / 2 + fontSize * 0.2
            };
            
            // Check collision with already placed labels
            let collides = false;
            for (const placed of placedLabels) {
                if (labelBox.left < placed.right && labelBox.right > placed.left &&
                    labelBox.top < placed.bottom && labelBox.bottom > placed.top) {
                    collides = true;
                    break;
                }
            }
            
            if (collides) continue;
            
            // Add to placed labels
            placedLabels.push(labelBox);
            
            const x = centroid.x;
            const y = centroid.y;
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillText(name, x + 1.5/zoom, y + 1.5/zoom);
            
            // Draw white halo/outline
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.lineWidth = 3.5 / zoom;
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.strokeText(name, x, y);
            
            // Draw main text
            ctx.fillStyle = '#1a1a2e';
            ctx.fillText(name, x, y);
        }
    }
    
    /**
     * Render county names - smaller and more subtle than kingdom names
     */
    _renderCountyNames(ctx, bounds) {
        if (!this.countyNames || !this.countyCentroids || !this.countyCells) return;
        
        const zoom = this.viewport.zoom;
        const baseFontSize = 12 / zoom;
        
        // Sort counties by size (largest first)
        const countyOrder = [];
        for (let c = 0; c < this.countyCount; c++) {
            const cellCount = this.countyCells[c] ? this.countyCells[c].length : 0;
            countyOrder.push({ index: c, size: cellCount });
        }
        countyOrder.sort((a, b) => b.size - a.size);
        
        // Track placed labels for collision detection
        const placedLabels = [];
        
        // Also avoid kingdom name positions
        for (let k = 0; k < this.kingdomCount; k++) {
            const centroid = this.kingdomCentroids[k];
            const cellCount = this.kingdomCells[k] ? this.kingdomCells[k].length : 0;
            if (!centroid || cellCount === 0) continue;
            
            const sizeScale = Math.min(2.2, Math.max(0.65, Math.sqrt(cellCount / 500)));
            const fontSize = (18 / zoom) * sizeScale;
            const name = this.kingdomNames[k] || '';
            
            ctx.font = `italic ${fontSize}px 'Times New Roman', serif`;
            const width = ctx.measureText(name).width;
            
            placedLabels.push({
                left: centroid.x - width / 2 - fontSize * 0.5,
                right: centroid.x + width / 2 + fontSize * 0.5,
                top: centroid.y - fontSize * 0.8,
                bottom: centroid.y + fontSize * 0.8
            });
        }
        
        for (const county of countyOrder) {
            const c = county.index;
            const centroid = this.countyCentroids[c];
            const name = this.countyNames[c];
            const cellCount = county.size;
            
            if (!centroid || !name || cellCount < 20) continue;
            
            // Skip if centroid is outside view
            if (centroid.x < bounds.left || centroid.x > bounds.right ||
                centroid.y < bounds.top || centroid.y > bounds.bottom) continue;
            
            // Scale font size based on county size
            const sizeScale = Math.min(1.6, Math.max(0.7, Math.sqrt(cellCount / 250)));
            const fontSize = baseFontSize * sizeScale;
            
            ctx.font = `500 ${fontSize}px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
            
            const metrics = ctx.measureText(name);
            const totalWidth = metrics.width;
            const totalHeight = fontSize * 1.2;
            
            // Calculate label bounding box
            const labelBox = {
                left: centroid.x - totalWidth / 2 - fontSize * 0.2,
                right: centroid.x + totalWidth / 2 + fontSize * 0.2,
                top: centroid.y - totalHeight / 2 - fontSize * 0.1,
                bottom: centroid.y + totalHeight / 2 + fontSize * 0.1
            };
            
            // Check collision
            let collides = false;
            for (const placed of placedLabels) {
                if (labelBox.left < placed.right && labelBox.right > placed.left &&
                    labelBox.top < placed.bottom && labelBox.bottom > placed.top) {
                    collides = true;
                    break;
                }
            }
            
            if (collides) continue;
            
            placedLabels.push(labelBox);
            
            const x = centroid.x;
            const y = centroid.y;
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw subtle white outline
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2.5 / zoom;
            ctx.lineJoin = 'round';
            ctx.strokeText(name, x, y);
            
            // Draw text in muted color
            ctx.fillStyle = 'rgba(50, 50, 60, 0.7)';
            ctx.fillText(name, x, y);
        }
    }
    
    /**
     * Render borders between kingdoms - simple thin solid lines
     */
    _renderKingdomBorders(ctx, bounds) {
        if (!this.kingdoms || !this.heights) return;
        
        const zoom = this.viewport.zoom;
        const borderWidth = Math.max(0.5, 0.8 / zoom);
        
        ctx.strokeStyle = 'rgba(80, 80, 80, 0.4)';
        ctx.lineWidth = borderWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        
        for (let i = 0; i < this.cellCount; i++) {
            if (this.heights[i] < ELEVATION.SEA_LEVEL) continue;
            
            const myKingdom = this.kingdoms[i];
            if (myKingdom < 0) continue;
            
            const cell = this.voronoi.cellPolygon(i);
            if (!cell || cell.length < 3) continue;
            
            const neighbors = Array.from(this.voronoi.neighbors(i));
            
            for (let j = 0; j < cell.length - 1; j++) {
                const v1 = cell[j];
                const v2 = cell[j + 1];
                
                const edgeMidX = (v1[0] + v2[0]) / 2;
                const edgeMidY = (v1[1] + v2[1]) / 2;
                
                let edgeNeighbor = -1;
                let minDist = Infinity;
                for (const n of neighbors) {
                    const nx = this.points[n * 2];
                    const ny = this.points[n * 2 + 1];
                    const distSq = (nx - edgeMidX) ** 2 + (ny - edgeMidY) ** 2;
                    if (distSq < minDist) {
                        minDist = distSq;
                        edgeNeighbor = n;
                    }
                }
                
                if (edgeNeighbor < 0) continue;
                
                const neighborKingdom = this.kingdoms[edgeNeighbor];
                const neighborIsOcean = this.heights[edgeNeighbor] < ELEVATION.SEA_LEVEL;
                
                // Only draw borders between different kingdoms (not at coastline)
                if (neighborKingdom !== myKingdom && !neighborIsOcean) {
                    ctx.moveTo(v1[0], v1[1]);
                    ctx.lineTo(v2[0], v2[1]);
                }
            }
        }
        
        ctx.stroke();
    }
    
    /**
     * Render borders between counties - very subtle dotted lines
     */
    _renderCountyBorders(ctx, bounds) {
        if (!this.counties || !this.kingdoms || !this.heights) return;
        
        const zoom = this.viewport.zoom;
        const borderWidth = Math.max(0.3, 0.5 / zoom);
        
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.25)';
        ctx.lineWidth = borderWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        
        for (let i = 0; i < this.cellCount; i++) {
            if (this.heights[i] < ELEVATION.SEA_LEVEL) continue;
            
            const myCounty = this.counties[i];
            const myKingdom = this.kingdoms[i];
            if (myCounty < 0 || myKingdom < 0) continue;
            
            const cell = this.voronoi.cellPolygon(i);
            if (!cell || cell.length < 3) continue;
            
            const neighbors = Array.from(this.voronoi.neighbors(i));
            
            for (let j = 0; j < cell.length - 1; j++) {
                const v1 = cell[j];
                const v2 = cell[j + 1];
                
                const edgeMidX = (v1[0] + v2[0]) / 2;
                const edgeMidY = (v1[1] + v2[1]) / 2;
                
                let edgeNeighbor = -1;
                let minDist = Infinity;
                for (const n of neighbors) {
                    const nx = this.points[n * 2];
                    const ny = this.points[n * 2 + 1];
                    const distSq = (nx - edgeMidX) ** 2 + (ny - edgeMidY) ** 2;
                    if (distSq < minDist) {
                        minDist = distSq;
                        edgeNeighbor = n;
                    }
                }
                
                if (edgeNeighbor < 0) continue;
                
                const neighborCounty = this.counties[edgeNeighbor];
                const neighborKingdom = this.kingdoms[edgeNeighbor];
                const neighborIsOcean = this.heights[edgeNeighbor] < ELEVATION.SEA_LEVEL;
                
                // Draw county border only within same kingdom (not at kingdom borders or coast)
                if (neighborCounty !== myCounty && neighborKingdom === myKingdom && !neighborIsOcean) {
                    ctx.moveTo(v1[0], v1[1]);
                    ctx.lineTo(v2[0], v2[1]);
                }
            }
        }
        
        ctx.stroke();
    }
    
    /**
     * Get all boundary vertices of a lake (points on the edge)
     */
    _getLakeBoundaryPoints(lake) {
        const lakeSet = new Set(lake.cells);
        const allLakeCells = this.lakeCells || new Set();
        const boundaryPoints = [];
        const addedKeys = new Set();
        
        for (const cellIndex of lake.cells) {
            const cell = this.voronoi.cellPolygon(cellIndex);
            if (!cell || cell.length < 3) continue;
            
            const neighbors = Array.from(this.voronoi.neighbors(cellIndex));
            
            for (let j = 0; j < cell.length - 1; j++) {
                const v1 = cell[j];
                const v2 = cell[j + 1];
                const edgeMidX = (v1[0] + v2[0]) / 2;
                const edgeMidY = (v1[1] + v2[1]) / 2;
                
                // Find neighbor on other side of this edge
                let edgeNeighbor = -1;
                let minDist = Infinity;
                for (const n of neighbors) {
                    const nx = this.points[n * 2];
                    const ny = this.points[n * 2 + 1];
                    const distSq = (nx - edgeMidX) ** 2 + (ny - edgeMidY) ** 2;
                    if (distSq < minDist) {
                        minDist = distSq;
                        edgeNeighbor = n;
                    }
                }
                
                // If edge is on boundary (neighbor not in lake), add both vertices
                if (edgeNeighbor >= 0 && !allLakeCells.has(edgeNeighbor)) {
                    const key1 = `${v1[0].toFixed(1)},${v1[1].toFixed(1)}`;
                    const key2 = `${v2[0].toFixed(1)},${v2[1].toFixed(1)}`;
                    
                    if (!addedKeys.has(key1)) {
                        boundaryPoints.push({ x: v1[0], y: v1[1], key: key1 });
                        addedKeys.add(key1);
                    }
                    if (!addedKeys.has(key2)) {
                        boundaryPoints.push({ x: v2[0], y: v2[1], key: key2 });
                        addedKeys.add(key2);
                    }
                }
            }
        }
        
        return boundaryPoints;
    }
    
    /**
     * Order boundary points into a continuous loop using nearest neighbor
     */
    _orderBoundaryPoints(points) {
        if (points.length < 3) return points;
        
        const ordered = [];
        const remaining = [...points];
        
        // Start with the leftmost point
        remaining.sort((a, b) => a.x - b.x);
        ordered.push(remaining.shift());
        
        // Greedily add nearest point
        while (remaining.length > 0) {
            const last = ordered[ordered.length - 1];
            let nearestIdx = 0;
            let nearestDist = Infinity;
            
            for (let i = 0; i < remaining.length; i++) {
                const dist = (remaining[i].x - last.x) ** 2 + (remaining[i].y - last.y) ** 2;
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestIdx = i;
                }
            }
            
            ordered.push(remaining.splice(nearestIdx, 1)[0]);
        }
        
        return ordered;
    }
    
    /**
     * Smooth boundary points using Catmull-Rom interpolation
     */
    _smoothBoundary(points) {
        if (points.length < 4) return points;
        
        const result = [];
        const n = points.length;
        const segments = 3; // Points between each original point
        
        for (let i = 0; i < n; i++) {
            const p0 = points[(i - 1 + n) % n];
            const p1 = points[i];
            const p2 = points[(i + 1) % n];
            const p3 = points[(i + 2) % n];
            
            for (let t = 0; t < segments; t++) {
                const s = t / segments;
                const s2 = s * s;
                const s3 = s2 * s;
                
                const x = 0.5 * (
                    (2 * p1.x) +
                    (-p0.x + p2.x) * s +
                    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * s2 +
                    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * s3
                );
                
                const y = 0.5 * (
                    (2 * p1.y) +
                    (-p0.y + p2.y) * s +
                    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * s2 +
                    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * s3
                );
                
                result.push({ x, y });
            }
        }
        
        return result;
    }
    
    /**
     * Render precipitation-colored cells
     */
    _renderPrecipitationCells(ctx, bounds) {
        if (!this.precipitation || !this.voronoi) return;
        
        const colorBatches = new Map();
        let visibleCount = 0;
        
        for (let i = 0; i < this.cellCount; i++) {
            const x = this.points[i * 2];
            const y = this.points[i * 2 + 1];
            
            const margin = 50;
            if (x < bounds.left - margin || x > bounds.right + margin || 
                y < bounds.top - margin || y > bounds.bottom + margin) continue;
            
            visibleCount++;
            const precip = this.precipitation[i] || 0;
            const color = this._getPrecipitationColor(precip);
            
            if (!color) continue; // Skip if no valid color
            
            if (!colorBatches.has(color)) {
                colorBatches.set(color, []);
            }
            colorBatches.get(color).push(i);
        }
        
        ctx.lineJoin = 'round';
        ctx.lineWidth = 1.5 / this.viewport.zoom;
        
        for (const [color, indices] of colorBatches) {
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            ctx.beginPath();
            
            for (const i of indices) {
                const cell = this.voronoi.cellPolygon(i);
                if (!cell || cell.length < 3) continue;
                
                ctx.moveTo(cell[0][0], cell[0][1]);
                for (let j = 1; j < cell.length; j++) {
                    ctx.lineTo(cell[j][0], cell[j][1]);
                }
                ctx.closePath();
            }
            
            ctx.fill();
            ctx.stroke();
        }
        
        this.metrics.visibleCells = visibleCount;
    }
    
    /**
     * Render outline for hovered cell (or entire lake if hovering lake)
     */
    _renderHoveredCell(ctx) {
        // Check if hovered cell is part of a lake
        if (this.lakeCells && this.lakeCells.has(this.hoveredCell)) {
            // Find which lake this cell belongs to
            for (const lake of this.lakes) {
                if (lake.cells.includes(this.hoveredCell)) {
                    this._renderHoveredLake(ctx, lake);
                    return;
                }
            }
        }
        
        // Normal cell hover
        const cell = this.voronoi.cellPolygon(this.hoveredCell);
        if (!cell || cell.length < 3) return;
        
        // Draw outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3 / this.viewport.zoom;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cell[0][0], cell[0][1]);
        for (let j = 1; j < cell.length; j++) {
            ctx.lineTo(cell[j][0], cell[j][1]);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Inner outline for contrast
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5 / this.viewport.zoom;
        ctx.stroke();
    }
    
    /**
     * Render outline for entire hovered lake
     */
    _renderHoveredLake(ctx, lake) {
        if (!lake.cells || lake.cells.length === 0) return;
        
        const lakeSet = new Set(lake.cells);
        const boundaryEdges = [];
        
        // Find all boundary edges
        for (const cellIndex of lake.cells) {
            const cell = this.voronoi.cellPolygon(cellIndex);
            if (!cell || cell.length < 3) continue;
            
            const neighbors = Array.from(this.voronoi.neighbors(cellIndex));
            
            for (let j = 0; j < cell.length - 1; j++) {
                const v1 = cell[j];
                const v2 = cell[j + 1];
                const edgeMidX = (v1[0] + v2[0]) / 2;
                const edgeMidY = (v1[1] + v2[1]) / 2;
                
                let edgeNeighbor = -1;
                let minDist = Infinity;
                
                for (const n of neighbors) {
                    const nx = this.points[n * 2];
                    const ny = this.points[n * 2 + 1];
                    const distSq = (nx - edgeMidX) ** 2 + (ny - edgeMidY) ** 2;
                    
                    if (distSq < minDist) {
                        minDist = distSq;
                        edgeNeighbor = n;
                    }
                }
                
                // Only include boundary edges (not internal)
                if (edgeNeighbor >= 0 && !lakeSet.has(edgeNeighbor)) {
                    boundaryEdges.push([v1[0], v1[1], v2[0], v2[1]]);
                }
            }
        }
        
        if (boundaryEdges.length === 0) return;
        
        // Draw white outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4 / this.viewport.zoom;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (const [x1, y1, x2, y2] of boundaryEdges) {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
        ctx.stroke();
        
        // Draw black inner outline for contrast
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2 / this.viewport.zoom;
        ctx.stroke();
    }
    
    /**
     * Render flow direction arrows across the map
     * Shows where water would flow based on drainage
     */
    _renderFlowArrows(ctx, bounds) {
        if (!this.drainage || this.cellCount === 0) return;
        
        // Arrow settings - bigger arrows
        const arrowLength = 18 / this.viewport.zoom;
        const arrowHeadSize = 7 / this.viewport.zoom;
        const lineWidth = 2.5 / this.viewport.zoom;
        
        ctx.strokeStyle = 'rgba(20, 80, 160, 0.85)';
        ctx.fillStyle = 'rgba(20, 80, 160, 0.85)';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        
        // Sample cells to avoid overcrowding
        const sampleRate = Math.max(1, Math.floor(2 / this.viewport.zoom));
        
        for (let i = 0; i < this.cellCount; i += sampleRate) {
            // Skip ocean cells
            if (this.heights[i] < ELEVATION.SEA_LEVEL) continue;
            
            // Skip lake cells
            if (this.lakeCells && this.lakeCells.has(i)) continue;
            
            const drainTo = this.drainage[i];
            if (drainTo < 0) continue; // No outflow
            
            // Current cell position
            const x = this.points[i * 2];
            const y = this.points[i * 2 + 1];
            
            // Frustum culling
            if (x < bounds.left - 20 || x > bounds.right + 20 ||
                y < bounds.top - 20 || y > bounds.bottom + 20) continue;
            
            // Target cell position (lower neighbor)
            const tx = this.points[drainTo * 2];
            const ty = this.points[drainTo * 2 + 1];
            
            // Direction vector: from HERE to THERE (downhill)
            const dx = tx - x;
            const dy = ty - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1) continue;
            
            // Unit vector pointing downhill
            const ux = dx / dist;
            const uy = dy / dist;
            
            // Draw arrow from cell center toward the lower neighbor
            const startX = x;
            const startY = y;
            const endX = x + ux * arrowLength;
            const endY = y + uy * arrowLength;
            
            // Draw arrow shaft
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Draw arrow head
            const angle = Math.atan2(uy, ux);
            const headAngle = Math.PI / 5;
            
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - arrowHeadSize * Math.cos(angle - headAngle),
                endY - arrowHeadSize * Math.sin(angle - headAngle)
            );
            ctx.lineTo(
                endX - arrowHeadSize * Math.cos(angle + headAngle),
                endY - arrowHeadSize * Math.sin(angle + headAngle)
            );
            ctx.closePath();
            ctx.fill();
        }
    }
    
    /**
     * Render rivers as filled polygons that get wider - single color, no 3D
     */
    _renderRivers(ctx, bounds) {
        if (!this.rivers || this.rivers.length === 0) return;
        
        const zoom = this.viewport.zoom;
        
        // Collect all river paths
        ctx.beginPath();
        
        for (const river of this.rivers) {
            let path = river.path;
            if (path.length < 2) continue;
            
            // Clip path at coastline
            path = this._clipPathAtCoastline(path);
            if (path.length < 2) continue;
            
            // Check if river is in view
            let inView = false;
            for (const p of path) {
                if (p.x >= bounds.left - 100 && p.x <= bounds.right + 100 &&
                    p.y >= bounds.top - 100 && p.y <= bounds.bottom + 100) {
                    inView = true;
                    break;
                }
            }
            if (!inView) continue;
            
            // Use D3 curve interpolation
            const smoothPath = this._interpolateRiverPathD3(path);
            if (smoothPath.length < 2) continue;
            
            // Width scaling
            const zoomFactor = Math.max(0.5, Math.min(2, zoom));
            const baseWidthStart = 0.8 / zoom * zoomFactor;
            const baseWidthEnd = 3.5 / zoom * zoomFactor;
            
            // Build polygon edges
            const leftEdge = [];
            const rightEdge = [];
            
            for (let i = 0; i < smoothPath.length; i++) {
                const p = smoothPath[i];
                const progress = i / (smoothPath.length - 1);
                const width = baseWidthStart + (baseWidthEnd - baseWidthStart) * progress;
                
                // Calculate perpendicular direction
                let dx, dy;
                if (i === 0) {
                    dx = smoothPath[1].x - p.x;
                    dy = smoothPath[1].y - p.y;
                } else if (i === smoothPath.length - 1) {
                    dx = p.x - smoothPath[i - 1].x;
                    dy = p.y - smoothPath[i - 1].y;
                } else {
                    dx = smoothPath[i + 1].x - smoothPath[i - 1].x;
                    dy = smoothPath[i + 1].y - smoothPath[i - 1].y;
                }
                
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len < 0.001) continue;
                
                const px = -dy / len;
                const py = dx / len;
                
                leftEdge.push({ x: p.x + px * width, y: p.y + py * width });
                rightEdge.push({ x: p.x - px * width, y: p.y - py * width });
            }
            
            if (leftEdge.length < 2) continue;
            
            // Draw polygon
            ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
            for (let i = 1; i < leftEdge.length; i++) {
                ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
            }
            for (let i = rightEdge.length - 1; i >= 0; i--) {
                ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
            }
            ctx.closePath();
        }
        
        // Fill all rivers with ocean color (matches mode)
        ctx.fillStyle = this.renderMode === 'political' ? POLITICAL_OCEAN : OCEAN_COLORS[0];
        ctx.fill();
    }
    
    /**
     * Render 3D shadow effect on coastlines - outside only, no smoothing
     */
    _renderCoastline3D(ctx, bounds) {
        if (!this.heights || !this.voronoi) return;
        
        const zoom = this.viewport.zoom;
        const shadowWidth = 3 / zoom;
        
        // Collect all coastline edges from land cells
        const coastEdges = [];
        
        for (let i = 0; i < this.cellCount; i++) {
            if (this.heights[i] < ELEVATION.SEA_LEVEL) continue; // Skip ocean
            
            const cell = this.voronoi.cellPolygon(i);
            if (!cell || cell.length < 3) continue;
            
            const neighbors = Array.from(this.voronoi.neighbors(i));
            
            // Check each edge of this land cell
            for (let j = 0; j < cell.length - 1; j++) {
                const v1 = cell[j];
                const v2 = cell[j + 1];
                
                // Find neighbor for this edge
                const edgeMidX = (v1[0] + v2[0]) / 2;
                const edgeMidY = (v1[1] + v2[1]) / 2;
                
                let edgeNeighbor = -1;
                let minDist = Infinity;
                for (const n of neighbors) {
                    const nx = this.points[n * 2];
                    const ny = this.points[n * 2 + 1];
                    const distSq = (nx - edgeMidX) ** 2 + (ny - edgeMidY) ** 2;
                    if (distSq < minDist) {
                        minDist = distSq;
                        edgeNeighbor = n;
                    }
                }
                
                // If neighbor is ocean, this is coastline
                if (edgeNeighbor >= 0 && this.heights[edgeNeighbor] < ELEVATION.SEA_LEVEL) {
                    coastEdges.push({
                        x1: v1[0], y1: v1[1],
                        x2: v2[0], y2: v2[1]
                    });
                }
            }
        }
        
        if (coastEdges.length === 0) return;
        
        // Draw all edges as shadow strokes
        ctx.beginPath();
        for (const edge of coastEdges) {
            ctx.moveTo(edge.x1, edge.y1);
            ctx.lineTo(edge.x2, edge.y2);
        }
        ctx.strokeStyle = 'rgba(30, 60, 100, 0.4)';
        ctx.lineWidth = shadowWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }
    
    /**
     * Allow river to extend one cell into ocean for blending
     */
    _clipPathAtCoastline(path) {
        // Don't clip - let rivers extend into ocean for natural blending
        // The river already stops after one ocean cell in _traceRiverToOcean
        return path;
    }
    
    /**
     * Find the intersection point of river with coastline edge
     */
    _findCoastlineIntersection(landCell, oceanCell, landPoint, oceanPoint) {
        const polyLand = this.voronoi.cellPolygon(landCell);
        const polyOcean = this.voronoi.cellPolygon(oceanCell);
        
        if (!polyLand || !polyOcean) {
            // Fallback to midpoint
            return {
                x: (landPoint.x + oceanPoint.x) / 2,
                y: (landPoint.y + oceanPoint.y) / 2
            };
        }
        
        // Find shared edge vertices
        const tolerance = 1;
        const sharedVertices = [];
        
        for (let i = 0; i < polyLand.length - 1; i++) {
            const vL = polyLand[i];
            for (let j = 0; j < polyOcean.length - 1; j++) {
                const vO = polyOcean[j];
                const dist = Math.sqrt((vL[0] - vO[0]) ** 2 + (vL[1] - vO[1]) ** 2);
                if (dist < tolerance) {
                    sharedVertices.push({ x: vL[0], y: vL[1] });
                    break;
                }
            }
        }
        
        if (sharedVertices.length >= 2) {
            // Find intersection of river line with the shared edge
            const edgeStart = sharedVertices[0];
            const edgeEnd = sharedVertices[1];
            
            // Line-line intersection
            const intersection = this._lineIntersection(
                landPoint.x, landPoint.y, oceanPoint.x, oceanPoint.y,
                edgeStart.x, edgeStart.y, edgeEnd.x, edgeEnd.y
            );
            
            if (intersection) {
                return intersection;
            }
            
            // Fallback: midpoint of shared edge
            return {
                x: (edgeStart.x + edgeEnd.x) / 2,
                y: (edgeStart.y + edgeEnd.y) / 2
            };
        }
        
        // Fallback to midpoint between cells
        return {
            x: (landPoint.x + oceanPoint.x) / 2,
            y: (landPoint.y + oceanPoint.y) / 2
        };
    }
    
    /**
     * Calculate intersection point of two line segments
     */
    _lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 0.0001) return null;
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        
        return {
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1)
        };
    }
    
    /**
     * Interpolate river path using D3-style cardinal spline (tension 0.5)
     */
    _interpolateRiverPathD3(path) {
        if (path.length < 3) return path;
        
        const result = [];
        const tension = 0.5;  // Cardinal spline tension (0 = Catmull-Rom, 1 = straight lines)
        const segments = 16;  // Points between each original point
        
        for (let i = 0; i < path.length - 1; i++) {
            const p0 = path[Math.max(0, i - 1)];
            const p1 = path[i];
            const p2 = path[i + 1];
            const p3 = path[Math.min(path.length - 1, i + 2)];
            
            // Add first point
            if (i === 0) {
                result.push({ x: p1.x, y: p1.y });
            }
            
            // For the last segment, use fewer interpolation steps and end exactly at p2
            const isLastSegment = (i === path.length - 2);
            const segCount = isLastSegment ? 8 : segments;
            
            // Cardinal spline interpolation
            for (let t = 1; t <= segCount; t++) {
                const s = t / segCount;
                const s2 = s * s;
                const s3 = s2 * s;
                
                // Cardinal spline basis functions with tension
                const t0 = -tension * s + 2 * tension * s2 - tension * s3;
                const t1 = 1 + (tension - 3) * s2 + (2 - tension) * s3;
                const t2 = tension * s + (3 - 2 * tension) * s2 + (tension - 2) * s3;
                const t3 = -tension * s2 + tension * s3;
                
                let x = t0 * p0.x + t1 * p1.x + t2 * p2.x + t3 * p3.x;
                let y = t0 * p0.y + t1 * p1.y + t2 * p2.y + t3 * p3.y;
                
                // Force last point to be exactly the end point
                if (isLastSegment && t === segCount) {
                    x = p2.x;
                    y = p2.y;
                }
                
                result.push({ x, y });
            }
        }
        
        return result;
    }
    
    /**
     * Interpolate river path using Catmull-Rom spline for smoothness
     */
    _interpolateRiverPath(path) {
        if (path.length < 3) return path;
        
        const result = [];
        const segments = 4; // Points between each original point
        
        for (let i = 0; i < path.length - 1; i++) {
            const p0 = path[Math.max(0, i - 1)];
            const p1 = path[i];
            const p2 = path[i + 1];
            const p3 = path[Math.min(path.length - 1, i + 2)];
            
            // Add first point
            if (i === 0) {
                result.push({ x: p1.x, y: p1.y });
            }
            
            // Interpolate between p1 and p2
            for (let t = 1; t <= segments; t++) {
                const s = t / segments;
                const s2 = s * s;
                const s3 = s2 * s;
                
                // Catmull-Rom spline formula
                const x = 0.5 * (
                    (2 * p1.x) +
                    (-p0.x + p2.x) * s +
                    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * s2 +
                    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * s3
                );
                
                const y = 0.5 * (
                    (2 * p1.y) +
                    (-p0.y + p2.y) * s +
                    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * s2 +
                    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * s3
                );
                
                result.push({ x, y });
            }
        }
        
        return result;
    }
    
    /**
     * Render river source points as bright markers
     */
    _renderRiverSources(ctx, bounds) {
        if (!this.riverStartPoints || this.riverStartPoints.length === 0) return;
        
        const radius = Math.max(8, 12 / this.viewport.zoom);
        
        for (const point of this.riverStartPoints) {
            // Frustum culling
            if (point.x < bounds.left - radius || point.x > bounds.right + radius ||
                point.y < bounds.top - radius || point.y > bounds.bottom + radius) continue;
            
            // Bright magenta circle with black outline
            ctx.beginPath();
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgb(255, 0, 255)';
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2 / this.viewport.zoom;
            ctx.stroke();
        }
    }
    
    /**
     * Set hovered cell and re-render
     */
    setHoveredCell(cellIndex) {
        if (this.hoveredCell !== cellIndex) {
            this.hoveredCell = cellIndex;
            this._debouncedRender();
        }
    }

    /**
     * Fast contour-based terrain rendering using rasterization
     * Much faster than recursive subdivision
     */
    _renderContourTerrain(ctx, bounds, isGrayscale) {
        // Check if we need to regenerate contours
        const needsRegenerate = !this._contourCache || 
            this._contourCache.subdivisionLevel !== this.subdivisionLevel ||
            this._contourCache.heightsHash !== this._getHeightsHash();
        
        if (needsRegenerate) {
            this._generateContourCache();
        }
        
        if (!this._contourCache || !this._contourCache.contours) return;
        
        const { contours, scaleX, scaleY } = this._contourCache;
        
        // Render contours from low to high (painter's algorithm)
        ctx.lineJoin = 'round';
        ctx.lineWidth = 0.5 / this.viewport.zoom;
        
        for (const contour of contours) {
            const elevation = contour.value;
            const color = isGrayscale ? this._getGrayscale(elevation) : this._getElevationColor(elevation);
            
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            ctx.beginPath();
            
            // Draw each polygon in the MultiPolygon
            for (const polygon of contour.coordinates) {
                for (const ring of polygon) {
                    if (ring.length < 3) continue;
                    
                    ctx.moveTo(ring[0][0] * scaleX, ring[0][1] * scaleY);
                    for (let i = 1; i < ring.length; i++) {
                        ctx.lineTo(ring[i][0] * scaleX, ring[i][1] * scaleY);
                    }
                    ctx.closePath();
                }
            }
            
            ctx.fill();
            ctx.stroke();
        }
        
        this.metrics.visibleCells = this.cellCount;
    }
    
    /**
     * Generate and cache contour data
     */
    _generateContourCache() {
        // Grid resolution based on subdivision level
        const baseRes = 200;
        const resolution = baseRes * (1 + this.subdivisionLevel * 0.5);
        
        const gridWidth = Math.ceil(Math.min(resolution, this.width));
        const gridHeight = Math.ceil(Math.min(resolution, this.height));
        
        const cellWidth = this.width / gridWidth;
        const cellHeight = this.height / gridHeight;
        
        // Build elevation grid by sampling Voronoi cells
        const grid = new Float32Array(gridWidth * gridHeight);
        let minElev = Infinity, maxElev = -Infinity;
        
        for (let gy = 0; gy < gridHeight; gy++) {
            for (let gx = 0; gx < gridWidth; gx++) {
                const wx = (gx + 0.5) * cellWidth;
                const wy = (gy + 0.5) * cellHeight;
                
                // Find cell at this point
                const cellIndex = this.delaunay.find(wx, wy);
                const elevation = cellIndex >= 0 ? this.heights[cellIndex] : 0;
                
                grid[gy * gridWidth + gx] = elevation;
                minElev = Math.min(minElev, elevation);
                maxElev = Math.max(maxElev, elevation);
            }
        }
        
        // Number of contour levels based on subdivision level
        const numLevels = 20 + this.subdivisionLevel * 30;
        
        // Generate thresholds from min to max elevation
        const thresholds = [];
        for (let i = 0; i <= numLevels; i++) {
            thresholds.push(minElev + (maxElev - minElev) * (i / numLevels));
        }
        
        // Use d3.contours for fast marching squares
        const contourGenerator = d3.contours()
            .size([gridWidth, gridHeight])
            .thresholds(thresholds);
        
        const contours = contourGenerator(grid);
        
        // Cache the results
        this._contourCache = {
            contours,
            scaleX: this.width / gridWidth,
            scaleY: this.height / gridHeight,
            subdivisionLevel: this.subdivisionLevel,
            heightsHash: this._getHeightsHash()
        };
    }
    
    /**
     * Simple hash of heights array for cache invalidation
     */
    _getHeightsHash() {
        if (!this.heights || this.heights.length === 0) return 0;
        // Sample a few values for quick hash
        const samples = [0, 
            Math.floor(this.heights.length / 4),
            Math.floor(this.heights.length / 2),
            Math.floor(this.heights.length * 3 / 4),
            this.heights.length - 1
        ];
        let hash = this.heights.length;
        for (const i of samples) {
            hash = hash * 31 + (this.heights[i] | 0);
        }
        return hash;
    }
    
    /**
     * Clear contour cache (call when heights change)
     */
    clearContourCache() {
        this._contourCache = null;
    }
    
    /**
     * Count land cells
     */
    getLandCount() {
        if (!this.terrain) return 0;
        let count = 0;
        for (let i = 0; i < this.cellCount; i++) {
            if (this.terrain[i] === 1) count++;
        }
        return count;
    }
    
    /**
     * Find cell at given screen coordinates (handles viewport transform)
     */
    findCell(screenX, screenY) {
        if (!this.delaunay) return -1;
        
        // Convert screen to world coordinates
        const world = this.screenToWorld(screenX, screenY);
        return this.delaunay.find(world.x, world.y);
    }
    
    /**
     * Find cell at world coordinates (no transform)
     */
    findCellWorld(worldX, worldY) {
        if (!this.delaunay) return -1;
        return this.delaunay.find(worldX, worldY);
    }
    
    /**
     * Get cell polygon by index
     */
    getCellPolygon(index) {
        if (!this.voronoi || index < 0 || index >= this.cellCount) return null;
        return this.voronoi.cellPolygon(index);
    }
    
    /**
     * Get cell center point
     */
    getCellCenter(index) {
        if (index < 0 || index >= this.cellCount) return null;
        return {
            x: this.points[index * 2],
            y: this.points[index * 2 + 1]
        };
    }
    
    /**
     * Get cell height
     */
    getCellHeight(index) {
        if (!this.heights || index < 0 || index >= this.cellCount) return null;
        return this.heights[index];
    }
    
    /**
     * Check if cell is land
     */
    isLand(index) {
        if (!this.terrain || index < 0 || index >= this.cellCount) return false;
        return this.terrain[index] === 1;
    }
    
    /**
     * Get neighboring cell indices
     */
    getNeighbors(index) {
        if (!this.voronoi || index < 0 || index >= this.cellCount) return [];
        return Array.from(this.voronoi.neighbors(index));
    }
    
    /**
     * Export cell data for map generation
     */
    exportData() {
        if (!this.voronoi) return null;
        
        const cells = [];
        
        for (let i = 0; i < this.cellCount; i++) {
            const polygon = this.voronoi.cellPolygon(i);
            if (!polygon) continue;
            
            // Calculate centroid and area
            let cx = 0, cy = 0, area = 0;
            for (let j = 0; j < polygon.length - 1; j++) {
                const cross = polygon[j][0] * polygon[j + 1][1] - polygon[j + 1][0] * polygon[j][1];
                area += cross;
                cx += (polygon[j][0] + polygon[j + 1][0]) * cross;
                cy += (polygon[j][1] + polygon[j + 1][1]) * cross;
            }
            area = Math.abs(area / 2);
            if (area > 0) {
                cx /= (6 * area / (area > 0 ? 1 : -1));
                cy /= (6 * area / (area > 0 ? 1 : -1));
            } else {
                cx = this.points[i * 2];
                cy = this.points[i * 2 + 1];
            }
            
            const cellData = {
                id: i,
                center: { x: this.points[i * 2], y: this.points[i * 2 + 1] },
                centroid: { x: cx, y: cy },
                area: area,
                polygon: polygon.map(p => ({ x: p[0], y: p[1] })),
                neighbors: this.getNeighbors(i)
            };
            
            // Add elevation data if available (in meters)
            if (this.heights) {
                cellData.elevation = this.heights[i];  // meters (-4000 to 6000)
                cellData.isLand = this.terrain[i] === 1;
                cellData.isOcean = this.terrain[i] === 0;
            }
            
            cells.push(cellData);
        }
        
        return {
            width: this.width,
            height: this.height,
            cellCount: this.cellCount,
            elevation: {
                unit: 'meters',
                seaLevel: ELEVATION.SEA_LEVEL,
                maxHeight: ELEVATION.MAX,
                maxDepth: ELEVATION.MIN
            },
            seaLevelThreshold: this.seaLevel,  // The 0-1 value used to determine land/water ratio
            cells: cells
        };
    }
    
    /**
     * Export as PNG data URL
     */
    exportPNG() {
        return this.canvas.toDataURL('image/png');
    }
}
