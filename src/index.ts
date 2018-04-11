import { createHash } from 'crypto'
import { Request, Response, createHeaders, CreateHeaders } from 'servie'
import { createBody, CreateBody } from 'servie/dist/body/node'

export interface SendOptions {
  statusCode?: number // Change the default response status code (200).
  headers?: CreateHeaders // Define headers to use for the response.
  contentType?: string // Define content length for the response.
  contentLength?: number // Define content length for the response.
  mtime?: Date // Define modtime for the response.
  etag?: string // Define ETag for the response.
  skipEtag?: boolean // Skips automatic ETag creation for buffered bodies.
  jsonSpaces?: string | number // `JSON.stringify` spaces.
  jsonReplacer?: (key: string, value: any) => string // `JSON.stringify` replacer.
}

const CACHE_CONTROL_NO_CACHE_REGEXP = /(?:^|,)\s*?no-cache\s*?(?:,|$)/
const TOKEN_LIST_REGEXP = / *, */
const ZERO_LENGTH_ENTITY_TAG = createEntityTag('')

/**
 * Create an empty response.
 */
export function sendEmpty (req: Request, options: SendOptions = {}): Response {
  return send(req, undefined, options)
}

/**
 * Send JSON response.
 */
export function sendJson (
  req: Request,
  payload: boolean | string | number | object,
  options: SendOptions = {}
): Response {
  const contentType = options.contentType || 'application/json'
  const data = JSON.stringify(payload, options.jsonReplacer, options.jsonSpaces)
  return send(req, data, { ...options, contentType })
}

/**
 * Send the response as a stream.
 */
export function sendStream (req: Request, payload: CreateBody, options: SendOptions = {}): Response {
  const contentType = options.contentType || 'application/octet-stream'
  return send(req, payload, { ...options, contentType })
}

/**
 * Send as text response (defaults to `text/plain`).
 */
export function sendText (req: Request, payload: CreateBody, options: SendOptions = {}): Response {
  const contentType = options.contentType || 'text/plain'
  return send(req, payload, { ...options, contentType })
}

/**
 * Send as html response (`text/html`).
 */
export function sendHtml (req: Request, payload: CreateBody, options: SendOptions = {}): Response {
  const contentType = options.contentType || 'text/html'
  return send(req, payload, { ...options, contentType })
}

/**
 * Generate the response for Servie.
 */
export function send (req: Request, payload: CreateBody, options: SendOptions = {}) {
  const headers = createHeaders(options.headers)
  let statusCode = options.statusCode || 200
  let body = req.method === 'HEAD' ? undefined : createBody(payload)

  if (fresh(req, options.etag, options.mtime)) {
    statusCode = 304
    body = undefined
  } else {
    if (options.contentType) headers.set('Content-Type', options.contentType)
    if (options.contentLength) headers.set('Content-Length', String(options.contentLength))
  }

  if (options.mtime) headers.set('Last-Modified', options.mtime.toUTCString())

  if (options.etag) {
    headers.set('ETag', options.etag)
  } else if (!options.skipEtag) {
    if (typeof payload === 'string' || Buffer.isBuffer(payload)) {
      headers.set('ETag', entityTag(payload))
    }
  }

  return new Response({ statusCode, headers, body })
}

/**
 * Create an ETag of the payload body.
 */
export function entityTag (body: string | Buffer) {
  return body.length === 0 ? ZERO_LENGTH_ENTITY_TAG : createEntityTag(body)
}

/**
 * Create an entity tag for cache identification.
 */
function createEntityTag (body: string | Buffer) {
  const hash = createHash('sha256').update(body).digest('base64')

  return `"${hash}"`
}

/**
 * Check if a request is fresh.
 *
 * Reference: https://github.com/jshttp/fresh
 */
function fresh (req: Request, etag?: string, lastModified?: Date): boolean {
  const noneMatch = req.headers.get('if-none-match')
  const modifiedSince = req.headers.get('if-modified-since')

  if (!noneMatch && !modifiedSince) return false

  const cacheControl = req.headers.get('cache-control')

  if (cacheControl && CACHE_CONTROL_NO_CACHE_REGEXP.test(cacheControl)) {
    return false
  }

  if (noneMatch && etag) {
    const isStale = noneMatch.split(TOKEN_LIST_REGEXP).every(match => {
      return match !== etag
    })

    if (isStale) return false
  }

  if (modifiedSince && lastModified) {
    const isStale = lastModified.getTime() > Date.parse(modifiedSince)

    if (isStale) return false
  }

  return true
}
