// —————— VARIABLES GLOBALES ——————
let sales = [], topProducts = [], salesPoints = [];
const months = ['Ene','Feb','Mar','Abr','May','Jun'];
const productNames = ['Zapatos','Laptop','Smartphone','Audífonos','Camisetas','Relojes','Tablet','Silla Gamer'];
const maxSales = 100;

let graphOriginX, graphOriginY, monthSpacing;
let drawProgress = 0, drawSpeed = 0.02;
let drawingPoints = [], freehandEnabled = true;

let osc, audioStarted = false;
let isPaused = false, pauseCounter = 0, lastStep = -1;

// —————— SETUP ——————
function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  configureLayout();
  generateSalesData();

  // Prepara oscilador, pero NO lo inicies hasta el clic
  osc = new p5.Oscillator('sine');
  osc.amp(0);
}

// —————— DRAW LOOP ——————
function draw() {
  background(20);
  drawAxesAndLabels();
  drawAnimatedLine();
  drawFreehand();
  advanceOrReset();
}

// —————— DIBUJO DE EJES, TÍTULO, ETIQUETAS ——————
function drawAxesAndLabels() {
  fill(255);
  textSize(24);
  textAlign(LEFT, CENTER);
  text('📊 Ventas (Manim Style)', 20, 40);

  stroke(180);
  strokeWeight(1);
  line(graphOriginX, graphOriginY,
       graphOriginX + (months.length-1)*monthSpacing, graphOriginY);
  line(graphOriginX, graphOriginY,
       graphOriginX, graphOriginY - 150);

  fill(200);
  textSize(14);
  textAlign(CENTER, CENTER);
  for (let i=0; i<months.length; i++){
    let x = graphOriginX + i*monthSpacing;
    text(months[i], x, graphOriginY + 20);
  }

  stroke(50);
  for (let y=0; y<=150; y+=30) {
    line(graphOriginX, graphOriginY - y,
         graphOriginX + (months.length-1)*monthSpacing, graphOriginY - y);
    noStroke();
    fill(150);
    textAlign(RIGHT, CENTER);
    text(`${(y/150*maxSales).toFixed(0)}k`,
         graphOriginX - 10, graphOriginY - y);
    stroke(50);
  }
}

// —————— LÍNEA ANIMADA SUAVE (Manim Style) ——————
function drawAnimatedLine() {
  noFill();
  stroke(0, 200, 255);
  strokeWeight(3);
  beginShape();

  const total = salesPoints.length;
  let t = drawProgress * (total - 1);
  let step = floor(t);
  let frac = t - step;

  for (let i=0; i<step; i++){
    vertex(salesPoints[i].x, salesPoints[i].y);
  }
  if (step < total) {
    let A = salesPoints[step];
    let B = salesPoints[step+1] || A;
    let ix = lerp(A.x, B.x, frac);
    let iy = lerp(A.y, B.y, frac);
    vertex(ix, iy);
  }
  endShape();

  // Sonido al llegar a un nuevo paso
  if (audioStarted && step !== lastStep && step < sales.length) {
    playSalesSound(sales[step]);
    lastStep = step;
  }

  // Puntos y etiquetas
  for (let i=0; i<total; i++) {
    if (i <= step) {
      let { x, y } = salesPoints[i];
      fill(255); noStroke(); circle(x, y, 10);
      fill(0,255,100); textSize(14); textAlign(CENTER, BOTTOM);
      text(`${sales[i]}k`, x, y - 12);
      fill(255,180,0); textAlign(CENTER, TOP);
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

// —————— AVANCE Y REINICIO ——————
function advanceOrReset() {
  if (!isPaused) {
    drawProgress = min(drawProgress + drawSpeed, 1);
    if (drawProgress >= 1) { isPaused = true; pauseCounter = 0; }
  } else {
    pauseCounter++;
    if (pauseCounter > 90) {
      drawingPoints = [];
      generateSalesData();
    }
  }
}

// —————— DATOS Y POSICIONES ——————
function generateSalesData() {
  sales = []; topProducts = []; salesPoints = [];
  for (let i=0; i<months.length; i++) {
    let val = int(random(40,95));
    sales.push(val);
    topProducts.push(random(productNames));
    let x = graphOriginX + i*monthSpacing;
    let y = graphOriginY - map(val, 0, maxSales, 0, 150);
    salesPoints.push(createVector(x,y));
  }
  drawProgress = 0;
  lastStep = -1;
  isPaused = false;
}

// —————— LAYOUT RESPONSIVE ——————
function configureLayout() {
  graphOriginX = width * 0.1;
  graphOriginY = height * 0.75;
  monthSpacing = (width * 0.8) / (months.length - 1);
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

// —————— DESBLOQUEO DE AUDIO ——————
function mousePressed() {
  if (!audioStarted) {
    userStartAudio(); // pide permiso
    osc.start();      // ahora sí arranca
    audioStarted = true;
  }
}
