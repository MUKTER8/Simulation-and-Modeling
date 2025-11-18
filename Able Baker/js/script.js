// Arrival & Service distributions
const arrivalDist = [
  { time: 1, prob: 0.25, range: [0, 25] },
  { time: 2, prob: 0.4, range: [26, 65] },
  { time: 3, prob: 0.2, range: [66, 85] },
  { time: 4, prob: 0.15, range: [86, 100] },
];
const ableDist = [
  { time: 2, prob: 0.3, range: [0, 30] },
  { time: 3, prob: 0.28, range: [31, 58] },
  { time: 4, prob: 0.25, range: [59, 83] },
  { time: 5, prob: 0.17, range: [84, 100] },
];
const bakerDist = [
  { time: 3, prob: 0.35, range: [0, 35] },
  { time: 4, prob: 0.25, range: [36, 60] },
  { time: 5, prob: 0.2, range: [61, 80] },
  { time: 6, prob: 0.2, range: [81, 100] },
];

// Map random digit to time
function mapRand(rand, dist) {
  for (let d of dist) {
    if (rand >= d.range[0] && rand <= d.range[1]) return d.time;
  }
  return dist[dist.length - 1].time;
}

// Generate random digits
function randomDigits(count, max = 100) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * max));
}

// Start simulation
function startSimulation() {
  const n = parseInt(document.getElementById("customersToAdd").value);
  if (!n || n <= 0) {
    alert("Enter valid customer count");
    return;
  }

  const arrivalRand = randomDigits(n - 1, 101);
  const ableRand = randomDigits(n, 101);
  const bakerRand = randomDigits(n, 101);

  const table = document.getElementById("simulationTable");
  table.innerHTML = `<tr>
    <th>Customer</th><th>IAT</th><th>Arrival Time</th>
    <th>Able Begin</th><th>Able Service</th><th>Able End</th>
    <th>Baker Begin</th><th>Baker Service</th><th>Baker End</th>
    <th>Caller Delay</th><th>Time in System</th>
  </tr>`;

  let cumAT = 0,
    ableEnd = 0,
    bakerEnd = 0;
  let totalWaiting = 0,
    waitCustomers = 0,
    totalAble = 0,
    totalBaker = 0,
    totalIAT = 0;

  for (let i = 0; i < n; i++) {
    let iat = i === 0 ? 0 : mapRand(arrivalRand[i - 1], arrivalDist);
    cumAT += iat;
    let arrTime = cumAT;

    let ableServTime = mapRand(ableRand[i], ableDist);
    let bakerServTime = mapRand(bakerRand[i], bakerDist);

    let ableStart = "-",
      ableServ = "-",
      ableFinish = "-";
    let bakerStart = "-",
      bakerServ = "-",
      bakerFinish = "-";
    let callerWait = 0,
      timeInSys = 0;

    // === Able-Baker assignment rules ===
    if (i === 0) {
      // first customer always Able
      ableStart = 0;
      ableServ = ableServTime;
      ableFinish = ableStart + ableServ;
      ableEnd = ableFinish;
      timeInSys = ableServ;
    } else {
      // Determine which server free first
      if (arrTime >= ableEnd && arrTime >= bakerEnd) {
        // both free, Able priority
        ableStart = arrTime;
        ableServ = ableServTime;
        ableFinish = ableStart + ableServ;
        ableEnd = ableFinish;
        callerWait = 0;
        timeInSys = ableServ;
      } else if (arrTime >= ableEnd) {
        // Able free
        ableStart = arrTime;
        ableServ = ableServTime;
        ableFinish = ableStart + ableServ;
        ableEnd = ableFinish;
        callerWait = 0;
        timeInSys = ableServ;
      } else if (arrTime >= bakerEnd) {
        // Baker free
        bakerStart = arrTime;
        bakerServ = bakerServTime;
        bakerFinish = bakerStart + bakerServ;
        bakerEnd = bakerFinish;
        callerWait = 0;
        timeInSys = bakerServ;
      } else {
        // both busy, assign to who finishes first
        if (ableEnd <= bakerEnd) {
          ableStart = ableEnd;
          ableServ = ableServTime;
          ableFinish = ableStart + ableServ;
          callerWait = ableStart - arrTime;
          ableEnd = ableFinish;
          timeInSys = callerWait + ableServ;
        } else {
          bakerStart = bakerEnd;
          bakerServ = bakerServTime;
          bakerFinish = bakerStart + bakerServ;
          callerWait = bakerStart - arrTime;
          bakerEnd = bakerFinish;
          timeInSys = callerWait + bakerServ;
        }
      }
    }

    totalWaiting += callerWait;
    if (callerWait > 0) waitCustomers++;
    totalAble += ableServ === "-" ? 0 : ableServ;
    totalBaker += bakerServ === "-" ? 0 : bakerServ;
    if (i > 0) totalIAT += iat;

    const row = table.insertRow(-1);
    row.insertCell(0).textContent = i + 1;
    row.insertCell(1).textContent = iat;
    row.insertCell(2).textContent = arrTime;
    row.insertCell(3).textContent = ableStart;
    row.insertCell(4).textContent = ableServ;
    row.insertCell(5).textContent = ableFinish;
    row.insertCell(6).textContent = bakerStart;
    row.insertCell(7).textContent = bakerServ;
    row.insertCell(8).textContent = bakerFinish;
    row.insertCell(9).textContent = callerWait;
    row.insertCell(10).textContent = timeInSys;
  }

  // Display results
  document.getElementById("resultsWrapper").style.display = "block";
  document.getElementById("avgWaiting").textContent = (
    totalWaiting / n
  ).toFixed(2);
  document.getElementById("avgIAT").textContent = (totalIAT / (n - 1)).toFixed(
    2
  );
  document.getElementById("avgServiceAble").textContent = (
    totalAble / n
  ).toFixed(2);
  document.getElementById("avgServiceBaker").textContent = (
    totalBaker / n
  ).toFixed(2);
  document.getElementById("avgWaitWait").textContent = (
    waitCustomers ? totalWaiting / waitCustomers : 0
  ).toFixed(2);
}

function resetSimulation() {
  document.getElementById("customersToAdd").value = "";
  document.getElementById("simulationTable").innerHTML = `<tr>
    <th>Customer</th><th>IAT</th><th>Arrival Time</th>
    <th>Able Begin</th><th>Able Service</th><th>Able End</th>
    <th>Baker Begin</th><th>Baker Service</th><th>Baker End</th>
    <th>Caller Delay</th><th>Time in System</th>
  </tr>`;
  document.getElementById("resultsWrapper").style.display = "none";
}
