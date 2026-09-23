import { useCallback, useEffect, useState } from 'react';
import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { fetchDocuments } from './services/documentsApi';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setDocuments(await fetchDocuments());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  function handleUploaded(document) {
    setDocuments((currentDocuments) => [document, ...currentDocuments]);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand"><span className="brand-mark" aria-hidden="true">D</span> DMS</div>
        <span className="status-chip">Espaço pessoal</span>
      </header>
      <main>
        <section className="hero" aria-labelledby="page-title">
          <span className="eyebrow">Document Management System</span>
          <h1 id="page-title">Tudo que importa, em um só lugar.</h1>
          <p className="hero-copy">Envie seus documentos, acompanhe seu acervo e baixe os arquivos quando precisar.</p>
        </section>
        <div className="workspace">
          <UploadComponent onUploaded={handleUploaded} />
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            error={error}
            onRetry={loadDocuments}
          />
        </div>
      </main>
    </div>
  );
}
