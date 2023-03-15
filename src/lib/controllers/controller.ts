export abstract class Controller {
    json (): Record<string, unknown> {
        return { ...this } as Record<string, unknown>;
    }
}