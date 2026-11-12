import type { Component } from "vue";
import { createMemoryHistory, createRouter, type Router, type RouteRecordRaw } from "vue-router";
import { ROUTER_PATH } from "@/routerPaths";

/** The names of ROUTER_PATH's paths, leaving out its *For helpers. */
export type RoutePathName = { [Name in keyof typeof ROUTER_PATH]: (typeof ROUTER_PATH)[Name] extends string ? Name : never }[keyof typeof ROUTER_PATH];

const STUB: Component = { render: () => null };

/**
 * A memory-history router with a route for every path the app has, each drawing nothing unless a component is
 * given for it (the page under test, say).
 */
export const createTestRouter = (components: Partial<Record<RoutePathName, Component>> = {}): Router => {
    const routes: RouteRecordRaw[] = Object.entries(ROUTER_PATH)
        .filter((entry): entry is [RoutePathName, string] => typeof entry[1] === "string")
        .map(([name, path]) => ({ path, component: components[name] ?? STUB }));
    return createRouter({ history: createMemoryHistory(), routes });
};
