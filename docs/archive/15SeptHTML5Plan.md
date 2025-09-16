# HTML5 Puzzle Grid Rendering Plan
## September 15, 2025

**Authored by:** Cascade using Claude 4 Sonnet  
**Project:** HARC Platform

## Overview

This document outlines the design and implementation plan for a new HTML5-based puzzle grid component that will replace or complement the current div-based grid system. The component will use either HTML5 Canvas or SVG to render ARC-AGI puzzle grids with enhanced performance, scalability, and visual quality.

## Current System Analysis

### Existing Implementation
- **Current Component**: `ResponsiveOfficerGrid` + `EnhancedGridCell`
- **Rendering Method**: Individual React div elements for each cell
- **Grid Data**: `ARCGrid` (number[][] with values 0-9)
- **Emoji System**: 40+ emoji sets from `spaceEmojis.ts` with 0-9 mapping
- **Display Modes**: emoji, arc-colors, hybrid
- **Interaction**: Click/drag painting, cell selection, hover effects
- **Sizing**: Responsive via `useResponsiveGridSize` hook

### Current Limitations
1. **Performance**: Large grids (30x30) create 900+ DOM elements
2. **Scaling**: CSS scaling can cause pixelation of emojis at small sizes
3. **Grid Lines**: Currently handled via CSS borders, limited styling options
4. **Memory Usage**: Heavy DOM tree for complex puzzles
5. **Animation**: Limited smooth transition capabilities

## HTML5 Approach Comparison

### Canvas Approach

#### Pros
- **Performance**: Single DOM element, direct pixel manipulation
- **Smooth Scaling**: Programmatic resizing without CSS limitations
- **Grid Lines**: Perfect control over line rendering and styling
- **Animations**: Smooth transitions and effects possible
- **Memory**: Minimal DOM footprint
- **Text Rendering**: Canvas measureText() for optimal emoji sizing

#### Cons
- **Accessibility**: Requires custom accessibility implementation
- **Event Handling**: Manual coordinate-to-cell mapping needed
- **SEO**: No semantic HTML structure
- **Responsive**: Must handle resize events manually
- **Complexity**: More complex interaction handling

### SVG Approach

#### Pros
- **Scalability**: Vector-based, perfect scaling at any size
- **Accessibility**: Native SVG accessibility features
- **CSS Integration**: Can use existing CSS classes and animations
- **Event Handling**: Native DOM events on SVG elements
- **Semantic**: Maintains document structure
- **Grid Lines**: Clean vector line rendering

#### Cons
- **Performance**: Still creates many DOM elements for large grids
- **Emoji Rendering**: Complex emoji positioning and sizing
- **Browser Compatibility**: Some older browser issues with SVG text
- **Memory**: Still has DOM elements, though potentially lighter

## Recommended Implementation: Hybrid Canvas + SVG

### Architecture Decision
**Primary**: Canvas for grid rendering and interaction detection  
**Secondary**: SVG overlay for accessibility and semantic information  
**Fallback**: Current div-based system for incompatible browsers

### Component Structure
```
HTMLPuzzleGrid/
├── CanvasGridRenderer.tsx     # Core canvas rendering logic
├── SVGGridOverlay.tsx         # Accessibility and semantic overlay
├── GridInteractionHandler.tsx # Mouse/touch event management
├── GridScalingEngine.tsx      # Dynamic sizing and DPI handling
└── HTMLPuzzleGrid.tsx         # Main component wrapper
```

## Technical Specifications

### Canvas Implementation Details

#### Grid Rendering Pipeline
1. **Setup Phase**
   - Calculate optimal cell size based on container dimensions
   - Determine emoji font size using Canvas measureText()
   - Set up high-DPI rendering for crisp display

2. **Drawing Phase**
   - Clear canvas and draw background
   - Render grid lines using precise coordinates
   - Draw cell backgrounds (ARC colors when applicable)
   - Render emojis with proper centering and sizing

3. **Interaction Phase**
   - Convert mouse coordinates to grid coordinates
   - Handle click, drag, and hover events
   - Update visual state and trigger callbacks

#### Canvas Scaling Strategy
```typescript
interface CanvasScaling {
  // Physical canvas size in CSS pixels
  canvasWidth: number;
  canvasHeight: number;
  
  // Logical grid dimensions
  gridRows: number;
  gridCols: number;
  
  // Cell size in canvas units
  cellSize: number;
  
  // Device pixel ratio for crisp rendering
  devicePixelRatio: number;
  
  // Emoji font size calculation
  emojiSize: number;
}
```

### Emoji Rendering System

#### Font Size Calculation
```typescript
function calculateEmojiSize(cellSize: number, canvasContext: CanvasRenderingContext2D): number {
  const baseSize = cellSize * 0.7; // 70% of cell size
  const testEmoji = '🚀';
  
  // Use canvas measureText to find optimal size
  canvasContext.font = `${baseSize}px system-ui`;
  const metrics = canvasContext.measureText(testEmoji);
  
  // Adjust if emoji is too wide or tall for cell
  const maxWidth = cellSize * 0.9;
  if (metrics.width > maxWidth) {
    return (baseSize * maxWidth) / metrics.width;
  }
  
  return baseSize;
}
```

#### Emoji Positioning
- **Horizontal**: `cellCenterX - (emojiWidth / 2)`
- **Vertical**: `cellCenterY + (emojiHeight / 4)` (baseline offset)
- **Fallback**: Numeric display if emoji fails to render

### Grid Line Rendering

#### Line Types
- **Major Grid Lines**: 1px solid, between all cells
- **Border Lines**: 2px solid around entire grid
- **Selection Lines**: 3px colored lines for selected cells
- **Hover Lines**: 1px dashed for hover state

#### Line Drawing Algorithm
```typescript
function drawGridLines(ctx: CanvasRenderingContext2D, config: GridConfig) {
  ctx.strokeStyle = '#94A3B8'; // slate-400
  ctx.lineWidth = 1;
  
  // Vertical lines
  for (let col = 0; col <= config.gridCols; col++) {
    const x = col * config.cellSize;
    ctx.moveTo(x + 0.5, 0); // +0.5 for crisp 1px lines
    ctx.lineTo(x + 0.5, config.canvasHeight);
  }
  
  // Horizontal lines
  for (let row = 0; row <= config.gridRows; row++) {
    const y = row * config.cellSize;
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(config.canvasWidth, y + 0.5);
  }
  
  ctx.stroke();
}
```

### Mouse Interaction System

#### Coordinate Conversion
```typescript
function getGridCoordinates(
  mouseX: number, 
  mouseY: number, 
  canvasRect: DOMRect, 
  config: GridConfig
): { row: number; col: number } | null {
  
  const canvasX = mouseX - canvasRect.left;
  const canvasY = mouseY - canvasRect.top;
  
  // Account for device pixel ratio
  const scaledX = canvasX * config.devicePixelRatio;
  const scaledY = canvasY * config.devicePixelRatio;
  
  const col = Math.floor(scaledX / config.cellSize);
  const row = Math.floor(scaledY / config.cellSize);
  
  // Bounds checking
  if (row >= 0 && row < config.gridRows && col >= 0 && col < config.gridCols) {
    return { row, col };
  }
  
  return null;
}
```

#### Interaction States
- **Hover**: Highlight cell on mousemove
- **Click**: Select cell and trigger value placement
- **Drag**: Paint multiple cells while mouse is down
- **Right Click**: Clear cell (set to 0)
- **Keyboard**: Arrow keys for cell navigation

## Component API Design

### Props Interface
```typescript
interface HTMLPuzzleGridProps {
  // Core grid data
  grid: ARCGrid;
  onChange?: (newGrid: ARCGrid) => void;
  
  // Display options
  displayMode: 'emoji' | 'arc-colors' | 'hybrid';
  emojiSet: EmojiSet;
  
  // Interaction options
  interactive: boolean;
  selectedValue: number;
  onCellClick?: (row: number, col: number, value: number) => void;
  
  // Sizing and appearance
  containerType: 'example' | 'solver' | 'display';
  showGridLines: boolean;
  gridLineColor?: string;
  backgroundColor?: string;
  
  // Canvas-specific options
  enableHighDPI: boolean;
  animationDuration?: number;
  
  // Accessibility
  ariaLabel?: string;
  cellDescriptions?: string[][];
}
```

### Method Interface
```typescript
interface HTMLPuzzleGridMethods {
  // Rendering control
  redraw(): void;
  resize(): void;
  
  // Data export
  exportAsImage(format: 'png' | 'jpeg', quality?: number): string;
  exportAsDataURL(): string;
  
  // Interaction
  setCellValue(row: number, col: number, value: number): void;
  getCellValue(row: number, col: number): number;
  clearGrid(): void;
  
  // Focus management
  focusCell(row: number, col: number): void;
  getFocusedCell(): { row: number; col: number } | null;
}
```

## Performance Optimizations

### Rendering Optimizations
1. **Dirty Rectangle Tracking**: Only redraw changed regions
2. **Canvas Pooling**: Reuse canvas contexts for multiple grids
3. **Emoji Caching**: Pre-render emojis to prevent repeated font loading
4. **Viewport Culling**: Skip drawing for off-screen grids
5. **Animation Frame Throttling**: Limit redraws to 60fps

### Memory Management
1. **Canvas Size Limits**: Cap maximum canvas dimensions
2. **Cleanup Handlers**: Remove event listeners on unmount
3. **Image Data Caching**: Cache rendered cells for reuse
4. **Garbage Collection**: Clear temporary objects promptly

## Accessibility Implementation

### Screen Reader Support
- **SVG Overlay**: Invisible SVG grid with proper ARIA labels
- **Cell Descriptions**: Announce cell coordinates and values
- **Live Regions**: Announce grid changes dynamically
- **Focus Management**: Keyboard navigation between cells

### Keyboard Navigation
- **Arrow Keys**: Move focus between cells
- **Number Keys**: Set cell values (0-9)
- **Space/Enter**: Confirm cell selection
- **Delete/Backspace**: Clear cell
- **Tab**: Move to next interactive element

## Browser Compatibility

### Target Support
- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Canvas Features**: 2D context, high-DPI support, measureText
- **Fallback Strategy**: Graceful degradation to div-based rendering

### Feature Detection
```typescript
function supportsHTML5Canvas(): boolean {
  const canvas = document.createElement('canvas');
  return !!(canvas.getContext && canvas.getContext('2d'));
}

function supportsHighDPICanvas(): boolean {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  return ctx && 'devicePixelRatio' in window;
}
```

## Migration Strategy

### Phase 1: Component Development (Week 1)
- [ ] Create basic Canvas grid renderer
- [ ] Implement emoji and color display modes
- [ ] Add mouse interaction handling
- [ ] Create responsive sizing system

### Phase 2: Feature Parity (Week 2)
- [ ] Implement all current grid features
- [ ] Add drag-to-paint functionality
- [ ] Create accessibility overlay
- [ ] Performance optimization

### Phase 3: Integration (Week 3)
- [ ] Replace ResponsiveOfficerGrid in key areas
- [ ] A/B test performance improvements
- [ ] Monitor for rendering issues
- [ ] Gather user feedback

### Phase 4: Full Deployment (Week 4)
- [ ] Complete migration from div-based grids
- [ ] Remove legacy grid components
- [ ] Update documentation
- [ ] Performance benchmarking

## Testing Strategy

### Unit Tests
- Grid coordinate conversion accuracy
- Emoji rendering consistency
- Mouse interaction correctness
- Accessibility feature compliance

### Visual Regression Tests
- Screenshot comparisons across browsers
- Emoji rendering consistency
- Grid line alignment
- Color accuracy validation

### Performance Tests
- Rendering speed benchmarks
- Memory usage profiling
- Large grid performance
- Animation frame rate monitoring

## Security Considerations

### Canvas Security
- **XSS Prevention**: Sanitize any user-provided content
- **Image Export**: Validate export parameters
- **Memory Limits**: Prevent canvas size attacks
- **Input Validation**: Bounds checking for all grid operations

## Future Enhancements

### Advanced Features (Post-MVP)
1. **Grid Animations**: Smooth transitions between states
2. **Mini-map**: Zoomed-out view for large grids
3. **Grid Templates**: Pre-defined grid layouts
4. **Collaboration**: Real-time multi-user editing
5. **Export Options**: PDF, SVG, high-res PNG export

### Performance Improvements
1. **WebGL Renderer**: Hardware-accelerated rendering for huge grids
2. **Web Workers**: Off-main-thread grid processing
3. **Virtual Scrolling**: Render only visible portions of massive grids
4. **WASM**: Native-speed grid algorithms

## Conclusion

The HTML5 Canvas approach offers significant advantages in performance, visual quality, and feature flexibility while maintaining compatibility with the existing emoji system and display modes. The hybrid Canvas + SVG architecture provides the best of both worlds: high-performance rendering with proper accessibility support.

Key benefits of this implementation:
- **50-90% reduction** in DOM elements for large grids
- **Crisp rendering** at any scale via programmatic sizing
- **Smooth interactions** with precise mouse coordinate mapping
- **Enhanced grid lines** with perfect pixel alignment
- **Future-ready** architecture for advanced features

The phased migration approach ensures minimal risk while providing clear performance and user experience improvements throughout the SFMC puzzle platform.

---

*This plan serves as the foundation for implementing a modern, high-performance puzzle grid rendering system that will enhance user experience across all ARC-AGI puzzle interfaces.*
