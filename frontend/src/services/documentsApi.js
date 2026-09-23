// Cliente HTTP do DMS: concentra as chamadas fetch e o tratamento de erros da API.

const API_BASE_URL = '/api';

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function parseErrorResponse(response) {
  try {
    const body = await response.json();
    if (body?.error?.code) {
      return new ApiError(body.error.code, body.error.message, response.status);
    }
  } catch {
    // resposta sem corpo JSON válido
  }
  return new ApiError(
    'UNKNOWN_ERROR',
    'Ocorreu um erro inesperado ao comunicar com o servidor.',
    response.status,
  );
}

function extractFileName(contentDisposition, fallbackName) {
  const match = contentDisposition?.match(/filename="?([^"]+)"?/);
  return match ? match[1] : fallbackName;
}

export async function fetchDocuments() {
  const response = await fetch(`${API_BASE_URL}/documents`);
  if (!response.ok) {
    throw await parseErrorResponse(response);
  }
  const data = await response.json();
  return data.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

export async function downloadDocument(id, fallbackName) {
  const response = await fetch(`${API_BASE_URL}/documents/${id}/download`);

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const blob = await response.blob();
  const fileName = extractFileName(response.headers.get('Content-Disposition'), fallbackName);
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
