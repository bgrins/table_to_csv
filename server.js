import { match as pathMatch } from "https://deno.land/x/path_to_regexp@v6.2.0/index.ts";
import { serve } from "https://deno.land/std@0.147.0/http/server.ts";
import table_to_csv_headless, {
  get_table_from_document,
} from "./table_to_csv_headless.js";

// deno run -A server.js
// http://localhost:8001/table/2/https://en.wikipedia.org/wiki/List_of_states_and_territories_of_the_United_States

const DEBUG = false;

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

const routes = new Map();
routes.set("/external/:url(.*)", async function (request, { params }) {
  let { url } = params;
  try {
    let text = await fetchURLText(url);
    return new Response(text, {
      headers: {
        "content-type": "text/plain",
      },
    });
  } catch (e) {
    return new Response(`Error fetching ${url}`, {
      headers: {
        "content-type": "text/plain",
      },
    });
  }
});
routes.set("/table/:tableindex/:url(.*)", async function (request, { params }) {
  let { tableindex, url } = params;
  let tableSelector = `table:nth-of-type(${parseInt(tableindex)})`;
  try {
    let text = await fetchURLText(url);

    if (DEBUG) {
      let table = get_table_from_document(text, {
        tableSelector,
      });
      console.log(table.outerHTML);
    }
    let csv = table_to_csv_headless(text, {
      tableSelector,
    });

    return new Response(csv, {
      headers: {
        "content-type": "text/plain",
      },
    });
  } catch {
    return new Response(`Error fetching ${url} with ${tableSelector}`, {
      headers: {
        "content-type": "text/plain",
      },
    });
  }
});

const handler = async (request) => {
  // Allow CORS for browser
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  let pathname = new URL(request.url).pathname;
  for (let [path, route] of routes.entries()) {
    let match = pathMatch(path)(pathname);
    if (match) {
      let returnValue = route(request, {
        params: match.params,
      });
      return returnValue;
    }
  }

  return new Response("Unknown path", { status: 404 });
};

await serve(handler, { port: 8001 });
