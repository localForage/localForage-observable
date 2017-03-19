// function LocalForageObservableOptions() { }
// LocalForageObservableOptions.prototype.key = '';
// LocalForageObservableOptions.prototype.setItem = true;
// LocalForageObservableOptions.prototype.removeItem = true;
// LocalForageObservableOptions.prototype.clear = true;
// LocalForageObservableOptions.prototype.changeDetection = true;

interface LocalForageObservableOptions {
    key?: string;
    setItem?: boolean;
    removeItem?: boolean;
    clear?: boolean;
    changeDetection?: boolean; // default true
    crossTabNotification?: boolean; // default false
    crossTabChangeDetection?: boolean; // default false
}
