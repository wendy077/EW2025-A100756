const Comment = require("../models/Comment");
const Resource = require("../models/Resource");
const { bailIf } = require("../utils/helpers");
const logger = require("../utils/logger");

exports.listComments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id).lean();
    bailIf(!resource, "Recurso não encontrado", next);

    const comments = await Comment.find({ resource: id })
      .sort({ createdAt: -1 })
      .populate("author", "username") // bring in the username
      .lean();

    res.json(comments);
  } catch (err) {
    next(err);
  }
};

exports.createComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, author } = req.body;
    const userId = (req.user && req.user._id) || author || null;

    bailIf(
      !content || !content.trim(),
      "Comentário não pode estar vazio",
      next
    );

    if (!userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const resource = await Resource.findById(id).lean();
    bailIf(!resource, "Recurso não encontrado", next);

    const comment = await Comment.create({
      resource: id,
      author: userId,
      content: content.trim(),
    });

    logger.info(`Comentário criado por ${userId} em ${id}`);

    await comment.populate("author", "username");
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};
