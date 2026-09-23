// Repositório de metadados dos documentos, mantidos em memória (RNF-03).
// Os registros não sobrevivem ao reinício do processo.

const documentsById = new Map();

function create(document) {
  documentsById.set(document.id, document);
  return document;
}

function listByOwner(owner) {
  return Array.from(documentsById.values())
    .filter((document) => document.owner === owner)
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

function findByIdAndOwner(id, owner) {
  const document = documentsById.get(id);
  if (!document || document.owner !== owner) {
    return undefined;
  }
  return document;
}

function remove(id) {
  documentsById.delete(id);
}

module.exports = {
  create,
  listByOwner,
  findByIdAndOwner,
  remove,
};
