/* Chile Conecta - anuncios de empresas (solo lectura)
   Lee la tabla "anuncios" de Supabase: empresa, titulo, texto, imagen_url, desde.
   La política de Supabase ya filtra: solo se ven los activos y dentro de sus fechas. */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://hpghighabbuldsnnqkbn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_QmPh1XPv2vPWBQPS_ml1cQ_PqOha-n5';

  const root = document.getElementById('chile-conecta-feed');
  if (!root || !window.supabase) { console.error('Falta el contenedor o la librería de Supabase'); return; }
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  function el(tag, text, style) {
    const e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (style) e.style.cssText = style;
    return e;
  }

  const box = el('div', null, 'margin:16px 0;padding:12px;');
  const titulo = el('h2', 'Anuncios de empresas', 'margin:0 0 8px');
  const lista = el('div');
  box.appendChild(titulo);
  box.appendChild(lista);
  root.appendChild(box);

  function tarjeta(a) {
    const c = el('div', null, 'border:1px solid rgba(128,128,128,.4);border-radius:10px;padding:12px;margin:10px 0');
    c.appendChild(el('div', a.empresa, 'font-size:13px;opacity:.7;margin-bottom:4px'));
    c.appendChild(el('b', a.titulo));
    if (a.texto) c.appendChild(el('p', a.texto, 'margin:6px 0;white-space:pre-wrap'));
    if (a.imagen_url && /^https:\/\//.test(a.imagen_url)) {
      const img = el('img', null, 'max-width:100%;border-radius:8px;margin-top:6px');
      img.src = a.imagen_url; img.alt = a.titulo; img.loading = 'lazy';
      c.appendChild(img);
    }
    return c;
  }

  async function cargar() {
    lista.textContent = 'Cargando...';
    const { data, error } = await db.from('anuncios')
      .select('id,empresa,titulo,texto,imagen_url,desde')
      .eq('activo', true)
      .order('desde', { ascending: false })
      .limit(50);
    if (error) { lista.textContent = 'No se pudo cargar: ' + error.message; return; }
    lista.textContent = '';
    if (!data.length) { lista.textContent = 'Por ahora no hay anuncios de empresas.'; return; }
    data.forEach(a => lista.appendChild(tarjeta(a)));
  }

  cargar();
})();
