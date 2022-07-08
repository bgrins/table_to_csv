import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.137.0/testing/asserts.ts";

import { DOMParser } from "https://esm.sh/linkedom/worker";
import table_to_csv_headless from "./table_to_csv_headless.js";
import table_to_csv, { to_csv } from "./table_to_csv.js";

let verbose = true;

// deno test -A --watch

function getTestData(filename) {
  let document = new DOMParser().parseFromString(
    Deno.readTextFileSync(filename),
    "text/html"
  );
  let table = document.querySelector("table");
  let expected = document.querySelector("template")?.textContent?.trim();

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
    table_to_csv_headless(
      `<table><tr><td>1</td></tr><tr><td>2</td></tr></table>`,
      {
        verbose,
      }
    ),
    "1\n2"
  );
});

Deno.test("unbalanced table", async () => {
  assertEquals(
    table_to_csv_headless(
      `<table>
      <tr><td>1</td><td>2</td></tr>
      <tr><td>1</td><td>2</td><td>3</td></tr>
      </table>`,
      {
        verbose,
      }
    ),
    "1,2,\n1,2,3"
  );
});

Deno.test("trimming whitespace", async () => {
  assertEquals(
    table_to_csv_headless(
      `<table>
      <tr><td>1</td><td>2&nbsp;&nbsp;&nbsp;3</td></tr>
      </table>`,
      {
        verbose,
        limitwhitespace: false,
      }
    ),
    "1,2   3"
  );
  assertEquals(
    table_to_csv_headless(
      `<table>
      <tr><td>1</td><td>2&nbsp;&nbsp;&nbsp;3</td></tr>
      </table>`,
      {
        verbose,
      }
    ),
    "1,2 3"
  );
});

Deno.test("selectors", async () => {
  let htmlString = `<html><body>
  <table id="one"><tr><td>table 1 - row 1</td></tr><tr><td>table 1 - row 2</td></tr></table>
  <table id="two"><tr><td>table 2 - row 1</td></tr><tr><td>table 2 - row 2</td></tr></table>
  </body></html>`;
  assertEquals(
    table_to_csv_headless(htmlString, {
      tableSelector: "#one",
      verbose,
    }),
    "table 1 - row 1\ntable 1 - row 2"
  );
  assertEquals(
    table_to_csv_headless(htmlString, {
      tableSelector: "#two",
      verbose,
    }),
    "table 2 - row 1\ntable 2 - row 2"
  );
  try {
    table_to_csv_headless(htmlString, {
      tableSelector: "#invalid",
      verbose,
    });
    assert(false, "invalid selector didn't throw");
  } catch (e) {
    assert(true, "invalid selector threw");
  }
});

Deno.test("headers", async () => {
  assertEquals(
    table_to_csv_headless(
      `<table>
    <thead><tr><th colspan="2">The table header</th></tr></thead>
    <tbody><tr><td>The table body</td><td>with two columns</td></tr></tbody>
  </table>`,
      {
        includeheaders: false,
        verbose,
      }
    ),
    `The table body,with two columns`
  );
  assertEquals(
    table_to_csv_headless(
      `<table>
    <thead><tr><th colspan="2">The table header</th></tr></thead>
    <tbody><tr><td>The table body</td><td>with two columns</td></tr></tbody>
  </table>`,
      {
        verbose,
      }
    ),
    `The table header,The table header
The table body,with two columns`
  );
});

Deno.test("states-fullpage.html", async () => {
  // Saved from https://en.wikipedia.org/wiki/List_of_states_and_territories_of_the_United_States.
  // Asserting against the HTML fulled from Firefox after loading the page (i.e. template in states.html)
  // In this case the markup coming from the server doesn't have a thead (explicitly includes a tbody),
  // so the easy heuristic for detecting and collapsing headers is missing.
  let { expected } = getTestData("./testdata/states.html");

  let document = new DOMParser().parseFromString(
    Deno.readTextFileSync("./testdata/states-fullpage.html"),
    "text/html"
  );
  let table = document.querySelector("table:nth-of-type(2)");

  let csv = table_to_csv(table, {
    verbose,
  });
  Deno.writeTextFileSync("./testdata/generated/states-fullpage.csv", csv);
  assertEquals(csv, expected);

  csv = table_to_csv(table, {
    includeheaders: false,
    verbose,
  });
  Deno.writeTextFileSync(
    "./testdata/generated/states-fullpage-noheaders.csv",
    csv
  );
  assertEquals(csv, expected.split("\n").slice(1).join("\n"));
});

Deno.test("dogbreeds.html", async () => {
  let { table, expected } = getTestData("./testdata/dogbreeds.html");
  let csv = table_to_csv(table, {
    verbose,
  });
  Deno.writeTextFileSync("./testdata/generated/dogbreeds.csv", csv);
  assertEquals(csv, expected);
});

Deno.test("movies.html", async () => {
  let { table, expected } = getTestData("./testdata/movies.html");
  let csv = table_to_csv(table, {
    verbose,
  });
  Deno.writeTextFileSync("./testdata/generated/movies.csv", csv);
  assertEquals(csv, expected);
});

Deno.test("states.html", async () => {
  let { table, expected } = getTestData("./testdata/states.html");
  let csv = table_to_csv(table, {
    verbose,
  });
  Deno.writeTextFileSync("./testdata/generated/states.csv", csv);
  assertEquals(csv, expected);
});
