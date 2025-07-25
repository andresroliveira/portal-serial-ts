export class EventEmitter {
    private events: { [key: string]: Function[] } = {};

    on(event: string, callback: Function): void {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event: string, callback: Function): void {
        if (!this.events[event]) return;

        const index = this.events[event].indexOf(callback);
        if (index > -1) {
            this.events[event].splice(index, 1);
        }
    }

    emit(event: string, ...args: any[]): void {
        if (!this.events[event]) return;

        this.events[event].forEach((callback) => {
            callback(...args);
        });
    }

    removeAllListeners(event?: string): void {
        if (event) {
            delete this.events[event];
        } else {
            this.events = {};
        }
    }
}
