import { AffectedItemChange } from './AffectedItemChange';

export interface LocalForageObservableChangeWithPrivateProps
    extends LocalForageObservableChange {
    // _affectedItems?: AffectedItemChange[];
    _affectedItemsByKey?: { [key: string]: AffectedItemChange };
}
