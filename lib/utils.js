export function getDriverPromise(localForageInstance, driverName) {
    getDriverPromise.result = getDriverPromise.result || {};
    if (getDriverPromise.result[driverName]) {
        return getDriverPromise.result[driverName];
    }
    if (!localForageInstance || typeof localForageInstance.getDriver !== 'function') {
        Promise.reject(new Error(
            'localforage.getDriver() was not available! ' +
            'localforage-observable requires localforage v1.4+'));
    }
    getDriverPromise.result[driverName] = localForageInstance.getDriver(driverName);
    return getDriverPromise.result[driverName];
}

// thanks AngularJS
function isDate(value) {
    return toString.call(value) === '[object Date]';
}

function isFunction(value) {
    return typeof value === 'function';
}

var isArray = (function() {
    if (!isFunction(Array.isArray)) {
        return function(value) {
            return toString.call(value) === '[object Array]';
        };
    }
    return Array.isArray;
})();

function isRegExp(value) {
    return toString.call(value) === '[object RegExp]';
}

export function equals(o1, o2) {
    if (o1 === o2) return true;
    if (o1 === null || o2 === null) return false;
    if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
    var t1 = typeof o1,
        t2 = typeof o2,
        length, key, keySet;
    if (t1 == t2) {
        if (t1 == 'object') {
            if (isArray(o1)) {
                if (!isArray(o2)) return false;
                if ((length = o1.length) == o2.length) {
                    for (key = 0; key < length; key++) {
                        if (!equals(o1[key], o2[key])) return false;
                    }
                    return true;
                }
            } else if (isDate(o1)) {
                if (!isDate(o2)) return false;
                return (isNaN(o1.getTime()) && isNaN(o2.getTime())) || (o1.getTime() === o2.getTime());
            } else if (isRegExp(o1) && isRegExp(o2)) {
                return o1.toString() == o2.toString();
            } else {
                if (isArray(o2)) return false;
                keySet = {};
                for (key in o1) {
                    if (key.charAt(0) === '$' || isFunction(o1[key])) continue;
                    if (!equals(o1[key], o2[key])) return false;
                    keySet[key] = true;
                }
                for (key in o2) {
                    if (!keySet.hasOwnProperty(key) &&
                        key.charAt(0) !== '$' &&
                        o2[key] !== undefined &&
                        !isFunction(o2[key])) return false;
                }
                return true;
            }
        }
    }
    return false;
}
