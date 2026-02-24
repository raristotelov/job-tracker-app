/**
 * Utilities for working with Tiptap JSON document content.
 *
 * Tiptap stores rich text as a JSONContent tree. The root node is always
 * a "doc" node with a "content" array of block nodes. Each block may have
 * its own "content" array containing inline nodes (including "text" nodes).
 */

/**
 * Recursively walks a Tiptap JSON node tree and returns true if any "text"
 * node with non-empty text is found.
 */
function hasTextContent(node: Record<string, unknown>): boolean {
  if (node.type === 'text') {
    return typeof node.text === 'string' && node.text.trim().length > 0;
  }

  const children = node.content;
  if (!Array.isArray(children)) return false;

  return (children as Record<string, unknown>[]).some(hasTextContent);
}

/**
 * Returns true when a Tiptap JSON document contains no visible text content.
 *
 * An empty document is one where every paragraph (or other block node)
 * has no text nodes, or only whitespace text nodes.
 *
 * @param content - A Tiptap JSONContent document object.
 */
export function isNoteEmpty(content: Record<string, unknown>): boolean {
  return !hasTextContent(content);
}

/**
 * Sanitizes a Tiptap JSON document by stripping disallowed node types and marks.
 *
 * Allowed nodes:  doc, paragraph, heading, bulletList, orderedList, listItem,
 *                 text, hardBreak
 * Allowed marks:  bold, italic, link
 *
 * This is a placeholder implementation. Full sanitization logic is implemented
 * in T-032 when note Server Actions are built.
 *
 * @param content - A Tiptap JSONContent document object.
 * @returns A new document with disallowed nodes and marks removed.
 */
export function sanitizeNoteContent(
  content: Record<string, unknown>,
): Record<string, unknown> {
  // Placeholder — full implementation in T-032.
  return content;
}
