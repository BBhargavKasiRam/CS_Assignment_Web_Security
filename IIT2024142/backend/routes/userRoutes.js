const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/mediators", userController.getMediators);
router.get("/auctioneers", userController.getMediators);

module.exports = router;
