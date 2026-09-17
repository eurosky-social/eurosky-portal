import cache from '@adonisjs/cache/services/main'
import { fromHtml } from 'hast-util-from-html'
import { sanitize } from 'hast-util-sanitize'
import { toString } from 'hast-util-to-string'
import type { Root } from 'hast'
import { DateTime } from 'luxon'
import { EXIT, visit } from 'unist-util-visit'

interface CachedLegalDocument {
  effectiveAt: string
  tree: Root
}

export type LegalDocumentName = 'privacy' | 'terms'

export interface LegalDocument {
  effectiveAt: DateTime
  tree: Root
}

const legalUrls: Record<LegalDocumentName, string> = {
  privacy: 'https://eurosky.tech/accounts/privacy/',
  terms: 'https://eurosky.tech/accounts/terms/',
}

class LegalService {
  /**
   * Get a legal document from `eurosky.tech`.
   */
  async getDocument(name: LegalDocumentName): Promise<LegalDocument> {
    const cached = await cache.getOrSet({
      factory() {
        return fetchDocument(name)
      },
      graceBackoff: '15m',
      grace: '3d',
      key: `legal:${name}`,
      ttl: '24h',
    })

    return { effectiveAt: DateTime.fromISO(cached.effectiveAt), tree: cached.tree }
  }

  /**
   * Get all legal documents.
   */
  async getDocuments(): Promise<Record<LegalDocumentName, LegalDocument>> {
    const [privacy, terms] = await Promise.all([
      this.getDocument('privacy'),
      this.getDocument('terms'),
    ])
    return { privacy, terms }
  }
}

async function fetchDocument(name: LegalDocumentName): Promise<CachedLegalDocument> {
  const response = await fetch(legalUrls[name], { signal: AbortSignal.timeout(10_000) })

  if (!response.ok) {
    throw new Error(`Cannot fetch ${name} document (${response.status})`)
  }

  const tree = fromHtml(await response.text())
  let fragment: Root | undefined

  visit(tree, function (node, _index, parent) {
    if (parent && node.type === 'element' && node.tagName === 'h1') {
      fragment = { children: parent.children, type: 'root' }
      return EXIT
    }
  })

  if (!fragment) {
    throw new Error(`Cannot find body of ${name} document`)
  }

  let effectiveAt: DateTime<true> | undefined

  visit(fragment, function (node) {
    // In the future we can use `<time id="effect">` but for now the content
    // is not structured.
    if (
      node.type === 'element' &&
      node.tagName === 'time' &&
      node.properties.id === 'effect' &&
      typeof node.properties.dateTime === 'string'
    ) {
      const parsed = DateTime.fromISO(node.properties.dateTime)
      if (parsed.isValid) {
        effectiveAt = parsed
        return EXIT
      }
    }

    // Match a date such as `19 September 2026`.
    // Something like `Version 1.1 · Published $date · Takes effect $date`.
    if (node.type === 'element' && node.tagName === 'p') {
      const value = toString(node)
      if (/Version\s+\d/.test(value)) {
        const dates = value.match(/\d{1,2}\s+[a-z]+\s+\d{4}/gi)
        const last = dates?.at(-1)
        if (last) {
          const date = DateTime.fromFormat(last, 'd MMMM yyyy')
          if (date.isValid) {
            effectiveAt = date
            return EXIT
          }
        }
      }
    }
  })

  if (!effectiveAt?.isValid) {
    throw new Error(`Cannot find effective date of ${name} document`)
  }

  return { effectiveAt: effectiveAt.toISO(), tree: sanitize(fragment) as Root }
}

export default new LegalService()
