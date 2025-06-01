# Eu Digital — Engenharia Web 2025

Projeto final da unidade curricular de **Engenharia Web** (Licenciatura em Engenharia Informática, Universidade do Minho).

A aplicação "Eu Digital" representa uma plataforma pessoal de registo e preservação de conteúdos digitais ao longo do tempo, funcionando como um diário digital com base cronológica e classificadores.

## Objetivo

Desenvolver uma aplicação Web que permita ao utilizador:

- Submeter e organizar conteúdos digitais com base cronológica
- Classificar os conteúdos segundo uma taxonomia controlada
- Consultar, filtrar e exportar os seus recursos
- Administrar os seus dados, utilizadores e estatísticas
- Integrar diferentes tipos de ficheiros e metadados

## Tecnologias Usadas

- **Node.js** + **Express** – Backend
- **MongoDB** + **Mongoose** – Base de dados
- **Pug** – Motor de templates para HTML
- **Docker** + **Docker Compose** – Containerização e orquestração
- **Multer** – Upload de ficheiros
- **Unzipper/Archiver** - Gestão de ficheiros ZIP
- **Winston** - Logger
- **dotenv** – Configuração por ambiente
- **HTML/CSS/JS** – Frontend e interface

## Funcionalidades Principais

- Upload de ficheiros (imagens, documentos, vídeos, áudio, etc.)
- Atribuição de metadados e classificadores aos conteúdos
- Organização cronológica por linha temporal
- Filtros por tipo de recurso, tags, datas e taxonomias
- Sistema de autenticação para acesso administrativo
- Estatísticas e gestão de utilizadores
- Exportação de conteúdos em pacotes ZIP (DIP)

## Como correr o projeto

Consulta o [DEVELOPERS.md](./DEVELOPERS.md) para instruções detalhadas de instalação, setup do `.env`, comandos úteis e alternativas sem Docker.
Depois, basta executar:

```bash
npm run docker
```

> A app ficará acessível em: [http://localhost:3000](http://localhost:3000)

> O backoffice ficará exposto em `http://localhost:3001`

## Equipa

- A100612 - José Rodrigo Ferreira Matos
- A100551 - Diogo Miguel Torres Moreira de Oliveira Pinto
- A100756 - Mariana Miguel Leão Barros Oliveira Pinto
