import { send } from './index'
import { Request } from 'servie'
import { Readable } from 'stream'

describe('servie-send', () => {
  it('should send text', () => {
    const req = new Request({ url: '/' })

    expect(send(req, 'hello world')).toMatchSnapshot()
  })

  it('should send an empty response', () => {
    const req = new Request({ url: '/' })

    expect(send(req, null)).toMatchSnapshot()
  })

  it('should send json', () => {
    const req = new Request({ url: '/' })

    expect(send(req, { hello: 'world' })).toMatchSnapshot()
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

    expect(send(req, stream)).toMatchSnapshot()
  })

  it('should send 304 with matching etag', () => {
    const req = new Request({
      url: '/',
      headers: {
        'If-None-Match': '"0-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU"'
      },
      body: ''
    })

    expect(send(req, '')).toMatchSnapshot()
  })
})
