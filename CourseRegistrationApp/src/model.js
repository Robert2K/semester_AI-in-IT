// GOTOWE — nie zmieniaj. Wysyła prompt do Claude (klucz z .env) albo do Ollamy (model lokalny z lekcji 8).
import Anthropic from '@anthropic-ai/sdk';

export const MODEL = process.env.MODEL || 'claude-haiku-5-5';

export async function zapytajModel({ system, user }) {
  if (process.env.OLLAMA_MODEL) return zapytajOllame({ system, user });
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Brak klucza. Skopiuj .env.przyklad jako .env i wklej klucz kursu (albo ustaw OLLAMA_MODEL).');
  }
  const client = new Anthropic({
    defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
      ? { 'anthropic-workspace-id': process.env.ANTHROPIC_WORKSPACE_ID }
      : undefined,
  });
  const odpowiedz = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: 'low' },
    system,
    messages: [{ role: 'user', content: user }],
  });
  if (odpowiedz.stop_reason === 'refusal') return 'Model odmówił odpowiedzi.';
  return odpowiedz.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
}

async function zapytajOllame({ system, user }) {
  const r = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL, stream: false, think: false,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  if (!r.ok) throw new Error('Ollama: ' + r.status + ' ' + (await r.text()));
  return (await r.json()).message.content.trim();
}
