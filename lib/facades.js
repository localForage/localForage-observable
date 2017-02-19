export function processObserverList(list, changeArgs) {
    for (var i = 0, observableWrapper; (observableWrapper = list[i]); i++) {
        var itemOptions = observableWrapper.options;
        if (!itemOptions || (
            (!itemOptions.key || itemOptions.key === changeArgs.key) &&
            (itemOptions[changeArgs.methodName] === true ||
             !observableWrapper.hasMethodFilterOptions()) &&
            // do not publish cross tab evets when the observable
            // doesn't explicitelly require it,
            // to avoid messing troubles in existing implementations.
            (!changeArgs.crossTabNotification || itemOptions.crossTabNotification)
           )) {
            observableWrapper.publish(changeArgs);
        }
    }
}
