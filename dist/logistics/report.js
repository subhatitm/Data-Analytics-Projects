"use strict";

const el = id => document.getElementById(id);
const stateNames = {
  AC:"Acre", AL:"Alagoas", AP:"Amapá", AM:"Amazonas", BA:"Bahia", CE:"Ceará",
  DF:"Distrito Federal", ES:"Espírito Santo", GO:"Goiás", MA:"Maranhão", MT:"Mato Grosso",
  MS:"Mato Grosso do Sul", MG:"Minas Gerais", PA:"Pará", PB:"Paraíba", PR:"Paraná",
  PE:"Pernambuco", PI:"Piauí", RJ:"Rio de Janeiro", RN:"Rio Grande do Norte",
  RS:"Rio Grande do Sul", RO:"Rondônia", RR:"Roraima", SC:"Santa Catarina", SP:"São Paulo",
  SE:"Sergipe", TO:"Tocantins"
};
const metrics = ["orders","late","late_days","staged_orders","dispatch_days_sum","transit_days_sum"];
const integer = new Intl.NumberFormat("en-US");
const monthFormat = new Intl.DateTimeFormat("en", { month:"short", year:"numeric", timeZone:"UTC" });
const monthLabel = month => monthFormat.format(new Date(month + "-01T00:00:00Z"));
const rate = row => row.orders ? 100 * row.late / row.orders : 0;
const percent = n => n.toFixed(2) + "%";
const severity = row => row.late ? (row.late_days / row.late).toFixed(1) : "—";
let records = [], selection = [], expanded = false;

function total(rows) {
  const result = Object.fromEntries(metrics.map(key => [key, 0]));
  for (const row of rows) for (const key of metrics) result[key] += row[key];
  return result;
}
function group(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row[key])) groups.set(row[key], []);
    groups.get(row[key]).push(row);
  }
  return Array.from(groups, ([name, items]) => ({ name, ...total(items) }));
}
function element(tag, value, className) {
  const node = document.createElement(tag);
  if (value !== undefined) node.textContent = value;
  if (className) node.className = className;
  return node;
}
function renderTrend() {
  const months = group(selection, "month").sort((a,b) => a.name.localeCompare(b.name));
  const upper = Math.max(10, Math.ceil(Math.max(...months.map(rate),0) / 10) * 10);
  el("axis").replaceChildren(...[upper, upper / 2, 0].map(v => element("span", v + "%")));
  const bars = el("bars");
  bars.replaceChildren();
  el("detail").textContent = "";
  for (const month of months) {
    const label = monthLabel(month.name) + " · " + integer.format(month.late) + " late of " +
      integer.format(month.orders) + " orders (" + percent(rate(month)) + ")";
    const bar = element("button", undefined, "bar");
    bar.type = "button";
    bar.title = label;
    bar.setAttribute("aria-label", label);
    bar.setAttribute("aria-pressed", "false");
    bar.style.height = (rate(month) / upper * 100) + "%";
    function select() {
      for (const item of bars.children) item.setAttribute("aria-pressed", String(item === bar));
      el("detail").textContent = label;
    }
    bar.addEventListener("click", select);
    bar.addEventListener("focus", select);
    bars.append(bar);
  }
  if (months.length) {
    const peak = months.reduce((a,b) => rate(b) > rate(a) ? b : a);
    bars.children[months.indexOf(peak)].click();
  }
  el("ends").replaceChildren(...(months.length ? [months[0], months.at(-1)] : []).map(m => element("span",monthLabel(m.name))));
}
function renderStages(s) {
  const box = el("stages");
  box.replaceChildren();
  const stages = [["Purchase to carrier",s.dispatch_days_sum],["Carrier to customer",s.transit_days_sum]];
  for (const [name, sum] of stages) {
    const stage = element("div", undefined, "stage");
    const heading = element("div");
    heading.append(element("span",name), element("strong",s.staged_orders ? (sum/s.staged_orders).toFixed(1) + " days" : "—"));
    const rail = element("div",undefined,"rail");
    const fill = element("i");
    fill.style.width = (100 * sum / (s.dispatch_days_sum + s.transit_days_sum || 1)) + "%";
    rail.append(fill);
    stage.append(heading,rail);
    box.append(stage);
  }
  el("stage-note").textContent = integer.format(s.staged_orders) + " of " + integer.format(s.orders) + " scored orders have usable stage times.";
}
function renderTable() {
  const sort = el("sort").value;
  const destinations = group(selection, "state");
  const score = s => sort === "rate" ? rate(s) : s[sort];
  destinations.sort((a,b) => score(b)-score(a) || b.orders-a.orders || a.name.localeCompare(b.name));
  const visible = expanded ? destinations : destinations.slice(0,6);
  el("rows").replaceChildren(...visible.map(s => {
    const tr = element("tr");
    for (const value of [stateNames[s.name] + " (" + s.name + ")", integer.format(s.orders), integer.format(s.late),percent(rate(s)),severity(s)]) tr.append(element("td",value));
    return tr;
  }));
  el("more").hidden = destinations.length <= 6;
  el("more").textContent = expanded ? "Show top six" : "Show all " + destinations.length + " states";
}
function render() {
  selection = records.filter(r => (!el("year").value || r.month.startsWith(el("year").value)) && (!el("state").value || r.state === el("state").value));
  const s = total(selection);
  el("orders").textContent = integer.format(s.orders);
  el("late").textContent = integer.format(s.late);
  el("ontime").textContent = s.orders ? percent(100-rate(s)) : "—";
  el("severity").textContent = severity(s);
  el("status").textContent = (el("state").value ? stateNames[el("state").value] : "All destinations") + " · " + (el("year").value || "Full period") + " · " + integer.format(s.orders) + " eligible orders";
  el("export").disabled = !selection.length;
  renderTrend(); renderStages(s); renderTable();
}
async function start() {
  const response = await fetch("scorecard.csv");
  if (!response.ok) throw new Error("CSV unavailable");
  const [header, ...lines] = (await response.text()).trim().split(/\r?\n/);
  const columns = header.split(",");
  records = lines.map(line => Object.fromEntries(line.split(",").map((v,i) => [columns[i], metrics.includes(columns[i]) ? Number(v) : v])));
  for (const year of [...new Set(records.map(r => r.month.slice(0,4)))].sort()) el("year").add(new Option(year,year));
  for (const state of [...new Set(records.map(r => r.state))].sort((a,b) => stateNames[a].localeCompare(stateNames[b]))) el("state").add(new Option(stateNames[state] + " (" + state + ")",state));
  for (const id of ["year","state"]) el(id).addEventListener("change", () => { expanded = false; render(); });
  el("sort").addEventListener("change",renderTable);
  el("more").addEventListener("click", () => { expanded = !expanded; renderTable(); });
  el("export").addEventListener("click", () => {
    const csv = [header,...selection.map(r => columns.map(k => r[k]).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const link = element("a");
    link.href = url;
    link.download = "delivery-" + (el("state").value || "all-states") + "-" + (el("year").value || "full-period") + ".csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  });
  render();
}
start().catch(() => { el("status").textContent = "The scorecard could not load. Download the full aggregate CSV under Method and evidence."; });
