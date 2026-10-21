import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { renderThemeCss } from "../src/theme/renderThemeCss";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDirectory, "../src/style/themes.generated.css");

writeFileSync(outputPath, renderThemeCss());
console.log(`Wrote ${outputPath}`);
