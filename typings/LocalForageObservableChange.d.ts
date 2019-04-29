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
    methodName: keyof LocalForageObservableMethodOptions;
    oldValue: any;
    newValue: any;
    valueChange?: boolean;
    success?: boolean;
    fail?: boolean;
    error?: any;
    crossTabNotification?: string;
}
