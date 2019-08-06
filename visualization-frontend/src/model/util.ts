export function assert(condition, message) {
    if (!condition)
        throw Error('Assert failed: ' + (message || ''));
};