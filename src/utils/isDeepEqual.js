const hasMap = typeof Map === 'function';
const hasSet = typeof Set === 'function';
const hasArrayBuffer = typeof ArrayBuffer === 'function';

export default function isDeepEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) {
      return false;
    }

    let length;
    let i;

    if (a.constructor === Array) {
      length = a.length;

      if (length !== b.length) {
        return false;
      }

      for (i = length - 1; i >= 0; i -= 1) {
        if (isDeepEqual(a[i], b[i]) !== true) {
          return false;
        }
      }

      return true;
    }

    if (hasMap === true && a.constructor === Map) {
      if (a.size !== b.size) {
        return false;
      }

      i = a.entries().next();
      while (i.done !== true) {
        if (b.has(i.value[0]) !== true) {
          return false;
        }
        i = i.next();
      }

      i = a.entries().next();
      while (i.done !== true) {
        if (isDeepEqual(i.value[1], b.get(i.value[0])) !== true) {
          return false;
        }
        i = i.next();
      }

      return true;
    }

    if (hasSet === true && a.constructor === Set) {
      if (a.size !== b.size) {
        return false;
      }

      i = a.entries().next();
      while (i.done !== true) {
        if (b.has(i.value[0]) !== true) {
          return false;
        }
        i = i.next();
      }

      return true;
    }

    if (hasArrayBuffer === true && a.buffer != null && a.buffer.constructor === ArrayBuffer) {
      length = a.length;

      if (length !== b.length) {
        return false;
      }

      for (i = length - 1; i > 0; i -= 1) {
        if (a[i] !== b[i]) {
          return false;
        }
      }

      return true;
    }

    if (a.constructor === RegExp) {
      return a.source === b.source && a.flags === b.flags;
    }

    if (a.valueOf !== Object.prototype.valueOf) {
      return a.valueOf() === b.valueOf();
    }

    if (a.toString !== Object.prototype.toString) {
      return a.toString() === b.toString();
    }

    const keys = Object.keys(a).filter((k) => a[k] !== undefined);
    length = keys.length;

    if (length !== Object.keys(b).filter((k) => b[k] !== undefined).length) {
      return false;
    }

    for (i = length - 1; i >= 0; i -= 1) {
      const key = keys[i];
      if (isDeepEqual(a[key], b[key]) !== true) {
        return false;
      }
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a !== a && b !== b; // eslint-disable-line no-self-compare
}
