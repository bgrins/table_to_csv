import { DOMParser } from "https://esm.sh/linkedom/worker";
import table_to_csv_headless from "./table_to_csv_headless.js";

// deno run -A readme-examples.js

(async function () {
  console.log(table_to_csv_headless(
    `<table>
    <thead><tr><th colspan="2">The table header</th></tr></thead>
    <tbody><tr><td>The table body</td><td>with two columns</td></tr></tbody>
  </table>`,
    {
      includeheaders: false,
    }
  )); /* returns:
  The table body,with two columns
  */

  console.log(table_to_csv_headless(`<table>
<thead><tr><th colspan="2">The table header</th></tr></thead>
<tbody><tr><td>The table body</td><td>with two columns</td></tr></tbody>
</table>`)); /* returns:
The table header,The table header
The table body,with two columns
*/
})();

(async function () {
  let resp = await fetch(
    "https://en.wikipedia.org/wiki/List_of_states_and_territories_of_the_United_States"
  );
  let text = await resp.text();
  // let text = Deno.readTextFileSync("./testdata/states-fullpage.html");

  console.log(
  table_to_csv_headless(text, {
    tableSelector: "table:nth-of-type(2)"
  }));
})();
