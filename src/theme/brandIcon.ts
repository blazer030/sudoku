// The app's own icon, shown on the home screen while the icon does not follow the style: a tilted
// sudoku board of thick rainbow tiles running off the edge, its first box in front. The launcher
// generator (scripts/) draws from here. Relative imports only.
//
// The artwork is a 108-unit square with no rounding; callers mask it. It is designed on a 512-unit
// square and scaled down. Digits are Outfit Bold's outlines, not text: the fonts are not there
// when the generator rasterises the icon.

const ICON_SIZE = 108;
const DESIGN_SIZE = 512;
// An adaptive icon's 108dp layers show their middle 72dp
const ADAPTIVE_VIEWPORT = 72;
// Android tints the monochrome layer itself and reads only its alpha
const MONOCHROME_COLOR = "#FFFFFF";

export const BRAND_ICON_BACKGROUND = "#17171C";
/** The icon's Android resource name; the app's main activity shows it. */
export const BRAND_ICON_RESOURCE = "ic_launcher_brand";

// Outfit Bold's digits in font units (1000 to the em), centred on the baseline at the origin
const DIGIT_PATHS: Record<number, string> = {
    1: "M-33.5 0V-706H122.5V0ZM-169.5 -573V-706H112.5V-573Z",
    2: "M-258.5 -89 12.5 -369Q38.5 -394 53 -414.5Q67.5 -435 75 -453Q82.5 -471 82.5 -491Q82.5 -532 55.5 -555.5Q28.5 -579 -14.5 -579Q-56.5 -579 -90 -556.5Q-123.5 -534 -153.5 -483L-259.5 -574Q-216.5 -646 -151.5 -681.5Q-86.5 -717 -3.5 -717Q70.5 -717 124 -690Q177.5 -663 206 -613.5Q234.5 -564 234.5 -497Q234.5 -454 224.5 -419Q214.5 -384 189.5 -349.5Q164.5 -315 123.5 -273L-65.5 -87ZM-258.5 0V-89L-124.5 -133H250.5V0Z",
    3: "M-27 11Q-100 11 -161 -14.5Q-222 -40 -264 -88L-162 -189Q-143 -161 -107 -143.5Q-71 -126 -29 -126Q7 -126 34 -139Q61 -152 77 -176Q93 -200 93 -233Q93 -266 76.5 -290Q60 -314 31 -326.5Q2 -339 -38 -339Q-58 -339 -78 -336Q-98 -333 -113 -328L-44 -416Q-15 -425 10.5 -430Q36 -435 56 -435Q111 -435 154 -410Q197 -385 223 -337.5Q249 -290 249 -227Q249 -157 214 -103.5Q179 -50 117.5 -19.5Q56 11 -27 11ZM-113 -328V-417L60 -617L236 -620L57 -415ZM-219 -573V-706H236V-620L111 -573Z",
    4: "M-283.5 -245 -51.5 -706H119.5L-117.5 -245ZM-283.5 -157V-245L-231.5 -290H282.5V-157ZM49.5 0V-438H204.5V0Z",
    5: "M-25 11Q-99 11 -162 -14.5Q-225 -40 -267 -88L-165 -189Q-146 -161 -109.5 -143.5Q-73 -126 -31 -126Q7 -126 35 -140Q63 -154 79.5 -178.5Q96 -203 96 -238Q96 -273 79.5 -298Q63 -323 34.5 -336Q6 -349 -31 -349Q-66 -349 -95.5 -340Q-125 -331 -151 -312L-138 -412Q-115 -431 -94 -442Q-73 -453 -48.5 -459Q-24 -465 11 -465Q90 -465 143 -433.5Q196 -402 224 -348.5Q252 -295 252 -231Q252 -162 217 -106.5Q182 -51 119.5 -20Q57 11 -25 11ZM-151 -312 -219 -375 -184 -706H-43L-80 -379ZM-164 -573 -184 -706H213V-573Z",
    6: "M1 11Q-75 11 -133.5 -22Q-192 -55 -226.5 -111Q-261 -167 -261 -236Q-261 -326 -199 -417L1 -706H177L-44 -398L-103 -393Q-89 -418 -73.5 -435Q-58 -452 -33.5 -461.5Q-9 -471 28 -471Q93 -471 145.5 -440.5Q198 -410 230.5 -358Q263 -306 263 -237Q263 -169 228 -112.5Q193 -56 133.5 -22.5Q74 11 1 11ZM0 -127Q32 -127 56.5 -142Q81 -157 95 -182Q109 -207 109 -240Q109 -273 95 -298.5Q81 -324 56.5 -339Q32 -354 0 -354Q-31 -354 -55.5 -339.5Q-80 -325 -94.5 -298.5Q-109 -272 -109 -240Q-109 -208 -94.5 -182Q-80 -156 -55.5 -141.5Q-31 -127 0 -127Z",
    7: "M-150 0 90 -619 244 -618 13 0ZM-244 -573V-706H244V-618L191 -573Z",
    8: "M0 11Q-75 11 -132 -16Q-189 -43 -220 -90Q-251 -137 -251 -196Q-251 -247 -232.5 -287Q-214 -327 -178 -354Q-142 -381 -95 -392L-97 -359Q-137 -368 -165.5 -392.5Q-194 -417 -209 -452Q-224 -487 -224 -526Q-224 -582 -195 -625Q-166 -668 -116 -693Q-66 -718 0 -718Q67 -718 116.5 -693Q166 -668 195 -625Q224 -582 224 -526Q224 -487 209 -452Q194 -417 166.5 -392.5Q139 -368 100 -359L95 -392Q143 -381 179 -354Q215 -327 234 -287Q253 -247 253 -196Q253 -137 222 -90Q191 -43 134 -16Q77 11 0 11ZM0 -124Q31 -124 53.5 -136Q76 -148 89.5 -169.5Q103 -191 103 -220Q103 -247 89.5 -269Q76 -291 53.5 -303Q31 -315 0 -315Q-29 -315 -52 -303Q-75 -291 -88.5 -269Q-102 -247 -102 -220Q-102 -191 -88.5 -169.5Q-75 -148 -52 -136Q-29 -124 0 -124ZM0 -429Q35 -429 58 -451.5Q81 -474 81 -509Q81 -543 58 -566Q35 -589 0 -589Q-34 -589 -56.5 -566.5Q-79 -544 -79 -510Q-79 -475 -56.5 -452Q-34 -429 0 -429Z",
    9: "M-177 0 44 -308 103 -314Q90 -290 74 -272.5Q58 -255 34.5 -245.5Q11 -236 -27 -236Q-91 -236 -145 -266Q-199 -296 -230.5 -349.5Q-262 -403 -262 -469Q-262 -539 -227 -595Q-192 -651 -132.5 -684Q-73 -717 0 -717Q74 -717 133 -684Q192 -651 227 -596Q262 -541 262 -471Q262 -381 199 -289L0 0ZM0 -353Q32 -353 56.5 -368.5Q81 -384 95.5 -409.5Q110 -435 110 -466Q110 -499 95.5 -525Q81 -551 56.5 -565.5Q32 -580 0 -580Q-32 -580 -56.5 -565.5Q-81 -551 -95.5 -525.5Q-110 -500 -110 -466Q-110 -433 -95.5 -408Q-81 -383 -56 -368Q-31 -353 0 -353Z",
};

// A solved board whose first box shows 5 3 . / 6 . 9 / . 8 7
const SOLUTION = [
    [5, 3, 1, 4, 7, 2, 9, 8, 6],
    [6, 4, 9, 1, 5, 8, 7, 2, 3],
    [2, 8, 7, 9, 3, 6, 4, 1, 5],
    [4, 7, 2, 5, 9, 1, 3, 6, 8],
    [9, 1, 5, 8, 6, 3, 2, 4, 7],
    [8, 6, 3, 7, 2, 4, 1, 5, 9],
    [7, 2, 4, 3, 8, 5, 6, 9, 1],
    [1, 9, 8, 6, 4, 7, 5, 3, 2],
    [3, 5, 6, 2, 1, 9, 8, 7, 4],
];
const FIRST_BOX_GIVENS = new Set(["0,0", "0,1", "1,0", "1,2", "2,1", "2,2"]);
// Elsewhere about four cells in nine show their digit
const showsDigit = (row: number, column: number): boolean => row < 3 && column < 3
    ? FIRST_BOX_GIVENS.has(`${row},${column}`)
    : [0, 2, 4, 6].includes((column * 7 + row * 5) % 9);

// The board lies on an isometric plane: a cell's square tilted and squashed, each tile a stack of
// copies stepping down the screen to give it its thickness
const PLANE = "0.9526 -0.5500 0.9526 0.5500 -29.78";
const PLANE_TOP = 243;
const THICKNESS_STEPS = 17;
const THICKNESS_STEP = 1.5;
const TILE = 84;
const CELL_PITCH = 100;
// Boxes sit a little further apart than cells
const BOX_GAP = 14;
// Where the board sits on the 512 design: the first box large on the left, the rest off the edge
const PLACEMENT = "translate(20 32) scale(0.88)";

const cellOrigin = (index: number): number => 8 + CELL_PITCH * index + BOX_GAP * Math.floor(index / 3);

const hsvHex = (hue: number, saturation: number, value: number): string => {
    const channel = (offset: number): number => {
        const position = (offset + hue / 60) % 6;
        const level = value - value * saturation * Math.max(0, Math.min(position, 4 - position, 1));
        return Math.round(level * 255);
    };
    return `#${[channel(5), channel(3), channel(1)].map(level => level.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
};

// The rainbow runs down the rows and, more gently, across the columns; the first box is brighter
export const brandTileColors = (row: number, column: number): { top: string; side: string; digitOpacity: number } => {
    const hue = ((258 - 12.5 * column - 43 * row) % 360 + 360) % 360;
    return row < 3 && column < 3
        ? { top: hsvHex(hue, 0.72, 0.875), side: hsvHex(hue, 0.75, 0.57), digitOpacity: 1 }
        : { top: hsvHex(hue, 0.66, 0.70), side: hsvHex(hue, 0.70, 0.45), digitOpacity: 0.75 };
};

const onPlane = (offset: number, content: string): string =>
    `<g transform="matrix(${PLANE} ${(PLANE_TOP + offset).toFixed(2)})">${content}</g>`;

const tileRect = (x: number, y: number, fill: string, extra = ""): string =>
    `<rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="14" fill="${fill}"${extra}/>`;

const digitPath = (row: number, column: number, fill: string, opacity = 1): string =>
    `<path transform="translate(${cellOrigin(column) + TILE / 2} ${cellOrigin(row) + 64}) scale(0.062)" d="${DIGIT_PATHS[SOLUTION[row][column]]}" fill="${fill}"${opacity === 1 ? "" : ` fill-opacity="${opacity}"`}/>`;

// Back to front: a tile further down the screen covers the ones behind it
const CELLS: readonly { row: number; column: number }[] = Array.from({ length: 81 }, (_, index) => ({ row: Math.floor(index / 9), column: index % 9 }))
    .sort((left, right) => (left.row - left.column) - (right.row - right.column) || left.column - right.column);

const boardTiles = (): string[] => CELLS.flatMap(({ row, column }) => {
    const x = cellOrigin(column);
    const y = cellOrigin(row);
    const colors = brandTileColors(row, column);
    const sides = Array.from({ length: THICKNESS_STEPS }, (_, step) => onPlane(THICKNESS_STEP * (THICKNESS_STEPS - step), tileRect(x, y, colors.side)));
    const digit = showsDigit(row, column) ? digitPath(row, column, "#FFFFFF", colors.digitOpacity) : "";
    return [...sides, onPlane(0, tileRect(x, y, colors.top) + digit)];
});

const designGroup = (content: string[]): string[] =>
    [`<g transform="scale(${ICON_SIZE / DESIGN_SIZE})">`, `<g transform="${PLACEMENT}">`, ...content, "</g>", "</g>"];

const svgOf = (...content: string[]): string => [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}">`,
    ...content,
    "</svg>",
    "",
].join("\n");

const ADAPTIVE_INSET = (ICON_SIZE - ADAPTIVE_VIEWPORT) / 2;

const inAdaptiveViewport = (...content: string[]): string[] =>
    [`<g transform="translate(${ADAPTIVE_INSET} ${ADAPTIVE_INSET}) scale(${ADAPTIVE_VIEWPORT / ICON_SIZE})">`, ...content, "</g>"];

/** The icon as a full 108-unit square SVG, unrounded. */
export const brandIconSvg = (): string =>
    svgOf(`<rect width="${ICON_SIZE}" height="${ICON_SIZE}" fill="${BRAND_ICON_BACKGROUND}"/>`, ...designGroup(boardTiles()));

/**
 * The adaptive icon's foreground layer: the board fitted to the 72dp viewport, running on into
 * the layer's bleed so a launcher's wider mask shows more of it rather than a seam.
 */
export const brandIconForeground = (): string =>
    svgOf(...inAdaptiveViewport(...designGroup(boardTiles())));

/** The adaptive icon's monochrome layer: the tiles' faces with their digits cut out, the first box solid. */
export const brandIconMonochrome = (): string => svgOf(
    `<defs><mask id="brand-digits" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">`,
    `<rect x="-2000" y="-2000" width="6000" height="6000" fill="#FFFFFF"/>`,
    ...CELLS.filter(({ row, column }) => showsDigit(row, column)).map(({ row, column }) => onPlane(0, digitPath(row, column, "#000000"))),
    "</mask></defs>",
    ...inAdaptiveViewport(...designGroup([
        `<g mask="url(#brand-digits)">`,
        ...CELLS.map(({ row, column }) => onPlane(0, tileRect(cellOrigin(column), cellOrigin(row), MONOCHROME_COLOR, row < 3 && column < 3 ? "" : ` fill-opacity="0.45"`))),
        "</g>",
    ])),
);
