// Reads tables out of a WOFF2 font, enough to check what a bundled subset maps and names.
// WOFF2: a 48-byte header, a table directory, then one Brotli stream holding every table's data in
// directory order. cmap and name are never transformed, so they come out as plain sfnt tables.
import { brotliDecompressSync } from "zlib";

const KNOWN_TAGS = [
    "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf", "loca", "prep", "CFF ",
    "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS",
    "GSUB", "EBSC", "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar", "bdat", "bloc",
    "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd", "prop",
    "trak", "Zapf", "Silf", "Glat", "Gloc", "Feat", "Sill",
];

const HEADER_LENGTH = 48;
const ARBITRARY_TAG = 63;

/** Every table of a single-font WOFF2 file, by tag. */
export const woff2Tables = (font: Buffer): Map<string, Buffer> => {
    if (font.toString("latin1", 0, 4) !== "wOF2") throw new Error("Not a WOFF2 font");
    const tableCount = font.readUInt16BE(12);
    const compressedLength = font.readUInt32BE(20);
    let position = HEADER_LENGTH;
    const readBase128 = (): number => {
        let value = 0;
        for (let byteIndex = 0; byteIndex < 5; byteIndex++) {
            const byte = font[position++];
            value = value * 128 + (byte & 0x7f);
            if ((byte & 0x80) === 0) return value;
        }
        throw new Error("Bad UIntBase128");
    };
    const entries: { tag: string; length: number }[] = [];
    for (let tableIndex = 0; tableIndex < tableCount; tableIndex++) {
        const flags = font[position++];
        let tag = KNOWN_TAGS[flags & 0x3f];
        if ((flags & 0x3f) === ARBITRARY_TAG) {
            tag = font.toString("latin1", position, position + 4);
            position += 4;
        }
        const transformVersion = flags >> 6;
        const originalLength = readBase128();
        // glyf and loca are transformed at version 0; every other table only at a non-zero version
        const transformed = tag === "glyf" || tag === "loca" ? transformVersion === 0 : transformVersion !== 0;
        const length = transformed ? readBase128() : originalLength;
        entries.push({ tag, length });
    }
    const data = brotliDecompressSync(font.subarray(position, position + compressedLength));
    const tables = new Map<string, Buffer>();
    let offset = 0;
    for (const { tag, length } of entries) {
        tables.set(tag, data.subarray(offset, offset + length));
        offset += length;
    }
    return tables;
};

const glyphForFormat4 = (table: Buffer, codePoint: number): number => {
    const segmentCount = table.readUInt16BE(6) / 2;
    const endCodes = 14;
    const startCodes = endCodes + segmentCount * 2 + 2;
    const deltas = startCodes + segmentCount * 2;
    const rangeOffsets = deltas + segmentCount * 2;
    for (let segment = 0; segment < segmentCount; segment++) {
        if (codePoint > table.readUInt16BE(endCodes + segment * 2)) continue;
        const start = table.readUInt16BE(startCodes + segment * 2);
        if (codePoint < start) return 0;
        const delta = table.readInt16BE(deltas + segment * 2);
        const rangeOffset = table.readUInt16BE(rangeOffsets + segment * 2);
        if (rangeOffset === 0) return (codePoint + delta) & 0xffff;
        const glyphAt = rangeOffsets + segment * 2 + rangeOffset + (codePoint - start) * 2;
        const glyph = table.readUInt16BE(glyphAt);
        return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
    }
    return 0;
};

/** The code points a font maps to a real glyph, from its cmap (format 12, else format 4). */
export const mappedCodePoints = (font: Buffer, candidates: Iterable<number>): Set<number> => {
    const cmap = woff2Tables(font).get("cmap");
    if (cmap === undefined) throw new Error("No cmap table");
    const subtableCount = cmap.readUInt16BE(2);
    const subtables = Array.from({ length: subtableCount }, (_, index) => cmap.subarray(cmap.readUInt32BE(4 + index * 8 + 4)));
    const mapped = new Set<number>();
    const format12 = subtables.find(subtable => subtable.readUInt16BE(0) === 12);
    if (format12 !== undefined) {
        const groupCount = format12.readUInt32BE(12);
        const groups = Array.from({ length: groupCount }, (_, index) => [format12.readUInt32BE(16 + index * 12), format12.readUInt32BE(20 + index * 12)]);
        for (const codePoint of candidates) {
            if (groups.some(([first, last]) => codePoint >= first && codePoint <= last)) mapped.add(codePoint);
        }
        return mapped;
    }
    const format4 = subtables.find(subtable => subtable.readUInt16BE(0) === 4);
    if (format4 === undefined) throw new Error("No format 4 or 12 cmap subtable");
    for (const codePoint of candidates) {
        if (codePoint <= 0xffff && glyphForFormat4(format4, codePoint) !== 0) mapped.add(codePoint);
    }
    return mapped;
};

/** The Windows (UTF-16) strings of a font's name table, by name ID. */
export const nameStrings = (font: Buffer): Map<number, string> => {
    const name = woff2Tables(font).get("name");
    if (name === undefined) throw new Error("No name table");
    const count = name.readUInt16BE(2);
    const storage = name.readUInt16BE(4);
    const strings = new Map<number, string>();
    for (let record = 0; record < count; record++) {
        const base = 6 + record * 12;
        if (name.readUInt16BE(base) !== 3) continue;
        const nameId = name.readUInt16BE(base + 6);
        const length = name.readUInt16BE(base + 8);
        const offset = storage + name.readUInt16BE(base + 10);
        strings.set(nameId, Buffer.from(name.subarray(offset, offset + length)).swap16().toString("utf16le"));
    }
    return strings;
};
