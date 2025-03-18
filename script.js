let timer, lastStartTime, remainingTime, cyclesCompleted = 0, isPaused = false, totalCycles, currentPhase, wakeLock;

// Inicia el temporizador
function startTimer() {
    document.getElementById("setup").classList.add("hidden");
    document.getElementById("running").classList.remove("hidden");
    requestWakeLock(); 

    totalCycles = parseInt(document.getElementById("cycles").value);

    let prepTime = getTimeInMs("prepMin", "prepSec", "prepMs");
    let workTime = getTimeInMs("workMin", "workSec", "workMs");
    let restTime = getTimeInMs("restMin", "restSec", "restMs");
    let cooldownTime = getTimeInMs("cooldownMin", "cooldownSec", "calmMs");

    cyclesCompleted = 0;
    startPhase("Preparación", prepTime, workTime, restTime, cooldownTime);
}


// Controla las distintas fases del temporizador
function startPhase(phase, time, workTime, restTime, cooldownTime) {
    currentPhase = phase;
    document.getElementById("status").textContent = phase;
    setBackgroundColor(phase);

    runTimer(time, () => {
        if (phase === "Preparación") {
            startPhase("Entrenamiento", workTime, workTime, restTime, cooldownTime);
        } else if (phase === "Entrenamiento") {
            cyclesCompleted++;
            document.getElementById("cycleCount").textContent = cyclesCompleted;
            if (totalCycles === 0 || cyclesCompleted < totalCycles) {
                startPhase("Descanso", restTime, workTime, restTime, cooldownTime);
            } else {
                startPhase("Vuelta a la Calma", cooldownTime, workTime, restTime, cooldownTime);
            }
        } else if (phase === "Descanso") {
            startPhase("Entrenamiento", workTime, workTime, restTime, cooldownTime);
        } else if (phase === "Vuelta a la Calma") {
            releaseWakeLock(); // Libera la prevención de apagado de pantalla
            resetTimer();
        }
    });
}
// Maneja la cuenta regresiva
function runTimer(duration, callback) {
    lastStartTime = Date.now();
    let endTime = lastStartTime + duration;

    function update() {
        if (isPaused) return;

        let now = Date.now();
        remainingTime = Math.max(0, endTime - now);
        displayTime(remainingTime);

        if (remainingTime > 0) {
            timer = requestAnimationFrame(update);
        } else {
            callback();
        }
    }
    update();
}

// Pausa el temporizador
function stopTimer() {
    cancelAnimationFrame(timer);
    isPaused = true;
    remainingTime -= Date.now() - lastStartTime;
    document.body.style.backgroundColor = "#F0F8FF";
    document.getElementById("pausedCycleCount").textContent = cyclesCompleted;
    document.getElementById("running").classList.add("hidden");
    document.getElementById("paused").classList.remove("hidden");
    document.getElementById("timer").classList.remove("hidden"); // Asegurar que el tiempo sigue visible
}

// Reanuda el temporizador desde donde se pausó
function resumeTimer() {
    isPaused = false;
    document.getElementById("paused").classList.add("hidden");
    document.getElementById("running").classList.remove("hidden");
    setBackgroundColor(currentPhase);
    lastStartTime = Date.now();
    runTimer(remainingTime, () => startPhase(currentPhase, remainingTime, getTimeInMs("workMin", "workSec", "workMs"), getTimeInMs("restMin", "restSec", "restMs"), getTimeInMs("cooldownMin", "cooldownSec", "calmMs")));
}


// Reinicia el temporizador
function resetTimer() {
    cancelAnimationFrame(timer);
    isPaused = false;
    cyclesCompleted = 0;
    document.getElementById("pausedCycleCount").textContent = cyclesCompleted;
    document.getElementById("cycleCount").textContent = 0;
    document.getElementById("paused").classList.add("hidden");
    document.getElementById("running").classList.add("hidden");
    document.getElementById("setup").classList.remove("hidden");
    releaseWakeLock(); // Libera la prevención de apagado de pantalla
}
// Convierte el tiempo ingresado en milisegundos
function getTimeInMs(min, sec, ms) {
    return (parseInt(document.getElementById(min).value || 0) * 60000) +
           (parseInt(document.getElementById(sec).value || 0) * 1000) +
           (parseInt(document.getElementById(ms).value || 0));
}

// Muestra el tiempo en formato mm:ss:ms
function displayTime(ms) {
    let minutes = Math.floor(ms / 60000);
    let seconds = Math.floor((ms % 60000) / 1000);
    let milliseconds = ms % 1000;
    document.getElementById("timer").textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(milliseconds).padStart(3, "0")}`;
}

// Cambia el color de fondo según la fase
function setBackgroundColor(phase) {
    document.body.style.backgroundColor = phase === "Preparación" ? "lightblue" :
                                          phase === "Entrenamiento" ? "red" :
                                          phase === "Descanso" ? "green" : "aliceblue";
}

// Evita que la pantalla se apague
async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request("screen");
        console.log("Pantalla bloqueada");
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden" && wakeLock) {
                wakeLock.release();
                wakeLock = null;
                console.log("Pantalla desbloqueada");
            }
        });
    } catch (err) {
        console.error("No se pudo bloquear la pantalla: ", err);
    }
}

// Libera el bloqueo de pantalla
function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
        console.log("Bloqueo de pantalla liberado");
    }
}