/* Demand Table */
const demandTable = {
  good: [
    { min: 1, demand: 40 },
    { min: 31, demand: 50 },
    { min: 61, demand: 60 },
    { min: 81, demand: 70 },
  ],
  fair: [
    { min: 1, demand: 60 },
    { min: 36, demand: 70 },
    { min: 76, demand: 80 },
  ],
  poor: [
    { min: 1, demand: 40 },
    { min: 31, demand: 50 },
    { min: 71, demand: 60 },
    { min: 91, demand: 70 },
  ],
};

function getNewsType(rnd) {
  if (rnd <= 35) return "good";
  if (rnd <= 80) return "fair";
  return "poor";
}

function getDemand(type, rnd) {
  const rows = demandTable[type];
  let result = rows[0].demand;

  for (let row of rows) {
    if (rnd >= row.min) {
      result = row.demand;
    }
  }
  return result;
}

document.getElementById("simulateBtn").addEventListener("click", () => {
  const days = Number(document.getElementById("days").value);
  const order = Number(document.getElementById("orderQty").value);
  const cost = Number(document.getElementById("cost").value);
  const sell = Number(document.getElementById("sell").value);
  const lost = Number(document.getElementById("lost").value);
  const salvage = Number(document.getElementById("salvage").value);

  const tbody = document.querySelector("#resultTable tbody");
  tbody.innerHTML = "";

  // Summary totals
  let totalRevenue = 0;
  let totalLost = 0;
  let totalSalvage = 0;
  let totalProfit = 0;

  let countGood = 0,
    countFair = 0,
    countPoor = 0;

  for (let day = 1; day <= days; day++) {
    const rndType = Math.floor(Math.random() * 100) + 1;
    const type = getNewsType(rndType);

    if (type === "good") countGood++;
    if (type === "fair") countFair++;
    if (type === "poor") countPoor++;

    const rndDemand = Math.floor(Math.random() * 100) + 1;
    const demand = getDemand(type, rndDemand);

    const revenue = Math.min(order, demand) * sell;
    const lostProfit = demand > order ? (demand - order) * lost : 0;
    const salvageAmt = demand < order ? (order - demand) * salvage : 0;

    const dailyProfit = revenue - order * cost - lostProfit + salvageAmt;

    totalRevenue += revenue;
    totalLost += lostProfit;
    totalSalvage += salvageAmt;
    totalProfit += dailyProfit;

    tbody.innerHTML += `
      <tr>
        <td>${day}</td>
        <td>${rndType}</td>
        <td>${type}</td>
        <td>${rndDemand}</td>
        <td>${demand}</td>
        <td>$${revenue.toFixed(2)}</td>
        <td>$${lostProfit.toFixed(2)}</td>
        <td>$${salvageAmt.toFixed(2)}</td>
        <td>$${dailyProfit.toFixed(2)}</td>
      </tr>
    `;
  }

  // Update summary UI
  document.getElementById(
    "totalRevenue"
  ).textContent = `$${totalRevenue.toFixed(2)}`;
  document.getElementById("totalLost").textContent = `$${totalLost.toFixed(2)}`;
  document.getElementById(
    "totalSalvage"
  ).textContent = `$${totalSalvage.toFixed(2)}`;
  document.getElementById("totalProfit").textContent = `$${totalProfit.toFixed(
    2
  )}`;
  document.getElementById("avgProfit").textContent = `$${(
    totalProfit / days
  ).toFixed(2)}`;

  document.getElementById("countGood").textContent = countGood;
  document.getElementById("countFair").textContent = countFair;
  document.getElementById("countPoor").textContent = countPoor;
});
