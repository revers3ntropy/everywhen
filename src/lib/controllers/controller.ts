export abstract class Controller {
    json (): object {
        return { ...this };
    }
}