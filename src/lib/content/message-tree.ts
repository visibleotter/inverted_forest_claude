/**
 * Message-tree mechanics, with no I/O.
 *
 * Split out from `messages.ts` so it can be unit-tested directly: these
 * four functions decide whether the site's copy renders at all, and the
 * loader beside them pulls in Supabase and Next request context, neither
 * of which belongs in a test of string flattening.
 */

export type MessageTree = Record<string, unknown>;

/** `{ home: { heroTitle: 'x' } }` → `{ 'home.heroTitle': 'x' }`. */
export function flattenMessages(
  node: unknown,
  prefix = ''
): Record<string, string> {
  const out: Record<string, string> = {};

  if (typeof node === 'string') {
    if (prefix) out[prefix] = node;
    return out;
  }

  if (Array.isArray(node)) {
    node.forEach((child, index) => {
      Object.assign(out, flattenMessages(child, `${prefix}.${index}`));
    });
    return out;
  }

  if (node && typeof node === 'object') {
    for (const [key, child] of Object.entries(node as MessageTree)) {
      Object.assign(out, flattenMessages(child, prefix ? `${prefix}.${key}` : key));
    }
  }

  return out;
}

/**
 * Write one dotted path into a tree, creating what is missing.
 *
 * A numeric segment makes an array rather than an object — `faq.items` is
 * read with `t.raw()` and iterated, so turning it into `{ '0': … }` would
 * quietly break the FAQ page.
 */
export function setByPath(
  tree: MessageTree,
  path: string,
  value: string
): void {
  const segments = path.split('.');
  let node: Record<string, unknown> | unknown[] = tree;

  for (let i = 0; i < segments.length - 1; i += 1) {
    const key = segments[i]!;
    const nextIsIndex = /^\d+$/.test(segments[i + 1]!);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const container = node as any;

    if (container[key] === undefined || container[key] === null) {
      container[key] = nextIsIndex ? [] : {};
    }
    node = container[key];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (node as any)[segments[segments.length - 1]!] = value;
}

/**
 * ICU placeholders and rich-text tags used by one string.
 *
 * The guard this feeds is not pedantry: `t('months', {count})` throws when
 * the translation drops `{count}`, and a rich string that loses its
 * `<terms>` tag throws too. Either one takes down the page it is on, and
 * the person who caused it is looking at an admin form, not a stack trace.
 */
export function placeholdersIn(value: string): string[] {
  // exec-in-a-loop rather than matchAll: the project targets ES5 lib and
  // iterating a RegExp iterator needs downlevelIteration, which is not
  // worth turning on for two regexes.
  const found: string[] = [];
  const add = (token: string) => {
    if (!found.includes(token)) found.push(token);
  };

  const icu = /\{([a-zA-Z0-9_]+)[^}]*\}/g;
  let match: RegExpExecArray | null;
  while ((match = icu.exec(value)) !== null) add(`{${match[1]}}`);

  const tag = /<([a-zA-Z][a-zA-Z0-9]*)>/g;
  while ((match = tag.exec(value)) !== null) add(`<${match[1]}>`);

  return found.sort();
}

export function placeholdersMatch(original: string, edited: string): boolean {
  const a = placeholdersIn(original);
  const b = placeholdersIn(edited);
  return a.length === b.length && a.every((token, i) => token === b[i]);
}
