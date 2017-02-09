// function LocalForageObservableOptions() { }
// LocalForageObservableOptions.prototype.key = '';
// LocalForageObservableOptions.prototype.setItem = true;
// LocalForageObservableOptions.prototype.removeItem = true;
// LocalForageObservableOptions.prototype.clear = true;
// LocalForageObservableOptions.prototype.changeDetection = true;

interface LocalForageObservableOptions {
    key: string;
    setItem: boolean;
    removeItem: boolean;
    clear: boolean;
    changeDetection?: boolean; // default true
}

// function LocalForageObservableChange() { }
// LocalForageObservableChange.prototype.key = '';
// LocalForageObservableChange.prototype.methodName = '';
// LocalForageObservableChange.prototype.oldValue = null;
// LocalForageObservableChange.prototype.newValue = null;
// LocalForageObservableChange.prototype.success = false;
// LocalForageObservableChange.prototype.fail = false;
// LocalForageObservableChange.prototype.error = '';

interface LocalForageObservableChange {
    key: string;
    methodName: string;
    oldValue: any;
    newValue: any;
    valueChange?: boolean;
    success?: boolean;
    fail?: boolean;
    error: any;
    crossTabNotification?: string;
}
