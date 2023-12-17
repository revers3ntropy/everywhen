import type { Coordinate } from 'ol/coordinate';

export type OlCallbackObject = {
    coordinate: Coordinate;
    data: unknown;
};

export type Expand<T> = T extends (infer E)[]
    ? E[]
    : T extends object
      ? T extends infer O
          ? { [K in keyof O]: Expand<O[K]> }
          : never
      : T;

export type ArrayElement<ArrayType extends readonly unknown[]> =
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
type NonFunctionPropertyNames<T> = {
    [K in keyof T]: T[K] extends (...args: infer _) => infer _ ? never : K;
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
export type PickOptionalAndMutable<A, B extends keyof A> = NonFunctionProperties<
    Omit<Readonly<A>, B> & Partial<Mutable<Pick<A, B>>>
>;
export type PickOptional<A, B extends keyof A = keyof A> = NonFunctionProperties<
    Omit<A, B> & Partial<Pick<A, B>>
>;

export type MaybePromise<T> = T | Promise<T>;

export type Bytes = number;
export type Pixels = number;
export type Hours = number;
export type Seconds = number;
export type TimestampSecs = number;
export type TimestampMilliseconds = number;
export type Milliseconds = number;
export type Degrees = number;
export type Meters = number;

export type EventsSortKey = 'name' | 'start' | 'end' | 'created';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export type CursorStyle =
    | 'pointer'
    | 'default'
    | 'none'
    | 'auto'
    | 'crosshair'
    | 'move'
    | 'sw-resize'
    | 'ns-resize'
    | 'nesw-resize'
    | 'nwse-resize'
    | 'text'
    | 'wait'
    | 'help'
    | 'progress'
    | 'copy'
    | 'alias'
    | 'context-menu'
    | 'cell'
    | 'vertical-text'
    | 'no-drop'
    | 'not-allowed'
    | 'zoom-in'
    | 'zoom-out'
    | 'grab'
    | 'grabbing'
    | 'all-scroll'
    | 'col-resize'
    | 'row-resize'
    | 'n-resize'
    | 'e-resize'
    | 's-resize'
    | 'w-resize'
    | 'ne-resize'
    | 'nw-resize'
    | 'se-resize'
    | 'ew-resize';
