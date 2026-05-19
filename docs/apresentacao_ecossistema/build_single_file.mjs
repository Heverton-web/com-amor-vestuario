import fs from 'fs';
import path from 'path';

const DOCS_DIR = 'docs/apresentacao_ecossistema';
const SLIDES_DIR = path.join(DOCS_DIR, 'slides');
const TOKENS_PATH = path.join(DOCS_DIR, 'shared', 'tokens.css');
const LOGO_PATH = path.join(DOCS_DIR, 'shared', 'logo-com-amor.png');
const OUTPUT_PATH = path.join('docs', 'apresentacao_ecossistema.html');

console.log('Iniciando compilação robusta do Single-File da Apresentação...');

// 1. Obter e converter imagem do logotipo para Base64
if (!fs.existsSync(LOGO_PATH)) {
  console.error(`Erro: Logotipo não encontrado em ${LOGO_PATH}`);
  process.exit(1);
}
const logoBase64 = fs.readFileSync(LOGO_PATH).toString('base64');
const logoDataUri = `data:image/png;base64,${logoBase64}`;

// 2. Ler tokens de design globais
if (!fs.existsSync(TOKENS_PATH)) {
  console.error(`Erro: Arquivo tokens.css não encontrado em ${TOKENS_PATH}`);
  process.exit(1);
}
let tokensCss = fs.readFileSync(TOKENS_PATH, 'utf-8');

// 3. Manifesto dos slides (em ordem)
const slidesManifest = [
  { file: '01-capa.html', label: 'Apresentação' },
  { file: '02-problema.html', label: 'O Desafio do Varejo' },
  { file: '03-arquitetura.html', label: 'A Solução Unificada' },
  { file: '04-vendas.html', label: 'Módulo Vendas & Checkout' },
  { file: '05-fidelidade.html', label: 'Módulo Clube & Recompensas' },
  { file: '06-crm.html', label: 'CRM & Inteligência de Marketing' },
  { file: '07-financeiro.html', label: 'Módulo Financeiro & Fiscal' },
  { file: '08-automacao.html', label: 'Automação & APIs (n8n)' },
  { file: '09-valores.html', label: 'Custo Oculto vs Unificação' },
  { file: '09b-comparativo.html', label: 'Análise de Alternativas' },
  { file: '09c-personalizacao.html', label: 'Personalização do Ecossistema' },
  { file: '09d-combos.html', label: 'Combos Sugeridos' },
  { file: '10-fechamento.html', label: 'Conclusão' }
];

let slidesSectionHtml = '';

// 4. Processar cada slide individual
slidesManifest.forEach((slide, index) => {
  const slidePath = path.join(SLIDES_DIR, slide.file);
  if (!fs.existsSync(slidePath)) {
    console.error(`Erro: Slide ${slide.file} não encontrado.`);
    process.exit(1);
  }

  let htmlContent = fs.readFileSync(slidePath, 'utf-8');

  // Injetar os tokens CSS diretamente dentro de cada slide
  const tokensStyleBlock = `<style>\n${tokensCss}\n</style>`;
  htmlContent = htmlContent.replace(/<link rel="stylesheet" href="\.\.\/shared\/tokens\.css">/g, tokensStyleBlock);

  // Substituir a imagem local do logo pela versão embutida em Base64
  htmlContent = htmlContent.replace(/src="\.\.\/shared\/logo-com-amor\.png"/g, `src="${logoDataUri}"`);

  // Substituir a numeração estática de rodapé pela numeração dinâmica de acordo com a posição real no manifesto
  const pageNumStr = String(index + 1).padStart(2, '0');
  const totalNumStr = String(slidesManifest.length).padStart(2, '0');
  htmlContent = htmlContent.replace(/<span>\d{2}[a-z]?\s*\/\s*\d{2}<\/span>/g, `<span>${pageNumStr} / ${totalNumStr}</span>`);

  // Converter o HTML completo do slide para Base64
  const slideBase64 = Buffer.from(htmlContent, 'utf-8').toString('base64');
  const slideDataUri = `data:text/html;charset=utf-8;base64,${slideBase64}`;

  // Montar a seção agregadora que contém o iframe isolado
  slidesSectionHtml += `
  <section class="slide-section ${index === 0 ? 'active' : ''}" id="slide-${index + 1}" data-label="${slide.label}">
    <iframe src="${slideDataUri}" class="slide-iframe"></iframe>
  </section>\n`;
});

// 5. CSS do Agregador
const hostCss = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  height: 100%;
  background: #11100F;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
#stage {
  position: fixed;
  top: 50%; left: 50%;
  transform-origin: top left;
  will-change: transform;
  background: oklch(0.972 0.018 80);
  box-shadow: 0 20px 80px rgba(0,0,0,0.6);
  overflow: hidden;
}
.slide-section {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: none;
}
.slide-section.active {
  display: block;
}
.slide-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  display: block;
}
.counter {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: rgba(28, 27, 26, 0.85);
  color: #F7F5F0;
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 14px;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
  z-index: 100;
  user-select: none;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(247, 245, 240, 0.1);
}
.counter .label { 
  color: rgba(247, 245, 240, 0.6); 
  margin-left: 8px; 
  font-weight: 500;
}
.nav-zone {
  position: fixed;
  top: 0; bottom: 0;
  width: 10%;
  cursor: pointer;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}
.nav-zone.left  { left: 0; }
.nav-zone.right { right: 0; }
.nav-hint {
  width: 48px; height: 48px;
  border-radius: 999px;
  background: rgba(247, 245, 240, 0.05);
  color: rgba(247, 245, 240, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  opacity: 0;
  transition: all 0.25s ease;
  border: 1px solid rgba(247, 245, 240, 0.05);
}
.nav-zone:hover .nav-hint { 
  opacity: 1; 
  background: rgba(247, 245, 240, 0.1);
  color: rgba(247, 245, 240, 0.8);
  transform: scale(1.05);
}
.nav-zone.left:hover .nav-hint { transform: translateX(4px) scale(1.05); }
.nav-zone.right:hover .nav-hint { transform: translateX(-4px) scale(1.05); }

.instructions-tip {
  position: fixed;
  bottom: 24px;
  left: 24px;
  font-size: 12px;
  color: rgba(247, 245, 240, 0.4);
  z-index: 100;
  pointer-events: none;
  letter-spacing: 0.05em;
}

/* Impressão PDF */
@media print {
  @page { size: 1920px 1080px; margin: 0; }
  html, body { background: #fff; overflow: visible; height: auto; }
  #stage { position: static; transform: none !important; box-shadow: none; width: auto !important; height: auto !important; }
  .counter, .nav-zone, .instructions-tip { display: none !important; }
  .slide-section {
    position: relative !important;
    display: block !important;
    width: 1920px !important;
    height: 1080px !important;
    page-break-after: always;
  }
}
`;

// 6. Template HTML5 Final
const finalHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Ecossistema Com Amor · Apresentação Comercial</title>
<style>
${hostCss}
</style>
</head>
<body>

<div id="stage">
  ${slidesSectionHtml}
</div>

<div class="nav-zone left"  id="navL"><div class="nav-hint">‹</div></div>
<div class="nav-zone right" id="navR"><div class="nav-hint">›</div></div>
<div class="counter" id="counter">1 / 1</div>
<div class="instructions-tip">Use as setas ← → ou Espaço para navegar. P para imprimir PDF.</div>

<script>
(function () {
  const W = 1920;
  const H = 1080;
  const stage = document.getElementById('stage');
  const slides = Array.from(document.querySelectorAll('.slide-section'));
  const counter = document.getElementById('counter');
  const storageKey = 'deck-comamor-single-file';
  let current = 0;

  stage.style.width  = W + 'px';
  stage.style.height = H + 'px';

  function fit() {
    if (window.matchMedia('print').matches) return;
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    const x = (window.innerWidth  - W * s) / 2;
    const y = (window.innerHeight - H * s) / 2;
    stage.style.transform = \`translate(\${x}px, \${y}px) scale(\${s})\`;
    stage.style.top = '0';
    stage.style.left = '0';
  }

  function show(idx) {
    if (idx < 0 || idx >= slides.length) return;
    slides[current].classList.remove('active');
    current = idx;
    slides[current].classList.add('active');
    
    const label = slides[current].getAttribute('data-label') || '';
    counter.innerHTML = \`\${idx + 1} / \${slides.length} <span class="label">\${label}</span>\`;
    
    try { localStorage.setItem(storageKey, String(idx)); } catch (_) {}
    if (location.hash !== '#' + (idx + 1)) {
      history.replaceState(null, '', '#' + (idx + 1));
    }
  }

  function next() { show(Math.min(current + 1, slides.length - 1)); }
  function prev() { show(Math.max(current - 1, 0)); }

  // Navegação Teclado
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.key) {
      case 'ArrowRight': case ' ': case 'PageDown': e.preventDefault(); next(); break;
      case 'ArrowLeft':  case 'PageUp':              e.preventDefault(); prev(); break;
      case 'Home':                                    e.preventDefault(); show(0); break;
      case 'End':                                     e.preventDefault(); show(slides.length - 1); break;
      case 'p': case 'P':                             window.print(); break;
      default:
        if (e.key >= '1' && e.key <= '9') {
          const i = parseInt(e.key, 10) - 1;
          if (i < slides.length) { e.preventDefault(); show(i); }
        }
    }
  });

  document.getElementById('navL').addEventListener('click', prev);
  document.getElementById('navR').addEventListener('click', next);
  window.addEventListener('resize', fit);
  
  window.addEventListener('hashchange', () => {
    const m = location.hash.match(/^#(\\d+)$/);
    if (m) show(parseInt(m[1], 10) - 1);
  });

  // Restaurar estado inicial
  const hashMatch = location.hash.match(/^#(\\d+)$/);
  if (hashMatch) {
    current = Math.min(parseInt(hashMatch[1], 10) - 1, slides.length - 1);
  } else {
    try {
      const v = parseInt(localStorage.getItem(storageKey), 10);
      if (!isNaN(v) && v >= 0 && v < slides.length) current = v;
    } catch (_) {}
  }
  
  fit();
  show(current);
})();
</script>

</body>
</html>`;

// 7. Salvar arquivo unificado
fs.writeFileSync(OUTPUT_PATH, finalHtml, 'utf-8');
console.log(`Sucesso! Apresentação Single-File robusta gerada em: ${OUTPUT_PATH}`);
