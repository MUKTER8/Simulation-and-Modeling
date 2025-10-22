let arrivalData = [];
let serviceData = [];
let arrivalRandoms = [];
let serviceRandoms = [];

// HELPER FUNCTION: format number with up to 3 decimals, no unnecessary zeros
function formatNumber(num) {
  if(num === null || num === undefined) return '';
  return parseFloat(num.toFixed(3)).toString();
}

// ADD PROBABILITY
function addProbability(type) {
  const input = document.getElementById(type+'Input');
  let value = parseFloat(input.value);
  if(isNaN(value)||value<=0) return;
  input.value='';
  const table = document.getElementById(type+'Table');
  const data = type==='arrival'?arrivalData:serviceData;
  const cumulative = (data.length===0?value:data[data.length-1].cumulative+value);

  // Determine multiplier based on decimal digits
  const decimalPart = value.toString().split('.')[1] || '';
  const multiplier = decimalPart.length === 3 ? 1000 : 100;

  // Random digit range
  let rangeStart = 0;
  if(data.length > 0) {
    const prevRange = data[data.length-1].range.split('-').map(Number);
    rangeStart = prevRange[1] + 1;
  }
  const rangeEnd = Math.round(cumulative * multiplier);

  data.push({prob:value,cumulative:cumulative,range:`${rangeStart}-${rangeEnd}`});

  const row = table.insertRow(-1);
  row.insertCell(0).textContent = data.length;
  row.insertCell(1).textContent = formatNumber(value);
  row.insertCell(2).textContent = formatNumber(cumulative);
  row.insertCell(3).textContent = `${rangeStart}-${rangeEnd}`;
}

// RESET PROBABILITY TABLE
function resetTable(type){
  if(type==='arrival') arrivalData=[];
  else serviceData=[];
  const table=document.getElementById(type+'Table');
  table.innerHTML=`<tr><th>${type==='arrival'?'Interval Time':'Service Time'}</th><th>Probability</th><th>Cumulative Probability</th><th>Random Digit Range</th></tr>`;
}

// ADD RANDOM DIGIT
function addRandomDigit(type){
  const input=document.getElementById(type+'RandomInput');
  const value=input.value.trim();
  if(value==='') return;
  input.value='';
  const table=document.getElementById(type+'RandomTable');
  const data=type==='arrival'?arrivalRandoms:serviceRandoms;
  data.push(parseInt(value));
  const row=table.insertRow(-1);
  row.insertCell(0).textContent=data.length;
  row.insertCell(1).textContent=value;
}

// RESET RANDOM TABLE
function resetRandom(type){
  if(type==='arrival') arrivalRandoms=[];
  else serviceRandoms=[];
  const table=document.getElementById(type+'RandomTable');
  table.innerHTML=`<tr><th>No.</th><th>Random Digit</th></tr>`;
}

// ENTER KEY HANDLING
document.addEventListener("DOMContentLoaded",()=>{
  const inputs=[
    {id:"arrivalInput",action:()=>addProbability("arrival")},
    {id:"serviceInput",action:()=>addProbability("service")},
    {id:"arrivalRandomInput",action:()=>addRandomDigit("arrival")},
    {id:"serviceRandomInput",action:()=>addRandomDigit("service")}
  ];
  inputs.forEach(({id,action})=>{
    const input=document.getElementById(id);
    input.addEventListener("keypress",(e)=>{
      if(e.key==="Enter"){e.preventDefault();action();}
    });
  });
});

// GENERATE SIMULATION TABLE
function generateSimulation(){
  const table=document.getElementById('simulationTable');
  table.style.display='table';
  table.innerHTML = `<tr>
      <th>Customer</th><th>Random Digit Arrival</th><th>IAT</th><th>AT</th>
      <th>Random Digit Service Time</th><th>Service Time</th>
      <th>Time Service Begin</th><th>Waiting Time</th>
      <th>Time Service End</th><th>Time Spent in System</th><th>IOS</th>
    </tr>`;

  const totalRows=Math.max(arrivalRandoms.length,serviceRandoms.length);
  let cumulativeAT=0,previousServiceEnd=0;

  for(let i=0;i<totalRows;i++){
    const cust=i+1;
    const randArr=i===0?0:arrivalRandoms[i-1];
    const randServ=i<serviceRandoms.length?serviceRandoms[i]:0;

    // IAT mapping
    let iat=0;
    if(randArr!==0){
      for(let j=0;j<arrivalData.length;j++){
        const [start,end]=arrivalData[j].range.split('-').map(Number);
        if(randArr>=start && randArr<=end){ iat=j+1; break; }
      }
    }
    cumulativeAT+=iat;
    const at=cumulativeAT;

    // Service Time mapping
    let servTime=0;
    for(let j=0;j<serviceData.length;j++){
      const [start,end]=serviceData[j].range.split('-').map(Number);
      if(randServ>=start && randServ<=end){ servTime=j+1; break; }
    }

    const timeServiceBegin=i===0?0:Math.max(at,previousServiceEnd);
    const waitingTime=timeServiceBegin-at;
    const timeServiceEnd=timeServiceBegin+servTime;
    const timeInSystem=waitingTime+servTime;
    const ios=i===0?0:timeServiceBegin-previousServiceEnd;
    previousServiceEnd=timeServiceEnd;

    const row=table.insertRow(-1);
    row.insertCell(0).textContent=cust;
    row.insertCell(1).textContent=randArr;
    row.insertCell(2).textContent=iat;
    row.insertCell(3).textContent=at;
    row.insertCell(4).textContent=randServ;
    row.insertCell(5).textContent=servTime;
    row.insertCell(6).textContent=timeServiceBegin;
    row.insertCell(7).textContent=waitingTime;
    row.insertCell(8).textContent=timeServiceEnd;
    row.insertCell(9).textContent=timeInSystem;
    row.insertCell(10).textContent=ios;
  }
}
