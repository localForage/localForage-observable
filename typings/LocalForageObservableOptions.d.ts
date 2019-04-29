// function LocalForageObservableOptions() { }
// LocalForageObservableOptions.prototype.key = '';
// LocalForageObservableOptions.prototype.setItem = true;
// LocalForageObservableOptions.prototype.removeItem = true;
// LocalForageObservableOptions.prototype.clear = true;
// LocalForageObservableOptions.prototype.changeDetection = true;

interface LocalForageObservableMethodOptions {
    setItem?: boolean;
    removeItem?: boolean;
    clear?: boolean;
}

interface LocalForageObservableOptions
    extends LocalForageObservableMethodOptions {
    key?: string;
    changeDetection?: boolean; // default true
    crossTabNotification?: boolean; // default false
    crossTabChangeDetection?: boolean; // default false
}
