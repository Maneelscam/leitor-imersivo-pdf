# Leitor Imersivo de PDF

Aplicação web local para organização e leitura imersiva de documentos PDF.

O projeto foi desenvolvido com foco em privacidade, funcionamento offline, boa experiência de leitura e uma arquitetura preparada para evolução. Os PDFs são processados diretamente no navegador e não são enviados para servidores externos.

## Visão geral

O Leitor Imersivo de PDF permite:

- importar documentos PDF;
- organizar uma biblioteca local;
- gerar capas automaticamente;
- abrir e renderizar documentos com PDF.js;
- continuar a leitura de onde parou;
- criar favoritos por página;
- utilizar página única ou página dupla;
- ler com rolagem contínua;
- ajustar zoom e rotação;
- personalizar o comportamento do leitor;
- manter os dados armazenados localmente no navegador.

O arquivo PDF original permanece preservado. Informações derivadas, como capa, progresso, favoritos e configurações, são armazenadas separadamente.

---

## Principais funcionalidades

### Biblioteca local

- Importação de arquivos PDF.
- Validação técnica antes do armazenamento.
- Identificação de documentos duplicados.
- Extração de metadados.
- Resolução automática do título.
- Geração de capa baseada na primeira página.
- Ordenação da biblioteca.
- Exclusão segura de documentos.
- Persistência no IndexedDB.

### Leitor de PDF

- Renderização com PDF.js.
- Navegação entre páginas.
- Página única.
- Página dupla.
- Rolagem contínua progressiva.
- Carregamento de páginas em pequenos lotes.
- Zoom manual.
- Ajuste à largura.
- Ajuste à página.
- Rotação em intervalos de 90 graus.
- Atalhos de teclado.
- Ocultação automática dos controles.
- Painel lateral de leitura.

### Progresso de leitura

- Salvamento da página atual.
- Salvamento da posição dentro da página.
- Restauração automática ao reabrir o documento.
- Atualização de progresso durante a rolagem contínua.
- Salvamento antes de fechar ou trocar de documento.

### Favoritos

- Criação de favorito na posição atual.
- Listagem dos favoritos do documento.
- Navegação direta até o favorito.
- Exclusão de favoritos.
- Persistência separada por livro.

### Configurações

- Modo de exibição:
  - página única;
  - página dupla.

- Fluxo de leitura:
  - paginado;
  - rolagem contínua.

- Zoom inicial:
  - personalizado;
  - ajustar à largura;
  - ajustar à página.

- Atalhos de teclado.
- Ocultação automática dos controles.
- Persistência das preferências no IndexedDB.
- Restauração das configurações padrão.

---

## Privacidade e armazenamento

Todo o processamento principal ocorre localmente no navegador.

A aplicação não necessita de:

- cadastro de usuário;
- autenticação;
- servidor externo;
- banco de dados remoto;
- envio de documentos para terceiros;
- conexão permanente com a internet.

Os dados são armazenados no IndexedDB do navegador, incluindo:

- arquivo PDF original;
- informações do livro;
- capa gerada;
- progresso de leitura;
- favoritos;
- configurações do leitor.

### Atenção

Os dados pertencem ao navegador e ao perfil utilizado.

Eles podem ser removidos caso o usuário:

- limpe os dados do navegador;
- apague o armazenamento do site;
- utilize navegação anônima;
- troque de navegador;
- troque de perfil do navegador;
- desinstale o navegador sem preservar os dados.

---

## Tecnologias

### Interface

- React 19.2.7
- TypeScript 5.9.3
- Vite 7.3.6

### Estado

- Zustand 5.0.14

### PDF

- PDF.js
- pdfjs-dist 5.4.624

### Persistência

- IndexedDB nativo do navegador

### Qualidade

- ESLint
- TypeScript Build Mode
- Vite Build

---

## Requisitos

Ambiente utilizado durante o desenvolvimento:

- Node.js 24.18.0
- npm 11.16.0

Recomenda-se utilizar essas versões ou versões compatíveis.

Também é necessário um navegador moderno com suporte a:

- IndexedDB;
- Canvas;
- Web Workers;
- ResizeObserver;
- IntersectionObserver;
- APIs modernas do DOM.

---

## Instalação

Clone ou copie o projeto para sua máquina.

No terminal, acesse a pasta do projeto:

```powershell
cd caminho\para\LeitorImersivoPDF
src/
├── app/
│   ├── config/
│   ├── providers/
│   └── routes/
│
├── components/
│   ├── buttons/
│   ├── feedback/
│   ├── forms/
│   └── layout/
│
├── controllers/
│   ├── bookmarks/
│   ├── library/
│   ├── reader/
│   └── settings/
│
├── errors/
│   ├── library/
│   └── reader/
│
├── features/
│   ├── library/
│   ├── reader/
│   └── settings/
│
├── models/
│   ├── dtos/
│   ├── entities/
│   ├── enums/
│   └── value-objects/
│
├── pages/
│   ├── library/
│   ├── reader/
│   └── settings/
│
├── repositories/
│   └── indexed-db/
│
├── services/
│   ├── cover/
│   ├── database/
│   ├── file/
│   ├── metadata/
│   ├── pdf/
│   └── settings/
│
├── stores/
│   ├── selectors/
│   └── slices/
│
├── styles/
│   ├── components/
│   ├── foundations/
│   └── global/
│
└── utils/