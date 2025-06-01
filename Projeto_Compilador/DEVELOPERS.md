Este ficheiro explica como instalar e executar a aplicação localmente utilizando Docker. Inclui também detalhes sobre as dependências, estrutura do projeto e comandos úteis.

## Pré-requisitos

Antes de começares, garante que tens instalado:

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) + [npm](https://www.npmjs.com/)

## Estrutura do Projeto

```
Projeto_Compilador/
├── data/                    # Volume de dados para MongoDB
├── src/                     # Código da aplicação (Express, Pug, Mongoose, etc.)
│   ├── __tests__/           # Testes unitários/integrados
│   ├── controllers/         # Lógica dos controladores
│   ├── logs/                # Logs da aplicação (volume Docker)
│   ├── models/              # Modelos Mongoose
│   ├── node_modules/        # Dependências (gerado pelo npm)
│   ├── public/              # Arquivos estáticos (CSS, JS, imagens)
│   ├── routes/              # Definição de rotas Express
│   ├── tmp_sips/            # Pasta temporária (ex.: processamento de ficheiros SIP)
│   ├── uploads/             # Ficheiros submetidos pelos utilizadores (volume Docker)
│   ├── utils/               # Funções utilitárias (helpers, middlewares, etc.)
│   ├── views/               # Views Pug (templates)
│   └── .dockerignore        # Arquivos/pastas ignorados pelo Docker Build
│   └── .env                 # Variáveis de ambiente (não versionado)
│   └── .env.test            # Variáveis de ambiente para testes (não versionado)
│   └── backoffice.js        # Script de inicialização do backoffice
│   └── frontoffice.js       # Script de inicialização do frontoffice
│   └── Dockerfile           # Define o ambiente Docker
│   └── package-lock.json    # Lockfile gerado pelo npm
│   └── package.json         # Declarativo de dependências e scripts npm
├── .gitignore               # Arquivos/pastas ignorados pelo Git
├── DEVELOPERS.md            # Instruções para desenvolvedores
├── LICENSE                  # Licença do projeto
├── projeto_EW2025.pdf       # Enunciado do projeto
├── README.md                # Visão geral do projeto
├── SPECIFICATIONS.md        # Definições e especificações detalhadas do projeto
└── docker-compose.yml       # Orquestra os serviços (MongoDB, backoffice, frontoffice)
```

> NOTA: Em alguns casos, pode ser necessário criar manualmente as diretorias `tmp_sips`, `uploads` e `logs`, pois em certos ambientes, estes podem não ser criados automaticamente e resultará em erros na execução.

## Instalar e correr o projeto com Docker

### 1. Clonar o repositório

```bash
git clone <link-do-repositório>
cd <nome-do-repositorio>
```

### 2. Criar ficheiro `.env`

Dentro da pasta `src/`, cria um ficheiro `.env` com o seguinte conteúdo:

```
MONGO_URI=mongodb://mongo:27017/eu-digital
PORT=3000

ADMIN_USER=admin
ADMIN_EMAIL=admin@root.com
ADMIN_PASS=admin
```

### 3. Lançar a aplicação

```bash
npm run docker
```

Este comando:

- Cria os containers do **MongoDB** e do **backoffice (Express)**;
- Liga-os em rede;
- Monta os volumes de dados, uploads e logs;
- Inicia a app na porta `http://localhost:3000`

## Comandos úteis Docker

### Ver logs da aplicação:

```bash
docker-compose logs -f
```

### Aceder ao terminal do container do backoffice:

```bash
docker exec -it ew-backoffice-1 bash
```

> Usa `docker ps` para ver o nome exato do container em execução, caso o nome seja diferente.

Garante que tens o MongoDB a correr localmente na porta 27017 e ajusta o `MONGO_URI` no `.env` se necessário.
