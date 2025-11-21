// Arrival & Service Distributions
const arrivalDist = [
  { time: 1, range: [0, 25] },
  { time: 2, range: [26, 65] },
  { time: 3, range: [66, 85] },
  { time: 4, range: [86, 100] },
];

const ableDist = [
  { time: 2, range: [0, 30] },
  { time: 3, range: [31, 58] },
  { time: 4, range: [59, 83] },
  { time: 5, range: [84, 100] },
];

const bakerDist = [
  { time: 3, range: [0, 35] },
  { time: 4, range: [36, 60] },
  { time: 5, range: [61, 80] },
  { time: 6, range: [81, 100] },
];

// Map random digit to time based on distribution
function mapRand(rand, dist) {
  for (let d of dist) {
    if (rand >= d.range[0] && rand <= d.range[1]) return d.time;
  }
  return dist[dist.length - 1].time;
}

// Generate random digits
function randomDigits(count, max = 101) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * max));
}

function startSimulation() {
  const n = parseInt(document.getElementById("customersToAdd").value);
  if (!n || n <= 0) {
    alert("Enter valid customer count");
    return;
  }

  const arrivalRand = randomDigits(n - 1);
  const ableRand = randomDigits(n);
  const bakerRand = randomDigits(n);

  const table = document.getElementById("simulationTable");
  table.innerHTML = `
    <tr>
      <th>Customer</th>
      <th>IAT</th>
      <th>Arrival Time</th>
      <th>Who Served?</th>
      <th>Able Begin</th>
      <th>Able Service</th>
      <th>Able End</th>
      <th>Baker Begin</th>
      <th>Baker Service</th>
      <th>Baker End</th>
      <th>Caller Delay</th>
      <th>Time in System</th>
    </tr>
  `;

  let cumulativeAT = 0;
  let ableEnd = 0;
  let bakerEnd = 0;

  let totalWaiting = 0;
  let waitCustomers = 0;
  let totalAbleService = 0;
  let totalBakerService = 0;
  let countAble = 0;
  let countBaker = 0;
  let totalIAT = 0;

  for (let i = 0; i < n; i++) {
    // Inter-arrival time
    let iat = i === 0 ? 0 : mapRand(arrivalRand[i - 1], arrivalDist);
    if (i > 0) totalIAT += iat;
    cumulativeAT += iat;
    let arrival = cumulativeAT;

    let ableStart = "-",
      ableServ = "-",
      ableFinish = "-";
    let bakerStart = "-",
      bakerServ = "-",
      bakerFinish = "-";

    let delay = 0;
    let timeInSystem = 0;
    let server = "-";

    // Able–Baker assignment logic
    if (arrival >= ableEnd && arrival >= bakerEnd) {
      // Both free → Able
      ableStart = arrival;
      ableServ = mapRand(ableRand[i], ableDist);
      ableFinish = ableStart + ableServ;
      ableEnd = ableFinish;
      server = "Able";
      timeInSystem = ableServ;

      totalAbleService += ableServ;
      countAble++;
    } else if (arrival >= ableEnd) {
      // Able free
      ableStart = arrival;
      ableServ = mapRand(ableRand[i], ableDist);
      ableFinish = ableStart + ableServ;
      ableEnd = ableFinish;
      server = "Able";
      timeInSystem = ableServ;

      totalAbleService += ableServ;
      countAble++;
    } else if (arrival >= bakerEnd) {
      // Baker free
      bakerStart = arrival;
      bakerServ = mapRand(bakerRand[i], bakerDist);
      bakerFinish = bakerStart + bakerServ;
      bakerEnd = bakerFinish;
      server = "Baker";
      timeInSystem = bakerServ;

      totalBakerService += bakerServ;
      countBaker++;
    } else {
      // Both busy → earliest free
      if (ableEnd <= bakerEnd) {
        ableStart = ableEnd;
        ableServ = mapRand(ableRand[i], ableDist);
        delay = ableStart - arrival;
        ableFinish = ableStart + ableServ;
        ableEnd = ableFinish;
        server = "Able";
        timeInSystem = delay + ableServ;

        totalAbleService += ableServ;
        countAble++;
      } else {
        bakerStart = bakerEnd;
        bakerServ = mapRand(bakerRand[i], bakerDist);
        delay = bakerStart - arrival;
        bakerFinish = bakerStart + bakerServ;
        bakerEnd = bakerFinish;
        server = "Baker";
        timeInSystem = delay + bakerServ;

        totalBakerService += bakerServ;
        countBaker++;
      }
    }

    totalWaiting += delay;
    if (delay > 0) waitCustomers++;

    const row = table.insertRow(-1);
    row.insertCell(0).textContent = i + 1;
    row.insertCell(1).textContent = iat;
    row.insertCell(2).textContent = arrival;
    row.insertCell(3).textContent = server;
    row.insertCell(4).textContent = ableStart;
    row.insertCell(5).textContent = ableServ;
    row.insertCell(6).textContent = ableFinish;
    row.insertCell(7).textContent = bakerStart;
    row.insertCell(8).textContent = bakerServ;
    row.insertCell(9).textContent = bakerFinish;
    row.insertCell(10).textContent = delay;
    row.insertCell(11).textContent = timeInSystem;
  }

  // Show results
  document.getElementById("resultsWrapper").style.display = "block";

  document.getElementById("avgWaiting").textContent = (
    totalWaiting / n
  ).toFixed(2);

  document.getElementById("avgIAT").textContent = (
    n > 1 ? totalIAT / (n - 1) : 0
  ).toFixed(2);

  document.getElementById("avgServiceAble").textContent = (
    countAble ? totalAbleService / countAble : 0
  ).toFixed(2);

  document.getElementById("avgServiceBaker").textContent = (
    countBaker ? totalBakerService / countBaker : 0
  ).toFixed(2);

  document.getElementById("avgWaitWait").textContent = (
    waitCustomers ? totalWaiting / waitCustomers : 0
  ).toFixed(2);
}

function resetSimulation() {
  document.getElementById("customersToAdd").value = "";
  document.getElementById("simulationTable").innerHTML = `
    <tr>
      <th>Customer</th>
      <th>IAT</th>
      <th>Arrival Time</th>
      <th>Who Served?</th>
      <th>Able Begin</th>
      <th>Able Service</th>
      <th>Able End</th>
      <th>Baker Begin</th>
      <th>Baker Service</th>
      <th>Baker End</th>
      <th>Caller Delay</th>
      <th>Time in System</th>
    </tr>
  `;
  document.getElementById("resultsWrapper").style.display = "none";
}

// Allow pressing Enter to trigger simulation
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("customersToAdd");
  const simulateBtn = document.getElementById("simulateBtn");

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        startSimulation();
      }
    });
  }
  if (simulateBtn) {
    simulateBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        startSimulation();
      }
    });
  }
});
