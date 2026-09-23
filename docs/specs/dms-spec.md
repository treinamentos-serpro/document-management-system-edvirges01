# Especificação - Document Management System

> Especificação funcional e técnica do MVP do Document Management System (DMS).
> Este documento orienta a implementação incremental sem alterar as restrições
> de arquitetura e armazenamento definidas para o projeto.

## 1. Objetivo

Entregar um sistema web que permita a um usuário enviar, consultar e baixar seus documentos, mantendo os arquivos no filesystem local e seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos pertencentes ao usuário atual.
- Download de um documento pertencente ao usuário atual pelo identificador lógico.
- Gestão simples por usuário, sem autenticação completa.
- Geração de identificador único para cada documento.
- Validação de presença do arquivo e de limite máximo configurável.
- Tratamento consistente de erros HTTP.
- Interface React mínima para upload, listagem e download.
- Testes automatizados do backend e dos fluxos principais.

### Fora do escopo

- Armazenamento externo, em nuvem, banco de dados ou serviço de terceiros.
- Persistência dos metadados após o reinício do processo.
- Versionamento, edição, exclusão ou renomeação de documentos.
- Compartilhamento entre usuários.
- Cadastro, login, sessão, JWT ou qualquer mecanismo completo de autenticação.
- Busca textual, classificação, pastas ou tags.
- Preview ou processamento do conteúdo dos arquivos.
- Allowlist obrigatória de extensões ou validação profunda do conteúdo binário.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um documento por meio de `multipart/form-data` no campo `file`. |
| RF-02 | O sistema deve rejeitar requisições de upload sem arquivo com status `400`. |
| RF-03 | O sistema deve rejeitar arquivos maiores que o limite configurado com status `413`. |
| RF-04 | O sistema deve gravar o conteúdo recebido em `backend/storage` usando `multer` com `diskStorage`. |
| RF-05 | O sistema deve gerar um `id` único, preferencialmente UUID, sem usar o nome original como identificador ou caminho físico. |
| RF-06 | O sistema deve registrar os metadados do documento em uma coleção mantida em memória. |
| RF-07 | O sistema deve associar cada documento ao usuário definido pela configuração do processo. |
| RF-08 | O upload deve responder com os metadados do documento criado, sem expor o caminho físico do arquivo. |
| RF-09 | O sistema deve listar somente os documentos do usuário atual em `GET /documents`. |
| RF-10 | A listagem deve retornar uma coleção vazia, com status `200`, quando o usuário não possuir documentos. |
| RF-11 | O sistema deve permitir o download somente de um documento existente e pertencente ao usuário atual. |
| RF-12 | O download deve retornar o conteúdo binário e um nome de arquivo derivado de `originalName`. |
| RF-13 | O sistema deve evitar revelar se um identificador existe para outro usuário; nesses casos, o download deve responder `404`. |
| RF-14 | Após o reinício do processo, os metadados em memória devem ser descartados e os documentos anteriormente registrados não devem ser considerados disponíveis pela API. |
| RF-15 | O cliente React deve consumir a API por `fetch` usando o prefixo `/api` e permitir os fluxos de upload, listagem e download. |
| RF-16 | Erros previsíveis devem usar o formato JSON padronizado definido na seção de contratos. |

### Identidade do usuário no MVP

O MVP não implementa autenticação. O usuário atual deve ser obtido de uma variável de ambiente, denominada `DMS_OWNER_ID`, carregada na inicialização do backend. O valor deve ser não vazio e receber validação antes de as rotas de documentos serem usadas. Uma configuração ausente ou inválida deve impedir a operação das rotas protegidas e resultar em erro de configuração do servidor, sem aceitar um `owner` enviado pelo cliente.

O cliente não pode escolher ou sobrescrever o proprietário por campo multipart, query string ou corpo JSON. A substituição futura dessa estratégia por middleware de autenticação deve preservar o contrato interno que fornece um `owner` confiável aos serviços.

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados exclusivamente no filesystem local da aplicação, no diretório `backend/storage`. |
| RNF-02 | O upload deve usar `multer.diskStorage`; não devem ser usados provedores externos, armazenamento em memória como destino final ou serviços de upload de terceiros. |
| RNF-03 | Os metadados devem permanecer em memória nesta fase e não devem depender de banco de dados. |
| RNF-04 | `PORT`, `DMS_OWNER_ID`, `MAX_FILE_SIZE_BYTES` e o caminho de storage devem ser configuráveis por variáveis de ambiente, com defaults documentados quando aplicável. |
| RNF-05 | O limite padrão de upload deve ser `10 MiB` (`10485760` bytes) quando `MAX_FILE_SIZE_BYTES` não estiver definido; valores ausentes, não numéricos ou menores que zero devem ser rejeitados na inicialização. |
| RNF-06 | O nome original deve ser preservado apenas como metadado e como nome sugerido no download; nunca deve controlar diretamente o caminho físico. |
| RNF-07 | O identificador recebido na rota deve ser validado e resolvido somente contra metadados pertencentes ao usuário atual, evitando path traversal e acesso arbitrário ao filesystem. |
| RNF-08 | O backend deve usar CommonJS, Express e as camadas `routes`, `controllers`, `services` e `repositories`. |
| RNF-09 | O frontend deve usar React com componentes funcionais, Hooks e módulos ESM, mantendo a organização em `components`, `pages` e `services`. |
| RNF-10 | Os testes do backend devem usar o runner nativo `node:test` e cobrir sucesso, validação, autorização e falhas de persistência. |
| RNF-11 | Mensagens retornadas ao usuário devem estar em português; nomes de símbolos devem permanecer em inglês. |
| RNF-12 | O sistema deve manter respostas determinísticas e não deve expor stack traces, caminhos absolutos ou detalhes internos de filesystem em produção. |

## 5. Modelo de dados (metadados do documento)

Cada upload bem-sucedido cria um registro em memória com a seguinte forma lógica:

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | `string` | Sim | Identificador único, gerado pelo servidor, preferencialmente UUID. |
| `originalName` | `string` | Sim | Nome original informado pelo cliente, normalizado para exibição segura. |
| `size` | `number` | Sim | Tamanho do arquivo em bytes. Deve ser maior que zero, salvo se uma regra futura permitir arquivos vazios. |
| `uploadedAt` | `string` | Sim | Data e hora do upload em formato ISO 8601 UTC. |
| `owner` | `string` | Sim | Identificador carregado de `DMS_OWNER_ID`; nunca vem do corpo da requisição. |
| `mimeType` | `string` | Sim | Tipo MIME informado pelo upload, aceitando valores genéricos como `application/octet-stream`. |
| `storageName` | `string` | Sim | Nome físico gerado pelo servidor para localizar o arquivo em `backend/storage`; não é exposto na API pública. |

O repositório de metadados deve manter a associação entre `id` e `storageName`. O cliente conhece apenas `id`, `originalName`, `size`, `uploadedAt`, `owner` e `mimeType`; o caminho físico deve permanecer um detalhe interno do repositório.

Os arquivos podem continuar no diretório local depois de um reinício, mas, como os metadados são voláteis, não haverá referência válida para listá-los ou baixá-los. A implementação deve documentar ou tratar a limpeza desses órfãos, sem introduzir persistência externa.

## 6. Contratos de API

### Convenção de erro

Toda falha HTTP prevista deve retornar JSON no formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

`code` deve ser estável para o cliente e `message` deve ser legível em português. Erros inesperados devem usar `500` e um código genérico, sem stack trace ou caminho físico.

### POST /upload

Envia um documento para o usuário configurado.

**Entrada**

- Content-Type: `multipart/form-data`.
- Campo obrigatório: `file`.
- O cliente pode fornecer o nome original e o MIME por meio do mecanismo padrão do multipart, mas não pode fornecer `id`, `owner`, `uploadedAt` ou `storageName`.

**Sucesso**

- Status: `201 Created`.
- Corpo: objeto de metadados públicos do documento criado, sem `storageName`.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-09-23T12:00:00.000Z",
  "owner": "usuario-demo",
  "mimeType": "application/pdf"
}
```

**Erros**

| Status | Código | Situação |
| --- | --- | --- |
| `400` | `FILE_REQUIRED` | O campo `file` não foi enviado ou não contém um arquivo válido. |
| `413` | `FILE_TOO_LARGE` | O arquivo excede `MAX_FILE_SIZE_BYTES`. |
| `500` | `STORAGE_ERROR` | Falha ao gravar o arquivo ou registrar os metadados. |
| `503` | `OWNER_NOT_CONFIGURED` | O backend não possui um `DMS_OWNER_ID` válido. |

Se o registro de metadados falhar depois da gravação física, a implementação deve tentar remover o arquivo recém-gravado antes de responder o erro.

### GET /documents

Lista os documentos associados ao usuário configurado.

**Entrada**

- Não recebe `owner` por query string ou corpo.
- O usuário é obtido do contexto de configuração do backend.

**Sucesso**

- Status: `200 OK`.
- Corpo:

```json
{
  "documents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-09-23T12:00:00.000Z",
      "owner": "usuario-demo",
      "mimeType": "application/pdf"
    }
  ]
}
```

Quando não houver documentos, a resposta deve ser `200` com `{"documents": []}`. A ordenação padrão deve ser do mais recente para o mais antigo, usando `uploadedAt`.

**Erros**

- `503 OWNER_NOT_CONFIGURED` quando não houver identidade configurada.
- `500 INTERNAL_ERROR` para falhas inesperadas do repositório.

### GET /documents/:id/download

Baixa o conteúdo binário de um documento do usuário configurado.

**Entrada**

- Parâmetro de rota obrigatório: `id`.
- O `id` deve ser resolvido no repositório de metadados, nunca convertido diretamente em caminho de filesystem.

**Sucesso**

- Status: `200 OK`.
- Corpo: conteúdo binário do arquivo.
- `Content-Type`: `mimeType` registrado, com fallback para `application/octet-stream`.
- `Content-Disposition`: anexo com nome seguro derivado de `originalName`.

**Erros**

| Status | Código | Situação |
| --- | --- | --- |
| `400` | `INVALID_DOCUMENT_ID` | O identificador possui formato inválido. |
| `404` | `DOCUMENT_NOT_FOUND` | O documento não existe, não pertence ao usuário atual ou não possui arquivo acessível. |
| `503` | `OWNER_NOT_CONFIGURED` | O backend não possui um `DMS_OWNER_ID` válido. |
| `500` | `STORAGE_ERROR` | Falha inesperada ao ler o arquivo. |

O mesmo `404` deve ser usado para documento inexistente e documento de outro usuário, evitando vazamento de existência.

### Compatibilidade com o frontend

Durante o desenvolvimento, o frontend chama `/api/upload`, `/api/documents` e `/api/documents/:id/download`. O proxy do Vite remove o prefixo `/api` e encaminha as chamadas ao backend. Em produção, a estratégia de publicação deve manter esses caminhos ou fornecer uma configuração equivalente.

## 7. Decisões arquiteturais

### Backend

O backend seguirá uma Clean Architecture simples, com dependências apontando para dentro:

```text
routes -> controllers -> services -> repositories
```

- `routes/`: registra os caminhos Express, middlewares do `multer` e encaminha a requisição para controllers.
- `controllers/`: lê entrada HTTP, acessa o usuário configurado, chama os serviços e transforma resultados em status, headers e JSON.
- `services/`: concentra as regras de negócio: validação, associação ao owner, geração de ID, autorização e coordenação do upload/download.
- `repositories/`: abstrai a coleção de metadados em memória e o acesso ao arquivo local; não deve conhecer detalhes de HTTP.
- `app.js`: configura Express, middlewares gerais, rotas e `/health`; não deve concentrar regras de negócio.

O middleware do `multer` deve gravar em `backend/storage` usando `diskStorage`, com nome físico controlado pelo servidor. O controller não deve construir caminhos a partir de valores recebidos do cliente.

### Frontend

O frontend usará React + Vite, componentes funcionais e Hooks. A comunicação ficará concentrada em `services/`, enquanto páginas e componentes cuidarão da apresentação e interação. A tela principal deve permitir selecionar um arquivo, enviar o upload, atualizar a listagem e iniciar o download por `id`, exibindo mensagens para estados de carregamento, vazio e erro.

### Configuração e persistência

As configurações devem seguir o princípio 12-Factor e ser obtidas de variáveis de ambiente. O sistema não deve adicionar banco de dados, storage remoto ou dependência de sessão para cumprir o escopo do MVP.

## 8. Plano de execução

1. **Configuração e storage local**: definir variáveis de ambiente, defaults, criação/validação de `backend/storage` e configuração do `multer.diskStorage`.
2. **Repositórios**: implementar o repositório de metadados em memória e o adaptador de arquivos locais, mantendo separado o `id` lógico do `storageName` físico.
3. **Serviços de negócio**: implementar upload, listagem filtrada por owner e download autorizado, incluindo geração de ID, validações e compensação em caso de falha.
4. **Controllers e rotas**: registrar os três endpoints, mapear entradas e respostas HTTP, padronizar erros e preservar o endpoint `/health`.
5. **Testes do backend**: ampliar o `node:test` com casos de upload, limite, ausência de arquivo, listagem vazia, isolamento por owner, download e falhas do filesystem.
6. **Serviços e componentes frontend**: criar funções `fetch`, página principal e componentes para upload, listagem, estados de carregamento/erro e download.
7. **Integração frontend/backend**: validar o proxy `/api`, o fluxo completo no ambiente local e a apresentação dos erros definidos nos contratos.
8. **Documentação e critérios de aceite**: atualizar instruções de execução, variáveis de ambiente, comportamento após reinício e limites conhecidos do armazenamento em memória.

Nenhuma etapa acima implica persistência externa ou autenticação completa. A implementação deve permanecer compatível com CommonJS no backend, ESM/React no frontend e o runner nativo `node:test`.

## 9. Critérios de aceite

- Um upload válido retorna `201`, grava o arquivo em `backend/storage` e retorna metadados sem caminho físico.
- Upload sem arquivo ou acima do limite retorna o erro padronizado correspondente.
- `GET /documents` retorna somente registros do `DMS_OWNER_ID` atual e retorna coleção vazia quando aplicável.
- Download por `id` retorna o binário correto e headers compatíveis com o tipo e nome do arquivo.
- Documento de outro usuário e documento inexistente produzem a mesma resposta `404`.
- Nenhum cliente consegue escolher `owner`, `storageName` ou caminho físico.
- Reiniciar o processo descarta os metadados e impede acesso aos registros anteriores pela API.
- O backend mantém a separação `routes -> controllers -> services -> repositories`.
- O frontend usa o prefixo `/api` e não acessa o filesystem diretamente.
- Testes automatizados cobrem os fluxos principais e as falhas previstas sem depender de serviços externos.