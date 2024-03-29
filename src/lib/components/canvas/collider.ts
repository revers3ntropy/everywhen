import type { Pixels, Seconds, TimestampSecs } from '../../../types';
import type { RenderProps } from './canvasState';

export interface Collider {
    colliding(state: RenderProps, x: number, y: number): boolean;
    debugDraw(state: RenderProps): void;
    zIndex?: number;
}

export class DurationRectCollider implements Collider {
    public readonly zIndex: number = 0;
    constructor(
        public readonly time: TimestampSecs,
        public readonly y: Pixels,
        public readonly duration: Seconds,
        public readonly height: Pixels,
        { zIndex = 0 } = {}
    ) {
        this.zIndex = zIndex;
    }

    colliding(_state: RenderProps, time: TimestampSecs, y: number): boolean {
        return (
            time >= this.time &&
            time <= this.time + this.duration &&
            y >= this.y &&
            y <= this.y + this.height
        );
    }

    public debugDraw(state: RenderProps): void {
        state.rect(state.timeToX(this.time), this.y, this.duration * state.zoom, this.height, {
            color: '#F00',
            wireframe: true,
            zIndex: 100
        });
    }
}

export class RectCollider implements Collider {
    public readonly zIndex: number = 0;
    constructor(
        public readonly x: number,
        public readonly y: number,
        public readonly width: number,
        public readonly height: number,
        { zIndex = 0 } = {}
    ) {
        this.zIndex = zIndex;
    }

    colliding(state: RenderProps, time: TimestampSecs, y: Pixels): boolean {
        const x = state.timeToX(time);
        return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
    }

    public debugDraw(state: RenderProps): void {
        state.rect(this.x, this.y, this.width, this.height, {
            color: '#FF0000',
            wireframe: true,
            zIndex: 100
        });
    }
}
