import L from 'leaflet';

/**
 * Creates a pre-rendered radial blur gradient stamp offscreen.
 * Reusing this stamp onto the alpha accumulation canvas makes rendering 1000+ points instantaneous.
 */
function createBrushCanvas(radius: number, blurRatio = 0.85): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const size = radius * 2;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const gradient = ctx.createRadialGradient(radius, radius, radius * (1 - blurRatio), radius, radius, radius);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
  gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

/**
 * Generates an authentic, scientific 256-color gradient ramp for landslide susceptibility:
 * Transparent -> Cool Emerald/Green (Low) -> Amber (Moderate) -> Deep Orange (High) -> Crimson/Purple (Extreme Critical)
 */
function createGradientPalette(): Uint8ClampedArray {
  const paletteCanvas = document.createElement('canvas');
  paletteCanvas.width = 256;
  paletteCanvas.height = 1;
  const ctx = paletteCanvas.getContext('2d');
  if (!ctx) return new Uint8ClampedArray(256 * 4);

  const grad = ctx.createLinearGradient(0, 0, 256, 1);
  grad.addColorStop(0.0, 'rgba(16, 185, 129, 0)');      // 0: transparent
  grad.addColorStop(0.15, 'rgba(16, 185, 129, 0.25)');  // Low (Green)
  grad.addColorStop(0.35, 'rgba(34, 197, 94, 0.55)');   // Light Green
  grad.addColorStop(0.55, 'rgba(234, 179, 8, 0.75)');   // Moderate (Yellow/Amber)
  grad.addColorStop(0.75, 'rgba(249, 115, 22, 0.85)');  // High (Orange)
  grad.addColorStop(0.90, 'rgba(239, 68, 68, 0.95)');   // Critical (Red)
  grad.addColorStop(1.0, 'rgba(185, 28, 28, 1.0)');     // Extreme (Dark Crimson)

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 1);
  return ctx.getImageData(0, 0, 256, 1).data;
}

const PALETTE = createGradientPalette();

/**
 * Leaflet custom Canvas layer that renders a true continuous, interpolated density heat surface
 * without individual spotty dots, circles, or white borders.
 */
export class HeatmapCanvasLayer extends L.Layer {
  private _points: [number, number, number][];
  private _canvas: HTMLCanvasElement | null = null;
  private _ctx: CanvasRenderingContext2D | null = null;
  private _brush: HTMLCanvasElement | null = null;
  private _radius: number;
  private _maxIntensity: number;

  constructor(points: [number, number, number][], options?: { radius?: number; maxIntensity?: number }) {
    super();
    this._points = points;
    this._radius = options?.radius || 32;
    this._maxIntensity = options?.maxIntensity || 1.0;
    this._brush = createBrushCanvas(this._radius);
  }

  public setPoints(points: [number, number, number][]): void {
    this._points = points;
    this._redraw();
  }

  public onAdd(map: L.Map): this {
    this._canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-canvas-layer') as HTMLCanvasElement;
    this._canvas.style.position = 'absolute';
    this._canvas.style.pointerEvents = 'none';
    this._canvas.style.zIndex = '350';
    this._canvas.style.mixBlendMode = 'normal';

    const pane = map.getPane('overlayPane') || map.getPanes().overlayPane;
    pane.appendChild(this._canvas);

    this._ctx = this._canvas.getContext('2d', { willReadFrequently: true });

    map.on('moveend resize viewreset zoomend', this._reset, this);
    this._reset();
    return this;
  }

  public onRemove(map: L.Map): this {
    if (this._canvas && this._canvas.parentNode) {
      this._canvas.parentNode.removeChild(this._canvas);
    }
    map.off('moveend resize viewreset zoomend', this._reset, this);
    this._canvas = null;
    this._ctx = null;
    return this;
  }

  private _reset(): void {
    if (!this._map || !this._canvas) return;

    const topLeft = this._map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this._canvas, topLeft);

    const size = this._map.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;

    this._redraw();
  }

  private _redraw(): void {
    if (!this._map || !this._canvas || !this._ctx || !this._brush) return;
    if (!this._points || this._points.length === 0) {
      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
      return;
    }

    const width = this._canvas.width;
    const height = this._canvas.height;
    const ctx = this._ctx;

    // 1. Offscreen Accumulation Canvas (Greyscale intensity / alpha channel)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = width;
    shadowCanvas.height = height;
    const shadowCtx = shadowCanvas.getContext('2d');
    if (!shadowCtx) return;

    const zoom = this._map.getZoom();
    // Dynamically scale brush radius with zoom level for seamless multi-scale continuity
    const zoomScale = Math.max(0.65, Math.min(2.2, Math.pow(1.22, zoom - 8)));
    const currentRadius = Math.round(this._radius * zoomScale);
    const brush = createBrushCanvas(currentRadius, 0.82);

    const bounds = this._map.getBounds();
    // Pad bounds so edge points naturally blend into visible viewport
    const padFactor = 0.08;
    const latSpan = bounds.getNorth() - bounds.getSouth();
    const lngSpan = bounds.getEast() - bounds.getWest();
    const north = bounds.getNorth() + latSpan * padFactor;
    const south = bounds.getSouth() - latSpan * padFactor;
    const east = bounds.getEast() + lngSpan * padFactor;
    const west = bounds.getWest() - lngSpan * padFactor;

    for (let i = 0; i < this._points.length; i++) {
      const [lat, lng, val] = this._points[i];
      if (lat < south || lat > north || lng < west || lng > east) continue;

      const point = this._map.latLngToContainerPoint([lat, lng]);
      // Normalize alpha intensity (0.15 -> 0.70) to prevent immediate saturated blowouts
      const alpha = Math.min(1.0, Math.max(0.18, (val / this._maxIntensity) * 0.65));

      shadowCtx.globalAlpha = alpha;
      shadowCtx.drawImage(brush, point.x - currentRadius, point.y - currentRadius);
    }

    // 2. Colorize the grayscale accumulation buffer using the continuous color ramp
    const imgData = shadowCtx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    const len = pixels.length;

    for (let i = 3; i < len; i += 4) {
      const alpha = pixels[i];
      if (alpha === 0) continue;

      // Map alpha (0-255) to color ramp index
      const colorOffset = alpha * 4;
      pixels[i - 3] = PALETTE[colorOffset];     // R
      pixels[i - 2] = PALETTE[colorOffset + 1]; // G
      pixels[i - 1] = PALETTE[colorOffset + 2]; // B
      // Preserve smooth continuous transparency fadeout
      pixels[i] = Math.round(alpha * 0.88);
    }

    ctx.clearRect(0, 0, width, height);
    ctx.putImageData(imgData, 0, 0);
  }
}
