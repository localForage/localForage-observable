export const formatChangeArg = (change: LocalForageObservableChange) => {
    if (!change.key) {
        return `${change.methodName}()`;
    }

    const newValue =
        typeof change.newValue === 'object'
            ? JSON.stringify(change.newValue)
            : change.newValue;

    return `${change.methodName}('${change.key}', '${newValue}')`;
};
