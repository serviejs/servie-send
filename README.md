# Servie Send

[![NPM version](https://img.shields.io/npm/v/servie-send.svg?style=flat)](https://npmjs.org/package/servie-send)
[![NPM downloads](https://img.shields.io/npm/dm/servie-send.svg?style=flat)](https://npmjs.org/package/servie-send)
[![Build status](https://img.shields.io/travis/serviejs/servie-send.svg?style=flat)](https://travis-ci.org/serviejs/servie-send)
[![Test coverage](https://img.shields.io/coveralls/serviejs/servie-send.svg?style=flat)](https://coveralls.io/r/serviejs/servie-send?branch=master)

> Create a HTTP response to send using Servie - a thin layer for creating a `Response` object with cache headers.

## Installation

```
npm install servie-send --save
```

## Usage

```ts
import {
  sendText,
  sendHtml,
  sendJson,
  sendStream,
  sendEmpty,
  entityTag
} from "servie-send";

function handle(req) {
  return sendText(req, "hello world!");
  return sendHtml(req, "<!doctype html>");
  return sendJson(req, { json: true });
  return sendStream(req, fs.createReadStream("example.txt"));
  return sendEmpty(req); // Nothing in response.
}
```

### Options

- `status?` Change the default response status code (200).
- `headers?` Define the headers to use for the response.
- `contentType?` Define content length for the response.
- `contentLength?` Define content length for the response.
- `mtime?` Define the modification `Date` for the response.
- `etag?` Define an ETag for the response (e.g. pre-computed with `entityTag()` or `true` for on-demand).

## TypeScript

This project is written using [TypeScript](https://github.com/Microsoft/TypeScript) and publishes the definitions directly to NPM.

## License

Apache 2.0
