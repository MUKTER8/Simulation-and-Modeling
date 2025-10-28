let arrivalData = [];
let serviceData = [];
let arrivalRandoms = []; // length = totalCustomers - 1
let serviceRandoms = []; // length = totalCustomers

// ===== Helpers =====
function formatNumber(num) {
  if (num === null || num === undefined) return "";
  return parseFloat(num.toFixed(3)).toString();
}

function addProbability(type) {
  const input = document.getElementById(type + "Input");
  let value = parseFloat(input.value);
  if (isNaN(value) || value <= 0) return;

  const data = type === "arrival" ? arrivalData : serviceData;
  const table = document.getElementById(type + "Table");
  const scale = type === "arrival" ? 1000 : 100;

  const prevCum = data.length === 0 ? 0 : data[data.length - 1].cumulative;
  const cumulative = prevCum + value;

  if (cumulative > 1 + 1e-9) {
    alert(
      "Total probability cannot exceed 1. Current total would be " +
        cumulative.toFixed(3)
    );
    return;
  }

  input.value = "";

  const rangeStart =
    data.length === 0
      ? 1
      : parseInt(data[data.length - 1].range.split("-")[1]) + 1;

  let rangeEnd = Math.round(cumulative * scale);
  if (rangeEnd < rangeStart) rangeEnd = rangeStart;

  data.push({ prob: value, cumulative, range: `${rangeStart}-${rangeEnd}` });

  const row = table.insertRow(-1);
  row.insertCell(0).textContent = data.length;
  row.insertCell(1).textContent = formatNumber(value);
  row.insertCell(2).textContent = formatNumber(cumulative);
  row.insertCell(3).textContent = `${rangeStart}-${rangeEnd}`;

  // re-run simulation if we already have customers
  if (serviceRandoms.length > 0) updateSimulation();
}

function resetTable(type) {
  if (type === "arrival") arrivalData = [];
  else serviceData = [];
  const table = document.getElementById(type + "Table");
  table.innerHTML = `<tr><th>${
    type === "arrival" ? "Interval Time" : "Service Time"
  }</th><th>Probability</th><th>Cumulative Probability</th><th>Random Digit Range</th></tr>`;

  if (serviceRandoms.length > 0) updateSimulation();
}

// ===== Customers & Randoms =====
function addCustomers() {
  const input = document.getElementById("customersToAdd");
  const addCount = parseInt(input.value, 10);
  if (isNaN(addCount) || addCount <= 0) {
    alert("Enter a valid positive number of customers to add.");
    return;
  }

  // generate arrival and service random digits
  // arrival: only for customers after the very first overall customer
  const firstOverall = serviceRandoms.length === 0; // starting from empty

  for (let i = 0; i < addCount; i++) {
    // For arrival, add a random only if this is not the first overall customer
    if (!(firstOverall && i === 0)) {
      arrivalRandoms.push(Math.floor(Math.random() * 1000) + 1); // 1..1000
    }
    serviceRandoms.push(Math.floor(Math.random() * 100) + 1); // 1..100
  }

  input.value = "";
  document.getElementById(
    "statusMsg"
  ).textContent = `Total customers: ${serviceRandoms.length}`;

  updateSimulation();
}

function resetSimulation() {
  arrivalRandoms = [];
  serviceRandoms = [];
  document.getElementById("statusMsg").textContent = "";
  const table = document.getElementById("simulationTable");
  table.innerHTML = `<tr>
    <th>Customer</th>
    <th>IAT</th>
    <th>AT</th>
    <th>Service Time</th>
    <th>Time Service Begin</th>
    <th>Waiting Time</th>
    <th>Time Service End</th>
    <th>Time in System</th>
    <th>Idle Time</th>
  </tr>`;
  document.getElementById("resultsWrapper").style.display = "none";
}

// ENTER key on the customers input
document.addEventListener("DOMContentLoaded", () => {
  const custInput = document.getElementById("customersToAdd");
  custInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomers();
    }
  });

  const probInputs = [
    { id: "arrivalInput", action: () => addProbability("arrival") },
    { id: "serviceInput", action: () => addProbability("service") },
  ];
  probInputs.forEach(({ id, action }) => {
    const input = document.getElementById(id);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        action();
      }
    });
  });
});

// ===== Simulation=====
function updateSimulation() {
  const table = document.getElementById("simulationTable");
  table.innerHTML = `<tr>
  <th>Customer</th>
  <th>Random Digit (Arrival)</th>
  <th>IAT</th>
  <th>AT</th>
  <th>Random Digit (Service)</th>
  <th>Service Time</th>
  <th>Time Service Begin</th>
  <th>Waiting Time</th>
  <th>Time Service End</th>
  <th>Time in System</th>
  <th>Idle Time</th>
</tr>`;

  const totalCustomers = serviceRandoms.length;
  if (totalCustomers === 0) {
    document.getElementById("resultsWrapper").style.display = "none";
    return;
  }

  let cumulativeAT = 0;
  let previousServiceEnd = 0;

  for (let i = 0; i < totalCustomers; i++) {
    const cust = i + 1;

    // IAT: first customer arrives at time 0; others map from arrivalRandoms[i-1]
    let iat = 0;
    let randArr = 0;
    if (i > 0) {
      randArr = arrivalRandoms[i - 1] || 0;
      iat = mapFromRanges(randArr, arrivalData);
    }

    cumulativeAT += iat;
    const at = cumulativeAT;

    // Service time mapped from serviceRandoms[i]
    const randServ = serviceRandoms[i] || 0;
    const servTime = mapFromRanges(randServ, serviceData);

    const timeServiceBegin = i === 0 ? 0 : Math.max(at, previousServiceEnd);
    const waitingTime = timeServiceBegin - at;
    const timeServiceEnd = timeServiceBegin + servTime;
    const timeInSystem = waitingTime + servTime;
    const idleTime = i === 0 ? 0 : timeServiceBegin - previousServiceEnd;
    previousServiceEnd = timeServiceEnd;

    const row = table.insertRow(-1);
    row.insertCell(0).textContent = cust;
    row.insertCell(1).textContent = randArr; // Random Digit Arrival
    row.insertCell(2).textContent = iat;
    row.insertCell(3).textContent = at;
    row.insertCell(4).textContent = randServ; // Random Digit Service
    row.insertCell(5).textContent = servTime;
    row.insertCell(6).textContent = timeServiceBegin;
    row.insertCell(7).textContent = waitingTime;
    row.insertCell(8).textContent = timeServiceEnd;
    row.insertCell(9).textContent = timeInSystem;
    row.insertCell(10).textContent = idleTime;
  }

  computeResults();
}

// map a random digit to row index (1..k) using the built ranges
function mapFromRanges(rand, data) {
  // If the probability table doesn't cover the full range, unmatched digits map to 0
  for (let j = 0; j < data.length; j++) {
    const [start, end] = data[j].range.split("-").map(Number);
    if (rand >= start && rand <= end) return j + 1;
  }
  return 0;
}

// ===== KPIs =====
function computeResults() {
  const table = document.getElementById("simulationTable");
  let totalWaiting = 0,
    waitingCustomers = 0;
  let totalIdle = 0,
    totalService = 0,
    totalIAT = 0;
  let totalTimeInSystem = 0;

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    const iat = parseFloat(row.cells[1].textContent);
    const service = parseFloat(row.cells[3].textContent);
    const waiting = parseFloat(row.cells[5].textContent);
    const timeSys = parseFloat(row.cells[7].textContent);
    const idle = parseFloat(row.cells[8].textContent);

    totalWaiting += waiting;
    if (waiting > 0) waitingCustomers++;
    totalIdle += idle;
    totalService += service;
    totalTimeInSystem += timeSys;
    if (i > 1) totalIAT += iat;
  }

  const lastEnd =
    table.rows.length > 1
      ? parseFloat(table.rows[table.rows.length - 1].cells[6].textContent)
      : 0;

  document.getElementById("resultsWrapper").style.display = "block";
  document.getElementById("avgWaiting").textContent = (
    totalWaiting /
    (table.rows.length - 1)
  ).toFixed(2);
  document.getElementById("probWait").textContent = (
    waitingCustomers /
    (table.rows.length - 1)
  ).toFixed(3);
  document.getElementById("idleFraction").textContent = (
    totalIdle / (lastEnd || 1)
  ).toFixed(3);
  document.getElementById("avgService").textContent = (
    totalService /
    (table.rows.length - 1)
  ).toFixed(2);
  document.getElementById("avgIAT").textContent = (
    totalIAT / Math.max(1, table.rows.length - 2)
  ).toFixed(2);
  document.getElementById("avgWaitWait").textContent =
    waitingCustomers > 0 ? (totalWaiting / waitingCustomers).toFixed(2) : 0;
  document.getElementById("avgSys").textContent = (
    totalTimeInSystem /
    (table.rows.length - 1)
  ).toFixed(2);
}
const title = document.getElementById("title");
const text = title.textContent;
title.textContent = "";

// Wrap each character in a span
const chars = text.split("").map((ch) => {
  const span = document.createElement("span");
  span.textContent = ch;
  title.appendChild(span);
  return span;
});

const colors = ["#3949ab", "#1de9b6", "#f50057", "#ffca28", "#00bcd4"];
let t = 0;

function waveEffect() {
  chars.forEach((span, i) => {
    // vertical wave motion
    const y = Math.sin((i + t) / 2) * 10;
    span.style.transform = `translateY(${y}px)`;
    // color cycling
    span.style.color = colors[(i + Math.floor(t / 3)) % colors.length];
  });
  t += 0.1;
  requestAnimationFrame(waveEffect);
}

waveEffect();
