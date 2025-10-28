let arrivalData = [];
let serviceData = [];
let arrivalRandoms = [];
let serviceRandoms = [];

// HELPER FUNCTION
function formatNumber(num) {
  if (num === null || num === undefined) return "";
  return parseFloat(num.toFixed(3)).toString();
}

// ADD PROBABILITY
function addProbability(type) {
  const input = document.getElementById(type + "Input");
  let value = parseFloat(input.value);
  if (isNaN(value) || value <= 0) return;
  input.value = "";
  const table = document.getElementById(type + "Table");
  const data = type === "arrival" ? arrivalData : serviceData;
  const cumulative =
    data.length === 0 ? value : data[data.length - 1].cumulative + value;

  const decimalPart = value.toString().split(".")[1] || "";
  const multiplier = Math.pow(10, Math.max(2, decimalPart.length));

  let rangeStart = 0;
  if (data.length > 0) {
    const prevRange = data[data.length - 1].range.split("-").map(Number);
    rangeStart = prevRange[1] + 1;
  }
  const rangeEnd = Math.round(cumulative * multiplier);

  data.push({
    prob: value,
    cumulative: cumulative,
    range: `${rangeStart}-${rangeEnd}`,
  });

  const row = table.insertRow(-1);
  row.insertCell(0).textContent = data.length;
  row.insertCell(1).textContent = formatNumber(value);
  row.insertCell(2).textContent = formatNumber(cumulative);
  row.insertCell(3).textContent = `${rangeStart}-${rangeEnd}`;
}

// RESET TABLE
function resetTable(type) {
  if (type === "arrival") arrivalData = [];
  else serviceData = [];
  const table = document.getElementById(type + "Table");
  table.innerHTML = `<tr><th>${
    type === "arrival" ? "Interval Time" : "Service Time"
  }</th><th>Probability</th><th>Cumulative Probability</th><th>Random Digit Range</th></tr>`;
}

// ADD RANDOM DIGIT (Horizontal, first column labels always visible)
function addRandomDigit(type) {
  const input = document.getElementById(type + "RandomInput");
  const value = input.value.trim();
  if (value === "") return;
  input.value = "";

  const table = document.getElementById(type + "RandomTable");
  const data = type === "arrival" ? arrivalRandoms : serviceRandoms;
  data.push(parseInt(value));

  const rowNo = table.rows[0];
  const rowDigit = table.rows[1];

  // Append new cell for number and digit
  rowNo.insertCell(-1).textContent = data.length;
  rowDigit.insertCell(-1).textContent = value;
}

// RESET RANDOM TABLE (keep first column labels)
function resetRandom(type) {
  if (type === "arrival") arrivalRandoms = [];
  else serviceRandoms = [];

  const table = document.getElementById(type + "RandomTable");
  table.rows[0].innerHTML = "<td><strong>No.</strong></td>";
  table.rows[1].innerHTML = "<td><strong>Random Digit</strong></td>";
}

// ENTER KEY HANDLING
document.addEventListener("DOMContentLoaded", () => {
  const inputs = [
    { id: "arrivalInput", action: () => addProbability("arrival") },
    { id: "serviceInput", action: () => addProbability("service") },
    { id: "arrivalRandomInput", action: () => addRandomDigit("arrival") },
    { id: "serviceRandomInput", action: () => addRandomDigit("service") },
  ];
  inputs.forEach(({ id, action }) => {
    const input = document.getElementById(id);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        action();
      }
    });
  });
});

// GENERATE SIMULATION TABLE (unchanged)
function generateSimulation() {
  const table = document.getElementById("simulationTable");
  table.style.display = "table";
  table.innerHTML = `<tr>
      <th>Customer</th><th>Random Digit Arrival</th><th>IAT</th><th>AT</th>
      <th>Random Digit Service Time</th><th>Service Time</th>
      <th>Time Service Begin</th><th>Waiting Time</th>
      <th>Time Service End</th><th>Time in System</th><th>Idle Time</th>
    </tr>`;

  const totalRows = Math.max(arrivalRandoms.length, serviceRandoms.length);
  let cumulativeAT = 0,
    previousServiceEnd = 0;

  for (let i = 0; i < totalRows; i++) {
    const cust = i + 1;
    const randArr = i === 0 ? 0 : arrivalRandoms[i - 1];
    const randServ = i < serviceRandoms.length ? serviceRandoms[i] : 0;

    // IAT mapping
    let iat = 0;
    if (randArr !== 0) {
      for (let j = 0; j < arrivalData.length; j++) {
        const [start, end] = arrivalData[j].range.split("-").map(Number);
        if (randArr >= start && randArr <= end) {
          iat = j + 1;
          break;
        }
      }
    }
    cumulativeAT += iat;
    const at = cumulativeAT;

    // Service Time mapping
    let servTime = 0;
    for (let j = 0; j < serviceData.length; j++) {
      const [start, end] = serviceData[j].range.split("-").map(Number);
      if (randServ >= start && randServ <= end) {
        servTime = j + 1;
        break;
      }
    }

    const timeServiceBegin = i === 0 ? 0 : Math.max(at, previousServiceEnd);
    const waitingTime = timeServiceBegin - at;
    const timeServiceEnd = timeServiceBegin + servTime;
    const timeInSystem = waitingTime + servTime;
    const idleTime = i === 0 ? 0 : timeServiceBegin - previousServiceEnd;
    previousServiceEnd = timeServiceEnd;

    const row = table.insertRow(-1);
    row.insertCell(0).textContent = cust;
    row.insertCell(1).textContent = randArr;
    row.insertCell(2).textContent = iat;
    row.insertCell(3).textContent = at;
    row.insertCell(4).textContent = randServ;
    row.insertCell(5).textContent = servTime;
    row.insertCell(6).textContent = timeServiceBegin;
    row.insertCell(7).textContent = waitingTime;
    row.insertCell(8).textContent = timeServiceEnd;
    row.insertCell(9).textContent = timeInSystem;
    row.insertCell(10).textContent = idleTime;
  }

  // RESULTS SUMMARY
  let totalWaiting = 0,
    waitingCustomers = 0;
  let totalIdle = 0,
    totalService = 0,
    totalIAT = 0;
  let totalTimeInSystem = 0;

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    const waiting = parseFloat(row.cells[7].textContent);
    const idle = parseFloat(row.cells[10].textContent);
    const service = parseFloat(row.cells[5].textContent);
    const iat = parseFloat(row.cells[2].textContent);
    const timeSys = parseFloat(row.cells[9].textContent);

    totalWaiting += waiting;
    if (waiting > 0) waitingCustomers++;
    totalIdle += idle;
    totalService += service;
    totalTimeInSystem += timeSys;
    if (i > 1) totalIAT += iat;
  }

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
    totalIdle /
    parseFloat(table.rows[table.rows.length - 1].cells[8].textContent)
  ).toFixed(3);
  document.getElementById("avgService").textContent = (
    totalService /
    (table.rows.length - 1)
  ).toFixed(2);
  document.getElementById("avgIAT").textContent = (
    totalIAT /
    (table.rows.length - 2)
  ).toFixed(2);
  document.getElementById("avgWaitWait").textContent =
    waitingCustomers > 0 ? (totalWaiting / waitingCustomers).toFixed(2) : 0;
  document.getElementById("avgSys").textContent = (
    totalTimeInSystem /
    (table.rows.length - 1)
  ).toFixed(2);
}
