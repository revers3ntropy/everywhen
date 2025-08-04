import { browser } from '$app/environment';
import { theme } from '$lib/stores';
import { writable } from 'svelte/store';
import { nowUtc } from '$lib/utils/time';
import type { Interactable } from './interactable';
import { cssVarValue } from '$lib/utils/getCssVar';
import type { CursorStyle, Pixels, TimestampSecs } from '../../../types';
import { CSLogger } from '$lib/controllers/logs/logger.client';

export const START_ZOOM = 1 / (60 * 60);

interface Colors {
    primary: string;
    text: string;
    accent: string;
    lightAccent: string;
    vLightAccent: string;
}

const EMPTY_COLORS: Colors = {
    primary: '',
    text: '',
    accent: '',
    lightAccent: '',
    vLightAccent: ''
};

type CanvasListener<T = MouseEvent & TouchEvent & WheelEvent> = (event: T) => void;

export type RenderProps = Omit<Readonly<CanvasState>, 'ctx'> & {
    ctx: CanvasRenderingContext2D;
};
export type SetupCallback = (props: RenderProps) => void | Promise<void>;
export type RenderCallback = (props: RenderProps, dt: number) => void | Promise<void>;

export interface ContextMenuElement {
    label: string;
    action?: (state: RenderProps, clickX: Pixels, clickY: Pixels) => void | Promise<void>;
}

export type ContextMenuOptions = ContextMenuElement[];

export interface ContextMenu {
    options: ContextMenuOptions;
    x: Pixels;
    y: Pixels;
}

export interface Listener {
    setup?: SetupCallback;
    render?: RenderCallback;
    ready?: boolean;
    mounted?: boolean;
    hovering?: boolean;
}

export interface CanvasContext {
    add(fn: Listener): Promise<void>;

    remove(fn: Listener): void;
}

export interface CanvasListeners {
    mousemove: CanvasListener[];
    mouseup: CanvasListener[];
    mousedown: CanvasListener[];
    touchstart: CanvasListener[];
    touchmove: CanvasListener[];
    touchend: CanvasListener[];
    wheel: CanvasListener[];
    contextmenu: CanvasListener[];
}

export interface ICanvasState extends CanvasListeners {
    width: number;
    height: number;
    pixelRatio: number;
    ctx: null | CanvasRenderingContext2D;
    canvas: null | HTMLCanvasElement;
    time: number;
    cameraOffset: number;
    zoom: number;
    cursor?: CursorStyle;
}

export interface RenderRequest {
    zIndex: number;
    cb: (state: CanvasState) => void;
}

export class CanvasState implements CanvasListeners {
    public width: number;
    public height: number;
    public cameraOffset: number;
    public zoom: number;
    public ctx: CanvasRenderingContext2D | null;
    public pixelRatio: number;
    public time: number;
    public cursor: CursorStyle = 'default';

    private __canvas: HTMLCanvasElement | null;

    public readonly mousemove: CanvasListener[] = [];
    public readonly mouseup: CanvasListener[] = [];
    public readonly mousedown: CanvasListener[] = [];
    public readonly touchstart: CanvasListener[] = [];
    public readonly touchmove: CanvasListener[] = [];
    public readonly touchend: CanvasListener[] = [];
    public readonly wheel: CanvasListener[] = [];
    public readonly contextmenu: CanvasListener[] = [];

    public mouseTime = 0;
    public mouseY = 0;

    private interactables: Interactable[] = [];
    private renderQueue: RenderRequest[] = [];

    public colors: Colors;

    public constructor(props: ICanvasState) {
        this.width = props.width;
        this.height = props.height;
        this.cameraOffset = props.cameraOffset;
        this.zoom = props.zoom;
        this.pixelRatio = props.pixelRatio;
        this.time = props.time;
        this.colors = EMPTY_COLORS;

        this.ctx = props.ctx;
        this.__canvas = props.canvas;
        this.canvas = props.canvas;

        this.listen('mousemove', e => {
            this.mouseTime = this.getMouseTime(e);
            this.mouseY = this.getMouseYRaw(e);
            this.updateHoveringOnInteractables();
        });

        this.listen('touchmove', e => {
            this.mouseTime = this.getMouseTime(e);
            this.mouseY = this.getMouseYRaw(e);
            this.updateHoveringOnInteractables();
        });

        this.listen('mouseup', event => {
            if (event.button !== 0) return;

            this.hideContextMenu();
            const state = this.asRenderProps();

            for (const interactable of this.interactables) {
                if (!interactable.hovering || !interactable.mounted) continue;
                interactable.onMouseUp?.(state, this.mouseTime, this.mouseY, false);
                return;
            }
        });

        this.listen('mousedown', event => {
            if (event.button !== 0) return;

            const state = this.asRenderProps();

            for (const interactable of this.interactables) {
                if (!interactable.hovering || !interactable.mounted) continue;
                interactable.onMouseDown?.(state, this.mouseTime, this.mouseY, false);
                return;
            }
        });

        this.listen('touchend', event => {
            const time = this.getMouseTime(event);
            const y = this.getMouseYRaw(event);
            const state = this.asRenderProps();

            for (const interactable of this.interactables) {
                if (!interactable.hovering || !interactable.mounted) continue;
                interactable.onMouseUp?.(state, time, y, true);
                return;
            }
        });

        this.listen('touchstart', event => {
            const time = this.getMouseTime(event);
            const y = this.getMouseYRaw(event);
            const state = this.asRenderProps();

            this.mouseTime = time;
            this.mouseY = y;
            this.updateHoveringOnInteractables();

            for (const interactable of this.interactables) {
                if (!interactable.hovering || !interactable.mounted) continue;
                interactable.onMouseDown?.(state, time, y, true);
                return;
            }
        });

        this.listen('contextmenu', evt => {
            for (const interactable of this.interactables) {
                if (!interactable.hovering || !interactable.contextMenu || !interactable.mounted) {
                    continue;
                }
                evt.preventDefault();
                this.showContextMenu(interactable.contextMenu, evt);
                return;
            }
        });

        theme.subscribe(() => {
            // wait for variables to be changed
            setTimeout(() => {
                this.updateColors();
            }, 0);
        });
    }

    public get canvas(): HTMLCanvasElement | null {
        return this.__canvas;
    }

    public set canvas(canvas: HTMLCanvasElement | null) {
        this.__canvas = canvas;
        this.updateColors();
        if (canvas) {
            this.ctx = canvas.getContext('2d');
        }
    }

    private updateColors() {
        // because the instance is initialised on the server,
        // we need to update the color pallet once the canvas is mounted

        if (this.canvas && browser) {
            this.colors = {
                primary: cssVarValue(this.canvas, '--light-accent'),
                text: cssVarValue(this.canvas, '--text-color'),
                accent: cssVarValue(this.canvas, '--timeline-accent'),
                lightAccent: cssVarValue(this.canvas, '--border-light'),
                vLightAccent: cssVarValue(this.canvas, '--background-color')
            };
        } else {
            this.colors = EMPTY_COLORS;
        }
    }

    private showContextMenu(options: ContextMenuOptions, event: MouseEvent) {
        const x = this.getMouseXRaw(event);
        const y = this.getMouseYRaw(event);

        contextMenuState.set({
            options,
            x,
            y
        });
    }

    private hideContextMenu() {
        contextMenuState.set(null);
    }

    private updateHoveringOnInteractables() {
        const queue = this.interactables
            .filter(e => e.mounted)
            .map(i => (i.collider ? ([i.collider?.(this.asRenderProps()), i] as const) : null))
            .filter(Boolean)
            .sort(([a], [b]) => (b?.zIndex || 0) - (a?.zIndex || 0));

        while (queue.length) {
            const next = queue.shift();
            if (!next) continue;
            const [collider, interactable] = next;

            const hovering = collider?.colliding?.(
                this.asRenderProps(),
                this.mouseTime,
                this.mouseY
            );

            interactable.hovering = hovering;
            if (hovering) {
                // only hover one thing at a time
                for (const [, other] of queue) {
                    other.hovering = false;
                }
                return;
            }
        }
    }

    public handleResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.pixelRatio = window.devicePixelRatio;
    }

    public flushRenderQueue() {
        this.renderQueue.sort((a, b) => a.zIndex - b.zIndex);
        for (const req of this.renderQueue) {
            req.cb(this);
        }
        this.renderQueue = [];
    }

    static empty(): CanvasState {
        return new CanvasState({
            width: browser ? window.innerWidth : 0,
            height: browser ? window.innerHeight : 0,
            pixelRatio: browser ? window.devicePixelRatio : 0,
            ctx: null,
            canvas: null,
            time: 0,
            cameraOffset: 0,
            zoom: START_ZOOM
        } as unknown as CanvasState);
    }

    public listen<EvtT extends keyof CanvasListeners>(
        event: EvtT,
        callback: CanvasListener<WindowEventMap[EvtT]>
    ) {
        this[event].push(callback);
    }

    public registerInteractable(interactable: Interactable) {
        this.interactables.push(interactable);
    }

    public center(): number {
        return this.width / 2;
    }

    public centerLnY(): number {
        return (this.height * 3) / 4;
    }

    public zoomScaledPosition(pos: Pixels, zoom: number, center: Pixels): Pixels {
        return (pos - center) * zoom + center;
    }

    public timeToX(t: TimestampSecs): Pixels {
        t = nowUtc(false) - t + this.cameraOffset;
        t = this.zoomScaledPosition(t, this.zoom, this.cameraOffset);
        return this.width - t;
    }

    public dateToRenderPos(
        year: number,
        month = 0,
        date = 1,
        hour = 0,
        minute = 0,
        second = 0
    ): number {
        const t = new Date(year, month, date, hour, minute, second).getTime() / 1000;
        return this.timeToX(t);
    }

    public xToTime(pos: Pixels): TimestampSecs {
        pos = this.width - pos;
        pos = this.zoomScaledPosition(pos, 1 / this.zoom, this.cameraOffset);
        return nowUtc(false) - pos + this.cameraOffset;
    }

    public zoomOnCenter(deltaZoom: number) {
        const centerTime = this.xToTime(this.width / 2);

        this.zoom *= deltaZoom;
        this.zoom = Math.max(Math.min(100, this.zoom), 1e-10);

        const newCenterTime = this.xToTime(this.width / 2);
        this.cameraOffset -= (newCenterTime - centerTime) * this.zoom;
    }

    public getMouseXRaw(event: MouseEvent | TouchEvent): number {
        if (!this.canvas) throw new Error('Canvas not set');
        const rect = this.canvas.getBoundingClientRect();

        let pageX: number;
        if (
            event.type === 'touchstart' ||
            event.type === 'touchmove' ||
            event.type === 'touchend' ||
            event.type === 'touchcancel'
        ) {
            const evt =
                'originalEvent' in event
                    ? (event.originalEvent as TouchEvent)
                    : (event as TouchEvent);
            pageX = evt.touches?.[0]?.pageX || evt.changedTouches?.[0]?.pageX || 0;
        } else {
            pageX = (event as MouseEvent).pageX;
        }

        return ((pageX - rect.left) * this.canvas.width) / rect.width / this.pixelRatio;
    }

    public getMouseYRaw(event: MouseEvent | TouchEvent): number {
        if (!this.canvas) throw new Error('Canvas not set');
        const rect = this.canvas.getBoundingClientRect();

        let pageY: number;
        if (
            event.type === 'touchstart' ||
            event.type === 'touchmove' ||
            event.type === 'touchend' ||
            event.type === 'touchcancel'
        ) {
            const evt =
                'originalEvent' in event
                    ? (event.originalEvent as TouchEvent)
                    : (event as TouchEvent);
            pageY = evt.touches?.[0]?.pageY || evt.changedTouches?.[0]?.pageY || 0;
        } else {
            pageY = (event as MouseEvent).pageY;
        }

        return ((pageY - rect.top) * this.canvas.height) / rect.height / this.pixelRatio;
    }

    public cameraOffsetForTime(time: TimestampSecs | null = null, acrossScreen = 3 / 4): number {
        if (time === null) {
            time = nowUtc(false);
        }
        const offset = this.cameraOffset;
        this.cameraOffset = 0;
        const nowRenderPos = this.timeToX(time);
        this.cameraOffset = offset;
        return nowRenderPos - this.width * acrossScreen;
    }

    public getMouseTime(event: MouseEvent | TouchEvent): number {
        return this.xToTime(this.getMouseXRaw(event));
    }

    public moveX(x: number) {
        this.cameraOffset += x;
    }

    public zoomTo(start: TimestampSecs, end: TimestampSecs, marginPercent = 0.25) {
        const marginedStart = start - (end - start) * marginPercent;
        const marginedEnd = end + (end - start) * marginPercent;
        this.zoom = this.width / (marginedEnd - marginedStart);
        this.cameraOffset = this.cameraOffsetForTime(marginedStart, 0);
    }

    public rect(
        x: number,
        y: number,
        w: number,
        h: number,
        { radius = 0, color = this.colors.primary, wireframe = false, zIndex = 0 } = {}
    ) {
        if (!this.ctx) throw 'Canvas not set';
        if (zIndex < 0) throw 'zIndex < 0';
        if (zIndex !== 0) {
            this.renderQueue.push({
                zIndex,
                cb: () => this.rect(x, y, w, h, { radius, color, wireframe })
            });
            return;
        }

        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.roundRect(x, y, w, h, radius);
        if (wireframe) {
            this.ctx.stroke();
            return;
        }
        this.ctx.fill();
    }

    public text(
        txt: string,
        x: number,
        y: number,
        {
            color = this.colors.text,
            maxWidth = undefined,
            align = 'left',
            backgroundColor = undefined,
            backgroundPadding = 2,
            fontSize = 10,
            font = 'sans-serif',
            backgroundRadius = 0,
            zIndex = 1
        }: {
            color?: string;
            maxWidth?: number;
            align?: CanvasTextAlign;
            backgroundColor?: string;
            backgroundPadding?: Pixels;
            fontSize?: Pixels;
            font?: string;
            backgroundRadius?: number;
            zIndex?: number;
        } = {}
    ) {
        if (!this.ctx) throw new Error('Canvas not set');
        if (zIndex < 0) throw 'zIndex < 0';
        if (zIndex !== 0) {
            this.renderQueue.push({
                zIndex,
                cb: () =>
                    this.text(txt, x, y, {
                        color,
                        maxWidth,
                        align,
                        backgroundColor,
                        backgroundPadding,
                        fontSize,
                        font,
                        backgroundRadius,
                        zIndex: 0
                    })
            });
            return;
        }

        const fontFmt = `${fontSize}px ${font}`;

        if (backgroundColor) {
            this.ctx.font = fontFmt;
            const { width } = this.ctx.measureText(txt);

            let backgroundX = x;
            switch (align) {
                case 'center':
                    backgroundX -= width / 2;
                    break;
                case 'right':
                    backgroundX -= width;
                    break;
            }

            this.rect(
                backgroundX - backgroundPadding,
                y - backgroundPadding,
                width + backgroundPadding * 2,
                fontSize + backgroundPadding,
                {
                    color: backgroundColor,
                    radius: backgroundRadius
                }
            );
        }

        this.ctx.beginPath();
        this.ctx.font = fontFmt;
        this.ctx.textBaseline = 'hanging';
        this.ctx.textAlign = align;
        this.ctx.fillStyle = color;
        this.ctx.fillText(txt, x, y, maxWidth);
        this.ctx.fill();
    }

    public circle(
        x: number,
        y: number,
        r: number,
        { color = this.colors.primary, zIndex = 0, wireframe = false } = {}
    ) {
        if (!this.ctx) throw new Error('Canvas not set');
        if (zIndex < 0) throw 'zIndex < 0';
        if (zIndex !== 0) {
            this.renderQueue.push({
                zIndex,
                cb: () => this.circle(x, y, r, { color })
            });
            return;
        }

        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        if (wireframe) {
            this.ctx.stroke();
            return;
        }
        this.ctx.fill();
    }

    public asRenderProps(): RenderProps {
        if (!this.ctx) {
            void CSLogger.error('canvas not set', {});
            throw new Error('Canvas not set');
        }
        return this as unknown as RenderProps;
    }
}

export const canvasState = writable(CanvasState.empty());
export const contextMenuState = writable<ContextMenu | null>(null);
export const key = Symbol();
