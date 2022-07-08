import { DOMParser } from "https://esm.sh/linkedom/worker";
import table_to_csv from "./table_to_csv.js";

/**
 * @description Get the table from headless DOM given a selector
 * @param {String} input
 * @param {Object} options
 * @param {String} [options.tableSelector] - if input is a full document, the querySelector
 * @returns {Object}
 */
export function get_table_from_document(input, options = {}) {
  let tableSelector = options.tableSelector || "table";

  let document = new DOMParser().parseFromString(input, "text/html");
  return document.querySelector(tableSelector);
}

/**
 * @description For use in environments without a DOM
 * @param {String} input
 * @param {Object} options
 * @param {String} [options.tableSelector] - if input is a full document, the querySelector
 * @param {Boolean} options.includeheaders - whether or not to include headers from the table
 * @param {Boolean} options.verbose - whether or not to log
 * @returns {String}
 */
export default function table_to_csv_headless(input, options = {}) {
  const table = get_table_from_document(input, options);
  if (!table) {
    throw new Error(`No table matching selector: ${tableSelector}`);
  }

  return table_to_csv(table, options);
}
