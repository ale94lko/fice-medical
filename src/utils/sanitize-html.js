import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'article',
  'section',
  'header',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'br',
  'hr',
  'div',
  'span',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'blockquote',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]

const PURIFY_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR: ['class'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  FORBID_TAGS: [
    'script',
    'style',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'link',
    'meta',
    'svg',
    'math',
  ],
  FORBID_ATTR: ['style'],
}

export function sanitizeHtml(dirty) {
  const html = String(dirty ?? '')
  if (!html) {
    return ''
  }
  if (typeof window === 'undefined') {
    return ''
  }

  return DOMPurify.sanitize(html, PURIFY_CONFIG)
}
