const express = require("express");
const multer = require("multer");
const router = express.Router();

const oaisController = require("../controllers/oaisController");
const apiController = require("../controllers/apiController");
const commentController = require("../controllers/commentController");

const { ensureAdmin, ensureAuthenticated } = require("../utils/auth");

const upload = multer({ dest: "tmp_sips/" });

//
// OAIS PROTOCOL
//
router.post("/ingest", upload.single("sip"), oaisController.handleIngest);
router.post("/disseminate", oaisController.handleDisseminate);

//
// ADMIN API ROUTES
//
// User administrative API calls
router.get("/admin/users", apiController.listUsers);
router.get("/admin/users/:id", apiController.getUserByIdentifier);
router.post("/admin/users", apiController.createUser);
router.put("/admin/users/:id", apiController.updateUser);
router.delete("/admin/users/:id", apiController.deleteUser);

// Resources administrative API calls
router.get("/admin/resources", apiController.listResources);
router.post(
  "/admin/resources",
  upload.single("sip"),
  apiController.createResource
);
router.put("/admin/resources/:id", apiController.updateResource);
router.delete("/admin/resources/:id", apiController.deleteResource);
router.patch("/admin/resources/:id/public", apiController.toggleResourcePublic);
router.post("/admin/resources/:id/export", apiController.exportResource);

// News administrative API calls
router.get("/admin/news", apiController.listNews);
router.get("/admin/news/:id", apiController.getNewsById);
router.post("/admin/news", apiController.createNews);
router.put("/admin/news/:id", apiController.updateNews);
router.delete("/admin/news/:id", apiController.deleteNews);
router.patch("/admin/news/:id/visibility", apiController.toggleNewsVisibility);

// Statistics calls
router.get("/admin/stats", apiController.getStats);

//
// COMMENTS
//
router.get("/resources/:id/comments", commentController.listComments);
router.post("/resources/:id/comments", commentController.createComment);

//
// RESOURCES
//
router.get("/resources", apiController.getAllResources);
router.get("/resources/:id", apiController.getResource);
router.post(
  "/resources",
  ensureAuthenticated,
  upload.single("sip"),
  apiController.createResource
);
router.post("/resources/:id/export", apiController.exportResource);

// AUTH
router.get("/users/:username", apiController.getUser);
router.get("/users/id/:id", apiController.getUserByIdentifier);
router.post("/users", apiController.createUser);

// NEWS
router.get("/news/visible", apiController.getVisibleNews);

router.use("/admin", ensureAdmin); // ensure user is admin in admin routes
module.exports = router;
