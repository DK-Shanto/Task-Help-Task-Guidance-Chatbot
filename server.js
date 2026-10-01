const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const normalize = text => String(text).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const stopwords = new Set(['how', 'do', 'i', 'a', 'an', 'the', 'to', 'can', 'is', 'are', 'what', 'me', 'my', 'please', 'with', 'in', 'of']);
const tokens = text => new Set(normalize(text).split(' ').filter(word => word && !stopwords.has(word)));
function findAnswers(question, entries) {
  const normalized = normalize(question);
  const query = tokens(question);
  if (!query.size) return [];
  return entries.map(entry => {
    const score = Math.max(...[entry.question, ...(entry.phrases || [])].map(phrase => {
      const words = tokens(phrase);
      const matches = [...words].filter(word => query.has(word)).length;
      if (!matches) return 0;
      const exact = normalize(phrase) === normalized;
      return exact ? 1 : matches / Math.max(words.size, query.size);
    }));
    return { ...entry, score };
  }).filter(entry => entry.score >= 0.6).sort((a, b) => b.score - a.score).slice(0, 3);
}
function readKnowledge() { return JSON.parse(fs.readFileSync(path.join(__dirname, 'knowledge.json'), 'utf8')); }
function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); }
const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
    }
    if (req.method === 'GET' && req.url === '/api/topics') {
      return json(res, 200, readKnowledge().map(({ id, category, question }) => ({ id, category, question })));
    }
    if (req.method === 'POST' && req.url === '/api/ask') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 16384) return json(res, 413, { error: 'Question is too long.' });
      }
      let input;
      try { input = JSON.parse(body); } catch { return json(res, 400, { error: 'Invalid request.' }); }
      if (typeof input.question !== 'string' || !input.question.trim() || input.question.length > 1000) {
        return json(res, 400, { error: 'Enter a question of up to 1,000 characters.' });
      }
      const entries = readKnowledge();
      const selected = typeof input.id === 'string' ? entries.find(entry => entry.id === input.id) : null;
      const matches = selected ? [selected] : findAnswers(input.question, entries);
      if (!matches.length) return json(res, 200, { answer: 'I couldn’t find instructions for that task. Try a different question or contact your administrator.', choices: [] });
      if (matches.length > 1 && matches[0].score - matches[1].score < 0.15) {
        return json(res, 200, { answer: 'Which task do you mean?', choices: matches.map(({ id, question }) => ({ id, question })) });
      }
      return json(res, 200, { answer: matches[0].answer, source: matches[0].question, choices: [] });
    }
    json(res, 404, { error: 'Not found.' });
  } catch { json(res, 500, { error: 'Unable to read the task guides. Please check knowledge.json.' }); }
});
if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  server.listen(port, '127.0.0.1', () => console.log(`Task chatbot: http://localhost:${port}`));
}
module.exports = { findAnswers, server };
