const EventEmitter = require('events');
class QuizEventBus extends EventEmitter {
  publish(event, payload) {
    this.emit(event, payload);
  }
  subscribe(event, handler) {
    this.on(event, handler);
  }
}

module.exports = new QuizEventBus();
