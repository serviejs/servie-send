import { Request, Response, HeadersObject } from 'servie'
import { createHash } from 'crypto'
import { Stream } from 'stream'

export interface SendOptions {
  mtime?: Date
  replacer?: (key: string, value: any) => string
  space?: string | number
  type?: string
  status?: number
  etag?: string
  length?: number
}

const CACHE_CONTROL_NO_CACHE_REGEXP = /(?:^|,)\s*?no-cache\s*?(?:,|$)/
const TOKEN_LIST_REGEXP = / *, */

/**
 * Send the payload as a HTTP response.
 */
export function send (req: Request, payload: any, options?: SendOptions): Response {
  if (payload === null || payload === undefined) {
    return sendText(req, '', options)
  }

  if (payload instanceof Stream) {
    return sendStream(req, payload, options)
  }

  if (Buffer.isBuffer(payload)) {
    return sendText(req, payload, options)
  }

  if (typeof payload === 'object') {
    return sendJson(req, payload, options)
  }

  return sendText(req, String(payload), options)
}

/**
 * Send JSON response.
 */
export function sendJson (req: Request, payload: object | string | number, options: SendOptions = {}): Response {
  return sendText(req, JSON.stringify(payload, options.replacer, options.space), {
    type: options.type || 'application/json'
  })
}

/**
 * Send the response as a stream.
 */
export function sendStream (req: Request, payload: Stream, options: SendOptions = {}): Response {
  const headers: HeadersObject = {}
  let status = options.status || 200
  let body = req.method === 'HEAD' ? undefined : payload

  if (fresh(req, options.etag, options.mtime)) {
    status = 304
    body = undefined
  } else {
    headers['Content-Type'] = options.type || 'application/octet-stream'

    if (options.length) {
      headers['Content-Length'] = String(options.length)
    }
  }

  if (options.etag) {
    headers['ETag'] = options.etag
  }

  if (options.mtime) {
    headers['Last-Modified'] = options.mtime.toUTCString()
  }

  return new Response({ status, headers, body })
}

/**
 * Send as text response (defaults to `text/plain`).
 */
export function sendText (req: Request, payload: string | Buffer, options: SendOptions = {}): Response {
  const headers: HeadersObject = {}
  const length = typeof payload === 'string' ? Buffer.byteLength(payload) : payload.length
  const etag = options.etag || entityTag(length, payload)
  let status = options.status || 200
  let body = req.method === 'HEAD' ? undefined : payload

  if (fresh(req, etag, options.mtime)) {
    status = 304
    body = undefined
  } else {
    headers['Content-Type'] = options.type || 'text/plain'
    headers['Content-Length'] = String(length)
  }

  headers['ETag'] = etag

  if (options.mtime) {
    headers['Last-Modified'] = options.mtime.toUTCString()
  }

  return new Response({ status, headers, body })
}

/**
 * Create an ETag of the payload body.
 */
function entityTag (len: number, body: string | Buffer) {
  if (len === 0) {
    return `"0-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU"`
  }

  const hash = createHash('sha256').update(body).digest('base64').replace(/=+$/, '')

  return `"${len.toString(36)}-${hash}"`
}

/**
 * Check if a request is fresh.
 *
 * Reference: https://github.com/jshttp/fresh
 */
function fresh (req: Request, etag?: string, lastModified?: Date): boolean {
  const noneMatch = req.headers.get('if-none-match')
  const modifiedSince = req.headers.get('if-modified-since')

  if (!noneMatch && !modifiedSince) {
    return false
  }

  const cacheControl = req.headers.get('cache-control')

  if (cacheControl && CACHE_CONTROL_NO_CACHE_REGEXP.test(cacheControl)) {
    return false
  }

  if (noneMatch && etag) {
    const isStale = noneMatch.split(TOKEN_LIST_REGEXP).every((match) => match !== etag)

    if (isStale) {
      return false
    }
  }

  if (modifiedSince && lastModified) {
    const isStale = lastModified.getTime() > Date.parse(modifiedSince)

    if (isStale) {
      return false
    }
  }

  return true
}
