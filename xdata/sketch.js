// —————— VARIABLES GLOBALES ——————
let sales = [], topProducts = [], salesPoints = [];
const months       = ['Ene','Feb','Mar','Abr','May','Jun'];
const productNames = ['Zapatos','Laptop','Smartphone','Audífonos','Camisetas','Relojes','Tablet','Silla Gamer'];
const maxSales     = 100;

let graphOriginX, graphOriginY, monthSpacing, graphWidth;
let drawProgress = 0, drawSpeed = 0.02;
let drawingPoints = [], freehandEnabled = true;

let osc, audioStarted = false;
let isPaused = false, pauseCounter = 0, lastStep = -1;

let currentYear = 2022;

// Parámetros de la tabla
let tableX, tableY, rowHeight, col1W, col2W, col3W;

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  configureLayout();
  generateSalesData();

  // preparar oscilador (sin start)
  osc = new p5.Oscillator('sine');
  osc.amp(0);
}

function draw() {
  background(20);
  drawAxesAndLabels();
  drawTable();            // Tabla justo debajo del título
  drawAnimatedLine();
  drawFreehand();
  advanceOrReset();
}

// —————— EJES Y TÍTULO ——————
function drawAxesAndLabels() {
  fill(255);
  textSize(24);
  textAlign(LEFT, CENTER);
  text('📊 Ventas (Manim Style)', 20, 40);

  stroke(180); strokeWeight(1);
  // eje X
  line(graphOriginX, graphOriginY,
       graphOriginX + graphWidth, graphOriginY);
  // eje Y
  line(graphOriginX, graphOriginY,
       graphOriginX, graphOriginY - 150);

  // meses
  fill(200);
  textSize(14);
  textAlign(CENTER, CENTER);
  for (let i = 0; i < months.length; i++) {
    let x = graphOriginX + i * monthSpacing;
    text(months[i], x, graphOriginY + 20);
  }

  // líneas horizontales
  stroke(50);
  for (let y = 0; y <= 150; y += 30) {
    line(graphOriginX, graphOriginY - y,
         graphOriginX + graphWidth, graphOriginY - y);
    noStroke();
    fill(150);
    textAlign(RIGHT, CENTER);
    text(`${(y/150*maxSales).toFixed(0)}k`,
         graphOriginX - 10, graphOriginY - y);
    stroke(50);
  }
}

// —————— TABLA DE DATOS ——————
function drawTable() {
  noStroke();
  // año encima de la tabla
  fill(180);
  textSize(16);
  textAlign(LEFT, CENTER);
  text(`Año ${currentYear}`, tableX, tableY - rowHeight);

  // cabecera
  textSize(14);
  fill(180);
  text('Mes',      tableX,                      tableY);
  text('Producto', tableX + col1W,              tableY);
  text('Ventas',   tableX + col1W + col2W,      tableY);

  // filas hasta el paso actual
  let step = floor(drawProgress * (salesPoints.length - 1));
  textSize(12);
  fill(255);
  textAlign(LEFT, CENTER);
  for (let i = 0; i <= step; i++) {
    let y = tableY + rowHeight * (i + 1);
    text(months[i],                 tableX,                   y);
    text(topProducts[i],            tableX + col1W,           y);
    text(`${sales[i]}k`,            tableX + col1W + col2W,   y);
  }
}

// —————— CURVA ANIMADA SUAVE ——————
function drawAnimatedLine() {
  noFill();
  stroke(0, 200, 255);
  strokeWeight(3);
  beginShape();
    const total = salesPoints.length;
    let t    = drawProgress * (total - 1);
    let step = floor(t);
    let frac = t - step;
    for (let i = 0; i < step; i++) {
      vertex(salesPoints[i].x, salesPoints[i].y);
    }
    if (step < total) {
      let A = salesPoints[step],
          B = salesPoints[step+1] || A;
      let ix = lerp(A.x, B.x, frac),
          iy = lerp(A.y, B.y, frac);
      vertex(ix, iy);
    }
  endShape();

  // disparo de sonido en nuevo paso
  if (audioStarted && step !== lastStep && step < sales.length) {
    playSalesSound(sales[step]);
    lastStep = step;
  }

  // puntos y etiquetas
  for (let i = 0; i < total; i++) {
    if (i <= step) {
      let { x, y } = salesPoints[i];
      fill(255); noStroke(); circle(x, y, 10);
      fill(0,255,100);
      textSize(14);
      textAlign(CENTER, BOTTOM);
      text(`${sales[i]}k`, x, y - 12);
      fill(255,180,0);
      textAlign(CENTER, TOP);
      text(`🛒 ${topProducts[i]}`, x, y + 12);
    }
  }
}

// —————— DIBUJO LIBRE ——————
function drawFreehand() {
  if (freehandEnabled && mouseIsPressed && mouseY > 0) {
    drawingPoints.push({ x: mouseX, y: mouseY });
  }
  noFill();
  stroke(255,100,255);
  strokeWeight(2);
  beginShape();
    for (let pt of drawingPoints) vertex(pt.x, pt.y);
  endShape();
}

// —————— AVANCE Y CICLO ——————
function advanceOrReset() {
  if (!isPaused) {
    drawProgress = min(drawProgress + drawSpeed, 1);
    if (drawProgress >= 1) {
      isPaused = true;
      pauseCounter = 0;
    }
  } else {
    pauseCounter++;
    if (pauseCounter > 90) {
      currentYear++;
      drawingPoints = [];
      generateSalesData();
    }
  }
}

// —————— DATOS Y POSICIONES ——————
function generateSalesData() {
  sales = []; topProducts = []; salesPoints = [];
  for (let i = 0; i < months.length; i++) {
    let val = int(random(40,95));
    sales.push(val);
    topProducts.push(random(productNames));
    let x = graphOriginX + i * monthSpacing;
    let y = graphOriginY - map(val, 0, maxSales, 0, 150);
    salesPoints.push(createVector(x,y));
  }
  drawProgress = 0;
  lastStep     = -1;
  isPaused     = false;
}

// —————— LAYOUT RESPONSIVE ——————
function configureLayout() {
  graphWidth   = width * 0.6;
  graphOriginX = width * 0.05;
  graphOriginY = height * 0.75;
  monthSpacing = graphWidth / (months.length - 1);

  // Tabla justo debajo del título (que está en y=40)
  tableX    = 20;
  rowHeight = 24;
  tableY    = 40 + rowHeight * 2.5; // un espacio y media fila debajo del título

  // Ancho de columnas
  let tblW = width * 0.4;
  col1W   = tblW * 0.25;
  col2W   = tblW * 0.50;
  col3W   = tblW * 0.25;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  configureLayout();
}

// —————— SONIDO ——————
function playSalesSound(val) {
  let freq = map(val, 40, 95, 200, 1200);
  osc.freq(freq);
  osc.amp(0.3, 0.02);
  osc.amp(0, 0.2);
}

// —————— CONTROLES ——————
function keyPressed() {
  if (key === 'C') drawingPoints = [];
  if (key === 'F') freehandEnabled = !freehandEnabled;
  if (key === '+') drawSpeed = min(drawSpeed + 0.005, 0.1);
  if (key === '-') drawSpeed = max(drawSpeed - 0.005, 0.001);
}

function mousePressed() {
  if (!audioStarted) {
    userStartAudio();
    osc.start();
    audioStarted = true;
  }
}
