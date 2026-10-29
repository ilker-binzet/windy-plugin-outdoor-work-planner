import MagicString from 'magic-string';

/** The official bridge injects W after Rollup has already assigned local names.
 * Qualify only those injected import bindings so bundled dependencies cannot
 * shadow Windy's runtime global. Other W identifiers must stay untouched.
 */
export function protectWindyGlobal() {
    return {
        name: 'protect-windy-global',
        renderChunk(code) {
            const output = new MagicString(code);
            const bindings = /\/\/ transformCode: import[^\n]*\nconst [^\n]*? = (W)\./g;
            for (const match of code.matchAll(bindings)) {
                const position = match.index + match[0].lastIndexOf('W.');
                output.overwrite(position, position + 1, 'globalThis.W');
            }
            return { code: output.toString(), map: output.generateMap({ hires: true }) };
        },
    };
}
