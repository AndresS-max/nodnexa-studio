"use client";

import { FormEvent, useMemo, useState } from "react";

type Result = { hook: string; angle: string; structure: string[]; script: string };
const EXAMPLE = "La mayoría intenta publicar todos los días y termina agotada. El problema no es la frecuencia, sino empezar sin un sistema. Define tres temas, convierte cada tema en una serie y mide cuál genera conversaciones. Guarda este video y prueba el sistema durante una semana.";
const STOP = new Set("para como pero esta este esto desde entre sobre porque donde cuando todos todas una uno unos unas del las los que con por sin sus son más muy hay ser fue han al el la y o en tu te se no si".split(" "));

function keywords(text: string) {
  const words = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-zñáéíóúü]{4,}/g) ?? [];
  const count = new Map<string, number>();
  words.filter((word) => !STOP.has(word)).forEach((word) => count.set(word, (count.get(word) ?? 0) + 1));
  return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([word]) => word);
}

function createResult(reference: string, brand: string, audience: string, tone: string, objective: string): Result {
  const points = reference.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean).slice(0, 3);
  const topic = keywords(reference)[0] || "tu contenido";
  const brandName = brand || "tu marca";
  const audienceName = audience || "equipos que crean contenido";
  const toneLead = tone === "Directo" ? "Sin rodeos:" : tone === "Cercano" ? "Hablemos claro:" : tone === "Experto" ? "Hay un patrón que conviene entender:" : "Una idea para empezar:";
  const cta = objective === "Vender" ? `Si quieres aplicarlo con ${brandName}, escríbenos “GUION”.` : objective === "Educar" ? "Guárdalo y úsalo como checklist en tu próxima pieza." : objective === "Conversar" ? "¿Qué cambiarías tú? Te leo en los comentarios." : `Sigue a ${brandName} para ver el siguiente ejemplo.`;
  const body = points.map((point, index) => `${index + 1}. ${point.replace(/[.!?]+$/, "")}.`).join("\n");
  return {
    hook: `${toneLead} ${audienceName} no necesita más ideas sobre ${topic}; necesita convertirlas en una decisión clara.`,
    angle: `Traducir la referencia a un consejo práctico de ${brandName}, sin copiar sus frases.`,
    structure: ["Interrupción de patrón", "Problema reconocible", "3 ideas aplicables", "CTA único"],
    script: `${toneLead} ${audienceName} no necesita más ideas sobre ${topic}; necesita un sistema para usarlas.\n\n${body || "1. Parte de un problema concreto.\n2. Explica una sola idea.\n3. Cierra con una acción simple."}\n\nLa diferencia está en adaptar el patrón a la voz de ${brandName}, no en repetir la referencia.\n\n${cta}`,
  };
}

function sessionId() {
  const key = "nodnexa-session";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID(); localStorage.setItem(key, value); return value;
}

async function track(name: string) {
  try { await fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, sessionId: sessionId() }) }); } catch { /* never block product */ }
}

export function Studio() {
  const [brand, setBrand] = useState(""); const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("Cercano"); const [objective, setObjective] = useState("Educar");
  const [reference, setReference] = useState(""); const [result, setResult] = useState<Result | null>(null);
  const [feedback, setFeedback] = useState(""); const [email, setEmail] = useState(""); const [feedbackStatus, setFeedbackStatus] = useState("");
  const ready = reference.trim().length >= 80;
  const count = useMemo(() => reference.trim().split(/\s+/).filter(Boolean).length, [reference]);

  function generate(event: FormEvent) { event.preventDefault(); if (!ready) return; setResult(createResult(reference, brand, audience, tone, objective)); void track("workflow_completed"); }
  async function submitFeedback(event: FormEvent) {
    event.preventDefault(); if (feedback.trim().length < 8) return; setFeedbackStatus("Enviando…");
    try {
      const response = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: feedback, email, sessionId: sessionId() }) });
      if (!response.ok) throw new Error(); setFeedback(""); setEmail(""); setFeedbackStatus("Gracias. Tu comentario ya forma parte de la decisión del producto.");
    } catch { setFeedbackStatus("No pudimos guardarlo. Intenta de nuevo en un momento."); }
  }

  return <main>
    <nav className="shell topbar"><div className="logo"><span className="logo-mark">N</span>NodNexa <span style={{fontWeight:500}}>Studio</span></div><div className="status">MVP público</div></nav>
    <section className="shell hero"><div><p className="eyebrow">Para agencias y equipos de contenido</p><h1>De referencia a guion, con <em>voz de marca.</em></h1></div><p className="hero-copy">Pega el texto de un Reel, TikTok o Short. Obtén una estructura y un primer guion original que puedes editar hoy mismo.</p></section>
    <section className="shell workbench" id="probar">
      <div className="workbench-head"><div className="step-label"><span>1</span> Prueba el flujo completo</div><div className="privacy">Tu referencia se procesa en este navegador</div></div>
      <div className="workspace">
        <form className="panel" onSubmit={generate}>
          <h2 className="panel-title">Contexto mínimo</h2><p className="panel-sub">No necesitas crear una cuenta. Define la marca y pega una referencia.</p>
          <div className="fields">
            <div className="field"><label htmlFor="brand">Marca</label><input id="brand" value={brand} onChange={(e)=>setBrand(e.target.value)} placeholder="Ej. Café Aurora" /></div>
            <div className="field"><label htmlFor="audience">Audiencia</label><input id="audience" value={audience} onChange={(e)=>setAudience(e.target.value)} placeholder="Ej. dueños de cafeterías" /></div>
            <div className="field"><label htmlFor="tone">Tono</label><select id="tone" value={tone} onChange={(e)=>setTone(e.target.value)}><option>Cercano</option><option>Directo</option><option>Experto</option><option>Inspirador</option></select></div>
            <div className="field"><label htmlFor="objective">Objetivo</label><select id="objective" value={objective} onChange={(e)=>setObjective(e.target.value)}><option>Educar</option><option>Vender</option><option>Conversar</option><option>Crecer</option></select></div>
            <div className="field full"><label htmlFor="reference">Texto de la referencia</label><textarea id="reference" value={reference} onFocus={()=>void track("workflow_started")} onChange={(e)=>setReference(e.target.value)} placeholder="Pega aquí una transcripción, caption o idea. Mínimo 80 caracteres." /></div>
          </div>
          <div className="counter">{count} palabras · mínimo 80 caracteres</div><button className="primary" disabled={!ready}>Crear mi primer guion <span>→</span></button><button type="button" className="example" onClick={()=>setReference(EXAMPLE)}>Usar una referencia de ejemplo</button>
        </form>
        <div className="panel" aria-live="polite">
          <h2 className="panel-title">Resultado editable</h2><p className="panel-sub">Usamos el patrón de la referencia; nunca sus frases como plantilla literal.</p>
          {!result ? <div className="empty"><div><div className="empty-icon">✦</div><strong>Tu guion aparecerá aquí</strong><p>Completa la referencia y crea la primera versión.</p></div></div> : <div className="result">
            <div className="result-card"><p className="result-kicker">Gancho propuesto</p><p>{result.hook}</p></div>
            <div className="result-card"><p className="result-kicker">Ángulo original</p><p>{result.angle}</p></div>
            <div className="chips">{result.structure.map((item)=><span className="chip" key={item}>{item}</span>)}</div>
            <div className="result-card"><p className="result-kicker">Guion — primera versión</p><p className="script">{result.script}</p></div>
            <div className="result-actions"><button className="secondary" onClick={()=>navigator.clipboard.writeText(result.script)}>Copiar guion</button><button className="secondary" onClick={()=>document.querySelector("#feedback")?.scrollIntoView()}>Decir qué falta</button></div>
          </div>}
        </div>
      </div>
    </section>
    <section className="shell feedback" id="feedback">
      <div><p className="eyebrow">Construido en público</p><h2>Tu objeción vale más que un “me gusta”.</h2><p>Estamos decidiendo qué automatizar después: extracción por URL, memoria por marca o aprobación de clientes. Cuéntanos qué impediría que usaras esto con trabajo real.</p></div>
      <form className="feedback-form" onSubmit={submitFeedback}><div className="field"><label htmlFor="comment">¿Qué falta, sobra o no funciona?</label><textarea id="comment" value={feedback} onChange={(e)=>setFeedback(e.target.value)} placeholder="Ej. Necesito guardar varias marcas y compartir el guion con mi cliente…" /></div><div className="field"><label htmlFor="email">Correo (opcional, solo para invitarte al piloto)</label><input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="tu@agencia.com" /></div><button className="primary" disabled={feedback.trim().length<8}>Enviar comentario</button>{feedbackStatus&&<p className="message">{feedbackStatus}</p>}</form>
    </section>
    <footer className="shell"><span>© 2026 NodNexa Studio</span><span>MVP experimental · Sin contenido de terceros almacenado</span></footer>
  </main>;
}
