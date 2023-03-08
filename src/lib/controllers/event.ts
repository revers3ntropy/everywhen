import type { NonFunctionProperties } from '../utils';
import { Controller } from './controller';
import type { Label } from './label';

export class Event extends Controller {
    public constructor (
        public id: number,
        public name: string,
        public start: number,
        public end: number,
        public label?: Label,
    ) {
        super();
    }

    public override json (): NonFunctionProperties<Event> {
        return {
            ...this,
            label: this.label?.json(),
        };
    }
}

export type RawEvent = NonFunctionProperties<Omit<Event, 'label'>> & {
    label?: string
};