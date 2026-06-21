const express = require("express");
const router = express.Router();
const { getMe, updatePreferences } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware"); // غيّري الاسم لو مختلف عندك

router.get("/me", protect, getMe);
router.patch("/me/preferences", protect, updatePreferences);

module.exports = router;