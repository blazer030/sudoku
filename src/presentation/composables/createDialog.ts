import { inject, type InjectionKey, provide, readonly, ref, type Ref, shallowRef, type ShallowRef } from "vue";

type CloseFn<TResult> = undefined extends TResult
    ? (result?: TResult) => void
    : (result: TResult) => void;

interface DialogState<TParams, TResult> {
    visible: Readonly<Ref<boolean>>;
    params: Readonly<ShallowRef<TParams | undefined>>;
    close: CloseFn<TResult>;
}

export const createDialog = <TParams = undefined, TResult = undefined>() => {
    const key: InjectionKey<DialogState<TParams, TResult>> = Symbol();

    const provideDialog = () => {
        const visible = ref(false);
        const params = shallowRef<TParams>();
        let resolve: ((result: TResult) => void) | null = null;

        const open = (dialogParams?: TParams): Promise<TResult> => {
            params.value = dialogParams;
            visible.value = true;
            return new Promise(resolvePromise => { resolve = resolvePromise; });
        };

        const close: CloseFn<TResult> = ((result?: TResult) => {
            visible.value = false;
            resolve?.(result as TResult);
            resolve = null;
        }) as CloseFn<TResult>;

        provide(key, {
            visible: readonly(visible),
            params: params as Readonly<ShallowRef<TParams | undefined>>,
            close,
        });
        return { open, visible: readonly(visible) };
    };

    const useDialog = () => {
        const state = inject(key);
        if (!state) throw new Error("Dialog not provided");
        return state;
    };

    return { provideDialog, useDialog };
};
