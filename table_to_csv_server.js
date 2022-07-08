import { DOMParser } from "https://unpkg.com/linkedom/worker";
import table_to_csv from "./table_to_csv.js";

export default function table_to_csv_server(input, options = {}) {
  let tableSelector = options.tableSelector || "table";

  let document = new DOMParser().parseFromString(input, "text/html");
  var table = document.querySelector(tableSelector);

  if (!table) {
    throw new Error(`No table matching selector: ${tableSelector}`);
  }

  return table_to_csv(table, options);
}
