export const createAnalyticsSpy = () => ({
    logEvent: vi.fn().mockResolvedValue(undefined),
});
