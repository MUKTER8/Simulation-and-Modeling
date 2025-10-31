let arrivalData = [];
let serviceData = [];
let arrivalRandoms = [];
let serviceRandoms = [];

// ===== Generate Random Probabilities =====
function generateProbabilities(count, decimals) {
  let randoms = [];
  for (let i = 0; i < count; i++) randoms.push(Math.random());
  let sum = randoms.reduce((a, b) => a + b, 0);
  let probs = randoms.map((r) => parseFloat((r / sum).toFixed(decimals)));

  // Adjust rounding error to make sure sum = 1
  let total = probs.reduce((a, b) => a + b, 0);
  let diff = 1 - total;
  probs[probs.length - 1] = parseFloat(
    (probs[probs.length - 1] + diff).toFixed(decimals)
  );
  return probs;
}

// ===== Build Table =====
function buildTable(data, type, scale) {
  const table = document.getElementById(type + "Table");
  table.innerHTML = `<tr>
    <th>${type === "arrival" ? "Interval" : "Service"}</th>
    <th>Probability</th>
    <th>Cumulative Probability</th>
    <th>Random Digit Range</th>
  </tr>`;

  let cumulative = 0;
  data.length = 0;

  const probs = generateProbabilities(
    customerCount,
    type === "arrival" ? 3 : 2
  );

  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    const start = i === 0 ? 1 : parseInt(data[i - 1].range.split("-")[1]) + 1;
    let end = Math.round(cumulative * scale);
    if (end < start) end = start;

    data.push({ prob: probs[i], cumulative, range: `${start}-${end}` });

    const row = table.insertRow(-1);
    row.insertCell(0).textContent = i + 1;
    row.insertCell(1).textContent = probs[i].toFixed(
      type === "arrival" ? 3 : 2
    );
    row.insertCell(2).textContent = cumulative.toFixed(
      type === "arrival" ? 3 : 2
    );
    row.insertCell(3).textContent = `${start}-${end}`;
  }
}

// ===== Auto Simulation =====
let customerCount = 0;
function startAutoSimulation() {
  const input = document.getElementById("customersToAdd");
  customerCount = parseInt(input.value, 10);
  if (isNaN(customerCount) || customerCount <= 0) {
    alert("Enter a valid number of customers.");
    return;
  }

  // Generate tables automatically
  buildTable(arrivalData, "arrival", 1000);
  buildTable(serviceData, "service", 100);

  // Generate random digits for customers
  arrivalRandoms = [];
  serviceRandoms = [];

  for (let i = 0; i < customerCount; i++) {
    if (i > 0) arrivalRandoms.push(Math.floor(Math.random() * 1000) + 1);
    serviceRandoms.push(Math.floor(Math.random() * 100) + 1);
  }

  document.getElementById(
    "statusMsg"
  ).textContent = `Total customers: ${customerCount}`;
  updateSimulation();
}

// ===== Reset =====
function resetSimulation() {
  arrivalData = [];
  serviceData = [];
  arrivalRandoms = [];
  serviceRandoms = [];
  document.getElementById(
    "arrivalTable"
  ).innerHTML = `<tr><th>Interval</th><th>Probability</th><th>Cumulative Probability</th><th>Random Digit Range</th></tr>`;
  document.getElementById(
    "serviceTable"
  ).innerHTML = `<tr><th>Service</th><th>Probability</th><th>Cumulative Probability</th><th>Random Digit Range</th></tr>`;
  document.getElementById("simulationTable").innerHTML = `<tr>
    <th>Customer</th><th>Random Digit (Arrival)</th><th>IAT</th><th>AT</th>
    <th>Random Digit (Service)</th><th>Service Time</th><th>Time Service Begin</th>
    <th>Waiting Time</th><th>Time Service End</th><th>Time in System</th><th>Idle Time</th>
  </tr>`;
  document.getElementById("resultsWrapper").style.display = "none";
  document.getElementById("statusMsg").textContent = "";
}

// ===== Mapping =====
function mapFromRanges(rand, data) {
  for (let j = 0; j < data.length; j++) {
    const [start, end] = data[j].range.split("-").map(Number);
    if (rand >= start && rand <= end) return j + 1;
  }
  return 0;
}

// ===== Simulation =====
function updateSimulation() {
  const table = document.getElementById("simulationTable");
  table.innerHTML = `<tr>
    <th>Customer</th><th>Random Digit (Arrival)</th><th>IAT</th><th>AT</th>
    <th>Random Digit (Service)</th><th>Service Time</th><th>Time Service Begin</th>
    <th>Waiting Time</th><th>Time Service End</th><th>Time in System</th><th>Idle Time</th>
  </tr>`;

  let cumulativeAT = 0;
  let previousServiceEnd = 0;

  for (let i = 0; i < customerCount; i++) {
    let randArr = i > 0 ? arrivalRandoms[i - 1] : 0;
    let iat = i > 0 ? mapFromRanges(randArr, arrivalData) : 0;
    cumulativeAT += iat;
    const at = cumulativeAT;

    const randServ = serviceRandoms[i];
    const servTime = mapFromRanges(randServ, serviceData);

    const timeServiceBegin = i === 0 ? 0 : Math.max(at, previousServiceEnd);
    const waitingTime = timeServiceBegin - at;
    const timeServiceEnd = timeServiceBegin + servTime;
    const timeInSystem = waitingTime + servTime;
    const idleTime = i === 0 ? 0 : timeServiceBegin - previousServiceEnd;
    previousServiceEnd = timeServiceEnd;

    const row = table.insertRow(-1);
    row.insertCell(0).textContent = i + 1;
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

  computeResults();
}

// ===== Results =====
function computeResults() {
  const rows = document.getElementById("simulationTable").rows;
  if (rows.length <= 1) return;

  let totalWaiting = 0,
    waitingCustomers = 0,
    totalIdle = 0,
    totalService = 0,
    totalIAT = 0,
    totalTimeInSystem = 0;

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].cells;
    const iat = parseFloat(cells[2].textContent);
    const serv = parseFloat(cells[5].textContent);
    const wait = parseFloat(cells[7].textContent);
    const sys = parseFloat(cells[9].textContent);
    const idle = parseFloat(cells[10].textContent);

    totalWaiting += wait;
    if (wait > 0) waitingCustomers++;
    totalIdle += idle;
    totalService += serv;
    totalTimeInSystem += sys;
    if (i > 1) totalIAT += iat;
  }

  const lastEnd = parseFloat(rows[rows.length - 1].cells[8].textContent);
  document.getElementById("resultsWrapper").style.display = "block";
  document.getElementById("avgWaiting").textContent = (
    totalWaiting /
    (rows.length - 1)
  ).toFixed(2);
  document.getElementById("probWait").textContent = (
    waitingCustomers /
    (rows.length - 1)
  ).toFixed(3);
  document.getElementById("idleFraction").textContent = (
    totalIdle / (lastEnd || 1)
  ).toFixed(3);
  document.getElementById("avgService").textContent = (
    totalService /
    (rows.length - 1)
  ).toFixed(2);
  document.getElementById("avgIAT").textContent = (
    totalIAT / Math.max(1, rows.length - 2)
  ).toFixed(2);
  document.getElementById("avgWaitWait").textContent =
    waitingCustomers > 0 ? (totalWaiting / waitingCustomers).toFixed(2) : 0;
  document.getElementById("avgSys").textContent = (
    totalTimeInSystem /
    (rows.length - 1)
  ).toFixed(2);
}

// ===== Title Animation =====
const title = document.getElementById("title");
const text = title.textContent;
title.textContent = "";
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
    const y = Math.sin((i + t) / 2) * 10;
    span.style.transform = `translateY(${y}px)`;
    span.style.color = colors[(i + Math.floor(t / 3)) % colors.length];
  });
  t += 0.1;
  requestAnimationFrame(waveEffect);
}
waveEffect();
