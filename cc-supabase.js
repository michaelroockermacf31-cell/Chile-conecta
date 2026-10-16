/* Chile Conecta - conexión a Supabase
   Requiere en el HTML, antes de este script:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
   y un contenedor: <div id="chile-conecta-feed"></div> */
(function () {
  'use strict';

  /* ---- CONFIGURACIÓN (ajusta aquí si tus columnas se llaman distinto) ---- */
  const SUPABASE_URL = 'https://hpghighabbuldsnnqkbn.supabase.co';
   
  const SUPABASE_KEY = 'sb_publishable_QmPh1XPv2vPWBQPS_ml1cQ_PqOha-n5';
  const COL = {
    tabla: 'anuncios',
    titulo: 'titulo',
    descripcion: 'descripcion',
    whatsapp: 'whatsapp',
    activo: 'activo',          // columna que marca el anuncio visible
    fecha: 'created_at'
  };
  const REP = { tabla: 'reportes', anuncioId: 'anuncio_id', motivo: 'motivo' };

  /* ---- utilidades ---- */
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const root = document.getElementById('chile-conecta-feed');
  if (!root) { console.error('Falta <div id="chile-conecta-feed">'); return; }

  function el(tag, text, cls) {
    const e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  function waLink(n) {
    let d = String(n || '').replace(/\D/g, '');
    if (d.length === 9) d = '56' + d;           // celular chileno sin prefijo
    return d.length >= 10 ? 'https://wa.me/' + d : null;
  }
  function yaReporto(id) {
    try { return (JSON.parse(localStorage.getItem('cc-rep') || '[]')).includes(id); } catch (e) { return false; }
  }
  function marcarReporto(id) {
    try {
      const l = JSON.parse(localStorage.getItem('cc-rep') || '[]'); l.push(id);
      localStorage.setItem('cc-rep', JSON.stringify(l));
    } catch (e) {}
  }
  function aviso(msg) { estado.textContent = msg; setTimeout(() => { if (estado.textContent === msg) estado.textContent = ''; }, 5000); }

  /* ---- estilos mínimos (heredan colores, sirven en modo claro y oscuro) ---- */
  const st = document.createElement('style');
  st.textContent =
    '.cc-card{border:1px solid rgba(128,128,128,.4);border-radius:10px;padding:12px;margin:10px 0}' +
    '.cc-card p{margin:6px 0 10px;white-space:pre-wrap}' +
    '.cc-btn{display:inline-block;min-height:44px;line-height:44px;padding:0 14px;margin:0 8px 6px 0;border:1.5px solid currentColor;border-radius:8px;background:transparent;color:inherit;font:600 15px inherit;text-decoration:none;cursor:pointer}' +
    '#chile-conecta-feed input,#chile-conecta-feed textarea{display:block;width:100%;box-sizing:border-box;min-height:44px;margin:6px 0;padding:8px;font:16px inherit;color:inherit;background:transparent;border:1.5px solid rgba(128,128,128,.6);border-radius:8px}';
  document.head.appendChild(st);

  /* ---- formulario de publicar ---- */
  const form = el('div', null, 'cc-card');
  form.appendChild(el('b', 'Publicar anuncio'));
  const iTitulo = el('input'); iTitulo.placeholder = 'Título (ej: Maestro gasfíter)'; iTitulo.maxLength = 80;
  const iDesc = el('textarea'); iDesc.placeholder = 'Descripción, comuna y precio referencial'; iDesc.rows = 3; iDesc.maxLength = 500;
  const iWa = el('input'); iWa.placeholder = 'WhatsApp (ej: 9 1234 5678)'; iWa.inputMode = 'tel'; iWa.maxLength = 16;
  const bPub = el('button', 'Publicar', 'cc-btn');
  const estado = el('p', '');
  [iTitulo, iDesc, iWa, bPub, estado].forEach(x => form.appendChild(x));
  const feed = el('div');
  root.appendChild(form);
  root.appendChild(feed);

  /* ---- publicar ---- */
  bPub.onclick = async function () {
    const titulo = iTitulo.value.trim(), desc = iDesc.value.trim(), wa = iWa.value.trim();
    if (titulo.length < 4) return aviso('Escribe un título (mínimo 4 letras).');
    if (desc.length < 10) return aviso('Escribe una descripción (mínimo 10 letras).');
    if (!waLink(wa)) return aviso('Ingresa un WhatsApp válido.');
    bPub.disabled = true;
    const fila = {};
    fila[COL.titulo] = titulo; fila[COL.descripcion] = desc; fila[COL.whatsapp] = wa; fila[COL.activo] = true;
    const { error } = await db.from(COL.tabla).insert(fila);
    bPub.disabled = false;
    if (error) return aviso('No se pudo publicar: ' + error.message);
    iTitulo.value = ''; iDesc.value = ''; iWa.value = '';
    aviso('Anuncio publicado.');
    cargar();
  };

  /* ---- reportar ---- */
  async function reportar(id, btn) {
    if (yaReporto(id)) return aviso('Ya reportaste este anuncio.');
    const motivo = (prompt('¿Por qué reportas este anuncio?') || '').trim();
    if (!motivo) return;
    btn.disabled = true;
    const fila = {}; fila[REP.anuncioId] = id; fila[REP.motivo] = motivo.slice(0, 300);
    const { error } = await db.from(REP.tabla).insert(fila);
    if (error) { btn.disabled = false; return aviso('No se pudo reportar: ' + error.message); }
    marcarReporto(id);
    btn.textContent = 'Reportado';
    aviso('Gracias, revisaremos el anuncio.');
  }

  /* ---- tarjeta de anuncio ---- */
  function tarjeta(a) {
    const c = el('div', null, 'cc-card');
    c.appendChild(el('b', a[COL.titulo]));
    c.appendChild(el('p', a[COL.descripcion]));
    const link = waLink(a[COL.whatsapp]);
    if (link) {
      const w = el('a', 'Contactar por WhatsApp', 'cc-btn');
      w.href = link + '?text=' + encodeURIComponent('Hola, vi tu anuncio "' + a[COL.titulo] + '" en Chile Conecta');
      w.target = '_blank'; w.rel = 'noopener';
      c.appendChild(w);
    }
    const r = el('button', yaReporto(a.id) ? 'Reportado' : 'Reportar', 'cc-btn');
    r.onclick = () => reportar(a.id, r);
    c.appendChild(r);
    return c;
  }

  /* ---- leer anuncios activos (más recientes primero) ---- */
  async function cargar() {
    feed.textContent = 'Cargando...';
    const { data, error } = await db.from(COL.tabla).select('*')
      .eq(COL.activo, true).order(COL.fecha, { ascending: false }).limit(50);
    if (error) { feed.textContent = 'No se pudo cargar: ' + error.message; return; }
    feed.textContent = '';
    if (!data.length) { feed.textContent = 'Aún no hay anuncios. Sé el primero en publicar.'; return; }
    data.forEach(a => feed.appendChild(tarjeta(a)));
  }

  cargar();
})();
