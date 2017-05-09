# Servie Send

[![NPM version](https://img.shields.io/npm/v/servie-send.svg?style=flat)](https://npmjs.org/package/servie-send)
[![NPM downloads](https://img.shields.io/npm/dm/servie-send.svg?style=flat)](https://npmjs.org/package/servie-send)
[![Build status](https://img.shields.io/travis/serviejs/servie-send.svg?style=flat)](https://travis-ci.org/serviejs/servie-send)
[![Test coverage](https://img.shields.io/coveralls/serviejs/servie-send.svg?style=flat)](https://coveralls.io/r/serviejs/servie-send?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/serviejs/servie-send.svg)](https://greenkeeper.io/)

> Create a HTTP response to send using Servie - a thin layer for creating a `Response` object with correct client-side cache headers.

## Installation

```
npm install servie-send --save
```

## Usage

```ts
import { send } from 'servie-send'

function handle (req) {
  return send(req, 'hello world!')
}
```

## TypeScript

This project is written using [TypeScript](https://github.com/Microsoft/TypeScript) and publishes the definitions directly to NPM.

## License

Apache 2.0
