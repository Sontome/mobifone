document.getElementById("search").addEventListener("input", async function () {
  const q = this.value.trim();
  if (q.length < 3) {
    document.getElementById("results").innerHTML = "";
    return;
  }

  const res = await fetch(`/search?q=${encodeURIComponent(q)}`);
  const data = await res.json();

  const html = data.map(item => {
    const cols = item.columns.map(col => `<td><b>${col.col}</b>: ${col.value}</td>`).join("");
    return `<tr><td><b>${item.sheet}</b> - dòng ${item.rowIndex}</td>${cols}</tr>`;
  }).join("");

  document.getElementById("results").innerHTML = `<table>${html}</table>`;
});