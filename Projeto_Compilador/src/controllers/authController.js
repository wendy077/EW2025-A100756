const axios = require("axios");
const passport = require("passport");
const logger = require("../utils/logger");

exports.showLogin = (req, res) => {
  logger.info("Página de login solicitada");
  res.render("login", { title: "Login" });
};

exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      logger.error(`Erro na autenticação: ${err.message}`);
      return next(err);
    }
    if (!user) {
      logger.warn(`Falha de login: utilizador não encontrado`);
      return res.redirect("/register");
    }

    req.login(user, (err) => {
      if (err) {
        logger.error(`Erro no login do utilizador: ${err.message}`);
        return next(err);
      }

      logger.info(
        `Utilizador ${user.username} autenticado com sucesso (role: ${user.role})`
      );

      // Redirecionar conforme a role
      if (user.role === "admin") {
        return res.redirect("/admin");
      } else {
        return res.redirect("/"); // utilizador normal volta à homepage
      }
    });
  })(req, res, next);
};

exports.showRegister = (req, res) => {
  logger.info("Página de registo solicitada");
  res.render("register", { title: "Registar" });
};

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    logger.info(`A registar novo utilizador: ${username}`);
    const apiBase = `http://backoffice:3001`;
    const response = await axios.post(`${apiBase}/api/users`, {
      username,
      email,
      password,
    });
    const user = response.data;
    logger.info(`Utilizador criado: ${user._id} (${username})`);

    req.login(user, (err) => {
      if (err) {
        logger.error(`Erro no auto-login após registo: ${err.message}`);
        return next(err);
      }
      res.redirect("/");
    });
  } catch (err) {
    if (err.response) {
      logger.error(`Erro no registo (API): ${err.response.data.error}`);
      return res.status(err.response.status).render("register", {
        title: "Registar",
        error: err.response.data.error,
      });
    }
    logger.error(`Erro inesperado no registo: ${err.message}`);
    return next(err);
  }
};

exports.logout = (req, res) => {
  const username = req.user?.username || "unknown";
  req.logout(() => {
    logger.info(`Utilizador ${username} fez logout`);
    res.redirect("/login");
  });
};
