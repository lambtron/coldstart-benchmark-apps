import { Hono } from "hono";
import { jsx } from "hono/jsx";
import { serve } from "@hono/node-server";
import flatCache from "flat-cache";
import { nanoid } from "nanoid";

const app = new Hono();
const cache = flatCache.load("cacheId");

interface UrlObject {
  short: string;
  full: string;
  clicks: number;
}

interface UrlObjectRecord {
  [key: string]: UrlObject;
}

const View = (props: { shortUrls: UrlObjectRecord }) => {
  return (
    <html lang="en">
      <body>
        <div class="container">
          <h1>URL Shrinker</h1>
          <form action="/shortUrls" method="POST" class="my-4 form-inline">
            <label for="fullUrl" class="sr-only">Url</label>
            <input
              required
              placeholder="Url"
              type="url"
              name="fullUrl"
              id="fullUrl"
              class="form-control col mr-2"
            />
            <button class="btn btn-success" type="submit">Shrink</button>
          </form>

          <table class="table table-striped table-responsive">
            <thead>
              <tr>
                <th>Full URL</th>
                <th>Short URL</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(props.shortUrls as UrlObjectRecord).map(
                (shortUrl) => {
                  return (
                    <tr>
                      <td>
                        <a href={shortUrl[1].full}>
                          {shortUrl[1].full}
                        </a>
                      </td>
                      <td>
                        <a href={shortUrl[1].short}>{shortUrl[1].short}</a>
                      </td>
                      <td>{shortUrl[1].clicks}</td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  );
};

app.get("/", (c) => {
  const urlObjects = cache.all();
  return c.html(<View shortUrls={urlObjects} />);
});

app.post("/shortUrls", async (c) => {
  const body = await c.req.parseBody();
  const urlObject = {
    short: nanoid(10),
    full: body["fullUrl"],
    clicks: 0,
  };
  cache.setKey(urlObject.short, urlObject);
  cache.save(true);
  return c.redirect("/");
});

app.get("/:shortUrl", async (c) => {
  const urlObject = cache.getKey(c.req.param("shortUrl"));
  if (urlObject === null) return c.notFound();
  urlObject.clicks++;
  cache.setKey(urlObject.short, urlObject);
  cache.save(true);
  return c.redirect(urlObject.full);
});

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});
