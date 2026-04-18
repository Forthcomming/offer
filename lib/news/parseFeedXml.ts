/**
 * 轻量 RSS 2.0 / Atom 解析（无第三方依赖，适用于常见资讯源）。
 */

export type ParsedFeedItem = {
  title: string;
  url: string;
  publishedAt: string | null;
};

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    );
}

function stripInnerTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").trim();
}

/** 取首个匹配的闭合标签内容（支持 CDATA；无命名空间时允许 media:title 等形式） */
function extractTag(inner: string, localName: string): string {
  const esc = localName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tagName =
    localName.includes(":") ? `(${esc})` : `((?:[\\w.-]+:)?${esc})`;

  const cdata = new RegExp(
    `<${tagName}\\b[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</\\1>`,
    "i",
  );
  const c = inner.match(cdata);
  if (c?.[2]) return decodeXmlEntities(c[2].trim());

  const plain = new RegExp(
    `<${tagName}\\b[^>]*>([\\s\\S]*?)</\\1>`,
    "i",
  );
  const p = inner.match(plain);
  if (!p?.[2]) return "";
  return decodeXmlEntities(stripInnerTags(p[2]));
}

function extractAtomLink(entryInner: string): string {
  const hrefM = entryInner.match(/<link\b[^>]*\bhref=["']([^"']+)["']/i);
  if (hrefM?.[1]) return hrefM[1].trim();
  return extractTag(entryInner, "link");
}

function parseRss(xml: string): ParsedFeedItem[] {
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  const out: ParsedFeedItem[] = [];
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = extractTag(block, "title");
    let url = extractTag(block, "link");
    if (!url) url = extractTag(block, "guid");
    if (!title || !url) continue;
    const pub =
      extractTag(block, "pubDate") ||
      extractTag(block, "dc:date") ||
      extractTag(block, "published") ||
      null;
    out.push({
      title: title.slice(0, 300),
      url: url.trim(),
      publishedAt: pub || null,
    });
  }
  return out;
}

function parseAtom(xml: string): ParsedFeedItem[] {
  const entryRe = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
  const out: ParsedFeedItem[] = [];
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(xml)) !== null) {
    const block = m[1];
    const title = extractTag(block, "title");
    const url = extractAtomLink(block);
    if (!title || !url) continue;
    const pub =
      extractTag(block, "updated") ||
      extractTag(block, "published") ||
      extractTag(block, "dc:date") ||
      null;
    out.push({
      title: title.slice(0, 300),
      url: url.trim(),
      publishedAt: pub || null,
    });
  }
  return out;
}

export function parseFeedXml(xml: string): ParsedFeedItem[] {
  const t = xml.trim();
  if (/<feed\b/.test(t)) return parseAtom(t);
  return parseRss(t);
}
