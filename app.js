// =========================================================================
// LÓGICA DE APLICACIÓN - SUPER FONTANA DESIGNER
// Conecta a Supabase, maneja el Canvas, recomendaciones e interfaz.
// =========================================================================

let supabase = null;
let currentView = 'generador';

// Listas globales de datos en memoria para evitar llamadas redundantes
let marcasList = [];
let productosList = [];
let diseñosList = [];
let historialList = [];

// Estado del Generador
let activeDesign = null;
let imageCache = {}; // Cache de imágenes cargadas (HTMLImageElement)
let fontanaLogo = null; // Imagen del logo oficial

// Estado del Anotador Admin
let annotatorBaseImg = null;
let annotatorPatches = [];
let selectedAnnotatorPatchId = null;
let annotatorNextId = 1;
let isDrawing = false;
let startX = 0, startY = 0;
let currentMouseX = 0, currentMouseY = 0;
let activeTemplateId = null;

// =========================================================================
// 1. INICIALIZACIÓN Y CONEXIÓN
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  conectarSupabase();
});

function conectarSupabase() {
  const url = SUPABASE_CONFIG.url;
  const anonKey = SUPABASE_CONFIG.anonKey;
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  if (!url || !anonKey) {
    statusDot.className = 'status-dot disconnected';
    statusText.textContent = 'Configurar conexión';
    mostrarVista('configuracion');
    return;
  }

  try {
    supabase = window.supabase.createClient(url, anonKey);
    statusText.textContent = 'Conectando...';
    
    // Probar conexión leyendo la tabla de diseños
    supabase.from('diseños_base').select('id').limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error conectando a Supabase:", error);
          statusDot.className = 'status-dot disconnected';
          statusText.textContent = 'Error de conexión';
          alert("Error de conexión con Supabase. Por favor revisa la configuración y las tablas.");
        } else {
          statusDot.className = 'status-dot connected';
          statusText.textContent = 'Conectado';
          cargarTodosLosDatos();
        }
      });
  } catch (e) {
    console.error(e);
    statusDot.className = 'status-dot disconnected';
    statusText.textContent = 'Error';
  }
}

// Cargar todos los catálogos en paralelo
async function cargarTodosLosDatos() {
  mostrarCargando(true);
  try {
    await Promise.all([
      cargarMarcas(),
      cargarProductos(),
      cargarDiseños(),
      cargarHistorial()
    ]);
    
    // Cargar logo oficial del supermercado
    const logoImg = new Image();
    logoImg.onload = () => { fontanaLogo = logoImg; renderFinal(); };
    logoImg.onerror = () => {
      console.warn("No se pudo cargar logo_super_fontana.jpg localmente, se intentará de Supabase.");
      // Buscar en bucket 'identidad' en Supabase
      const logoUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/public/identidad/logo_super_fontana.jpg`;
      const logoImgSb = new Image();
      logoImgSb.onload = () => { fontanaLogo = logoImgSb; renderFinal(); };
      logoImgSb.src = logoUrl;
    };
    logoImg.src = 'logo_super_fontana.jpg';

    // Rellenar selectores del generador
    poblarSelectoresGenerador();
    
    // Renderizar grillas
    renderMarcasTable();
    renderProductosTable();
    renderTemplatesGrid();
    renderHistorialTable();

    // Trigger de recomendación inicial si hay productos
    if (productosList.length > 0) {
      setTimeout(ejecutarRecomendacion, 500);
    }
  } catch (err) {
    console.error("Error al cargar catálogos:", err);
  } finally {
    mostrarCargando(false);
  }
}

function mostrarCargando(show) {
  const statusText = document.getElementById('statusText');
  if (show) {
    statusText.textContent = 'Actualizando...';
  } else {
    statusText.textContent = 'Conectado';
  }
}

// =========================================================================
// 2. OPERACIONES DE BASE DE DATOS (CRUD)
// =========================================================================

async function cargarMarcas() {
  const { data, error } = await supabase.from('marcas').select('*').order('nombre', { ascending: true });
  if (!error) marcasList = data || [];
}

async function cargarProductos() {
  const { data, error } = await supabase.from('productos').select('*, marcas(nombre, logo_url)').order('nombre', { ascending: true });
  if (!error) productosList = data || [];
}

async function cargarDiseños() {
  const { data, error } = await supabase.from('diseños_base').select('*').order('created_at', { ascending: false });
  if (!error) diseñosList = data || [];
}

async function cargarHistorial() {
  const { data, error } = await supabase.from('carteles_generados').select('*, productos(nombre)').order('created_at', { ascending: false });
  if (!error) historialList = data || [];
}

// =========================================================================
// 3. RUTINAS DE NAVEGACIÓN Y COMPORTAMIENTO UI
// =========================================================================

function initUI() {
  // Configuración de pestañas del sidebar
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      const view = item.getAttribute('data-view');
      mostrarVista(view);
    });
  });

  // Listener para cambiar el tipo de cartel
  document.getElementById('genTipoComunicacion').addEventListener('change', () => {
    const tipo = document.getElementById('genTipoComunicacion').value;
    
    // Ocultar / Mostrar paneles condicionales
    document.getElementById('genCamposMayorista').style.display = (tipo === '03_precio_mayorista') ? 'block' : 'none';
    document.getElementById('genCamposVariedades').style.display = (tipo === '04_variedades_mismo_precio') ? 'block' : 'none';
    
    ejecutarRecomendacion();
  });

  // Listener al cambiar producto seleccionado
  document.getElementById('genProductoSelect').addEventListener('change', () => {
    const prodId = document.getElementById('genProductoSelect').value;
    const prod = productosList.find(p => p.id === prodId);
    
    if (prod) {
      document.getElementById('genProductoDetalles').style.display = 'block';
      document.getElementById('detProdCat').textContent = prod.categoria;
      document.getElementById('detProdEstilo').textContent = prod.estilo;
      
      // Auto-rellenar campos de texto si aplica
      ejecutarRecomendacion();
    } else {
      document.getElementById('genProductoDetalles').style.display = 'none';
    }
  });

  // Inputs del generador que gatillan render inmediato
  ['genPrecioEntero', 'genPrecioCentavos', 'genCantUnidades', 'genTextoVariedades'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => renderFinal());
  });

  // Botón guardar configuración
  document.getElementById('btnGuardarConfig').addEventListener('click', () => {
    const url = document.getElementById('configUrl').value.trim();
    const anon = document.getElementById('configAnonKey').value.trim();
    
    window.localStorage.setItem('supabase_url', url);
    window.localStorage.setItem('supabase_anon_key', anon);
    
    SUPABASE_CONFIG.url = url;
    SUPABASE_CONFIG.anonKey = anon;
    
    conectarSupabase();
  });

  // Inicializar credenciales en la pestaña de configuración
  document.getElementById('configUrl').value = SUPABASE_CONFIG.url;
  document.getElementById('configAnonKey').value = SUPABASE_CONFIG.anonKey;

  // Botones de Modales Admin
  document.getElementById('btnCrearMarcaModal').onclick = () => abrirModal('marcaModal');
  document.getElementById('btnCrearProductoModal').onclick = () => abrirModal('productoModal');
  document.getElementById('btnSubirPlantillaModal').onclick = () => abrirModal('plantillaModal');

  // Submit de Formularios
  document.getElementById('marcaForm').onsubmit = handleCrearMarca;
  document.getElementById('productoForm').onsubmit = handleCrearProducto;
  document.getElementById('plantillaForm').onsubmit = handleCrearPlantilla;

  // Botones del generador
  document.getElementById('btnDescargarPNG').onclick = descargarCartel;
  document.getElementById('btnGuardarHistorial').onclick = guardarCartelHistorial;

  // Configuración del Anotador Admin
  initAnnotatorEvents();

  // Filtros de plantillas base
  document.querySelectorAll('#templateFilterTabs .filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#templateFilterTabs .filter-tab').forEach(el => el.classList.remove('active'));
      tab.classList.add('active');
      renderTemplatesGrid(tab.getAttribute('data-filter'));
    });
  });
}

function mostrarVista(view) {
  currentView = view;
  document.querySelectorAll('.view-container').forEach(viewEl => viewEl.classList.remove('active'));
  
  const targetView = document.getElementById(`view-${view}`);
  if (targetView) targetView.classList.add('active');

  // Ajustar títulos
  const titles = {
    'generador': 'Asistente Inteligente de Diseño',
    'identidad': 'Identidad de Marca y Recursos Oficiales',
    'plantillas': 'Biblioteca de Plantillas & Memoria Visual',
    'productos': 'Catálogo de Productos',
    'historial': 'Historial de Carteles Generados',
    'configuracion': 'Configuración de Sistema'
  };
  document.getElementById('pageTitle').textContent = titles[view] || 'Super Fontana';
}

function abrirModal(id) {
  document.getElementById(id).classList.add('active');
}

function cerrarModal(id) {
  document.getElementById(id).classList.remove('active');
}

function closeMarcaModal() { cerrarModal('marcaModal'); }
function closeProductoModal() { cerrarModal('productoModal'); }
function closePlantillaModal() { cerrarModal('plantillaModal'); }

// Poblar desplegables en el Asistente
function poblarSelectoresGenerador() {
  const prodSelect = document.getElementById('genProductoSelect');
  prodSelect.innerHTML = '<option value="">-- Seleccioná un producto --</option>';
  
  productosList.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.nombre} (${p.marcas ? p.marcas.nombre : 'Sin Marca'})`;
    prodSelect.appendChild(opt);
  });

  // Selector marcas en modal producto
  const prodMarcaSelect = document.getElementById('prodMarca');
  prodMarcaSelect.innerHTML = '<option value="">(Sin Marca)</option>';
  marcasList.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.nombre;
    prodMarcaSelect.appendChild(opt);
  });
}

// =========================================================================
// 4. ALGORITMO DE RECOMENDACIÓN INTELIGENTE (MEMORIA VISUAL)
// =========================================================================

function ejecutarRecomendacion() {
  const tipo = document.getElementById('genTipoComunicacion').value;
  const prodId = document.getElementById('genProductoSelect').value;
  const proposalsGrid = document.getElementById('proposalsGrid');

  if (!prodId) {
    proposalsGrid.innerHTML = '<p style="font-size: 12px; color: var(--text-muted); padding: 10px;">Seleccioná un producto para ver propuestas...</p>';
    activeDesign = null;
    clearCanvas(document.getElementById('editorCanvas'));
    return;
  }

  const prod = productosList.find(p => p.id === prodId);
  if (!prod) return;

  // Filtrar plantillas correspondientes a la categoría seleccionada
  let candidatos = diseñosList.filter(d => d.categoria_cartel === tipo);

  if (candidatos.length === 0) {
    proposalsGrid.innerHTML = '<p style="font-size: 12px; color: var(--text-muted); padding: 10px;">No hay plantillas base cargadas para esta categoría.</p>';
    activeDesign = null;
    clearCanvas(document.getElementById('editorCanvas'));
    return;
  }

  // ALGORITMO DE PUNTUACIÓN DE COINCIDENCIA:
  // Intentamos priorizar plantillas que compartan el 'estilo' del producto (Elegante, Fresco, Familiar, etc.)
  // y que tengan configurados los parches requeridos.
  let propuestasEvaluadas = candidatos.map(diseño => {
    let score = 0;
    
    // Coincidencia exacta de estilo visual (ej: Vino -> Elegante)
    if (diseño.estilo.toLowerCase() === prod.estilo.toLowerCase()) {
      score += 10;
    }
    
    // Coincidencia parcial o general
    if (diseño.estilo.toLowerCase() === 'general') {
      score += 2;
    }
    
    // Coincidencia por nombre (si la plantilla hace referencia a marcas afines)
    if (prod.marcas && diseño.nombre.toLowerCase().includes(prod.marcas.nombre.toLowerCase())) {
      score += 5;
    }

    return { diseño, score };
  });

  // Ordenar por score descendente
  propuestasEvaluadas.sort((a, b) => b.score - a.score);

  // Renderizar las propuestas recomendadas en el panel lateral
  proposalsGrid.innerHTML = '';
  propuestasEvaluadas.forEach((prop, index) => {
    const card = document.createElement('div');
    card.className = 'proposal-card' + (index === 0 ? ' active' : '');
    card.innerHTML = `
      <img src="${prop.diseño.imagen_url}" alt="${prop.diseño.nombre}">
      <div class="label">${prop.diseño.nombre}</div>
    `;
    
    card.onclick = () => {
      document.querySelectorAll('.proposal-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      seleccionarDiseñoBase(prop.diseño);
    };

    proposalsGrid.appendChild(card);
  });

  // Seleccionar la propuesta con mayor coincidencia por defecto
  seleccionarDiseñoBase(propuestasEvaluadas[0].diseño);
}

function seleccionarDiseñoBase(diseño) {
  activeDesign = diseño;
  renderFinal();
}

function clearCanvas(cvs) {
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  ctx.fillStyle = '#1c1c24';
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  ctx.fillStyle = '#6e6e7f';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Lienzo Vacío', cvs.width / 2, cvs.height / 2);
}

// =========================================================================
// 5. MOTOR DE DIBUJO CANVAS (Renders automáticos de carteles finales)
// =========================================================================

async function loadImage(url) {
  if (imageCache[url]) return imageCache[url];
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache[url] = img;
      resolve(img);
    };
    img.onerror = () => reject(new Error("Error al cargar imagen " + url));
    img.src = url;
  });
}

async function renderFinal() {
  const canvas = document.getElementById('editorCanvas');
  const ctx = canvas.getContext('2d');

  if (!activeDesign) {
    clearCanvas(canvas);
    return;
  }

  const prodId = document.getElementById('genProductoSelect').value;
  const prod = productosList.find(p => p.id === prodId);
  if (!prod) return;

  const precioEntero = document.getElementById('genPrecioEntero').value || '0';
  const precioCentavos = document.getElementById('genPrecioCentavos').value || '00';
  const cantUnidades = document.getElementById('genCantUnidades').value || '1';
  const textoVariedades = document.getElementById('genTextoVariedades').value || '';

  try {
    // 1. Cargar imagen de la plantilla base
    const baseImg = await loadImage(activeDesign.imagen_url);
    
    // Ajustar dimensiones del canvas para que coincidan con la plantilla original
    canvas.width = baseImg.width;
    canvas.height = baseImg.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

    // 2. Leer configuraciones de parches anotados de la plantilla
    const parches = activeDesign.config_parches || {};

    // 3. ESTRUCTURA DE CAPAS DE DIBUJO (Rendering Engine)

    // CAPA 1: Plantilla original
    // (Ya dibujada arriba mediante ctx.drawImage(baseImg, 0, 0))

    // CAPA 2: Fondo y Decoración (Tapado de zonas antiguas)
    // Dibujamos todos los parches de fondo de una sola vez para limpiar el lienzo
    for (const [key, p] of Object.entries(parches)) {
      if (p && p.bgOn) {
        ctx.fillStyle = p.bg || '#ffffff';
        ctx.fillRect(p.x, p.y, p.w, p.h);
      }
    }

    // CAPA 3: Imagen del Producto (Botella, paquete, etc.)
    const patchImgProd = parches['imagen_producto'];
    if (patchImgProd && prod.imagen_url) {
      try {
        const pImg = await loadImage(prod.imagen_url);
        dibujarImagenAjustada(ctx, pImg, patchImgProd.x, patchImgProd.y, patchImgProd.w, patchImgProd.h);
      } catch (e) {
        console.error("Error al renderizar foto del producto en Capa 3:", e);
      }
    }

    // CAPA 4: Logo Marca del Producto (Ej: Arcor, Marolio)
    const patchLogoMarca = parches['logo_marca'];
    if (patchLogoMarca && prod.marcas && prod.marcas.logo_url) {
      try {
        const mImg = await loadImage(prod.marcas.logo_url);
        dibujarImagenAjustada(ctx, mImg, patchLogoMarca.x, patchLogoMarca.y, patchLogoMarca.w, patchLogoMarca.h);
      } catch (e) {
        console.error("Error al renderizar logo de marca en Capa 4:", e);
      }
    }

    // CAPA 5: Logo Super Fontana (Logo oficial fijo del supermercado)
    // (Se dibuja al final del método en su posición institucional fija)

    // CAPA 6: Texto Dinámico (Nombre, descripción, formato)
    for (const [key, p] of Object.entries(parches)) {
      if (!p) continue;
      
      const centerX = p.x + p.w / 2;
      const centerY = p.y + p.h / 2;
      ctx.fillStyle = p.color || '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (p.rol === 'nombre') {
        const maxTextW = p.w - 20;
        ctx.font = `bold ${p.fontSize || 40}px ${p.fontFamily || 'sans-serif'}`;
        ctx.fillText(prod.nombre.toUpperCase(), centerX, centerY, maxTextW);

      } else if (p.rol === 'formato') {
        ctx.font = `bold ${p.fontSize || 30}px ${p.fontFamily || 'sans-serif'}`;
        ctx.fillText(cantUnidades > 1 && activeDesign.categoria_cartel === '03_precio_mayorista' ? `LLEVANDO ${cantUnidades} UNID.` : 'PRECIO REGULAR', centerX, centerY);

      } else if (p.rol === 'subtitulo') {
        if (activeDesign.categoria_cartel === '04_variedades_mismo_precio' && textoVariedades) {
          ctx.font = `${p.fontSize || 25}px ${p.fontFamily || 'sans-serif'}`;
          ctx.fillText(textoVariedades, centerX, centerY, p.w - 10);
        }
      }
    }

    // CAPA 7: Precio (Superpuesto por encima de todo)
    const patchPrecio = parches['precio'];
    if (patchPrecio) {
      const centerX = patchPrecio.x + patchPrecio.w / 2;
      const centerY = patchPrecio.y + patchPrecio.h / 2;
      ctx.fillStyle = patchPrecio.color || '#000000';
      ctx.textBaseline = 'middle';

      const formattedPrice = `$ ${precioEntero}`;
      const centsText = `,${precioCentavos}`;
      
      ctx.font = `bold ${patchPrecio.fontSize || 80}px ${patchPrecio.fontFamily || 'sans-serif'}`;
      ctx.textAlign = 'center';
      
      const priceWidth = ctx.measureText(formattedPrice).width;
      ctx.font = `bold ${(patchPrecio.fontSize || 80) * 0.55}px ${patchPrecio.fontFamily || 'sans-serif'}`;
      const centsWidth = ctx.measureText(centsText).width;
      
      const totalW = priceWidth + centsWidth;
      const startX = centerX - totalW / 2;

      // Dibujar parte entera
      ctx.font = `bold ${patchPrecio.fontSize || 80}px ${patchPrecio.fontFamily || 'sans-serif'}`;
      ctx.textAlign = 'left';
      ctx.fillText(formattedPrice, startX, centerY);

      // Dibujar parte decimal desplazada arriba
      ctx.font = `bold ${(patchPrecio.fontSize || 80) * 0.55}px ${patchPrecio.fontFamily || 'sans-serif'}`;
      const centsY = centerY - (patchPrecio.fontSize || 80) * 0.18;
      ctx.fillText(centsText, startX + priceWidth, centsY);
    }

    // 4. Superponer el Logo Oficial de Supermercado Fontana en la base
    // Debe aparecer chico en el sector inferior de todos los carteles generados, sin excepción.
    if (fontanaLogo) {
      // Dimensionar logo al 14% del ancho de la plantilla
      const logoW = Math.floor(canvas.width * 0.14);
      const logoH = Math.floor(fontanaLogo.height * (logoW / fontanaLogo.width));
      
      const logoX = Math.floor((canvas.width - logoW) / 2);
      const logoY = Math.floor(canvas.height - logoH - (canvas.height * 0.03));
      
      // Limpiar un pequeño recuadro negro para colocarlo sobre fondo limpio si es necesario
      ctx.fillStyle = '#000000';
      ctx.fillRect(logoX - 4, logoY - 4, logoW + 8, logoH + 8);
      ctx.drawImage(fontanaLogo, logoX, logoY, logoW, logoH);
    }

  } catch (err) {
    console.error("Error renderizando cartel final:", err);
  }
}

// Función auxiliar para dibujar fotos/logos en bounding boxes manteniendo proporciones
function dibujarImagenAjustada(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let drawW = w;
  let drawH = h;
  let drawX = x;
  let drawY = y;

  if (imgRatio > boxRatio) {
    drawH = w / imgRatio;
    drawY = y + (h - drawH) / 2;
  } else {
    drawW = h * imgRatio;
    drawX = x + (w - drawW) / 2;
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

// =========================================================================
// 6. HERRAMIENTA INTERNA DE ANOTACIÓN (ADMIN MEMORY ANNOTATOR)
// =========================================================================

function initAnnotatorEvents() {
  const annCvs = document.getElementById('annotatorCanvas');
  
  annCvs.addEventListener('mousedown', (e) => {
    if (!annotatorBaseImg) return;
    const rect = annCvs.getBoundingClientRect();
    startX = (e.clientX - rect.left) * (annCvs.width / rect.width);
    startY = (e.clientY - rect.top) * (annCvs.height / rect.height);
    isDrawing = true;
  });

  annCvs.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const rect = annCvs.getBoundingClientRect();
    currentMouseX = (e.clientX - rect.left) * (annCvs.width / rect.width);
    currentMouseY = (e.clientY - rect.top) * (annCvs.height / rect.height);
    drawAnnotatorState();
  });

  annCvs.addEventListener('mouseup', () => {
    if (!isDrawing) return;
    isDrawing = false;
    
    // Crear el nuevo parche anotado
    const w = Math.abs(currentMouseX - startX);
    const h = Math.abs(currentMouseY - startY);
    const x = Math.min(startX, currentMouseX);
    const y = Math.min(startY, currentMouseY);

    // Solo agregar si el cuadro tiene tamaño mínimo considerable (evitar clicks fortuitos)
    if (w > 15 && h > 15) {
      const p = {
        id: annotatorNextId++,
        rol: 'precio',
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(w),
        h: Math.round(h),
        fontSize: 40,
        color: '#ffffff',
        bg: '#1a1a1a',
        bgOn: true,
        fontFamily: 'sans-serif'
      };
      annotatorPatches.push(p);
      selectAnnotatorPatch(p.id);
    }
    drawAnnotatorState();
  });

  // Botón agregar manualmente
  document.getElementById('btnCrearZona').addEventListener('click', () => {
    if (!annotatorBaseImg) return;
    const cvs = document.getElementById('annotatorCanvas');
    const p = {
      id: annotatorNextId++,
      rol: 'precio',
      x: Math.round(cvs.width / 2 - 150),
      y: Math.round(cvs.height / 2 - 50),
      w: 300,
      h: 100,
      fontSize: 40,
      color: '#ffffff',
      bg: '#1a1a1a',
      bgOn: true,
      fontFamily: 'sans-serif'
    };
    annotatorPatches.push(p);
    selectAnnotatorPatch(p.id);
    drawAnnotatorState();
  });

  // Inputs del panel de zonas para cambiar propiedades de forma interactiva
  ['zonaRol', 'zonaFontSize', 'zonaColor', 'zonaBg', 'zonaBgOn'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      const p = annotatorPatches.find(x => x.id === selectedAnnotatorPatchId);
      if (!p) return;
      
      p.rol = document.getElementById('zonaRol').value;
      p.fontSize = parseInt(document.getElementById('zonaFontSize').value) || 30;
      p.color = document.getElementById('zonaColor').value;
      p.bg = document.getElementById('zonaBg').value;
      p.bgOn = document.getElementById('zonaBgOn').checked;
      
      drawAnnotatorState();
      renderAnnotatorPatchList();
    });
  });

  // Guardar zonas anotadas en Supabase
  document.getElementById('btnGuardarAnotaciones').addEventListener('click', async () => {
    if (!activeTemplateId) return;

    // Convertir lista de parches a un mapa JSON indexado por el rol
    const configMap = {};
    annotatorPatches.forEach(p => {
      configMap[p.rol] = {
        rol: p.rol,
        x: p.x, y: p.y, w: p.w, h: p.h,
        fontSize: p.fontSize,
        color: p.color,
        bg: p.bg,
        bgOn: p.bgOn,
        fontFamily: p.fontFamily
      };
    });

    mostrarCargando(true);
    const { data, error } = await supabase
      .from('diseños_base')
      .update({ config_parches: configMap })
      .eq('id', activeTemplateId);

    mostrarCargando(false);
    if (error) {
      alert("Error al guardar en Supabase: " + error.message);
    } else {
      alert("Memoria Visual configurada y guardada correctamente.");
      cerrarModal('annotatorModal');
      cargarTodosLosDatos();
    }
  });
}

async function abrirAnotador(templateId) {
  activeTemplateId = templateId;
  const template = diseñosList.find(d => d.id === templateId);
  if (!template) return;

  mostrarCargando(true);
  try {
    const img = await loadImage(template.imagen_url);
    annotatorBaseImg = img;
    
    // Dimensionar Canvas del anotador
    const cvs = document.getElementById('annotatorCanvas');
    cvs.width = img.width;
    cvs.height = img.height;

    // Reconstruir lista de parches desde la base de datos
    annotatorPatches = [];
    annotatorNextId = 1;
    const config = template.config_parches || {};
    
    for (const [rol, val] of Object.entries(config)) {
      if (!val) continue;
      annotatorPatches.push({
        id: annotatorNextId++,
        rol: val.rol || rol,
        x: val.x, y: val.y, w: val.w, h: val.h,
        fontSize: val.fontSize || 40,
        color: val.color || '#ffffff',
        bg: val.bg || '#1a1a1a',
        bgOn: val.bgOn !== undefined ? val.bgOn : true,
        fontFamily: val.fontFamily || 'sans-serif'
      });
    }

    selectedAnnotatorPatchId = null;
    document.getElementById('zonaConfigFields').style.display = 'none';
    
    drawAnnotatorState();
    renderAnnotatorPatchList();
    abrirModal('annotatorModal');
  } catch (err) {
    alert("Error al cargar la plantilla: " + err.message);
  } finally {
    mostrarCargando(false);
  }
}

function closeAnnotator() {
  cerrarModal('annotatorModal');
  annotatorBaseImg = null;
  activeTemplateId = null;
}

function selectAnnotatorPatch(id) {
  selectedAnnotatorPatchId = id;
  const p = annotatorPatches.find(x => x.id === id);
  const fields = document.getElementById('zonaConfigFields');
  
  if (!p) {
    fields.style.display = 'none';
    return;
  }

  fields.style.display = 'block';
  document.getElementById('zonaRol').value = p.rol;
  document.getElementById('zonaFontSize').value = p.fontSize;
  document.getElementById('zonaColor').value = p.color;
  document.getElementById('zonaBg').value = p.bg;
  document.getElementById('zonaBgOn').checked = p.bgOn;

  renderAnnotatorPatchList();
}

function deleteAnnotatorPatch(id) {
  annotatorPatches = annotatorPatches.filter(x => x.id !== id);
  if (selectedAnnotatorPatchId === id) {
    selectedAnnotatorPatchId = null;
    document.getElementById('zonaConfigFields').style.display = 'none';
  }
  drawAnnotatorState();
  renderAnnotatorPatchList();
}

function renderAnnotatorPatchList() {
  const container = document.getElementById('annotatorPatchList');
  container.innerHTML = '';

  annotatorPatches.forEach(p => {
    const item = document.createElement('div');
    item.className = 'patch-item' + (p.id === selectedAnnotatorPatchId ? ' selected' : '');
    
    const roleLabels = {
      'precio': '🏷️ Precio',
      'nombre': '📝 Nombre Prod.',
      'imagen_producto': '🖼️ Foto Prod.',
      'logo_marca': '🏷️ Logo Marca',
      'formato': '⚖️ Gramaje/Form.',
      'subtitulo': 'ℹ️ Subtítulo'
    };

    item.innerHTML = `
      <span class="patch-item-name">${roleLabels[p.rol] || p.rol}</span>
      <span style="font-size:10px; color:var(--text-muted);">${p.w}x${p.h}px</span>
      <span class="patch-item-del" onclick="event.stopPropagation(); deleteAnnotatorPatch(${p.id})">✕</span>
    `;

    item.onclick = () => {
      selectAnnotatorPatch(p.id);
      drawAnnotatorState();
    };

    container.appendChild(item);
  });
}

function drawAnnotatorState() {
  const cvs = document.getElementById('annotatorCanvas');
  const ctx = cvs.getContext('2d');

  if (!annotatorBaseImg) return;
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  ctx.drawImage(annotatorBaseImg, 0, 0, cvs.width, cvs.height);

  // Dibujar todas las zonas anotadas
  annotatorPatches.forEach(p => {
    const isSelected = p.id === selectedAnnotatorPatchId;
    
    // Dibujar el recuadro de tapado simulado
    if (p.bgOn) {
      ctx.fillStyle = p.bg;
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
    
    // Dibujar borde indicador
    ctx.strokeStyle = isSelected ? '#ffd700' : '#d00000';
    ctx.lineWidth = isSelected ? 3 : 1.5;
    if (isSelected) {
      ctx.setLineDash([6, 4]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    ctx.setLineDash([]);

    // Dibujar rol de la zona encima
    ctx.fillStyle = isSelected ? '#ffd700' : '#d00000';
    ctx.font = 'bold 12px sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillText(` ${p.rol.toUpperCase()}`, p.x, p.y - 4);
  });

  // Dibujar la zona que se está arrastrando/dibujando actualmente
  if (isDrawing) {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    const w = currentMouseX - startX;
    const h = currentMouseY - startY;
    ctx.strokeRect(startX, startY, w, h);
    ctx.setLineDash([]);
  }
}

// =========================================================================
// 7. CARGA DE ARCHIVOS A SUPABASE STORAGE Y REGISTRO EN DB
// =========================================================================

async function uploadFileToSupabase(bucket, path, file) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;
  
  // Obtener URL pública
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
}

// Alta de nueva Marca
async function handleCrearMarca(e) {
  e.preventDefault();
  const nombre = document.getElementById('marcaNombre').value.trim();
  const file = document.getElementById('marcaLogoFile').files[0];

  if (!nombre || !file) return;

  mostrarCargando(true);
  try {
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const logoUrl = await uploadFileToSupabase('logos', filename, file);

    const { error } = await supabase
      .from('marcas')
      .insert([{ nombre, logo_url: logoUrl }]);

    if (error) throw error;

    alert("Marca registrada con éxito.");
    closeMarcaModal();
    document.getElementById('marcaForm').reset();
    cargarTodosLosDatos();
  } catch (err) {
    alert("Error al guardar la marca: " + err.message);
  } finally {
    mostrarCargando(false);
  }
}

// Alta de nuevo Producto
async function handleCrearProducto(e) {
  e.preventDefault();
  const nombre = document.getElementById('prodNombre').value.trim();
  const marcaId = document.getElementById('prodMarca').value || null;
  const categoria = document.getElementById('prodCategoria').value;
  const estilo = document.getElementById('prodEstilo').value;
  const file = document.getElementById('prodFotoFile').files[0];

  if (!nombre || !file) return;

  mostrarCargando(true);
  try {
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const imageUrl = await uploadFileToSupabase('productos', filename, file);

    const { error } = await supabase
      .from('productos')
      .insert([{
        nombre,
        marca_id: marcaId,
        categoria,
        estilo,
        imagen_url: imageUrl
      }]);

    if (error) throw error;

    alert("Producto registrado en catálogo.");
    closeProductoModal();
    document.getElementById('productoForm').reset();
    cargarTodosLosDatos();
  } catch (err) {
    alert("Error al registrar el producto: " + err.message);
  } finally {
    mostrarCargando(false);
  }
}

// Subir nueva Plantilla base (diseño histórico)
async function handleCrearPlantilla(e) {
  e.preventDefault();
  const nombre = document.getElementById('platNombre').value.trim();
  const categoriaCartel = document.getElementById('platCat').value;
  const estilo = document.getElementById('platEstilo').value;
  const file = document.getElementById('platFotoFile').files[0];

  if (!nombre || !file) return;

  mostrarCargando(true);
  try {
    const filename = `${categoriaCartel}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const imageUrl = await uploadFileToSupabase('diseños', filename, file);

    const { error } = await supabase
      .from('diseños_base')
      .insert([{
        nombre,
        categoria_cartel: categoriaCartel,
        estilo,
        imagen_url: imageUrl,
        config_parches: {} // Iniciar sin parches configurados
      }]);

    if (error) throw error;

    alert("Plantilla cargada en la biblioteca con éxito. Podes configurarla en la vista de biblioteca.");
    closePlantillaModal();
    document.getElementById('plantillaForm').reset();
    cargarTodosLosDatos();
  } catch (err) {
    alert("Error al cargar la plantilla: " + err.message);
  } finally {
    mostrarCargando(false);
  }
}

// =========================================================================
// 8. EXPORTACIÓN Y GUARDADO DE HISTORIAL (EMPLEADO)
// =========================================================================

function descargarCartel() {
  if (!activeDesign) {
    alert("No hay ningún diseño activo para descargar.");
    return;
  }
  const canvas = document.getElementById('editorCanvas');
  const link = document.createElement('a');
  link.download = `cartel_${activeDesign.nombre}_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function guardarCartelHistorial() {
  if (!activeDesign) return;

  const prodId = document.getElementById('genProductoSelect').value;
  const precioEntero = document.getElementById('genPrecioEntero').value || '0';
  const precioCentavos = document.getElementById('genPrecioCentavos').value || '00';
  
  if (!prodId) {
    alert("Seleccioná un producto primero.");
    return;
  }

  mostrarCargando(true);
  const canvas = document.getElementById('editorCanvas');
  
  canvas.toBlob(async (blob) => {
    if (!blob) {
      mostrarCargando(false);
      alert("Error al exportar la imagen.");
      return;
    }

    try {
      const filename = `${Date.now()}_cartel_generado.png`;
      // Subir cartel renderizado a bucket 'generados'
      const imageUrl = await uploadFileToSupabase('generados', filename, blob);

      // Guardar en la tabla relacional
      const { error } = await supabase
        .from('carteles_generados')
        .insert([{
          producto_id: prodId,
          diseño_base_id: activeDesign.id,
          precio: `$ ${precioEntero},${precioCentavos}`,
          imagen_url: imageUrl
        }]);

      if (error) throw error;

      alert("Cartel guardado en el historial con éxito.");
      cargarTodosLosDatos();
    } catch (e) {
      alert("Error al guardar en el historial: " + e.message);
    } finally {
      mostrarCargando(false);
    }
  }, 'image/png');
}

// =========================================================================
// 9. RENDERIZACIÓN DE TABLAS Y GRILLAS DE LA INTERFAZ
// =========================================================================

function renderMarcasTable() {
  const tbody = document.querySelector('#marcasTable tbody');
  tbody.innerHTML = '';

  if (marcasList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--text-muted); text-align:center;">No hay marcas cargadas.</td></tr>';
    return;
  }

  marcasList.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${m.logo_url}" class="table-thumb" onerror="this.src='https://placehold.co/100x100?text=Logo'"></td>
      <td style="font-weight:bold;">${m.nombre}</td>
      <td>${new Date(m.created_at).toLocaleDateString()}</td>
      <td><button class="btn btn-danger" style="padding:4px 8px; font-size:11px;" onclick="eliminarMarca('${m.id}')">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderProductosTable() {
  const tbody = document.querySelector('#productosTable tbody');
  tbody.innerHTML = '';

  if (productosList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--text-muted); text-align:center;">No hay productos registrados en el catálogo.</td></tr>';
    return;
  }

  productosList.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${p.imagen_url}" class="table-thumb" onerror="this.src='https://placehold.co/100x100?text=Foto'"></td>
      <td style="font-weight:bold;">${p.nombre}</td>
      <td>${p.marcas ? p.marcas.nombre : '(Sin marca)'}</td>
      <td>${p.categoria}</td>
      <td><span style="color:var(--secondary); font-weight:bold;">${p.estilo}</span></td>
      <td><button class="btn btn-danger" style="padding:4px 8px; font-size:11px;" onclick="eliminarProducto('${p.id}')">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderTemplatesGrid(filter = 'todos') {
  const grid = document.getElementById('templatesGrid');
  grid.innerHTML = '';

  let filtered = diseñosList;
  if (filter !== 'todos') {
    filtered = diseñosList.filter(d => d.categoria_cartel === filter);
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted); grid-column: 1 / -1; padding: 20px 0;">No hay plantillas base cargadas para esta categoría.</p>';
    return;
  }

  filtered.forEach(d => {
    const card = document.createElement('div');
    card.className = 'template-card';
    
    // Mapear etiquetas bonitas
    const catLabels = {
      '01_marcas': 'Folleto de Marca',
      '02_gondola_producto': 'Góndola',
      '03_precio_mayorista': 'Mayorista',
      '04_variedades_mismo_precio': 'Variedades',
      '05_sin_imagen_solo_texto': 'Solo Texto',
      '06_logo_plantilla': 'Logo Fijo'
    };

    let catClass = 'cat-gondola';
    if (d.categoria_cartel === '01_marcas') catClass = 'cat-marcas';
    if (d.categoria_cartel === '03_precio_mayorista') catClass = 'cat-mayorista';

    card.innerHTML = `
      <img src="${d.imagen_url}" loading="lazy">
      <div class="meta">
        <span class="name">${d.nombre}</span>
        <span class="badge ${catClass}">${catLabels[d.categoria_cartel] || d.categoria_cartel}</span>
        <span style="font-size:10px; color:var(--text-muted); margin-top:4px;">Estilo: <b>${d.estilo}</b></span>
        <button class="btn btn-secondary" style="margin-top: 10px; padding: 6px; font-size:11px; width:100%;" onclick="abrirAnotador('${d.id}')">⚙️ Configurar Memoria</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderHistorialTable() {
  const tbody = document.querySelector('#historialTable tbody');
  tbody.innerHTML = '';

  if (historialList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted); text-align:center;">No hay carteles en el historial de impresión.</td></tr>';
    return;
  }

  historialList.forEach(h => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${h.imagen_url}" class="table-thumb" style="width:50px; height:70px; object-fit:contain; border-radius: 2px;"></td>
      <td>${new Date(h.created_at).toLocaleString()}</td>
      <td style="font-weight:bold;">${h.productos ? h.productos.nombre : '(Borrado)'}</td>
      <td style="color:var(--secondary); font-weight:bold; font-size:14px;">${h.precio}</td>
      <td>
        <a href="${h.imagen_url}" target="_blank" download class="btn btn-secondary" style="padding:4px 8px; font-size:11px; display:inline-flex;">📥 Descargar</a>
        <button class="btn btn-danger" style="padding:4px 8px; font-size:11px;" onclick="eliminarHistorial('${h.id}')">Borrar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Acciones de eliminación rápida
async function eliminarMarca(id) {
  if (!confirm("¿Seguro que querés eliminar esta marca?")) return;
  mostrarCargando(true);
  const { error } = await supabase.from('marcas').delete().eq('id', id);
  mostrarCargando(false);
  if (!error) cargarTodosLosDatos();
}

async function eliminarProducto(id) {
  if (!confirm("¿Seguro que querés eliminar este producto?")) return;
  mostrarCargando(true);
  const { error } = await supabase.from('productos').delete().eq('id', id);
  mostrarCargando(false);
  if (!error) cargarTodosLosDatos();
}

async function eliminarHistorial(id) {
  if (!confirm("¿Seguro que querés borrar este registro del historial?")) return;
  mostrarCargando(true);
  const { error } = await supabase.from('carteles_generados').delete().eq('id', id);
  mostrarCargando(false);
  if (!error) cargarTodosLosDatos();
}
