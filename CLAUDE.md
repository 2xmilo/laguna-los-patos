# CLAUDE.md — RedHumedal

**Leé primero [`README.md`](README.md).** Tiene la arquitectura completa, dónde se
edita cada cosa, el modelo de datos y el estado/pendientes. Este archivo solo
resalta las reglas de trabajo que no hay que olvidar.

## Contexto en una línea
Plataforma web estática (sin build) de la red de humedales de Isla Teja, Valdivia.
Frontend en `frontend/` → Vercel (rama `main`). Repo `2xmilo/laguna-los-patos`.

## Reglas críticas al trabajar aquí
- **El proyecto real es `RedHumedal/`.** La carpeta hermana `plataforma-humedales/`
  está vacía (puede ser el `cwd`); trabajá sobre `RedHumedal/frontend`.
- **Estático puro:** HTML/CSS/JS servidos con `python -m http.server 5500`. Sin
  bundlers ni `package.json`.
- **Anti-caché:** al editar un CSS/JS compartido, **subí su `?v=` en todas las
  páginas** que lo referencian (`suave.css?v=mN`, `config.js?v=N`, `avatar.js?v=N`,
  `nav.js?v=4`, `juego-especies.js?v=N`). Si no, el celular sirve la versión vieja.
- **Diseño:** `css/suave.css` (tema "Suave", Nunito) se carga después de
  `style.css` y lo sobreescribe.
- **Biología honesta:** el avatar habla en 1ª persona solo si su especie está en
  `especies` del humedal; nunca nombrar especies que no están en el sitio.
- **Panos 360°:** ubicación/orientación se hornean en `humedales.json` vía
  `scripts/panos_geo.py` (GPS→`centro`, GimbalYaw→`norte`). No se lee EXIF en runtime.
- **Flujo:** el usuario revisa en el **celular** por Vercel → **commit + push
  después de cada tanda**. Mensajes de commit en español.
- Atribución de commits: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
