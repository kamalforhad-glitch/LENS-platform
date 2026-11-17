import type { ReactNode } from "react";
import { safeFocusUrl } from "./focus-url";

// A deliberately small Markdown subset. It is parsed into React elements and
// never injected as HTML, so editor content cannot introduce scripts or events.

type FocusBlock =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "rule" }
  | { kind: "image"; alt: string; src: string };

const LIST_UNORDERED = /^[-*]\s+(.+)$/;
const LIST_ORDERED = /^\d+\.\s+(.+)$/;
const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)]+)\)$/;

function isBlockStart(line: string): boolean {
  return (
    !line ||
    line.startsWith("## ") ||
    line.startsWith("### ") ||
    line === "---" ||
    line.startsWith("> ") ||
    LIST_UNORDERED.test(line) ||
    LIST_ORDERED.test(line) ||
    IMAGE_LINE.test(line)
  );
}

function parseBlocks(content: string): FocusBlock[] {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: FocusBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      blocks.push({ kind: "heading", level: 3, text: line.slice(4).trim() });
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      blocks.push({ kind: "heading", level: 2, text: line.slice(3).trim() });
      continue;
    }

    if (line === "---") {
      flushParagraph();
      blocks.push({ kind: "rule" });
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quote.push(lines[i].trim().slice(2).trim());
        i += 1;
      }
      i -= 1;
      blocks.push({ kind: "quote", text: quote.join(" ") });
      continue;
    }

    const unordered = LIST_UNORDERED.exec(line);
    const ordered = LIST_ORDERED.exec(line);
    if (unordered || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      const pattern = isOrdered ? LIST_ORDERED : LIST_UNORDERED;
      const items: string[] = [];
      while (i < lines.length) {
        const match = pattern.exec(lines[i].trim());
        if (!match) break;
        items.push(match[1].trim());
        i += 1;
      }
      i -= 1;
      blocks.push({ kind: "list", ordered: isOrdered, items });
      continue;
    }

    const image = IMAGE_LINE.exec(line);
    if (image) {
      flushParagraph();
      const src = safeFocusUrl(image[2]);
      if (src) blocks.push({ kind: "image", alt: image[1] || "", src });
      continue;
    }

    // A normal line: join wrapped lines into one paragraph.
    paragraph.push(line);
    if (i + 1 < lines.length && isBlockStart(lines[i + 1].trim())) {
      flushParagraph();
    }
  }

  flushParagraph();
  return blocks;
}

const INLINE_TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(INLINE_TOKEN).filter((part) => part.length > 0);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }

    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const href = safeFocusUrl(link[2]);
      if (!href) return <span key={key}>{link[1]}</span>;

      const external = /^https?:\/\//i.test(href);
      return (
        <a
          key={key}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {link[1]}
        </a>
      );
    }

    return <span key={key}>{part}</span>;
  });
}

export function renderFocusContent(
  content: string | null | undefined,
  keyPrefix = "focus-content"
): ReactNode {
  if (!content?.trim()) {
    return (
      <p className="focus-prose__empty">
        Detailed guidance for this focus area is being prepared. Check back soon.
      </p>
    );
  }

  return parseBlocks(content).map((block, index) => {
    const key = `${keyPrefix}-${index}`;

    switch (block.kind) {
      case "heading":
        return block.level === 2 ? (
          <h2 key={key}>{renderInline(block.text, key)}</h2>
        ) : (
          <h3 key={key}>{renderInline(block.text, key)}</h3>
        );
      case "quote":
        return <blockquote key={key}>{renderInline(block.text, key)}</blockquote>;
      case "rule":
        return <hr key={key} />;
      case "image":
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={key} src={block.src} alt={block.alt} loading="lazy" />
        );
      case "list":
        return block.ordered ? (
          <ol key={key}>
            {block.items.map((item, itemIndex) => (
              <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
            ))}
          </ol>
        ) : (
          <ul key={key}>
            {block.items.map((item, itemIndex) => (
              <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
            ))}
          </ul>
        );
      case "paragraph":
      default:
        return <p key={key}>{renderInline(block.text, key)}</p>;
    }
  });
}

export function estimateReadingMinutes(content: string | null | undefined): number {
  if (!content?.trim()) return 1;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 220));
}
