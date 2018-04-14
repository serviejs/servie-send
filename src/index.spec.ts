import { sendEmpty, sendJson, sendText, sendStream, entityTag } from './index'
import { Request, createHeaders } from 'servie'
import { Readable } from 'stream'
import { createBody } from 'servie/dist/body/node'

describe('servie-send', () => {
  it('should send text', async () => {
    const req = new Request({ url: '/' })
    const res = sendText(req, 'hello world')

    expect(res.statusCode).toEqual(200)
    expect(res.allHeaders).toMatchSnapshot()
    expect(await res.body.text()).toEqual('hello world')
  })

  it('should send an empty response', async () => {
    const req = new Request({ url: '/' })
    const res = sendEmpty(req)

    expect(res.statusCode).toEqual(200)
    expect(res.allHeaders).toMatchSnapshot()
    expect(await res.body.text()).toEqual('')
  })

  it('should send json', async () => {
    const req = new Request({ url: '/' })
    const res = sendJson(req, { hello: 'world' })

    expect(res.statusCode).toEqual(200)
    expect(res.allHeaders).toMatchSnapshot()
    expect(await res.body.text()).toEqual('{"hello":"world"}')
  })

  it('should send stream', async () => {
    const req = new Request({ url: '/' })
    let chunk: string | null = 'hello world'

    const stream = new Readable({
      read () {
        this.push(chunk)
        chunk = null
      }
    })

    const res = sendStream(req, stream)

    expect(res.statusCode).toEqual(200)
    expect(res.allHeaders).toMatchSnapshot()
    expect(await res.body.text()).toEqual('hello world')
  })

  it('should send 304 with matching etag', async () => {
    const req = new Request({
      url: '/',
      headers: createHeaders({
        'If-None-Match': entityTag('')
      }),
      body: createBody('')
    })

    const res = sendText(req, '')

    expect(res.statusCode).toEqual(304)
    expect(res.allHeaders).toMatchSnapshot()
    expect(await res.body.text()).toEqual('')
  })
})
