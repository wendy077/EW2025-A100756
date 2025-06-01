const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/authController");

router.get("/login", authCtrl.showLogin);
router.post("/login", authCtrl.login);
router.get("/register", authCtrl.showRegister);
router.post("/register", authCtrl.register);
router.get("/logout", authCtrl.logout);

module.exports = router;
