// ===============================
// CARTA PARA CHIWIS
// 1) Lucitas del fondo
// 2) Transición al abrir la carta
// 3) Aparición suave de los párrafos
// ===============================

const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


// ===============================
// 1) LUCITAS DEL FONDO
// Puntitos de luz que suben despacio y titilan.
// ===============================

const lienzo = document.getElementById("lucitas");
const ctx = lienzo.getContext("2d");

let ancho = 0;
let alto = 0;
let lucitas = [];
let brillo = 1;          // intensidad actual de las lucitas
let brilloObjetivo = 1;  // intensidad a la que se van acercando poco a poco

function nuevaLucita(alInicio) {
    return {
        x: Math.random() * ancho,
        y: alInicio ? Math.random() * alto : alto + 10,
        radio: Math.random() * 1.4 + 0.5,
        subida: Math.random() * 0.18 + 0.05,     // velocidad hacia arriba
        deriva: (Math.random() - 0.5) * 0.06,    // movimiento lateral
        fase: Math.random() * Math.PI * 2,       // para el titileo
        velFase: Math.random() * 0.012 + 0.004,
        alfa: Math.random() * 0.45 + 0.15
    };
}

function ajustarLienzo() {
    const anchoAnterior = ancho;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    ancho = window.innerWidth;
    alto = window.innerHeight;

    lienzo.width = ancho * dpr;
    lienzo.height = alto * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Solo se regeneran si cambia el ancho (así no "saltan" cuando
    // la barra del navegador del celular aparece o desaparece)
    if (ancho !== anchoAnterior) {
        const cantidad = Math.round(Math.min(55, Math.max(25, (ancho * alto) / 14000)));
        lucitas = Array.from({ length: cantidad }, () => nuevaLucita(true));
    }
}

function dibujarLucitas() {
    ctx.clearRect(0, 0, ancho, alto);
    brillo += (brilloObjetivo - brillo) * 0.03;

    for (const l of lucitas) {

        if (!reducirMovimiento) {
            l.y -= l.subida;
            l.x += l.deriva + Math.sin(l.fase) * 0.06;
            l.fase += l.velFase;
            if (l.y < -12) Object.assign(l, nuevaLucita(false));
        }

        const a = l.alfa * (0.55 + 0.45 * Math.sin(l.fase)) * brillo;
        const r = l.radio * 4;

        const halo = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
        halo.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, a * 1.8)})`);
        halo.addColorStop(0.35, `rgba(214, 140, 168, ${a * 0.55})`);
        halo.addColorStop(1, "rgba(214, 140, 168, 0)");

        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(l.x, l.y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    if (!reducirMovimiento) requestAnimationFrame(dibujarLucitas);
}

ajustarLienzo();
dibujarLucitas();

window.addEventListener("resize", () => {
    ajustarLienzo();
    if (reducirMovimiento) dibujarLucitas();
});


// ===============================
// 2) ABRIR LA CARTA
// ===============================

let cartaAbierta = false;

function abrirCarta() {

    // Evitamos que se pueda presionar dos veces
    if (cartaAbierta) return;
    cartaAbierta = true;

    const portada = document.getElementById("portada");
    const carta = document.getElementById("carta");
    const velo = document.getElementById("velo");

    document.body.classList.add("abriendo");

    // Tiempos en milisegundos
    const t = reducirMovimiento
        ? { velo: 0, cambio: 350, abrir: 400, fin: 900 }
        : { velo: 650, cambio: 2300, abrir: 2450, fin: 4100 };

    // a) La portada se desvanece hacia arriba y las lucitas bajan su brillo
    portada.classList.add("portada-saliendo");
    brilloObjetivo = 0.25;

    // b) La pantalla se oscurece y aparece la línea de luz
    setTimeout(() => {
        velo.classList.add("activo");
    }, t.velo);

    // c) Detrás del telón cambiamos la portada por la carta
    setTimeout(() => {
        portada.style.display = "none";
        carta.classList.remove("oculto");
        document.getElementById("fondo-flores").classList.add("suave");
        window.scrollTo(0, 0);
    }, t.cambio);

    // d) El telón se abre desde la línea y vuelven las lucitas
    setTimeout(() => {
        velo.classList.add("abrir");
        brilloObjetivo = 1;
        activarRevelado();
    }, t.abrir);

    // e) Se quita el telón y se vuelve a permitir el scroll
    setTimeout(() => {
        velo.style.display = "none";
        document.body.classList.remove("abriendo");
    }, t.fin);
}

document.getElementById("boton-abrir").addEventListener("click", abrirCarta);


// ===============================
// 3) APARICIÓN SUAVE DE LOS PÁRRAFOS
// Cada párrafo aparece cuando ella llega a él al bajar.
// ===============================

// Marcamos automáticamente todo lo que debe aparecer suave
const elementosRevelar = document.querySelectorAll(
    ".seccion-carta > *, .final > *"
);
elementosRevelar.forEach((el) => el.classList.add("revelar"));

function activarRevelado() {

    if (!("IntersectionObserver" in window)) {
        elementosRevelar.forEach((el) => el.classList.add("visible"));
        return;
    }

    const observador = new IntersectionObserver((entradas) => {

        const visibles = entradas.filter((e) => e.isIntersecting);

        // Si entran varios a la vez, aparecen uno tras otro
        visibles.forEach((entrada, i) => {
            const retraso = reducirMovimiento ? 0 : 400 + i * 350;
            entrada.target.style.transitionDelay = retraso + "ms";
            entrada.target.classList.add("visible");
            observador.unobserve(entrada.target);
        });

    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

    elementosRevelar.forEach((el) => observador.observe(el));
}