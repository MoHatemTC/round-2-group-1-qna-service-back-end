const EventEmitter = require('events');

/**
 * Minimal internal pub/sub so Slot 1 and Slot 5 can each subscribe to
 * scoring results without this module knowing who's listening or how.
 *
 * This is an adapter point: swap the internals for a message queue,
 * webhook call, or websocket emit if that's what those slots actually
 * expect — call sites elsewhere only ever call `publish(event, payload)`
 * and don't need to change.
 */
class QuizEventBus extends EventEmitter {
  publish(event, payload) {
    this.emit(event, payload);
  }
  subscribe(event, handler) {
    this.on(event, handler);
  }
}

module.exports = new QuizEventBus();
