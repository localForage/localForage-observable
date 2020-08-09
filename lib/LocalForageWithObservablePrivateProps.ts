import { LocalForageObservableWrapper } from './LocalForageObservableWrapper';
import CrossTabObserver from './StorageEventObserver';

export interface LocalForageWithObservablePrivateProps
    extends LocalForageWithObservableMethods {
    _dbInfo: {
        name: string;
        storeName: string;
    };
    _baseMethods: Pick<
        LocalForageWithObservableMethods,
        'setItem' | 'removeItem' | 'clear'
    >;
    _observables: {
        changeDetection: LocalForageObservableWrapper[];
        callDetection: LocalForageObservableWrapper[];
        crossTabChangeDetection?: boolean;
        crossTabObserver?: CrossTabObserver;
    };
}
