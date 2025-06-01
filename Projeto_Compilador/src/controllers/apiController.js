const bcrypt = require("bcryptjs");
const fs = require("fs-extra");
const path = require("path");

const logger = require("../utils/logger");
const { bailIf } = require("../utils/helpers");

const Resource = require("../models/Resource");
const News = require("../models/News");
const User = require("../models/User");
const statsService = require("../utils/stats");
const taxonomy = require("../utils/taxonomy");

const oaisController = require("./oaisController");

module.exports = {
  //
  // === ADMIN: UTILIZADORES ===
  //
  listUsers: async (req, res, next) => {
    try {
      const users = await User.find().lean();
      res.json(users);
    } catch (err) {
      next(err);
    }
  },

  createUser: async (req, res, next) => {
    try {
      const data = req.body;

      // Hash the password
      if (data.password) {
        data.passwordHash = await bcrypt.hash(data.password, 12);
        delete data.password; // remove plain password from body
      }

      const user = await User.create(data);
      logger.info(`Utilizador criado: ${user._id}`);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  },

  updateUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = req.body;

      // hash password
      if (data.password) {
        data.passwordHash = await bcrypt.hash(data.password, 12);
      }
      delete data.password; // remove raw password

      const user = await User.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      }).lean();
      bailIf(!user, "Utilizador não encontrado", next);
      logger.info(`Utilizador atualizado: ${id}`);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await User.findByIdAndDelete(id);
      bailIf(!user, "Utilizador não encontrado", next);
      logger.info(`Utilizador eliminado: ${id}`);
      res.json({ message: "Utilizador eliminado" });
    } catch (err) {
      next(err);
    }
  },

  //
  // === ADMIN: RECURSOS (AIPs) ===
  //
  listResources: async (req, res, next) => {
    try {
      const resources = await Resource.find().lean();
      res.json(resources);
    } catch (err) {
      next(err);
    }
  },

  createResource: async (req, res, next) => {
    // Chama o controlador de ingestão SIP
    return oaisController.handleIngest(req, res, next);
  },

  updateResource: async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const r = await Resource.findByIdAndUpdate(id, data, { new: true });
      bailIf(!r, "Recurso não encontrado", next);
      logger.info(`Recurso atualizado: ${id}`);
      res.json(r);
    } catch (err) {
      next(err);
    }
  },

  deleteResource: async (req, res, next) => {
    try {
      const { id } = req.params;
      const r = await Resource.findById(id);
      bailIf(!r, "Recurso não encontrado", next);

      // Remover ficheiro do filesystem
      await fs.remove(path.resolve(r.path));
      logger.info(`Ficheiro removido do disco: ${r.path}`);

      // Apagar da BD
      await Resource.findByIdAndDelete(id);
      logger.info(`Recurso eliminado da BD: ${id}`);

      res.json({ message: "Recurso eliminado com sucesso" });
    } catch (err) {
      next(err);
    }
  },

  toggleResourcePublic: async (req, res, next) => {
    try {
      const { id } = req.params;
      const r = await Resource.findById(id);
      bailIf(!r, "Recurso não encontrado", next);
      r.public = !r.public;
      await r.save();
      logger.info(`Visibilidade mudada para ${r.public} para o recurso ${id}`);
      res.json(r);
    } catch (err) {
      next(err);
    }
  },

  exportResource: async (req, res, next) => {
    // Monta um corpo falso com resourceIds = [id]
    req.body.resourceIds = [req.params.id];
    return oaisController.handleDisseminate(req, res, next);
  },
  //
  // === ADMIN: NOTÍCIAS ===
  //
  listNews: async (req, res, next) => {
    try {
      const news = await News.find().lean();
      res.json(news);
    } catch (err) {
      next(err);
    }
  },
  getVisibleNews: async (req, res, next) => {
    try {
      const news = await News.find({ visible: true })
        .sort({ createdAt: -1 })
        .lean();
      res.json({ news });
    } catch (err) {
      next(err);
    }
  },
  getNewsById: async (req, res, next) => {
    try {
      const param = req.params.id;
      const news = await News.findById(param).lean();
      if (!news) {
        return res.status(404).json({ error: "Notícia não encontrada" });
      }
      return res.json(news);
    } catch (err) {
      next(err);
    }
  },
  createNews: async (req, res, next) => {
    try {
      const data = req.body;
      data.visible = req.body.visible === "on";

      const n = await News.create(data);
      logger.info(`Notícia criada: ${n._id}`);
      res.status(201).json(n);
    } catch (err) {
      next(err);
    }
  },

  updateNews: async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = req.body;
      data.visible = req.body.visible === "on";
      const n = await News.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });
      bailIf(!n, "Notícia não encontrada", next);
      logger.info(`Notícia atualizada: ${id}`);
      res.json(n);
    } catch (err) {
      next(err);
    }
  },

  deleteNews: async (req, res, next) => {
    try {
      const { id } = req.params;
      const n = await News.findByIdAndDelete(id);
      bailIf(!n, "Notícia não encontrada", next);
      logger.info(`Notícia eliminada: ${id}`);
      res.json({ message: "Notícia eliminada com sucesso" });
    } catch (err) {
      next(err);
    }
  },

  toggleNewsVisibility: async (req, res, next) => {
    try {
      const { id } = req.params;
      const n = await News.findById(id);
      bailIf(!n, "Notícia não encontrada", next);
      n.visible = !n.visible;
      await n.save();
      logger.info(`Visibilidade alterada para ${n.visible} na notícia ${id}`);
      res.json(n);
    } catch (err) {
      next(err);
    }
  },

  //
  // === ADMIN: ESTATÍSTICAS ===
  //
  getStats: async (req, res, next) => {
    try {
      const stats = await statsService.computeUsageStatistics();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  },

  //
  // RESOURCES
  //
  getResource: async (req, res, next) => {
    try {
      const { id } = req.params;
      const r = await Resource.findById(id).lean();
      bailIf(!r, "Recurso não encontrado", next);
      res.json(r);
    } catch (err) {
      next(err);
    }
  },
  getAllResources: async (req, res, next) => {
    try {
      const {
        tag,
        dateFrom,
        dateTo,
        search,
        username: usernameFromQuery,
      } = req.query;

      const user = req.user || null;
      const effectiveUsername =
        usernameFromQuery || (user && user.username) || null;

      let filter;
      if (effectiveUsername) {
        filter = {
          $or: [{ public: true }, { "metadata.publicador": effectiveUsername }],
        };
      } else {
        filter = { public: true };
      }

      // 2) Filtro tag (match por prefixo)
      if (tag) {
        // ^TAG($|/) significa:
        //  - começa por “TAG” e de seguida ou acaba (fim da string)
        //  - ou segue com “/” (para categorias mais específicas)
        const esc = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // (só para escapar eventuais caracteres especiais; normalmente as tags não têm,
        // mas fica a técnica para casos futuros)

        filter["metadata.tags"] = { $regex: `^${esc}($|/)` };
      }

      // 3) Filtro por data
      if (dateFrom || dateTo) {
        filter["metadata.dataCriacao"] = {};
        if (dateFrom) filter["metadata.dataCriacao"].$gte = new Date(dateFrom);
        if (dateTo) filter["metadata.dataCriacao"].$lte = new Date(dateTo);
      }

      // 4) Filtro por título/search
      if (search) {
        filter["metadata.titulo"] = { $regex: search, $options: "i" };
      }

      // 5) Fetch dos recursos no MongoDB
      const resources = await Resource.find(filter)
        .sort({ "metadata.dataCriacao": -1 })
        .lean();

      // 6) Atualiza taxonomia e converte em flatTags
      taxonomy.updateHierarchyWithResources(resources);
      const tagOptions = taxonomy.getFlatTags();

      // 7) Responde sempre JSON para o front
      res.json({ resources, tagOptions });
    } catch (err) {
      next(err);
    }
  },

  // AUTH
  getUser: async (req, res, next) => {
    try {
      const username = req.params.username;
      const user = await User.findOne({ username }).lean();
      if (!user) {
        return res.status(404).json({ error: "Utilizador não encontrado" });
      }
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
  getUserByIdentifier: async (req, res, next) => {
    try {
      const param = req.params.id;
      const user = await User.findById(param).lean();
      if (!user) {
        return res.status(404).json({ error: "Utilizador não encontrado" });
      }
      return res.json(user);
    } catch (err) {
      next(err);
    }
  },
};
