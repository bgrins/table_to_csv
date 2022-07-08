import { assertEquals } from "https://deno.land/std@0.137.0/testing/asserts.ts";
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
