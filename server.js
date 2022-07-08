import { Application, Router } from "https://deno.land/x/oak@v10.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors/oakCors.ts";
import table_to_csv_headless, {
  get_table_from_document,
} from "./table_to_csv_headless.js";

// deno run -A server.js
// http://localhost:8001/table/2/https://en.wikipedia.org/wiki/List_of_states_and_territories_of_the_United_States

const DEBUG = true;

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

async function fetchURLText(url) {
  if (!isValidHttpUrl(url)) {
    url = `https://${url}`;
    if (!isValidHttpUrl(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  url = new URL(url);

  let resp = await fetch(url);
  let text = await resp.text();

  return text;
}
const app = new Application();
const router = new Router();
router.get("/external/:url(.*)", async (ctx) => {
  let url = ctx?.params?.url;
  ctx.response.headers.set("content-type", "text/plain");
  try {
    let text = await fetchURLText(url);
    ctx.response.body = text;
  } catch (e) {
    ctx.response.body = `Error fetching ${url}`;
  }
});

router.get("/table/:tableindex/:url(.*)", async (ctx) => {
  let { url, tableindex } = ctx.params;
  let tableSelector = `table:nth-of-type(${parseInt(tableindex)})`;
  ctx.response.headers.set("content-type", "text/plain");
  try {
    let text = await fetchURLText(url);

    if (DEBUG) {
      let table = get_table_from_document(text, {
        tableSelector,
      });
      console.log(table.outerHTML);
      Deno.writeTextFileSync("./FETCHED_TABLE.html", table.outerHTML);
    }
    let csv = table_to_csv_headless(text, {
      tableSelector,
    });
    ctx.response.body = csv;
  } catch {
    ctx.response.body = `Error fetching ${url} with ${tableSelector}`;
  }
});

app.use(oakCors()); // Enable CORS for All Routes
app.use(router.routes());
await app.listen({ port: 8001 });
