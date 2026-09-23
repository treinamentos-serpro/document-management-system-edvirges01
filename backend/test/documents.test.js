// Define o owner exigido pelo backend antes de carregar o app (config/env lê 1x na inicialização).
process.env.DMS_OWNER_ID = 'usuario-teste';

const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

// Sobe o servidor Express em uma porta aleatória para os testes end-to-end.
function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

test('fluxo de upload, listagem e download de documentos', async (t) => {
  const server = await startServer();
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  let uploadedId;
  const conteudoArquivo = 'conteudo de teste';

  await t.test('POST /upload envia um documento', async () => {
    const form = new FormData();
    form.append('file', new Blob([conteudoArquivo], { type: 'text/plain' }), 'teste.txt');

    const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });

    assert.strictEqual(response.status, 201);
    const body = await response.json();
    assert.ok(body.id, 'deve retornar um id gerado');
    assert.strictEqual(body.originalName, 'teste.txt');
    assert.strictEqual(body.owner, 'usuario-teste');
    uploadedId = body.id;
  });

  await t.test('POST /upload sem arquivo retorna 400', async () => {
    const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: new FormData() });
    assert.strictEqual(response.status, 400);
    const body = await response.json();
    assert.strictEqual(body.error.code, 'FILE_REQUIRED');
  });

  await t.test('GET /documents lista os documentos enviados', async () => {
    const response = await fetch(`${baseUrl}/documents`);
    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.ok(Array.isArray(body.documents));
    assert.ok(body.documents.some((document) => document.id === uploadedId));
  });

  await t.test('GET /documents/:id/download baixa o arquivo enviado', async () => {
    const response = await fetch(`${baseUrl}/documents/${uploadedId}/download`);
    assert.strictEqual(response.status, 200);
    const texto = await response.text();
    assert.strictEqual(texto, conteudoArquivo);
  });

  await t.test('GET /documents/:id/download retorna 400 para id em formato inválido', async () => {
    const response = await fetch(`${baseUrl}/documents/id-invalido/download`);
    assert.strictEqual(response.status, 400);
  });

  await t.test('GET /documents/:id/download retorna 404 para id inexistente', async () => {
    const response = await fetch(`${baseUrl}/documents/00000000-0000-0000-0000-000000000000/download`);
    assert.strictEqual(response.status, 404);
  });
});
