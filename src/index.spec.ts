import { sendEmpty, sendJson, sendText, sendStream, entityTag } from "./index";
import { Request, Headers } from "servie/dist/node";
import { Readable } from "stream";

describe("servie-send", () => {
  it("should send text", async () => {
    const req = new Request("/");
    const res = sendText(req, "hello world");

    expect(res.status).toEqual(200);
    expect(res.headers).toMatchSnapshot();
    expect(await res.text()).toEqual("hello world");
  });

  it("should send an empty response", async () => {
    const req = new Request("/");
    const res = sendEmpty(req);

    expect(res.status).toEqual(200);
    expect(res.headers).toMatchSnapshot();
    expect(await res.text()).toEqual("");
  });

  it("should send json", async () => {
    const req = new Request("/");
    const res = sendJson(req, { hello: "world" });

    expect(res.status).toEqual(200);
    expect(res.headers).toMatchSnapshot();
    expect(await res.text()).toEqual('{"hello":"world"}');
  });

  it("should send stream", async () => {
    const req = new Request("/");
    let chunk: string | null = "hello world";

    const stream = new Readable({
      read() {
        this.push(chunk);
        chunk = null;
      }
    });

    const res = sendStream(req, stream);

    expect(res.status).toEqual(200);
    expect(res.headers).toMatchSnapshot();
    expect(await res.text()).toEqual("hello world");
  });

  it("should always send 200 when not computing etag", async () => {
    const req = new Request("/", {
      headers: {
        "If-None-Match": entityTag("")
      },
      body: ""
    });

    const res = sendText(req, "");

    expect(res.status).toEqual(200);
    expect(res.headers).toMatchSnapshot();
    expect(await res.text()).toEqual("");
  });

  it("should send 304 with matching etag", async () => {
    const req = new Request("/", {
      headers: {
        "If-None-Match": entityTag("")
      },
      body: ""
    });

    const res = sendText(req, "", { etag: true });

    expect(res.status).toEqual(304);
    expect(res.headers).toMatchSnapshot();
    expect(await res.text()).toEqual("");
  });

  it("should send 200 with changed etag", async () => {
    const req = new Request("/", {
      headers: {
        "If-None-Match": entityTag("content")
      },
      body: ""
    });

    const res = sendText(req, "", { etag: true });

    expect(res.status).toEqual(200);
    expect(res.headers).toMatchSnapshot();
    expect(await res.text()).toEqual("");
  });
});
