const express = require("express");
const { protect, authorize } = require("../middleware/protect");
const Wallets = require("../controllers/wallets");
const router = express.Router();

router.post("/create", Wallets.createWallet); //ok
router.post("/forgot-password", Wallets.forgotPassword);
router.post("/login", Wallets.login); //ok
router.get("/logout", Wallets.logout);
router.post("/reset-password", Wallets.resetPassword);

router.use(protect);
router
  .route("/list")
  .get(authorize("admin", "operator"), Wallets.getAllWallets); //ok

router
  .route("/:id")
  .get(authorize("admin", "operator"), Wallets.getwallets)
  .put(authorize("admin", "user"), Wallets.updatewallets)
  .delete(authorize("admin"), Wallets.deletewallets);

module.exports = router;
