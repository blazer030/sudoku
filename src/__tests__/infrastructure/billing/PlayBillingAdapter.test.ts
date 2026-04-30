import { describe, it, expect, vi, beforeEach } from "vitest";

interface FakeOffer {
    order: ReturnType<typeof vi.fn>;
}

interface FakeProduct {
    id: string;
    pricing: { price: string; priceMicros: number; currency?: string };
    getOffer: () => FakeOffer;
}

interface FakeTransaction {
    products: { id: string }[];
    state: "approved" | "finished" | "initiated" | "pending" | "cancelled" | "";
    finish: ReturnType<typeof vi.fn>;
}

const mocks = vi.hoisted(() => {
    const handlers = new Map<string, ((arg: unknown) => void)[]>();
    const errorHandlers: ((error: { code: number; message: string }) => void)[] = [];
    const productById = new Map<string, unknown>();
    const localTransactions: unknown[] = [];

    const registerSpy = vi.fn();
    const initializeSpy = vi.fn().mockResolvedValue([]);

    const eventNames = [
        "productUpdated", "receiptUpdated", "approved", "verified", "unverified",
        "initiated", "pending", "finished", "receiptsReady", "receiptsVerified",
        "storefrontUpdated", "updated",
    ];
    const whenChain: Record<string, (cb: (arg: unknown) => void) => unknown> = {};
    eventNames.forEach((event) => {
        whenChain[event] = (cb) => {
            const list = handlers.get(event) ?? [];
            list.push(cb);
            handlers.set(event, list);
            return whenChain;
        };
    });

    const fakeStore = {
        register: registerSpy,
        initialize: initializeSpy,
        when: () => whenChain,
        get: (id: string) => productById.get(id),
        error: (cb: (error: { code: number; message: string }) => void) => {
            errorHandlers.push(cb);
        },
        get localTransactions(): unknown[] {
            return localTransactions;
        },
    };

    return {
        handlers,
        errorHandlers,
        productById,
        localTransactions,
        registerSpy,
        initializeSpy,
        fakeStore,
    };
});

vi.mock("capacitor-plugin-cdv-purchase", () => ({
    store: mocks.fakeStore,
    ProductType: { CONSUMABLE: "consumable" },
    Platform: { GOOGLE_PLAY: "android-playstore" },
    ErrorCode: { PAYMENT_CANCELLED: 5, PURCHASE: 2 },
    CdvPurchase: {
        TransactionState: {
            INITIATED: "initiated",
            PENDING: "pending",
            APPROVED: "approved",
            CANCELLED: "cancelled",
            FINISHED: "finished",
            UNKNOWN_STATE: "",
        },
    },
}));

import { PlayBillingAdapter } from "@/infrastructure/billing/PlayBillingAdapter";

const fireProductUpdated = (product: FakeProduct) => {
    mocks.productById.set(product.id, product);
    mocks.handlers.get("productUpdated")?.forEach((cb) => { cb(product); });
};

const fireApproved = (transaction: FakeTransaction) => {
    mocks.handlers.get("approved")?.forEach((cb) => { cb(transaction); });
};

const buildProduct = (id: string, price: string, priceMicros: number): FakeProduct => {
    const offer: FakeOffer = { order: vi.fn().mockResolvedValue(undefined) };
    return { id, pricing: { price, priceMicros, currency: "USD" }, getOffer: () => offer };
};

const fireAllProductsUpdated = (firstProduct: FakeProduct) => {
    fireProductUpdated(firstProduct);
    fireProductUpdated(buildProduct("donate_lunch",       "$5.99", 5_990_000));
    fireProductUpdated(buildProduct("donate_coding_time", "$9.99", 9_990_000));
};

beforeEach(() => {
    mocks.handlers.clear();
    mocks.errorHandlers.length = 0;
    mocks.productById.clear();
    mocks.localTransactions.length = 0;
    mocks.registerSpy.mockClear();
    mocks.initializeSpy.mockClear();
    mocks.initializeSpy.mockResolvedValue([]);
});

describe("PlayBillingAdapter", () => {
    it("loadProducts registers the three donate SKUs and resolves once productUpdated fires for each", async () => {
        const adapter = new PlayBillingAdapter();
        const promise = adapter.loadProducts();

        expect(mocks.registerSpy).toHaveBeenCalledWith([
            { id: "donate_coffee",      type: "consumable", platform: "android-playstore" },
            { id: "donate_lunch",       type: "consumable", platform: "android-playstore" },
            { id: "donate_coding_time", type: "consumable", platform: "android-playstore" },
        ]);
        expect(mocks.initializeSpy).toHaveBeenCalledWith(["android-playstore"]);

        fireAllProductsUpdated(buildProduct("donate_coffee", "$2.99", 2_990_000));

        await expect(promise).resolves.toEqual([
            { id: "donate_coffee",      tier: "coffee",      label: "Coffee",      priceText: "$2.99", amountUsd: 2.99 },
            { id: "donate_lunch",       tier: "lunch",       label: "Lunch",       priceText: "$5.99", amountUsd: 5.99 },
            { id: "donate_coding_time", tier: "coding_time", label: "Coding Time", priceText: "$9.99", amountUsd: 9.99 },
        ]);
    });

    it("purchase resolves with success after the approved callback finishes the transaction", async () => {
        const adapter = new PlayBillingAdapter();
        const productsPromise = adapter.loadProducts();
        const product = buildProduct("donate_coffee", "$2.99", 2_990_000);
        fireAllProductsUpdated(product);
        await productsPromise;

        const finishSpy = vi.fn().mockResolvedValue(undefined);
        const purchasePromise = adapter.purchase("donate_coffee");
        await Promise.resolve();
        fireApproved({ products: [{ id: "donate_coffee" }], state: "approved", finish: finishSpy });

        await expect(purchasePromise).resolves.toEqual({
            kind: "success",
            productId: "donate_coffee",
            tier: "coffee",
            amountUsd: 2.99,
        });
        expect(product.getOffer().order).toHaveBeenCalled();
        expect(finishSpy).toHaveBeenCalled();
    });

    it("purchase resolves with cancelled when order returns PAYMENT_CANCELLED", async () => {
        const adapter = new PlayBillingAdapter();
        const productsPromise = adapter.loadProducts();
        const product = buildProduct("donate_coffee", "$2.99", 2_990_000);
        product.getOffer().order.mockResolvedValue({ code: 5, message: "User cancelled" });
        fireAllProductsUpdated(product);
        await productsPromise;

        await expect(adapter.purchase("donate_coffee")).resolves.toEqual({ kind: "cancelled" });
    });

    it("purchase resolves with error when order returns a non-cancellation error", async () => {
        const adapter = new PlayBillingAdapter();
        const productsPromise = adapter.loadProducts();
        const product = buildProduct("donate_coffee", "$2.99", 2_990_000);
        product.getOffer().order.mockResolvedValue({ code: 2, message: "Service disconnected" });
        fireAllProductsUpdated(product);
        await productsPromise;

        await expect(adapter.purchase("donate_coffee")).resolves.toEqual({
            kind: "error",
            reason: "Service disconnected",
        });
    });

    it("consumeAll finishes any approved-but-unfinished local transaction", async () => {
        const finishApproved = vi.fn().mockResolvedValue(undefined);
        const finishAlreadyDone = vi.fn().mockResolvedValue(undefined);
        mocks.localTransactions.push(
            { products: [{ id: "donate_coffee" }], state: "approved", finish: finishApproved },
            { products: [{ id: "donate_lunch" }],  state: "finished", finish: finishAlreadyDone },
        );

        const adapter = new PlayBillingAdapter();
        await adapter.consumeAll();

        expect(finishApproved).toHaveBeenCalled();
        expect(finishAlreadyDone).not.toHaveBeenCalled();
    });
});
