/* VeriFree · comportamiento de la web (sin dependencias)
   Cada bloque comprueba que su elemento existe, así el mismo archivo
   sirve para todas las páginas. */
(function () {
  'use strict';

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hayObservador = 'IntersectionObserver' in window;

  /* Menú móvil hamburguesa */
  var botonHamb = document.querySelector('.btn-hamburguesa');
  var menuNav = document.getElementById('menu-principal') || document.querySelector('.menu');
  if (botonHamb && menuNav) {
    var alternarMenu = function (abrir) {
      var estado = typeof abrir === 'boolean' ? abrir : !menuNav.classList.contains('abierto');
      menuNav.classList.toggle('abierto', estado);
      botonHamb.setAttribute('aria-expanded', estado ? 'true' : 'false');
      botonHamb.setAttribute('aria-label', estado ? 'Cerrar menú' : 'Abrir menú');
    };

    botonHamb.addEventListener('click', function (e) {
      e.stopPropagation();
      alternarMenu();
    });

    menuNav.querySelectorAll('a').forEach(function (enlace) {
      enlace.addEventListener('click', function () {
        alternarMenu(false);
      });
    });

    document.addEventListener('click', function (e) {
      if (menuNav.classList.contains('abierto') && !menuNav.contains(e.target) && !botonHamb.contains(e.target)) {
        alternarMenu(false);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuNav.classList.contains('abierto')) {
        alternarMenu(false);
        botonHamb.focus();
      }
    });
  }

  /* Explorador de funciones: clic, avance automático y pausa al pasar el ratón */
  var explorador = document.querySelector('.explorador');
  if (explorador) {
    var opciones = [].slice.call(explorador.querySelectorAll('.explorador-opcion'));
    var temporizador;
    var programar = function () {
      clearTimeout(temporizador);
      if (sinMovimiento) return;
      temporizador = setTimeout(function () {
        var i = opciones.findIndex(function (o) { return o.classList.contains('activo'); });
        opciones[(i + 1) % opciones.length].click();
      }, 6000);
    };
    opciones.forEach(function (opcion) {
      opcion.addEventListener('click', function () {
        opciones.forEach(function (o) {
          var activa = o === opcion;
          o.classList.toggle('activo', activa);
          o.setAttribute('aria-selected', activa ? 'true' : 'false');
          var panel = document.getElementById(o.getAttribute('aria-controls'));
          if (panel) panel.classList.toggle('activo', activa);
        });
        programar();
      });
    });
    explorador.addEventListener('mouseenter', function () {
      explorador.classList.add('pausado');
      clearTimeout(temporizador);
    });
    explorador.addEventListener('mouseleave', function () {
      explorador.classList.remove('pausado');
      programar();
    });
    programar();
  }

  /* Titular de portada que aparece palabra a palabra */
  var titular = document.querySelector('.portada h1');
  if (titular && !sinMovimiento) {
    var n = 0;
    (function partir(nodo) {
      [].slice.call(nodo.childNodes).forEach(function (hijo) {
        if (hijo.nodeType !== 3) { partir(hijo); return; }
        var trozo = document.createDocumentFragment();
        hijo.textContent.split(/(\s+)/).forEach(function (parte) {
          if (!parte) return;
          if (/^\s+$/.test(parte)) { trozo.appendChild(document.createTextNode(parte)); return; }
          var palabra = document.createElement('span');
          palabra.className = 'palabra';
          palabra.style.animationDelay = (0.025 * n++) + 's';
          palabra.textContent = parte;
          trozo.appendChild(palabra);
        });
        hijo.parentNode.replaceChild(trozo, hijo);
      });
    })(titular);
  }

  /* Captura de portada que se endereza al bajar */
  var captura = document.querySelector('.escenario > img');
  if (captura && !sinMovimiento && window.innerWidth > 980) {
    var enderezar = function () {
      var r = captura.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, 1 - r.top / window.innerHeight));
      captura.style.setProperty('--inclinacion', (18 * (1 - p)).toFixed(2) + 'deg');
      captura.style.setProperty('--escala', (0.92 + 0.08 * p).toFixed(3));
    };
    window.addEventListener('scroll', enderezar, { passive: true });
    enderezar();
  }

  /* Foco de luz que sigue al ratón */
  document.querySelectorAll('.explorador-panel, .plan, .coste').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  if (!hayObservador) return;

  /* Gráfico de costes: las barras crecen al llegar */
  var coste = document.querySelector('.coste');
  if (coste) {
    coste.classList.add('preparado');
    var obsCoste = new IntersectionObserver(function (entradas) {
      if (entradas[0].isIntersecting) {
        coste.classList.add('visible');
        obsCoste.disconnect();
      }
    }, { threshold: 0.35 });
    obsCoste.observe(coste);
  }

  /* Cifras del resumen de costes que se cuentan al aparecer */
  if (!sinMovimiento) {
    var formato = function (x) { return Math.round(x).toLocaleString('es-ES'); };
    var obsCifras = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        obsCifras.unobserve(e.target);
        var b = e.target, original = b.textContent;
        var numeros = (original.match(/[\d.]+/g) || []).map(function (x) { return +x.replace(/\./g, ''); });
        var inicio = performance.now();
        (function paso(t) {
          var p = Math.min(1, Math.max(0, (t - inicio) / 1400)), k = 1 - Math.pow(1 - p, 3), j = 0;
          b.textContent = original.replace(/[\d.]+/g, function () { return formato(numeros[j++] * k); });
          if (p < 1) requestAnimationFrame(paso); else b.textContent = original;
        })(inicio);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.coste-ahorro b, .coste-gancho b').forEach(function (b) { obsCifras.observe(b); });
  }

  /* Aparición de bloques al hacer scroll */
  var selector = '.seccion-cabecera, .coste, .explorador, .manifiesto, .codigo-bloque, .captura-marco, .prueba, .planes, .precios-extra, .resumen, .faq-lista, .cierre .marco, .bloque, .legal-texto, .legal-lateral';
  var obsAparecer = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('visto');
        obsAparecer.unobserve(e.target);
      }
    });
  }, { threshold: 0.05 });
  document.querySelectorAll(selector).forEach(function (el) {
    el.classList.add('revelar');
    obsAparecer.observe(el);
  });
})();
