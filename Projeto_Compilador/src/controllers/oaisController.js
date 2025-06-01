const archiver = require("archiver");
const unzipper = require("unzipper");
const fs = require("fs-extra");
const path = require("path");

const taxonomy = require("../utils/taxonomy");
const logger = require("../utils/logger");
const { bailIf, ensureDir, computeChecksum } = require("../utils/helpers");

const SIP = require("../models/SIP");
const Resource = require("../models/Resource");

exports.handleIngest = async (req, res, next) => {
  const zipPath = req.file.path;
  const tempDir = zipPath + "_dir";

  logger.info(`Upload SIP em curso: ${req.file.originalname}`);

  // 1. Descomprimir o ZIP
  await fs
    .createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: tempDir }))
    .promise();

  // 2. Verificar e parsear manifesto
  const manifestPath = path.join(tempDir, "manifesto-SIP.json");
  bailIf(
    !(await fs.pathExists(manifestPath)),
    "manifesto-SIP.json não encontrado",
    next
  );

  const { version, payload } = await fs.readJSON(manifestPath);
  logger.info(`Versão do Manifesto: ${version}, Ficheiros: ${payload.length}`);

  // 3. Criar documento SIP
  const sipDoc = await SIP.create({
    version,
    submittedAt: new Date(),
    originalFilename: req.file.originalname,
  });
  logger.info(`Entrada SIP criada na BD: ${sipDoc._id}`);

  const resourcesCreated = [];

  for (const item of payload) {
    // 4. Validar existência do ficheiro
    const itemFilePath = path.join(tempDir, item.filename);
    bailIf(
      !(await fs.pathExists(itemFilePath)),
      `Ficheiro ${item.filename} em falta`,
      next
    );

    // 5. Validar checksum
    const checksum = await computeChecksum(itemFilePath, next);
    bailIf(
      checksum !== item.checksum,
      `Checksum inválido para ${item.filename}`,
      next
    );

    // 6. Ler metadados JSON
    const metadataSrcPath = path.join(tempDir, item.metadata);
    bailIf(
      !(await fs.pathExists(metadataSrcPath)),
      `Metadata JSON ${item.metadata} em falta`,
      next
    );
    const metadataObj = await fs.readJSON(metadataSrcPath);
    if (metadataObj.dataCriacao) {
      metadataObj.dataCriacao = new Date(metadataObj.dataCriacao);
    } else {
      metadataObj.dataCriacao = new Date();
    }
    if (metadataObj.dataSubmissao) {
      metadataObj.dataSubmissao = new Date(metadataObj.dataSubmissao);
    } else {
      metadataObj.dataSubmissao = new Date();
    }

    // 7. Preparar diretorias por tipo de recurso
    const tipoCat = metadataObj.tipo;
    const baseDir = path.join("uploads", tipoCat);
    await ensureDir(baseDir, next);

    // 8. Mover o recurso para a diretoria final
    const destFilePath = path.join(baseDir, path.basename(item.filename));
    await fs.move(itemFilePath, destFilePath, { overwrite: true });

    // 9. Criar documento do recurso na base de dados
    const resourceDoc = await Resource.create({
      sip: sipDoc._id,
      filename: item.filename,
      checksum,
      metadata: metadataObj,
      path: destFilePath,
      tipo: tipoCat,
    });
    resourcesCreated.push(resourceDoc);

    taxonomy.registerResourceTags(resourceDoc);
    logger.info(`Recurso criado: ${item.filename} (tipo: ${tipoCat})`);
  }

  // 10. Limpar ficheiros temporários
  await fs.remove(zipPath);
  await fs.remove(tempDir);

  logger.info(
    `Ingestão completa: ${resourcesCreated.length} recursos processados`
  );
  res.status(201).json({
    message: "Ingestão completa",
    sipId: sipDoc._id,
    resourcesCount: resourcesCreated.length,
  });
};

exports.handleDisseminate = async (req, res, next) => {
  const { resourceIds } = req.body; // array de IDs do MongoDB
  bailIf(
    !Array.isArray(resourceIds) || resourceIds.length === 0,
    "resourceIds deve ser um array não vazio",
    next
  );

  logger.info(`A iniciar exportação DIP para ${resourceIds.length} recursos`);

  // Fetch de recursos da base de dados
  const resources = await Resource.find({ _id: { $in: resourceIds } });
  bailIf(
    resources.length === 0,
    "Nenhum recurso encontrado para os IDs fornecidos",
    next
  );

  // Construir manifesto no formato tipo "SIP"
  const manifest = {
    version: (payloadVersion = "0.97"),
    payload: resources.map((r) => ({
      filename: r.filename,
      metadata: `metadata/${path.basename(r.filename)}.json`,
      checksum: r.checksum,
    })),
  };

  // Preparar o stream de exportação para ZIP
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="export.zip"');

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => next(err));
  archive.pipe(res);

  // 1) Adicionar o manifesto ao ZIP
  archive.append(JSON.stringify(manifest, null, 2), {
    name: "manifesto-DIP.json",
  });

  // 2) Para cada recurso: adicionar ficheiro + JSON dos metadados
  for (const r of resources) {
    const fileOnDisk = r.path;
    const metaObj = r.metadata;

    // a) Adicionar ficheiro do recurso
    archive.file(fileOnDisk, { name: r.filename });

    // b) Adicionar ficheiro de metadados na pasta metadata/
    archive.append(JSON.stringify(metaObj, null, 2), {
      name: `metadata/${path.basename(r.filename)}.json`,
    });
  }

  // Finalizar e enviar
  await archive.finalize();
  logger.info(`DIP exportado com sucesso`);
};
