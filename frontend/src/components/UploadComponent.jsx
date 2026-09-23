import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentsApi';

export default function UploadComponent({ onUploaded }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  function handleFileChange(event) {
    setSelectedFile(event.target.files?.[0] ?? null);
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      const document = await uploadDocument(selectedFile);
      setSelectedFile(null);
      inputRef.current.value = '';
      onUploaded(document);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="panel upload-panel" aria-labelledby="upload-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Novo arquivo</span>
          <h2 id="upload-title">Adicionar documento</h2>
        </div>
        <span className="upload-mark" aria-hidden="true">+</span>
      </div>
      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="file-picker">
          <span className="file-picker-title">Escolha um arquivo</span>
          <span className="file-picker-name">
            {selectedFile?.name ?? 'PDF, imagem ou outro documento'}
          </span>
          <input
            ref={inputRef}
            type="file"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
        <button className="primary-button" type="submit" disabled={isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar documento'}
        </button>
      </form>
      {error && <p className="error-message" role="alert">{error}</p>}
    </section>
  );
}
