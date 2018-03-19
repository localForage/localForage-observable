import { LocalForageObservableWrapper } from './LocalForageObservableWrapper';
import CrossTabObserver from './StorageEventObserver';

export interface LocalForageWithObservablePrivateProps
    extends LocalForageWithObservableMethods {
    _dbInfo: {
        name: string;
        storeName: string;
    };
    _baseMethods: {
        setItem: <T>(key: string, value: T) => Promise<T>;
        removeItem: (key: string) => Promise<void>;
        clear: () => Promise<void>;
    };
    _observables: {
        changeDetection: LocalForageObservableWrapper[];
        callDetection: LocalForageObservableWrapper[];
        crossTabChangeDetection?: boolean;
        crossTabObserver?: CrossTabObserver;
    };
}
