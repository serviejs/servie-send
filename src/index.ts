import { createHash } from "crypto";
import {
  Request,
  Response,
  Headers,
  HeadersInit,
  CreateBody
} from "servie/dist/node";

export interface SendOptions {
  status?: number; // Change the default response status code (200).
  headers?: HeadersInit; // Define headers to use for the response.
  contentType?: string; // Define content length for the response.
  contentLength?: number; // Define content length for the response.
  mtime?: Date; // Define modtime for the response.
  etag?: boolean | string; // Define ETag for the response.
}

const CACHE_CONTROL_NO_CACHE_REGEXP = /(?:^|,)\s*?no-cache\s*?(?:,|$)/;
const TOKEN_LIST_REGEXP = / *, */;
const ZERO_LENGTH_ENTITY_TAG = toEntityTag("");

/**
 * Create an empty response.
 */
export function sendEmpty(req: Request, options: SendOptions = {}): Response {
  return send(req, null, options);
}

/**
 * JSON response configuration.
 */
export interface JsonOptions extends SendOptions {
  jsonSpaces?: string | number; // `JSON.stringify` spaces.
  jsonReplacer?: (key: string, value: any) => string; // `JSON.stringify` replacer.
}

/**
 * Send JSON response.
 */
export function sendJson(
  req: Request,
  payload: boolean | string | number | object,
  options: JsonOptions = {}
): Response {
  const contentType = options.contentType || "application/json";
  const { status, headers, contentLength, mtime, etag } = options;
  const data = JSON.stringify(
    payload,
    options.jsonReplacer,
    options.jsonSpaces
  );
  return send(req, data, {
    status,
    headers,
    contentType,
    contentLength,
    mtime,
    etag
  });
}

/**
 * Send the response as a stream.
 */
export function sendStream(
  req: Request,
  payload: CreateBody,
  options: SendOptions = {}
): Response {
  const contentType = options.contentType || "application/octet-stream";
  return send(req, payload, { ...options, contentType });
}

/**
 * Send as text response (defaults to `text/plain`).
 */
export function sendText(
  req: Request,
  payload: CreateBody,
  options: SendOptions = {}
): Response {
  const contentType = options.contentType || "text/plain";
  return send(req, payload, { ...options, contentType });
}

/**
 * Send as html response (`text/html`).
 */
export function sendHtml(
  req: Request,
  payload: CreateBody,
  options: SendOptions = {}
): Response {
  const contentType = options.contentType || "text/html";
  return send(req, payload, { ...options, contentType });
}

/**
 * Generate the response for Servie.
 */
export function send(
  req: Request,
  payload: CreateBody,
  options: SendOptions = {}
) {
  let status = options.status || 200;
  let body = req.method === "HEAD" ? undefined : payload;

  const headers = new Headers(options.headers);
  const { mtime, contentType, contentLength } = options;
  const etag = computeEtag(body, options.etag);

  if (fresh(req, etag, mtime)) {
    status = 304;
    body = undefined;
  } else {
    if (contentType) headers.set("Content-Type", contentType);
    if (contentLength) headers.set("Content-Length", String(contentLength));
  }

  if (etag) headers.set("ETag", etag);
  if (mtime) headers.set("Last-Modified", mtime.toUTCString());

  return new Response(body, { status, headers });
}

/**
 * Compute etags when requested.
 */
function computeEtag(body: CreateBody, etag?: boolean | string) {
  if (typeof etag === "string") return etag;
  if (!etag) return;
  if (body === undefined || body === null) return ZERO_LENGTH_ENTITY_TAG;
  if (typeof body === "string" || Buffer.isBuffer(body)) return entityTag(body);
  throw new TypeError("Etag can only be computed on a string or buffer");
}

/**
 * Create an ETag from the payload body.
 */
export function entityTag(body: string | Buffer): string | undefined {
  return body.length === 0 ? ZERO_LENGTH_ENTITY_TAG : toEntityTag(body);
}

/**
 * Create an entity tag for cache identification.
 */
function toEntityTag(body: string | Buffer): string {
  const hash = createHash("sha256")
    .update(body)
    .digest("base64");

  return `"${hash}"`;
}

/**
 * Check if a request is fresh.
 *
 * Reference: https://github.com/jshttp/fresh
 */
function fresh(req: Request, etag?: string, mtime?: Date): boolean {
  const ifNoneMatch = req.headers.get("if-none-match");
  const ifModifiedSince = req.headers.get("if-modified-since");

  if (!ifNoneMatch && !ifModifiedSince) return false;

  const cacheControl = req.headers.get("cache-control");

  if (cacheControl && CACHE_CONTROL_NO_CACHE_REGEXP.test(cacheControl)) {
    return false;
  }

  if (ifNoneMatch && etag) {
    const isFresh = ifNoneMatch.split(TOKEN_LIST_REGEXP).every(match => {
      return match === etag;
    });

    if (isFresh) return true;
  }

  if (ifModifiedSince && mtime) {
    const isFresh = mtime.getTime() <= Date.parse(ifModifiedSince);

    if (isFresh) return true;
  }

  return false;
}
