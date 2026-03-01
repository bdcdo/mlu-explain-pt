import { select } from "d3-selection";
import { entries } from "d3-collection";

export class Table {
  constructor(opts) {
    this.tableContainer = opts.tableContainer;
  }

  drawTable() {
    // remove table if exists
    select("#data-table").remove();

    // set col names
    this.columnNames = [
      "conjunto",
      "atributo",
      "# gato correto",
      "# gato errado",
      "# cão correto",
      "# cão errado",
      "acurácia",
    ];

    // draw base table
    this.table = select(this.tableContainer)
      .append("table")
      .attr("id", "data-table");

    // add header
    this.thead = this.table.append("thead");

    // add columns
    this.thead
      .selectAll("th")
      .data(this.columnNames, (d) => d)
      .join(
        (enter) => enter.append("th").text((d) => d),
        (update) => {},
        (exit) => {}
      );

    this.startData = [];
  }

  updateTable(newRow) {
    const updatedRow = {
      "conjunto": newRow["dataset"],
      "atributo": newRow["feature"],
      "# gato correto": newRow["cat right"],
      "# gato errado": newRow["cat wrong"],
      "# cão correto": newRow["dog right"],
      "# cão errado": newRow["dog wrong"],
      "acurácia": newRow["accuracy"],
    };

    // update rows
    this.startData.unshift(updatedRow);

    // don't allow duplicates
    this.startData = Array.from(
      new Set(this.startData.map(JSON.stringify))
    ).map(JSON.parse);

    let rows = this.table
      .selectAll("tr")
      .data(this.startData)
      .join((enter) => enter.append("tr"));

    rows
      .selectAll("td")
      .data((row) => entries(row))
      .join(
        (enter) => enter.append("td").text((d) => d.value),
        (update) => update.text((d) => d.value)
      );
  }
}
