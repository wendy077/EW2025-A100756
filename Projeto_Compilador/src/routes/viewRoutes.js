const express = require("express");
const router = express.Router();

const { ensureAdmin } = require("../utils/auth");
const viewController = require("../controllers/viewController");

// Normal routes
router.get("/", viewController.renderHome);
router.get("/news", viewController.renderNews);

// Admin routes
router.get("/admin", ensureAdmin, viewController.renderAdmin);
router.get("/admin/users", ensureAdmin, viewController.usersList);
router.get("/admin/users/create", ensureAdmin, viewController.usersCreateForm);
router.get("/admin/users/:id", ensureAdmin, viewController.usersEditForm);
router.get("/admin/news", ensureAdmin, viewController.newsList);
router.get("/admin/news/create", ensureAdmin, viewController.newsCreateForm);
router.get("/admin/news/:id", ensureAdmin, viewController.newsEditForm);
router.get("/admin/resources", ensureAdmin, viewController.resourcesList);
router.get(
  "/admin/resources/import",
  ensureAdmin,
  viewController.resourcesImport
);
router.get("/admin/stats", ensureAdmin, viewController.statsPage);

module.exports = router;
