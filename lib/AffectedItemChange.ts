export type AffectedItemChange = Pick<
    LocalForageObservableChange,
    'key' | 'oldValue' | 'newValue'
>;
