import { LocalStorageLessonProgressRepository } from "@/infrastructure/lessons/LocalStorageLessonProgressRepository";

const STORAGE_KEY = "sudoku-lesson-progress";

describe("LocalStorageLessonProgressRepository", () => {
    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("should load what it saved", () => {
        const repository = new LocalStorageLessonProgressRepository();

        repository.save(["rules", "hiddenSingle"]);

        expect(new LocalStorageLessonProgressRepository().load()).toEqual(["rules", "hiddenSingle"]);
    });

    it("should load nothing when nothing is stored", () => {
        expect(new LocalStorageLessonProgressRepository().load()).toEqual([]);
    });

    it("should load nothing from unreadable data", () => {
        localStorage.setItem(STORAGE_KEY, "{not json");

        expect(new LocalStorageLessonProgressRepository().load()).toEqual([]);
    });

    it("should load nothing from data of another shape", () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ rules: true }));

        expect(new LocalStorageLessonProgressRepository().load()).toEqual([]);
    });

    it("should drop lessons it does not know", () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(["rules", "gone", 7]));

        expect(new LocalStorageLessonProgressRepository().load()).toEqual(["rules"]);
    });

    it("should carry on when storage refuses to save", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("full");
        });

        expect(() => { new LocalStorageLessonProgressRepository().save(["rules"]); }).not.toThrow();
    });
});
