export function to_csv(arr) {
  var output = "";
  arr.forEach((o, i) => {
    o.forEach((p, j) => {
      // Map DOM nodes to string
      p = typeof p == "string" ? p : p.textContent;
      // Handle starting spaces, and escape newlines
      p = p
        .replace(/^ +| +$/g, "")
        .replaceAll("\r\n", "\\r\\n")
        .replaceAll("\n", "\\n");
      // Quote when necessary, and convert to duplicate double quotes in string
      if (p.match(/,|"/)) {
        p = `"${p.replaceAll('"', '""')}"`;
      }

      output += p;
      if (j < o.length - 1) {
        output += ",";
      }
    });
    if (i < arr.length - 1) {
      output += "\n";
    }
  });
  return output;
}

function trimAndCollapseWhitespace(str) {
  return str.trim().replace(/[\s\uFEFF\xA0]+/g, " ");
}

function childRows(tableContainer) {
  return [...tableContainer.children].filter((c) => {
    return c.tagName == "TR";
  });
}

function childCells(row) {
  return [...row.children].filter((c) => {
    return c.tagName == "TD" || c.tagName == "TH";
  });
}

export function table_to_json(
  table,
  { includeheaders, limitwhitespace, verbose }
) {
  var rows = [];
  var numHeaderRows = 0;
  var tbody = [...table.children].find((c) => c.tagName == "TBODY") || table;
  var tbodyRows = childRows(tbody);

  var thead = [...table.children].find((c) => c.tagName == "THEAD");
  if (thead) {
    if (includeheaders) {
      let theadRows = childRows(thead);
      numHeaderRows = theadRows.length;
      rows = rows.concat(theadRows);
    }
  } else {
    // Handle special case of no thead but a first row containing only th's
    let leadingHeaderRowsCount = 0;
    for (let i = 0; i < tbodyRows.length; i++) {
      let cells = childCells(tbodyRows[i]);
      if (cells.length > 0 && cells.every((c) => c.tagName == "TH")) {
        leadingHeaderRowsCount++;
      } else {
        break;
      }
    }

    if (
      leadingHeaderRowsCount > 0 &&
      leadingHeaderRowsCount < tbodyRows.length
    ) {
      if (includeheaders) {
        numHeaderRows = leadingHeaderRowsCount;
        rows = rows.concat(tbodyRows.slice(0, leadingHeaderRowsCount));
      }
      // Even if we don't want to include headers we want to remove detected header rows
      tbodyRows = tbodyRows.slice(leadingHeaderRowsCount);
    }
  }

  var rows = rows.concat(tbodyRows);
  let rowLengths = rows.map((r) => childCells(r).length);
  let maxRowLength = Math.max(...rowLengths.concat(0));
  let minRowLength = Math.min(...rowLengths.concat(0));

  if (verbose) {
    console.log(`
  ----
  includeheaders ${includeheaders} - ${numHeaderRows} header rows detected
  total rows - ${rows.length}
  max row length: ${maxRowLength}
  min row length: ${minRowLength}
  ----`);
  }

  var records = rows.map((_) => new Array(maxRowLength).fill(null));

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var cells = childCells(row);
    var currentCellIndex = 0;
    cells.forEach((cell, j) => {
      let { rowSpan, colSpan } = cell;
      // linkedom doesn't support this as a property on the node - look up attr instead:
      if (!rowSpan || !colSpan) {
        rowSpan = parseInt(cell.getAttribute("rowspan") || "1", 10);
        colSpan = parseInt(cell.getAttribute("colspan") || "1", 10);
      }

      // records[i][currentCellIndex] = cell.textContent;
      // if (cell.rowSpan > 1 || cell.colSpan > 1) {
      for (var _ = 0; _ < colSpan; _++) {
        for (var row = 0; row < rowSpan; row++) {
          let currentRowIndex = row + i;
          // Find the next open cell to apply to (i.e. if a previous rowspan expanded into this space.
          // Todo: consult with spec/wpt to see if there are some good test cases to make sure this
          // works as expected
          while (records[currentRowIndex][currentCellIndex]) {
            currentCellIndex += 1;
          }
          if (currentCellIndex > maxRowLength) {
            console.error(cell.innerText);
            throw new Error(
              "Too many cells (total colspan larger than cells) " +
                i +
                "  " +
                j +
                " " +
                currentCellIndex +
                "  " +
                maxRowLength
            );
          }
          // Todo: should we just expand out to a string here? Maybe keeping a reference to cell is helpful
          // for the header row merging later? If not then just remove this.
          records[currentRowIndex][currentCellIndex] = cell;
        }
        currentCellIndex += 1;
      }
    });
  }

  // This is handling cases like https://en.wikipedia.org/wiki/List_of_states_and_territories_of_the_United_States
  // with complicated multi row headers. Basically merge header rows together into a new row and remove the others.
  if (includeheaders && numHeaderRows > 1) {
    let colTitles = [];
    for (let j = 0; j < maxRowLength; j++) {
      let titleSet = new Set();
      for (let i = 0; i < numHeaderRows; i++) {
        titleSet.add(records[i][j]);
      }
      colTitles.push(
        [...titleSet.values()]
          .map((el) => {
            // Use innerText to avoid headers getting stuck together on the server when there's a <br /> tag and
            // no whitespace.
            return limitwhitespace
              ? trimAndCollapseWhitespace(el.innerText)
              : el.innerText;
          })
          .filter((text) => text != "")
          .join(" - ")
      );
    }
    records = records.slice(numHeaderRows);
    records.unshift(colTitles);
  }

  for (let [rowIndex, row] of records.entries()) {
    for (let [colIndex, col] of row.entries()) {
      if (!records[rowIndex][colIndex]) {
        console.error("Error: missing cell", rowIndex, colIndex);
        records[rowIndex][colIndex] = "";
      }
      let colString = typeof col == "string" ? col : col.innerText;
      records[rowIndex][colIndex] = limitwhitespace
        ? trimAndCollapseWhitespace(colString)
        : colString;
    }
  }

  return records;
}

/**
 * @description Given a DOM table element, return the CSV
 * @param {Object} table
 * @param {Object} options
 * @param {Boolean} options.includeheaders - whether or not to include headers from the table
 * @param {Boolean} options.limitwhitespace - whether or not to trim and collapse whitespace inside cells
 * @param {Boolean} options.verbose - whether or not to log
 * @returns {String}
 */
export default function table_to_csv(
  table,
  { includeheaders = true, limitwhitespace = true, verbose = false } = {}
) {
  if (!table || !table.outerHTML) {
    throw new Error(`Not a valid table element`);
  }

  let json = table_to_json(table, {
    includeheaders,
    limitwhitespace,
    verbose,
  });
  return to_csv(json);
}
