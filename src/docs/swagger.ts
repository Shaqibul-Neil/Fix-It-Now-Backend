import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "./openapi";

const CDN = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14";

const customCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  /* ---- base: charcoal + subtle top glow for depth ---- */
  body, .swagger-ui {
    background: radial-gradient(1200px 600px at 50% -10%, #1b2430 0%, #0d1117 55%) fixed;
    color: #e6edf3;
    font-family: 'Inter', system-ui, sans-serif;
  }
  .swagger-ui .topbar { display: none; }
  .swagger-ui .wrapper { max-width: 1240px; padding: 0 20px; }

  /* ---- header / title — gradient wordmark ---- */
  .swagger-ui .info { margin: 40px 0; }
  .swagger-ui .info .title {
    font-size: 46px; font-weight: 800; letter-spacing: -.5px;
    background: linear-gradient(135deg,#818cf8 0%,#c084fc 50%,#22d3ee 100%);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  /* version + OAS badges — reset gradient text-fill so they stay visible */
  .swagger-ui .info .title small {
    background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
    border-radius: 8px; vertical-align: middle; box-shadow: none;
  }
  .swagger-ui .info .title small.version-stamp {
    background: linear-gradient(135deg,#6366f1,#a855f7); border: none;
  }
  .swagger-ui .info .title small pre {
    color: #f0f6fc !important; -webkit-text-fill-color: #f0f6fc;
    font-family: 'JetBrains Mono', monospace; font-weight: 600;
  }
  .swagger-ui .info p, .swagger-ui .info li,
  .swagger-ui .renderedMarkdown p, .swagger-ui .renderedMarkdown li {
    color:#c9d1d9; font-size:15px; line-height:1.7;
  }

  /* ---- inline highlight — backtick code in description ---- */
  .swagger-ui .info code, .swagger-ui .renderedMarkdown code {
    background: linear-gradient(135deg,#6366f1,#a855f7);
    color:#fff; font-weight:600; padding:2px 9px; border-radius:6px;
    font-family:'JetBrains Mono', monospace; font-size:13px;
  }

  /* ---- section (tag) headers ---- */
  .swagger-ui .opblock-tag {
    font-size:22px; font-weight:700;
    border-bottom:1px solid rgba(255,255,255,.08); padding-bottom:10px;
    transition: color .2s ease;
  }
  .swagger-ui .opblock-tag a.nostyle,
  .swagger-ui .opblock-tag a.nostyle span { color:#f0f6fc; }   /* tag name — white */
  .swagger-ui .opblock-tag small { color:#8b949e; font-weight:400; } /* desc — light gray */

  /* ---- endpoint cards — glassmorphism + soft shadow + hover lift ---- */
  .swagger-ui .opblock {
    background: rgba(22,27,34,.65);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,.07); border-radius: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,.35); margin: 0 0 14px;
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  }
  .swagger-ui .opblock:hover { transform: translateY(-2px); box-shadow: 0 14px 44px rgba(0,0,0,.5); }
  .swagger-ui .opblock.is-open { box-shadow: 0 10px 40px rgba(0,0,0,.45); }

  /* remove white focus ring / border when an endpoint is selected */
  .swagger-ui .opblock-summary-control:focus,
  .swagger-ui .opblock-summary:focus,
  .swagger-ui button:focus,
  .swagger-ui a:focus { outline: none; box-shadow: none; }

  .swagger-ui .opblock .opblock-summary { border-color: rgba(255,255,255,.06); }
  /* endpoint row text — brighter, readable */
  .swagger-ui .opblock .opblock-summary-path,
  .swagger-ui .opblock .opblock-summary-path a { color:#f0f6fc; font-weight:600; }
  .swagger-ui .opblock .opblock-summary-description { color:#c9d1d9; }
  .swagger-ui .opblock-section-header { background: rgba(13,17,23,.5); border-radius:10px; }
  .swagger-ui .opblock-section-header h4,
  .swagger-ui .opblock-title_normal, .swagger-ui .tab li,
  .swagger-ui table thead tr th, .swagger-ui .parameter__name,
  .swagger-ui .parameter__type, .swagger-ui .response-col_status,
  .swagger-ui .response-col_description { color:#c9d1d9; }

  /* expand/collapse chevron → white */
  .swagger-ui .opblock-summary-control svg.arrow,
  .swagger-ui svg.arrow { fill:#e6edf3; }

  /* ---- method labels — semantic gradients (color psychology) ---- */
  .swagger-ui .opblock .opblock-summary-method {
    border-radius:8px; font-weight:700; text-shadow:none; min-width:82px;
    box-shadow: 0 4px 12px rgba(0,0,0,.3);
  }
  .swagger-ui .opblock.opblock-get    .opblock-summary-method { background:linear-gradient(135deg,#0ea5e9,#2563eb); }
  .swagger-ui .opblock.opblock-post   .opblock-summary-method { background:linear-gradient(135deg,#22c55e,#15803d); }
  .swagger-ui .opblock.opblock-patch  .opblock-summary-method { background:linear-gradient(135deg,#f59e0b,#d97706); }
  .swagger-ui .opblock.opblock-put    .opblock-summary-method { background:linear-gradient(135deg,#a855f7,#7c3aed); }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method { background:linear-gradient(135deg,#ef4444,#b91c1c); }

  /* method-tinted card borders */
  .swagger-ui .opblock.opblock-get    { border-color: rgba(37,99,235,.35); }
  .swagger-ui .opblock.opblock-post   { border-color: rgba(21,128,61,.35); }
  .swagger-ui .opblock.opblock-patch  { border-color: rgba(217,119,6,.35); }
  .swagger-ui .opblock.opblock-put    { border-color: rgba(124,58,237,.35); }
  .swagger-ui .opblock.opblock-delete { border-color: rgba(185,28,28,.35); }

  /* ---- auth / execute buttons ---- */
  .swagger-ui .scheme-container {
    background: rgba(22,27,34,.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,.08); box-shadow: 0 8px 32px rgba(0,0,0,.3); border-radius: 14px;
  }
  .swagger-ui .btn { color:#e6edf3; border-color: rgba(255,255,255,.14); border-radius:8px; transition: all .2s ease; }
  .swagger-ui .btn.authorize { background:linear-gradient(135deg,#22c55e,#15803d); border:none; color:#fff; box-shadow:0 4px 14px rgba(34,197,94,.35); }
  .swagger-ui .btn.authorize:hover { transform: translateY(-1px); box-shadow:0 6px 20px rgba(34,197,94,.5); }
  .swagger-ui .btn.authorize svg { fill:#fff; }
  /* Execute — brand indigo→violet primary CTA (distinct from POST-green) */
  .swagger-ui .btn.execute {
    background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; color:#fff;
    box-shadow:0 4px 14px rgba(99,102,241,.4);
  }
  .swagger-ui .btn.execute:hover { transform: translateY(-1px); box-shadow:0 6px 22px rgba(99,102,241,.6); }

  /* ---- inputs, tables, models ---- */
  .swagger-ui input, .swagger-ui textarea, .swagger-ui select {
    background:#0d1117; color:#e6edf3; border:1px solid rgba(255,255,255,.14); border-radius:8px;
  }
  .swagger-ui table thead tr th, .swagger-ui table tbody tr td { border-color: rgba(255,255,255,.07); }
  .swagger-ui section.models {
    background: rgba(22,27,34,.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,.08); border-radius: 14px;
  }
  .swagger-ui section.models .model-container { background: rgba(13,17,23,.5); border-radius:10px; }
  .swagger-ui section.models .model-title, .swagger-ui .model { color:#e6edf3; }
  .swagger-ui .model-box { background:#0d1117; border-radius:10px; }

  /* schema chevrons → white; no focus border when a model is clicked */
  .swagger-ui section.models svg,
  .swagger-ui .models-control svg,
  .swagger-ui .model-box-control svg { fill:#e6edf3; }
  .swagger-ui .model-toggle { filter: brightness(0) invert(1); }   /* recolor caret bg-image → white */
  .swagger-ui .models-control:focus,
  .swagger-ui .model-box-control:focus,
  .swagger-ui .model-toggle:focus,
  .swagger-ui section.models .model-container:focus,
  .swagger-ui section.models:focus { outline:none; box-shadow:none; }

  /* ---- beautiful code blocks ---- */
  .swagger-ui .highlight-code, .swagger-ui .microlight {
    background:#0b0f14 !important; border:1px solid rgba(255,255,255,.07);
    border-radius:10px; font-family:'JetBrains Mono', monospace; font-size:12.5px;
  }

  /* premium scrollbar */
  ::-webkit-scrollbar { width:10px; height:10px; }
  ::-webkit-scrollbar-thumb { background:#30363d; border-radius:8px; }
  ::-webkit-scrollbar-thumb:hover { background:#484f58; }

  /* responsive */
  @media (max-width:600px){ .swagger-ui .info .title { font-size:32px; } }
`;

const swaggerOptions = {
  customSiteTitle: "FixItNow API Docs",
  customfavIcon: `${CDN}/favicon-32x32.png`,
  customCssUrl: `${CDN}/swagger-ui.min.css`,
  customJs: [
    `${CDN}/swagger-ui-bundle.min.js`,
    `${CDN}/swagger-ui-standalone-preset.min.js`,
  ],
  customCss,

  swaggerOptions: {
    docExpansion: "none",
    defaultModelsExpandDepth: 0, // Schemas section visible (collapsed), not hidden
    filter: false, // "Filter by tag" search box remove
    persistAuthorization: true,
    tryItOutEnabled: true,
    syntaxHighlight: { theme: "agate" },
  },
};

const router = Router();
router.use("/", swaggerUi.serve);
router.get("/", swaggerUi.setup(openapiSpec, swaggerOptions));

export const swaggerMiddleware = router;
