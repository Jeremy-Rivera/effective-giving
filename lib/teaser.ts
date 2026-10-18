// The one-sentence summary on a collapsed organization card: the first
// sentence, plus the next ones while it is still under about 60 characters.
// Handles the Devanagari full stop (।) too.
export function teaser(text: string) {
  const sentences = (text.match(/.+?[.!?।](?=\s|$)/g) ?? [text]).map((s) => s.trim());
  let out = sentences[0];
  for (let i = 1; out.length < 60 && i < sentences.length; i++) out += ` ${sentences[i]}`;
  return out;
}
