# Leitor Imersivo de PDF

Leitor de PDF moderno, rápido, imersivo e totalmente local, desenvolvido com React, TypeScript, Vite, Zustand, PDF.js e IndexedDB.

O projeto foi pensado para funcionar como uma biblioteca pessoal de leitura: o PDF original permanece imutável e todos os dados derivados — progresso, favoritos, notas, destaques, preferências e metadados editáveis — são armazenados separadamente.

## Princípios do projeto

- processamento dos PDFs no próprio dispositivo;
- nenhuma dependência de servidor para a biblioteca pessoal;
- PDF original preservado;
- funcionamento offline após o aplicativo ser carregado;
- arquitetura separada por responsabilidades;
- persistência local no IndexedDB;
- interface responsiva para desktop, tablet e celular.

## Funcionalidades

### Biblioteca

- importação de um ou vários PDFs;
- importação por botão ou arrastar e soltar;
- validação técnica dos arquivos;
- prevenção de duplicidades;
- geração automática de capas;
- extração de metadados;
- edição local de título e autor;
- busca por título, autor ou nome do arquivo;
- filtros por status de leitura;
- ordenação da biblioteca;
- visualização em grade ou lista;
- persistência do modo de visualização escolhido;
- progresso de leitura visível nos cards;
- exclusão segura de documentos;
- backup completo da biblioteca;
- restauração de backup.

### Leitor

- renderização com PDF.js;
- página única;
- página dupla;
- rolagem contínua;
- navegação entre páginas;
- miniaturas;
- sumário/outline do documento;
- busca textual dentro do PDF;
- destaque dos resultados de busca;
- zoom manual;
- ajuste à largura;
- ajuste à página;
- rotação;
- modo imersivo;
- atalhos de teclado;
- ocultação automática dos controles;
- carregamento progressivo de páginas;
- cache LRU de páginas;
- pré-carregamento adaptativo conforme a direção de leitura.

### Progresso de leitura

- salvamento automático da página atual;
- salvamento da posição dentro da página;
- restauração automática ao reabrir o documento;
- atualização durante a rolagem contínua;
- gravação protegida contra operações desnecessárias.

### Favoritos, notas e destaques

- favoritos por página;
- navegação direta para favoritos;
- notas vinculadas ao documento;
- destaques de texto;
- exclusão de anotações e favoritos;
- persistência independente do PDF original.

### Offline e instalação

O projeto possui suporte a PWA.

O build de produção gera um Service Worker versionado que mantém o shell do aplicativo disponível offline.

Quando o navegador oferecer suporte, o aplicativo também pode ser instalado como PWA e aberto em uma janela própria.

A instalação PWA continua sendo gerenciada pelo navegador. Ela não equivale a um instalador nativo de Windows como um arquivo `.exe`.

### Proteção do armazenamento local

A tela de Configurações consulta as APIs de armazenamento do navegador para:

- exibir o espaço local utilizado;
- exibir a quota estimada disponível;
- informar se o armazenamento persistente foi concedido;
- permitir solicitar armazenamento persistente quando suportado.

Armazenamento persistente reduz o risco de remoção automática por pressão de espaço, mas não impede que o próprio usuário limpe os dados do navegador.

## Privacidade

Os PDFs e os dados pessoais da biblioteca permanecem no dispositivo.

O aplicativo não precisa enviar os documentos para um servidor externo para realizar leitura, busca, geração de capa, progresso ou anotações.

Os dados locais podem incluir:

- PDF original;
- metadados do livro;
- capa gerada;
- progresso de leitura;
- favoritos;
- notas;
- destaques;
- preferências do leitor.

## Onde os dados ficam

A biblioteca é armazenada no IndexedDB do navegador utilizado.

Isso significa que os dados ficam vinculados ao navegador, ao perfil e à origem do aplicativo.

Eles podem ser perdidos caso o usuário, por exemplo:

- limpe os dados do site;
- remova manualmente o armazenamento do navegador;
- use navegação anônima;
- troque de navegador ou perfil sem restaurar um backup;
- remova o perfil do navegador.

Por isso, o recurso de backup deve ser usado para cópias de segurança importantes.

## Tecnologias

- React 19.2.7
- TypeScript 5.9.3
- Vite 7.3.6
- Zustand 5.0.14
- pdfjs-dist 5.4.624
- IndexedDB
- Vitest 4.1.10
- ESLint 9.39.1
- fflate 0.8.3

## Requisitos de desenvolvimento

O projeto está configurado para:

- Node.js 24.18.0
- npm 11.16.0

## Instalação do projeto

Na raiz do projeto:

```powershell
npm install
```

Para iniciar o ambiente de desenvolvimento:

```powershell
npm run dev
```

## Validação

As validações principais do projeto são:

```powershell
npm run typecheck
npm run lint
npm run build
```

Para executar a suíte completa de testes:

```powershell
npm run test -- --run
```

## Build de produção

```powershell
npm run build
```

Além do build do Vite, esse comando gera o Service Worker offline versionado.

Para testar a versão de produção localmente:

```powershell
npm run preview
```

Abra o endereço exibido pelo Vite no terminal.

O teste de PWA, instalação e funcionamento offline deve ser feito usando o build de produção/preview, não apenas o servidor de desenvolvimento.

## Arquitetura

A aplicação é organizada por responsabilidade, com áreas dedicadas a:

- `app`: configuração, rotas e composição da aplicação;
- `components`: componentes reutilizáveis;
- `controllers`: casos de uso e coordenação de operações;
- `features`: funcionalidades de biblioteca, importação e leitura;
- `models`: entidades, DTOs, enums e value objects;
- `pages`: composição das telas;
- `repositories`: persistência e acesso aos dados;
- `services`: PDF, arquivos, metadados, backup, offline e armazenamento;
- `stores`: estado global Zustand, slices e seletores;
- `styles`: estilos e fundamentos visuais;
- `utils`: utilitários independentes.

## Filosofia de dados

O PDF é tratado como documento original e imutável.

Alterações feitas dentro do leitor não modificam os bytes do PDF. Progresso, notas, destaques, favoritos, capas e outras informações derivadas são mantidos separadamente.

Essa separação permite evoluir o leitor sem comprometer o documento original.

## Estado atual

O projeto já possui biblioteca local, leitura de PDF, busca, miniaturas, sumário, progresso automático, favoritos, notas, destaques, backup, funcionamento offline, instalação PWA, proteção de armazenamento e otimizações de memória/carregamento.

O desenvolvimento continua orientado a estabilidade, desempenho, privacidade e experiência de leitura.
