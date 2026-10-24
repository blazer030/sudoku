/**
 * The cyberpunk style's type is bundled with the app (src/style/fonts.css; the web app's service
 * worker precaches it for everyone): Orbitron for digits and buttons, Share Tech Mono for notes,
 * the timer and labels. A page loads the faces once cyber uses them, and cyber switches to them
 * only once both have loaded (data-cyber-fonts="ready" on <html>); until then the fallback faces
 * stay.
 */
import { markFontsReady } from "@/style/fontGate";

const DIGITS = "0123456789";
const CYBER_FACES = ['500 16px "Orbitron"', '900 16px "Orbitron"', '16px "Share Tech Mono"'];

/** Marks <html> once cyber's faces have loaded, and drops the mark when leaving cyber. */
export const syncCyberFonts = markFontsReady({ style: "cyber", datasetKey: "cyberFonts", faces: CYBER_FACES, sample: DIGITS });
