const statsService = require("../utils/stats");
const axios = require("axios");

exports.renderHome = async (req, res, next) => {
  try {
    const { tag, dateFrom, dateTo, search } = req.query;

    const params = {};
    if (tag) params.tag = tag;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (search) params.search = search;
    const paramsCopy = { ...params };
    if (req.user && req.user.username) {
      paramsCopy.username = req.user.username;
    }

    const apiBase = `http://backoffice:3001`;
    const response = await axios.get(`${apiBase}/api/resources`, {
      params: paramsCopy,
      headers: { Cookie: req.headers.cookie || "" },
      withCredentials: true,
    });

    const { resources, tagOptions } = response.data;
    res.render("index", {
      title: "Eu Digital – Diário",
      user: req.user,
      resources,
      tagOptions,
      filters: { tag, dateFrom, dateTo, search },
    });
  } catch (err) {
    next(err);
  }
};

exports.renderNews = async (req, res) => {
  const apiBase = `http://backoffice:3001`;
  const response = await axios.get(`${apiBase}/api/news/visible`);
  const { news } = response.data;
  res.render("news", {
    title: "Eu Digital - Notícias",
    news,
  });
};

exports.renderAdmin = (req, res) => {
  res.render("admin", {
    title: "Admin Dashboard",
    user: req.user,
  });
};

exports.usersList = async (req, res, next) => {
  try {
    const API_BASE = "http://backoffice:3001";
    const response = await axios.get(`${API_BASE}/api/admin/users`, {
      headers: { Cookie: req.headers.cookie || "" },
      withCredentials: true,
    });
    const users = response.data;
    res.render("admin/usersList", { title: "Gerir Utilizadores", users });
  } catch (err) {
    next(err);
  }
};

exports.usersCreateForm = (req, res) => {
  res.render("admin/userForm", { title: "Criar Utilizador", user: {} });
};

exports.usersEditForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const API_BASE = "http://backoffice:3001";
    const response = await axios.get(`${API_BASE}/api/admin/users/${id}`, {
      headers: { Cookie: req.headers.cookie || "" },
      withCredentials: true,
    });
    const user = response.data;
    if (!user) return res.status(404).send("Utilizador não encontrado");
    delete user.passwordHash; // don't pass the password into the view
    res.render("admin/userEdit", {
      title: "Editar Utilizador",
      user,
    });
  } catch (err) {
    next(err);
  }
};

exports.newsList = async (req, res, next) => {
  try {
    const API_BASE = "http://backoffice:3001";
    const response = await axios.get(`${API_BASE}/api/admin/news`, {
      headers: { Cookie: req.headers.cookie || "" },
      withCredentials: true,
    });
    const news = response.data;
    res.render("admin/newsList", { title: "Gerir Notícias", news });
  } catch (err) {
    next(err);
  }
};

exports.newsCreateForm = (req, res) => {
  res.render("admin/newsForm", { title: "Criar Notícia", news: {} });
};

exports.newsEditForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const API_BASE = "http://backoffice:3001";
    const response = await axios.get(`${API_BASE}/api/admin/news/${id}`, {
      headers: { Cookie: req.headers.cookie || "" },
      withCredentials: true,
    });
    const news = response.data;
    if (!news) return res.status(404).send("Notícia não encontrada");
    res.render("admin/newsEdit", {
      title: "Editar Notícia",
      news,
    });
  } catch (err) {
    next(err);
  }
};

exports.resourcesList = async (req, res, next) => {
  try {
    const API_BASE = "http://backoffice:3001";
    const response = await axios.get(`${API_BASE}/api/admin/resources`, {
      headers: { Cookie: req.headers.cookie || "" },
      withCredentials: true,
    });
    const resources = response.data;
    res.render("admin/resourcesList", { title: "Gerir Recursos", resources });
  } catch (err) {
    next(err);
  }
};

exports.resourcesImport = async (req, res, next) => {
  try {
    res.render("admin/resourcesImport", { title: "Importar Recurso" });
  } catch (err) {
    next(err);
  }
};

exports.statsPage = async (req, res, next) => {
  try {
    const stats = await statsService.computeUsageStatistics();
    res.render("admin/statsPage", { title: "Estatísticas", stats });
  } catch (err) {
    next(err);
  }
};
