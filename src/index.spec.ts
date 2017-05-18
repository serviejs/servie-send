import { send } from './index'
import { Request } from 'servie'
import { Readable } from 'stream'

describe('servie-send', () => {
  it('should send text', () => {
    const req = new Request({ url: '/' })
    const res = send(req, 'hello world')

    expect(res.status).toEqual(200)
    expect(res.headers).toMatchSnapshot()
    expect(res.body).toEqual('hello world')
  })

  it('should send an empty response', () => {
    const req = new Request({ url: '/' })
    const res = send(req, null)

    expect(res.status).toEqual(200)
    expect(res.headers).toMatchSnapshot()
    expect(res.body).toEqual('')
  })

  it('should send json', () => {
    const req = new Request({ url: '/' })
    const res = send(req, { hello: 'world' })

    expect(res.status).toEqual(200)
    expect(res.headers).toMatchSnapshot()
    expect(res.body).toEqual('{"hello":"world"}')
  })

  it('should send stream', () => {
    const req = new Request({ url: '/' })
    let chunk: string | null = 'hello world'

    const stream = new Readable({
      read () {
        this.push(chunk)
        chunk = null
      }
    })

    const res = send(req, stream)

    expect(res.status).toEqual(200)
    expect(res.headers).toMatchSnapshot()
  })

  it('should send 304 with matching etag', () => {
    const req = new Request({
      url: '/',
      headers: {
        'If-None-Match': '"0-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU"'
      },
      body: ''
    })

    const res = send(req, '')

    expect(res.status).toEqual(304)
    expect(res.headers).toMatchSnapshot()
    expect(res.body).toEqual(undefined)
  })
})
