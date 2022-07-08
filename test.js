import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.137.0/testing/asserts.ts";
import { DOMParser } from "https://unpkg.com/linkedom/worker";
import table_to_csv_server from "./table_to_csv_server.js";
import table_to_csv, { to_csv } from "./table_to_csv.js";

// deno test -A --watch

function getTestData(filename) {
  let document = new DOMParser().parseFromString(
    Deno.readTextFileSync(filename),
    "text/html"
  );
  let table = document.querySelector("table");
  let expected = document.querySelector("template").textContent.trim();

  return { table, expected };
}

Deno.test("csv", async () => {
  assertEquals(to_csv([["1"], ["2"]]), "1\n2");

  // Quoting
  assertEquals(to_csv([["1,"]]), `"1,"`);
  assertEquals(to_csv([["1\n"]]), "1\\n");
  assertEquals(to_csv([["1\n2"]]), "1\\n2");
  assertEquals(to_csv([["1\n,"]]), '"1\\n,"');
  assertEquals(to_csv([['1\n,\n"']]), '"1\\n,\\n"""');
  assertEquals(to_csv([['1""']]), `"1"""""`);
});

Deno.test("basic", async () => {
  assertEquals(
    table_to_csv_server(
      `<table><tr><td>1</td></tr><tr><td>2</td></tr></table>`
    ),
    "1\n2"
  );
});

Deno.test("selectors", async () => {
  let htmlString = `<html><body>
  <table id="one"><tr><td>table 1 - row 1</td></tr><tr><td>table 1 - row 2</td></tr></table>
  <table id="two"><tr><td>table 2 - row 1</td></tr><tr><td>table 2 - row 2</td></tr></table>
  </body></html>`;
  assertEquals(
    table_to_csv_server(htmlString, {
      tableSelector: "#one",
    }),
    "table 1 - row 1\ntable 1 - row 2"
  );
  assertEquals(
    table_to_csv_server(htmlString, {
      tableSelector: "#two",
    }),
    "table 2 - row 1\ntable 2 - row 2"
  );
  try {
    table_to_csv_server(htmlString, {
      tableSelector: "#invalid",
    });
    assert(false, "invalid selector didn't throw");
  } catch (e) {
    assert(true, "invalid selector threw");
  }
});

Deno.test("headers", async () => {
  assertEquals(
    table_to_csv_server(
      `<table>
      <thead>
          <tr>
          <th colspan="2">The table header</th>
          </tr>
      </thead>
      <tbody>
          <tr>
              <td>The table body</td>
              <td>with two columns</td>
          </tr>
      </tbody>
  </table>`,
      {
        includeheaders: false,
      }
    ),
    `The table body,with two columns`
  );
  assertEquals(
    table_to_csv_server(
      `<table>
      <thead>
          <tr>
          <th colspan="2">The table header</th>
          </tr>
      </thead>
      <tbody>
          <tr>
              <td>The table body</td>
              <td>with two columns</td>
          </tr>
      </tbody>
  </table>`
    ),
    `The table header,The table header
The table body,with two columns`
  );
});

Deno.test("dogbreeds.html", async () => {
  let { table, expected } = getTestData("./testdata/dogbreeds.html");
  let csv = table_to_csv(table);
  Deno.writeTextFileSync("./testdata/generated/dogbreeds.csv", csv);
  assertEquals(csv, expected);
});

Deno.test("movies.html", async () => {
  let { table, expected } = getTestData("./testdata/movies.html");
  let csv = table_to_csv(table);
  Deno.writeTextFileSync("./testdata/generated/movies.csv", csv);
  assertEquals(csv, expected);
});

Deno.test("states.html", async () => {
  let { table, expected } = getTestData("./testdata/states.html");
  let csv = table_to_csv(table);
  Deno.writeTextFileSync("./testdata/generated/states.csv", csv);
  assertEquals(csv, expected);
});
