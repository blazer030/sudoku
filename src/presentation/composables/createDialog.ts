import { inject, type InjectionKey, onScopeDispose, provide, readonly, ref, type Ref, shallowRef, type ShallowRef } from "vue";
import { registerBackDismissal } from "@/presentation/composables/backDismissal";

type CloseFn<TResult> = undefined extends TResult
    ? (result?: TResult) => void
    : (result: TResult) => void;

interface DialogState<TParams, TResult> {
    visible: Readonly<Ref<boolean>>;
    params: Readonly<ShallowRef<TParams | undefined>>;
    close: CloseFn<TResult>;
}

interface DialogOptions<TResult> {
    /** The result the system Back key closes the dialog with; without one, Back leaves it open. */
    dismissResult?: TResult;
}

export const createDialog = <TParams = undefined, TResult = undefined>({ dismissResult }: DialogOptions<TResult> = {}) => {
    const key: InjectionKey<DialogState<TParams, TResult>> = Symbol();

    const provideDialog = () => {
        const visible = ref(false);
        const params = shallowRef<TParams>();
        let resolve: ((result: TResult) => void) | null = null;
        let withdrawBackDismissal: (() => void) | null = null;

        const open = (dialogParams?: TParams): Promise<TResult> => {
            params.value = dialogParams;
            visible.value = true;
            if (dismissResult !== undefined && withdrawBackDismissal === null) {
                withdrawBackDismissal = registerBackDismissal(() => {
                    close(dismissResult);
                });
            }
            return new Promise(resolvePromise => { resolve = resolvePromise; });
        };

        const close: CloseFn<TResult> = ((result?: TResult) => {
            visible.value = false;
            withdrawBackDismissal?.();
            withdrawBackDismissal = null;
            resolve?.(result as TResult);
            resolve = null;
        }) as CloseFn<TResult>;
        // A page that goes away with its dialog open must not leave Back closing it
        onScopeDispose(() => {
            withdrawBackDismissal?.();
            withdrawBackDismissal = null;
        });

        provide(key, {
            visible: readonly(visible),
            params: params as Readonly<ShallowRef<TParams | undefined>>,
            close,
        });
        return { open, close, visible: readonly(visible) };
    };

    const useDialog = () => {
        const state = inject(key);
        if (!state) throw new Error("Dialog not provided");
        return state;
    };

    return { provideDialog, useDialog };
};
