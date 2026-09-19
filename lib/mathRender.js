import katex from "katex";

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Wandelt Text mit eingebetteten LaTeX-Formeln ($...$ bzw. $$...$$) in
// statisches HTML um. Funktioniert dadurch auch ganz ohne JavaScript beim
// Anzeigen (z.B. für den Druck-Export).
export function mathToStaticHtml(text) {
  if (text == null) return "";
  const str = String(text);
  const parts = str.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
  return parts
    .map((part) => {
      if (part.startsWith("$$") && part.endsWith("$$")) {
        try {
          return katex.renderToString(part.slice(2, -2), { throwOnError: false, displayMode: true });
        } catch {
          return escapeHtml(part);
        }
      }
      if (part.startsWith("$") && part.endsWith("$") && part.length > 1) {
        try {
          return katex.renderToString(part.slice(1, -1), { throwOnError: false, displayMode: false });
        } catch {
          return escapeHtml(part);
        }
      }
      return escapeHtml(part);
    })
    .join("");
}
