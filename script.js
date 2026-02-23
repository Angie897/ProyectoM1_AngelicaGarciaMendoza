// ── REFERENCIAS AL DOM ────────────────────
const btnGenerar     = document.getElementById('btn-generar');
const btnLimpiar     = document.getElementById('btn-limpiar');
const grillaPaleta   = document.getElementById('grilla-paleta');
const listaGuardadas = document.getElementById('lista-guardadas');
const toast          = document.getElementById('toast');
const toastTexto     = document.getElementById('toast-texto');

// ── ESTADO DE LA APLICACIÓN ───────────────
// Guarda los colores actuales y cuáles están bloqueados
let coloresActuales = [];
let bloqueados      = [];
let timerToast      = null;

// ── FUNCIONES DE GENERACIÓN DE COLOR ─────

/*
 * Genera un color en formato HEX
 * Crea tres valores RGB aleatorios entre 0 y 255
 * y los convierte a hexadecimal
 */
function generarHEX() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    return '#' +
        r.toString(16).padStart(2, '0') +
        g.toString(16).padStart(2, '0') +
        b.toString(16).padStart(2, '0');
}

/*
 * Genera un color en formato HSL
 * H: 0-360 (tono), S: 40-90% (saturación), L: 35-65% (luminosidad)
 * Los rangos evitan colores muy oscuros o muy claros
 */
function generarHSL() {
    const h = Math.floor(Math.random() * 360);
    const s = Math.floor(Math.random() * 51) + 40;
    const l = Math.floor(Math.random() * 31) + 35;

    return `hsl(${h}, ${s}%, ${l}%)`;
}

/*
 * Convierte un color HEX a formato HSL
 * Se usa para mostrar ambos formatos en cada tarjeta
 */
function hexAHSL(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

// ── LEER OPCIONES DEL USUARIO ─────────────

// Lee cuántos colores quiere el usuario (6, 8 o 9)
function obtenerTamano() {
    return parseInt(document.querySelector('input[name="tamano"]:checked').value);
}

// Lee el formato seleccionado (hex o hsl)
function obtenerFormato() {
    return document.querySelector('input[name="formato"]:checked').value;
}

// ── GENERAR PALETA ────────────────────────

/*
 * Genera un array de colores respetando los bloqueados
 * Si un color está bloqueado, lo mantiene igual
 * Si no está bloqueado, genera uno nuevo
 */
function generarPaleta() {
    const tamano  = obtenerTamano();
    const formato = obtenerFormato();
    const paleta  = [];

    for (let i = 0; i < tamano; i++) {
        if (bloqueados[i]) {
            // Si está bloqueado, mantiene el color anterior
            paleta.push(coloresActuales[i]);
        } else {
            // Si no está bloqueado, genera uno nuevo
            paleta.push(formato === 'hsl' ? generarHSL() : generarHEX());
        }
    }

    // Si el nuevo tamaño es menor al anterior, limpia los bloqueos sobrantes
    bloqueados = bloqueados.slice(0, tamano);
    coloresActuales = paleta;

    return paleta;
}

// ── RENDER DE TARJETAS ────────────────────

/*
 * Crea y muestra cada tarjeta de color en la grilla
 * Cada tarjeta muestra el color, su código HEX, su HSL
 * y tiene un botón para bloquearla y otro para copiar
 */
function renderizarPaleta(paleta) {
    grillaPaleta.innerHTML = '';

    paleta.forEach((color, indice) => {
        const tarjeta = document.createElement('li');
        tarjeta.classList.add('color-tarjeta');
        tarjeta.setAttribute('role', 'listitem');

        // Animación escalonada: cada tarjeta aparece 50ms después
        tarjeta.style.animationDelay = `${indice * 50}ms`;

        // Determina el HEX para mostrar siempre ambos formatos
        const esHSL  = color.startsWith('hsl');
        const hexMostrar = esHSL ? hslAHex(color) : color;
        const hslMostrar = esHSL ? color : hexAHSL(color);

        tarjeta.innerHTML = `
            <div
                class="color-vista"
                style="background-color: ${color}"
                title="Clic para copiar ${hexMostrar}"
                tabindex="0"
                role="button"
                aria-label="Color ${hexMostrar}, clic para copiar"
            ></div>
            <div class="color-info">
                <span class="color-hex">${hexMostrar}</span>
                <span class="color-hsl">${hslMostrar}</span>
            </div>
            <button
                class="btn-bloqueo ${bloqueados[indice] ? 'bloqueado' : ''}"
                aria-label="${bloqueados[indice] ? 'Desbloquear color' : 'Bloquear color'}"
            >
                ${bloqueados[indice] ? '🔒 Bloqueado' : '🔓 Bloquear'}
            </button>
        `;

        // Evento para copiar al hacer clic en el bloque de color
        const vista = tarjeta.querySelector('.color-vista');
        vista.addEventListener('click', () => copiarAlPortapapeles(hexMostrar));
        vista.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') copiarAlPortapapeles(hexMostrar);
        });

        // Evento para bloquear/desbloquear
        const btnBloqueo = tarjeta.querySelector('.btn-bloqueo');
        btnBloqueo.addEventListener('click', () => toggleBloqueo(indice));

        grillaPaleta.appendChild(tarjeta);
    });
}

// ── BLOQUEO DE COLORES ────────────────────

/*
 * Alterna el estado de bloqueo de un color
 * Si está bloqueado lo desbloquea y viceversa
 */
function toggleBloqueo(indice) {
    bloqueados[indice] = !bloqueados[indice];
    renderizarPaleta(coloresActuales);
    mostrarToast(bloqueados[indice] ? '🔒 Color bloqueado' : '🔓 Color desbloqueado');
}

// ── COPIAR AL PORTAPAPELES ────────────────

async function copiarAlPortapapeles(hex) {
    try {
        await navigator.clipboard.writeText(hex);
        mostrarToast(`✓ Copiado: ${hex}`);
    } catch (error) {
        console.error('No se pudo copiar:', error);
        mostrarToast('No se pudo copiar');
    }
}

// ── TOAST DE FEEDBACK ─────────────────────

/*
 * Muestra el toast con un mensaje y lo oculta a los 2.5 segundos
 * Si se llama de nuevo antes de que se oculte, reinicia el timer
 */
function mostrarToast(mensaje) {
    if (timerToast) clearTimeout(timerToast);

    toastTexto.textContent = mensaje;
    toast.setAttribute('aria-hidden', 'false');
    toast.classList.add('visible');

    timerToast = setTimeout(() => {
        toast.classList.remove('visible');
        toast.setAttribute('aria-hidden', 'true');
    }, 2500);
}

// ── GUARDAR EN LOCALSTORAGE ───────────────

/*
 * Guarda la paleta actual en localStorage
 * localStorage guarda datos en el navegador que persisten
 * incluso cuando cierras y vuelves a abrir la página
 */
function guardarPaleta() {
    const guardadas = obtenerGuardadas();
    const nueva = {
        colores: coloresActuales,
        fecha: new Date().toLocaleString()
    };

    guardadas.push(nueva);
    localStorage.setItem('paletas', JSON.stringify(guardadas));
    renderizarGuardadas();
    mostrarToast('✓ Paleta guardada');
}

// Obtiene las paletas guardadas del localStorage
function obtenerGuardadas() {
    const datos = localStorage.getItem('paletas');
    return datos ? JSON.parse(datos) : [];
}

// Limpia todas las paletas guardadas
function limpiarGuardadas() {
    localStorage.removeItem('paletas');
    renderizarGuardadas();
    mostrarToast('Paletas eliminadas');
}

// ── RENDER DE PALETAS GUARDADAS ───────────

function renderizarGuardadas() {
    const guardadas = obtenerGuardadas();
    listaGuardadas.innerHTML = '';

    if (guardadas.length === 0) {
        listaGuardadas.innerHTML = '<p class="estado-vacio">No hay paletas guardadas aún</p>';
        return;
    }

    guardadas.forEach((paleta, i) => {
        const div = document.createElement('div');
        div.classList.add('paleta-guardada');

        const coloresHTML = paleta.colores.map(color => `
            <div
                class="color-guardado"
                style="background-color: ${color}"
                title="${color}"
                aria-label="Color ${color}"
            ></div>
        `).join('');

        div.innerHTML = `
            <div class="paleta-guardada-colores">${coloresHTML}</div>
            <p class="paleta-guardada-fecha">Guardada el ${paleta.fecha}</p>
        `;

        listaGuardadas.appendChild(div);
    });
}

// ── FUNCIÓN AUXILIAR: HSL a HEX ───────────

/*
 * Convierte un color HSL a HEX
 * Necesaria para mostrar el HEX cuando el formato elegido es HSL
 */
function hslAHex(hsl) {
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return '#000000';

    let h = parseInt(match[1]) / 360;
    let s = parseInt(match[2]) / 100;
    let l = parseInt(match[3]) / 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return '#' +
        Math.round(r * 255).toString(16).padStart(2, '0') +
        Math.round(g * 255).toString(16).padStart(2, '0') +
        Math.round(b * 255).toString(16).padStart(2, '0');
}

// ── MANEJADOR PRINCIPAL ───────────────────

function handleGenerar() {
    const paleta = generarPaleta();
    renderizarPaleta(paleta);
    mostrarToast(`Paleta de ${paleta.length} colores generada`);
    guardarPaleta();
}

// ── INICIALIZACIÓN ────────────────────────

// Carga las paletas guardadas al iniciar la página
renderizarGuardadas();

// Conecta los botones con sus funciones
btnGenerar.addEventListener('click', handleGenerar);
btnLimpiar.addEventListener('click', limpiarGuardadas);

console.log('Colorangie cargado ✅');