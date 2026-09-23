import DownloadButton from './DownloadButton';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function DocumentList({ documents, isLoading, error, onRetry }) {
  return (
    <section className="panel documents-panel" aria-labelledby="documents-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Seu acervo</span>
          <h2 id="documents-title">Documentos recentes</h2>
        </div>
        <span className="document-count">{documents.length}</span>
      </div>

      {isLoading && <p className="state-message">Carregando documentos...</p>}
      {!isLoading && error && (
        <div className="state-message error-state" role="alert">
          <p>{error}</p>
          <button className="text-button" type="button" onClick={onRetry}>Tentar novamente</button>
        </div>
      )}
      {!isLoading && !error && documents.length === 0 && (
        <p className="state-message">Nenhum documento enviado ainda.</p>
      )}
      {!isLoading && !error && documents.length > 0 && (
        <ul className="document-list">
          {documents.map((document) => (
            <li className="document-row" key={document.id}>
              <div className="document-icon" aria-hidden="true">DOC</div>
              <div className="document-details">
                <strong>{document.originalName}</strong>
                <span>{formatFileSize(document.size)} · {formatDate(document.uploadedAt)}</span>
              </div>
              <DownloadButton document={document} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
