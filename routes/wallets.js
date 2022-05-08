const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");
const Wallets = require("../controllers/wallets");

router.post("/create", Wallets.createWallet);
router.post("/forgot-password", Wallets.forgotPassword);
router.post("/login", Wallets.login); //ok
router.get("/logout", Wallets.logout);
router.post("/reset-password", Wallets.resetPassword);
router.use(protect);
router.get("/list", Wallets.getAllWallets);

router
  .route("/:id")
  .get(authorize("admin", "operator"), Wallets.getwallets)
  .put(authorize("admin"), Wallets.updatewallets)
  .delete(authorize("admin"), Wallets.deletewallets);

module.exports = router;
