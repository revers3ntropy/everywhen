import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { CursorStyle, Pixels, TimestampSecs } from '../../app';
import { errorLogger } from '$lib/utils/log';
import { nowUtc } from '$lib/utils/time';
import type { Interactable } from './interactable';

export const START_ZOOM = 1 / (60 * 60);

type CanvasListener<T = MouseEvent & TouchEvent & WheelEvent> = (
    event: T
) => void;

export type RenderProps = Omit<Readonly<CanvasState>, 'ctx'> & {
    ctx: CanvasRenderingContext2D;
};
export type SetupCallback = (props: RenderProps) => void | Promise<void>;
export type RenderCallback = (
    props: RenderProps,
    dt: number
) => void | Promise<void>;

export interface ContextMenuElement {
    label: string;
    action?: (
        state: RenderProps,
        clickX: Pixels,
        clickY: Pixels
    ) => void | Promise<void>;
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
    static colours = {
        primary: '#DDD',
        text: '#FFF',
        accentPrimary: 'rgb(121 235 226)',
        accentSecondary: 'rgb(189 176 255)',
        lightAccent: 'rgb(72 76 80)'
    };

    public readonly colours = CanvasState.colours;

    public width: number;
    public height: number;
    public cameraOffset: number;
    public zoom: number;
    public ctx: CanvasRenderingContext2D | null;
    public canvas: HTMLCanvasElement | null;
    public pixelRatio: number;
    public time: number;
    public cursor: CursorStyle = 'default';

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

    public constructor(props: ICanvasState) {
        this.width = props.width;
        this.height = props.height;
        this.cameraOffset = props.cameraOffset;
        this.zoom = props.zoom;
        this.ctx = props.ctx;
        this.canvas = props.canvas;
        this.pixelRatio = props.pixelRatio;
        this.time = props.time;

        this.listen('mousemove', e => {
            this.mouseTime = this.getMouseTime(e);
            this.mouseY = this.getMouseYRaw(e);

            this.updateHoveringOnInteractables();
        });

        this.listen('mouseup', event => {
            if (event.button !== 0) return;

            this.hideContextMenu();

            for (const interactable of this.interactables) {
                if (!interactable.hovering || !interactable.mounted) continue;
                interactable.onMouseUp?.(
                    this.asRenderProps(),
                    this.mouseTime,
                    this.mouseY
                );
                return;
            }
        });

        this.listen('contextmenu', evt => {
            for (const interactable of this.interactables) {
                if (
                    !interactable.hovering ||
                    !interactable.contextMenu ||
                    !interactable.mounted
                ) {
                    continue;
                }
                evt.preventDefault();
                this.showContextMenu(interactable.contextMenu, evt);
                return;
            }
        });
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
            .map(i =>
                i.collider
                    ? ([i.collider?.(this.asRenderProps()), i] as const)
                    : null
            )
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

    public removeInteractable(interactable: Interactable) {
        this.interactables = this.interactables.filter(i => i !== interactable);
    }

    public center(): number {
        return this.width / 2;
    }

    public centerLnY(): number {
        return (this.height * 3) / 4;
    }

    public zoomScaledPosition(
        pos: number,
        zoom: number,
        center: number
    ): number {
        return (pos - center) * zoom + center;
    }

    public timeToRenderPos(t: TimestampSecs): number {
        t -= new Date().getTimezoneOffset() * 60;
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
        const t =
            new Date(year, month, date, hour, minute, second).getTime() / 1000;
        return this.timeToRenderPos(t);
    }

    public renderPosToTime(pos: number): TimestampSecs {
        pos = this.width - pos;
        pos = this.zoomScaledPosition(pos, 1 / this.zoom, this.cameraOffset);
        return (
            nowUtc(false) -
            pos +
            this.cameraOffset +
            new Date().getTimezoneOffset() * 60
        );
    }

    public zoomOnCenter(deltaZoom: number) {
        const centerTime = this.renderPosToTime(this.width / 2);

        this.zoom *= deltaZoom;
        this.zoom = Math.max(Math.min(100, this.zoom), 1e-10);

        const newCenterTime = this.renderPosToTime(this.width / 2);
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
            pageX =
                evt.touches?.[0]?.pageX || evt.changedTouches?.[0]?.pageX || 0;
        } else {
            pageX = (event as MouseEvent).pageX;
        }

        return (
            ((pageX - rect.left) * this.canvas.width) /
            rect.width /
            this.pixelRatio
        );
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
            pageY =
                evt.touches?.[0]?.pageY || evt.changedTouches?.[0]?.pageY || 0;
        } else {
            pageY = (event as MouseEvent).pageY;
        }

        return (
            ((pageY - rect.top) * this.canvas.height) /
            rect.height /
            this.pixelRatio
        );
    }

    public cameraOffsetForTime(
        time: TimestampSecs | null = null,
        acrossScreen = 3 / 4
    ): number {
        if (time === null) {
            time = nowUtc(false);
        }
        const offset = this.cameraOffset;
        this.cameraOffset = 0;
        const nowRenderPos = this.timeToRenderPos(time);
        this.cameraOffset = offset;
        return nowRenderPos - this.width * acrossScreen;
    }

    public getMouseTime(event: MouseEvent | TouchEvent): number {
        return this.renderPosToTime(this.getMouseXRaw(event));
    }

    public zoomTo(
        start: TimestampSecs,
        end: TimestampSecs,
        marginPercent = 0.25
    ) {
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
        {
            radius = 0,
            colour = CanvasState.colours.primary,
            wireframe = false,
            zIndex = 0
        } = {}
    ) {
        if (!this.ctx) throw new Error('Canvas not set');
        if (zIndex !== 0) {
            this.renderQueue.push({
                zIndex,
                cb: () => this.rect(x, y, w, h, { radius, colour, wireframe })
            });
            return;
        }

        this.ctx.beginPath();
        this.ctx.fillStyle = colour;
        this.ctx.strokeStyle = colour;
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
            colour = CanvasState.colours.text,
            maxWidth = undefined,
            align = 'left',
            backgroundColour = undefined,
            backgroundPadding = 2,
            fontSize = 10,
            font = 'sans-serif',
            backgroundRadius = 0,
            zIndex = 1
        }: {
            colour?: string;
            maxWidth?: number;
            align?: CanvasTextAlign;
            backgroundColour?: string;
            backgroundPadding?: Pixels;
            fontSize?: Pixels;
            font?: string;
            backgroundRadius?: number;
            zIndex?: number;
        } = {}
    ) {
        if (!this.ctx) throw new Error('Canvas not set');
        if (zIndex !== 0) {
            this.renderQueue.push({
                zIndex,
                cb: () =>
                    this.text(txt, x, y, {
                        colour,
                        maxWidth,
                        align,
                        backgroundColour,
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

        if (backgroundColour) {
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
                    colour: backgroundColour,
                    radius: backgroundRadius
                }
            );
        }

        this.ctx.beginPath();
        this.ctx.font = fontFmt;
        this.ctx.textBaseline = 'hanging';
        this.ctx.textAlign = align;
        this.ctx.fillStyle = colour;
        this.ctx.fillText(txt, x, y, maxWidth);
        this.ctx.fill();
    }

    public circle(
        x: number,
        y: number,
        r: number,
        { colour = CanvasState.colours.primary, zIndex = 0 } = {}
    ) {
        if (!this.ctx) throw new Error('Canvas not set');
        if (zIndex !== 0) {
            this.renderQueue.push({
                zIndex,
                cb: () => this.circle(x, y, r, { colour })
            });
            return;
        }

        this.ctx.beginPath();
        this.ctx.fillStyle = colour;
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    public asRenderProps(): RenderProps {
        if (!this.ctx) {
            errorLogger.error('Canvas not set');
            throw new Error('Canvas not set');
        }
        return this as unknown as RenderProps;
    }
}

export const canvasState = writable(CanvasState.empty());
export const contextMenuState = writable<ContextMenu | null>(null);
export const key = Symbol();
