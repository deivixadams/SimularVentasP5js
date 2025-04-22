let tablaVentas = null;
let sales = [], topProducts = [], salesPoints = [];
let mesesOrden = ['Ene','Feb','Mar','Abr','May','Jun'];
let currentYear = 2016;

let graphOriginX, graphOriginY, graphWidth, monthSpacing;
let drawProgress = 0, drawSpeed = 0.02;
let drawingPoints = [], freehandEnabled = false;

let osc, audioStarted = false;
let isPaused = false, pauseCounter = 0, lastStep = -1;

let tableX, tableY, rowHeight, col1W, col2W, col3W;
let fileInput, fakeBtn;
let loadingNewData = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  configureLayout();
  setupFileUpload();
  osc = new p5.Oscillator('sine');
  osc.amp(0);
}

function draw() {
  background(20);

  if (loadingNewData) {
    showFileHint("Cargando nuevo archivo...");
    return;
  }
  if (salesPoints.length === 0) {
    showFileHint("📂 Carga un archivo .csv con columnas: Año, Mes, Producto, Ventas");
    return;
  }

  drawTituloYTabla();
  drawCurvaVentas();
  //drawFreehand();
  advanceOrReset();
}

function setupFileUpload() {
  fileInput = createFileInput(handleFile);
  fileInput.style('opacity', '0');
  fileInput.style('position', 'absolute');
  fileInput.style('right', '20px');
  fileInput.style('bottom', '20px');
  fileInput.size(160, 40);

  fakeBtn = createDiv('📂 Cargar Archivo');
  fakeBtn.position(width - 180, height - 60);
  fakeBtn.style('background', '#444');
  fakeBtn.style('color', 'white');
  fakeBtn.style('padding', '10px 20px');
  fakeBtn.style('border-radius', '6px');
  fakeBtn.style('cursor', 'pointer');
  fakeBtn.style('font-size', '14px');
  fakeBtn.mousePressed(() => {
    loadingNewData = true;
    drawingPoints = [];
    salesPoints = [];
    fileInput.elt.click();
  });
}

function handleFile(file) {
  if (file.type === 'text') {
    const reader = new FileReader();
    reader.onload = event => parseCSV(event.target.result);
    reader.readAsText(file.file);
  } else {
    loadingNewData = false;
  }
}

function parseCSV(data) {
  const rows = data.trim().split('\n');
  const headers = rows[0].split(',').map(h => h.trim());
  const entries = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split(',').map(c => c.trim());
    let entry = {};
    headers.forEach((h, j) => entry[h] = cols[j]);
    entries.push(entry);
  }
  tablaVentas = entries;
  currentYear = 2016;
  generarDatosDelAño();
  loadingNewData = false;
}

function generarDatosDelAño() {
  sales = []; topProducts = []; salesPoints = [];
  const datosPorAño = tablaVentas.filter(row =>
    parseInt(row['Año']) === currentYear &&
    mesesOrden.includes(row['Mes'])
  );
  datosPorAño.sort((a,b) =>
    mesesOrden.indexOf(a['Mes']) - mesesOrden.indexOf(b['Mes'])
  );
  for (let i = 0; i < datosPorAño.length; i++) {
    const venta = parseInt(datosPorAño[i]['Ventas']);
    sales.push(venta);
    topProducts.push(datosPorAño[i]['Producto']);
    const x = graphOriginX + i * monthSpacing;
    const y = graphOriginY - map(venta, 0, 100, 0, 150);
    salesPoints.push(createVector(x, y));
  }
  drawProgress = 0;
  lastStep = -1;
  isPaused = false;
}

function drawTituloYTabla() {
  noStroke();
  fill(255);  // Título en blanco
  textSize(24);
  textAlign(LEFT, CENTER);
  text('📊 Ventas semestrales', 20, 40);

  // Tabla
  fill(255);  // Todo el texto de la tabla en blanco
  textSize(16);
  text(`Año ${currentYear}`, tableX, tableY - rowHeight);
  textSize(14);
  text('Mes',      tableX,                    tableY);
  text('Producto', tableX + col1W,            tableY);
  text('Ventas',   tableX + col1W + col2W,    tableY);

  const step = floor(drawProgress * (salesPoints.length - 1));
  textSize(12);
  for (let i = 0; i <= step; i++) {
    const y = tableY + rowHeight * (i + 1);
    text(mesesOrden[i], tableX, y);
    text(topProducts[i], tableX + col1W, y);
    text(`${sales[i]}k`, tableX + col1W + col2W, y);
  }
}

function drawCurvaVentas() {
  noFill(); stroke(0,200,255); strokeWeight(3);
  beginShape();
  const total = salesPoints.length;
  const t = drawProgress * (total - 1);
  const step = floor(t), frac = t - step;
  for (let i=0; i<step; i++) vertex(salesPoints[i].x, salesPoints[i].y);
  if (step < total) {
    const A = salesPoints[step], B = salesPoints[step+1] || A;
    vertex(lerp(A.x,B.x,frac), lerp(A.y,B.y,frac));
  }
  endShape();

  if (audioStarted && step !== lastStep && step < sales.length) {
    playSalesSound(sales[step]);
    lastStep = step;
  }

  for (let i=0; i<total; i++){
    if (i<=step){
      const {x,y} = salesPoints[i];
      fill(255); noStroke(); circle(x,y,10);
      fill(0,255,100); textAlign(CENTER,BOTTOM); textSize(14);
      text(`${sales[i]}k`, x, y-12);
      fill(255,180,0); textAlign(CENTER,TOP);
      text(`🛒 ${topProducts[i]}`, x, y+12);
    }
  }
}

function drawFreehand() {
  if (freehandEnabled && mouseIsPressed && mouseY>0) {
    drawingPoints.push({x:mouseX,y:mouseY});
  }
  noFill(); stroke(255,100,255); strokeWeight(2);
  beginShape();
  for (const pt of drawingPoints) vertex(pt.x,pt.y);
  endShape();
}

function advanceOrReset() {
  if (!isPaused) {
    drawProgress = min(drawProgress + drawSpeed, 1);
    if (drawProgress>=1) { isPaused=true; pauseCounter=0; }
  } else {
    pauseCounter++;
    if (pauseCounter>90){
      currentYear++;
      if (currentYear>2024) currentYear=2016;
      drawingPoints=[];
      generarDatosDelAño();
    }
  }
}

function configureLayout() {
  graphWidth    = width * 0.6;
  graphOriginX  = width * 0.05;
  graphOriginY  = height * 0.75;
  monthSpacing  = graphWidth / (mesesOrden.length - 1);

  tableX    = 20;
  rowHeight = 24;
  tableY    = 40 + rowHeight * 3;  // 3× para bajar más

  const tblW = width * 0.4;
  col1W = tblW * 0.25;
  col2W = tblW * 0.5;
  col3W = tblW * 0.25;

  if (fakeBtn) {
    fakeBtn.position(width - 180, height - 60);
    fileInput.position(width - 160, height - 40);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  configureLayout();
}

function playSalesSound(val) {
  const freq = map(val,40,95,200,1200);
  osc.freq(freq);
  osc.amp(0.3,0.02);
  osc.amp(0,0.2);
}

function keyPressed() {
  if (key === 'C') drawingPoints = [];
  if (key === 'F') freehandEnabled = !freehandEnabled;
  if (key === '+') drawSpeed = min(drawSpeed + 0.005,0.1);
  if (key === '-') drawSpeed = max(drawSpeed - 0.005,0.001);
}

function mousePressed() {
  if (!audioStarted) {
    userStartAudio();
    osc.start();
    audioStarted = true;
  }
}

function showFileHint(msg) {
  fill(200);
  textAlign(CENTER,CENTER);
  textSize(20);
  text(msg, width/2, height/2);
}
