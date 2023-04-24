import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { nowUtc } from '../utils/time';
import type { TimestampSecs } from '../utils/types';

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

export interface Listener {
    setup?: SetupCallback;
    render?: RenderCallback;
    ready: boolean;
    mounted: boolean;
}

export interface CanvasContext {
    add(fn: Listener): Promise<void>;

    remove(fn: Listener): void;
}

export interface ICanvasListeners {
    mousemove: CanvasListener[];
    mouseup: CanvasListener[];
    mousedown: CanvasListener[];
    touchstart: CanvasListener[];
    touchmove: CanvasListener[];
    touchend: CanvasListener[];
    wheel: CanvasListener[];
}

export interface ICanvasState extends ICanvasListeners {
    width: number;
    height: number;
    pixelRatio: number;
    ctx: null | CanvasRenderingContext2D;
    canvas: null | HTMLCanvasElement;
    time: number;
    cameraOffset: number;
    zoom: number;
}

export class CanvasState implements ICanvasListeners {
    static colours = {
        primary: '#DDD',
        text: '#FFF',
    };

    public width: number;
    public height: number;
    public cameraOffset: number;
    public zoom: number;
    public ctx: CanvasRenderingContext2D | null;
    public canvas: HTMLCanvasElement | null;
    public pixelRatio: number;
    public time: number;

    public readonly mousemove: CanvasListener[];
    public readonly mouseup: CanvasListener[];
    public readonly mousedown: CanvasListener[];
    public readonly touchstart: CanvasListener[];
    public readonly touchmove: CanvasListener[];
    public readonly touchend: CanvasListener[];
    public readonly wheel: CanvasListener[];

    public mouseTime = 0;
    public mouseY = 0;

    public constructor(props: Required<CanvasState>) {
        this.width = props.width;
        this.height = props.height;
        this.cameraOffset = props.cameraOffset;
        this.zoom = props.zoom;
        this.ctx = props.ctx;
        this.canvas = props.canvas;
        this.pixelRatio = props.pixelRatio;
        this.time = props.time;

        this.mousemove = props.mousemove;
        this.mouseup = props.mouseup;
        this.mousedown = props.mousedown;
        this.touchstart = props.touchstart;
        this.touchmove = props.touchmove;
        this.touchend = props.touchend;
        this.wheel = props.wheel;

        this.listen('mousemove', (e) => {
            this.mouseTime = this.getMouseTime(e);
            this.mouseY = this.getMouseYRaw(e);
        });
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
            zoom: START_ZOOM,

            mousemove: [],
            mouseup: [],
            mousedown: [],
            touchstart: [],
            touchmove: [],
            touchend: [],
            wheel: []
        } as unknown as CanvasState);
    }

    public listen<EvtT extends keyof ICanvasListeners>(
        event: EvtT,
        callback: CanvasListener<WindowEventMap[EvtT]>
    ) {
        this[event].push(callback);
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
        return nowUtc(false) -
                pos +
                this.cameraOffset +
                new Date().getTimezoneOffset() * 60
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
                evt.touches?.[0]?.pageX
                || evt.changedTouches?.[0]?.pageX
                || 0;
        } else {
            pageX = (event as MouseEvent).pageX;
        }

        return (pageX - rect.left) * this.canvas.width / rect.width;
    }

    public getMouseTime(event: MouseEvent | TouchEvent): number {
        return this.renderPosToTime(this.getMouseXRaw(event));
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

        return ((pageY - rect.top) * this.canvas.height) / rect.height;
    }

    public rect(
        x: number,
        y: number,
        w: number,
        h: number,
        {
            radius = 0,
            colour = CanvasState.colours.primary
        } = {}
    ) {
        if (!this.ctx) throw new Error('Canvas not set');
        this.ctx.beginPath();
        this.ctx.fillStyle = colour;
        this.ctx.roundRect(x, y, w, h, radius);
        this.ctx.fill();
    }

    public text(
        txt: string,
        x: number,
        y: number,
        {
            c = CanvasState.colours.text,
            maxWidth = undefined,
            align = 'left'
        }: {
            c?: string;
            maxWidth?: number;
            align?: CanvasTextAlign;
        } = {}
    ) {
        if (!this.ctx) throw new Error('Canvas not set');
        this.ctx.beginPath();
        this.ctx.textAlign = align;
        this.ctx.fillStyle = c;
        this.ctx.fillText(txt, x, y, maxWidth);
        this.ctx.fill();
    }

    public circle(
        x: number,
        y: number,
        r: number,
        {
            colour = CanvasState.colours.primary
        } = {}
    ) {
        if (!this.ctx) throw new Error('Canvas not set');
        this.ctx.beginPath();
        this.ctx.fillStyle = colour;
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    public asRenderProps(): RenderProps {
        if (!this.ctx) throw new Error('Canvas not set');
        return this as unknown as RenderProps;
    }
}

export const canvasState = writable(CanvasState.empty());
export const key = Symbol();
