export const formatChangeArg = (change: LocalForageObservableChange) => {
    if (!change.key) {
        return `${change.methodName}()`;
    }

    const newValue =
        change.newValue == null
            ? change.newValue
            : typeof change.newValue === 'object'
            ? `'${JSON.stringify(change.newValue)}'`
            : `'${change.newValue}'`;

    if (change.methodName === 'clear') {
        return `${change.methodName}() '${change.key}' => ${newValue}`;
    }

    if (change.methodName === 'removeItem') {
        return `${change.methodName}('${change.key}') => ${newValue}`;
    }

    return `${change.methodName}('${change.key}', ${newValue})`;
};
