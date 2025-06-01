## Projeto: Eu Digital — Engenharia Web 2025

Este documento serve de guia para os programadores envolvidos no desenvolvimento da aplicação. Descreve os tipos de ficheiros suportados, a definição dos metadados e a estrutura do manifesto (SIP) com base na norma BagIt.

## Tipos de Ficheiros Suportados

A aplicação deverá aceitar os seguintes tipos de ficheiros, divididos por categoria:

### Imagem

- `.jpg`, `.jpeg`
- `.png`
- `.gif`

### Documento

- `.txt`
- `.md` (Markdown)
- `.pdf`

### Dados

- `.csv`
- `.json`

### Áudio

- `.mp3`
- `.wav`

### Vídeo

- `.mp4`
- `.webm`

### Outro

Qualquer outro tipo de dados desconhecido ou não suportado cai nesta categoria.

## Taxonomia

Para garantir coerência na categorização dos recursos, é utilizado um vocabulário controlado (taxonomia). Esta estrutura pode ser usada para filtrar, agrupar e navegar os conteúdos da aplicação.

```json
{
  "Pessoal": {
    "Fotografia": [],
    "Pensamento": [],
    "Crónica": []
  },
  "Atividades": {
    "Evento": {
      "Jantar de Aniversário": [],
      "Participação em Evento": []
    },
    "Desporto": {
      "Passeio de Bicicleta": [],
      "Treino de Natação": [],
      "Corrida": [],
      "Registo Desportivo": []
    },
    "Viagem": []
  },
  "Académico": {
    "Resultado Académico": [],
    "Comentário Web": []
  }
}
```

### Exemplo de representação num recurso:

```json
{
  "tituloRecurso": "Foto do jantar",
  "tags": ["Pessoal/Fotografia", "Atividades/Evento/Jantar de Aniversário"]
}
```

> Um recurso pode conter **mais do que um classificador** dentro da hierarquia, desde que faça sentido semanticamente.

## Metadados

Todos os ficheiros submetidos devem ser acompanhados de metadados que descrevam o recurso. Estes metadados serão armazenados na base de dados MongoDB e utilizados para facilitar a pesquisa e categorização.

### Campos de Metadados Obrigatórios

| Campo           | Descrição                                                                |
| --------------- | ------------------------------------------------------------------------ |
| `dataCriacao`   | Data em que o conteúdo foi criado                                        |
| `dataSubmissao` | Data em que o ficheiro foi submetido à aplicação                         |
| `produtor`      | Identificação de quem criou o conteúdo                                   |
| `publicador`    | Identificação de quem submeteu o ficheiro                                |
| `titulo`        | Título ou descrição breve do recurso                                     |
| `tipo`          | Tipo do recurso (ver [Tipos Suportados](#tipos-de-ficheiros-suportados)) |
| `tags`          | Lista de palavras-chave (ver [Taxonomia](#taxonomia))                    |

## Estrutura do Manifesto SIP (`manifesto-SIP.json`)

O manifesto é um ficheiro JSON incluído dentro do ficheiro `.zip` enviado pelo produtor. Ele define:

- A versão do BagIt utilizada
- Os ficheiros submetidos (payload)
- Os respetivos checksums

### Exemplo de `manifesto-SIP.json`

```json
{
  "version": "0.97",
  "payload": [
    {
      "filename": "fotos/foto_aniversario.jpg",
      "metadata": "metadata/foto_aniversario.json",
      "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "filename": "documentos/registo_evento.pdf",
      "metadata": "metadata/registo_evento.pdf",
      "checksum": "1a2b3c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef"
    }
  ]
}
```

### Requisitos do Processo de Ingestão

Ao receber o `.zip`, o backend deve:

1. Verificar se o `manifesto-SIP.json` está presente.
2. Validar se todos os ficheiros listados no manifesto existem dentro do ZIP.
3. Calcular e validar checksums dos ficheiros.
4. Guardar os metadados na base de dados MongoDB.
5. Armazenar os ficheiros fisicamente na pasta `uploads/`.

## Considerações Técnicas

- A pasta `uploads/` deverá ser montada como volume Docker.
- Os caminhos relativos dos ficheiros no manifesto devem coincidir com a estrutura do ZIP.
- A integridade dos ficheiros será verificada via checksums (SHA-256 recomendado).
- O manifesto será o único ponto de entrada com metainformação — não devem ser inferidos dados a partir dos ficheiros diretamente.

---

Este documento deverá ser seguido para garantir a uniformidade e integridade dos dados durante a submissão, ingestão e gestão dos conteúdos na aplicação _Eu Digital_.
