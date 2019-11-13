class SatVisAssertionError extends Error {
    constructor(message) {
      super(message);
      this.name = "SatVisAssertionError";
    }
  }

export function assert(condition, message="") {
    if (!condition)
        throw new SatVisAssertionError('Assertion failed: ' + (message || ''));
};