import { DOMParser } from "https://unpkg.com/linkedom/worker";
import table_to_csv from "./table_to_csv.js";

/**
 * @description For use in environments without a DOM
 * @param {String} input
 * @param {Object} options
 * @param {String} [options.tableSelector] - if input is a full document, the querySelector
 * @param {Boolean} options.includeheaders - whether or not to include headers from the table
 * @returns {String}
 */
export default function table_to_csv_headless(input, options = {}) {
  let tableSelector = options.tableSelector || "table";

  let document = new DOMParser().parseFromString(input, "text/html");
  var table = document.querySelector(tableSelector);

  if (!table) {
    throw new Error(`No table matching selector: ${tableSelector}`);
  }

  return table_to_csv(table, options);
}
