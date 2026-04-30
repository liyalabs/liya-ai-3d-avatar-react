/**
 * TTS (Text-to-Speech) için metin temizleme utility'leri.
 * Markdown, URL, emoji ve özel karakterleri sesli okuma için temizler.
 */

/**
 * Markdown linklerden sadece link metnini çıkarır, URL'yi atar.
 * [Dosya Adı](https://...) → "Dosya Adı"
 */
function stripMarkdownLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

/**
 * Çıplak URL'leri kaldırır (http/https ile başlayanlar).
 */
function stripBareUrls(text: string): string {
  return text.replace(/https?:\/\/[^\s)>\]]+/g, "");
}

/**
 * Markdown kod bloklarını kaldırır.
 */
function stripCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]*?```/g, "");
}

/**
 * Markdown formatlama işaretlerini kaldırır (bold, italic, heading, list markers).
 */
function stripMarkdownFormatting(text: string): string {
  return text
    .replace(/#{1,6}\s*/g, "") // headings
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1") // bold italic
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/___([^_]+)___/g, "$1") // bold italic alt
    .replace(/__([^_]+)__/g, "$1") // bold alt
    .replace(/_([^_]+)_/g, "$1") // italic alt
    .replace(/~~([^~]+)~~/g, "$1") // strikethrough
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/^[-*+]\s+/gm, "") // list markers
    .replace(/^\d+\.\s+/gm, ""); // numbered list
}

/**
 * Emoji'leri kaldırır.
 */
function stripEmojis(text: string): string {
  // Broad emoji regex
  return text.replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F910}-\u{1F96B}\u{1F980}-\u{1F9E0}]/gu,
    "",
  );
}

/**
 * Metin içindeki fazla boşlukları temizler.
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * TTS'e gönderilecek metni tamamen temizler.
 */
export function stripForTTS(text: string): string {
  if (!text) return "";

  let clean = text;
  clean = stripCodeBlocks(clean); // ```code``` → ''
  clean = stripMarkdownLinks(clean); // [name](url) → name
  clean = stripBareUrls(clean); // https://... → ''
  clean = stripMarkdownFormatting(clean);
  clean = stripEmojis(clean);
  clean = normalizeWhitespace(clean);

  return clean;
}
