const express = require("express");
const { protect, authorize } = require("../middleware/protect");
const Wallets = require("../controllers/wallets");
const Loan = require("../controllers/loan");

const router = express.Router();

router.post("/create", Wallets.createWallet); //ok
router.post("/login", Wallets.login);

router.post("/version", Wallets.version);
router.get("/test", Wallets.testcheck);
router.post("/loan", Loan.generateLoan);

router.use(protect);

router
  .route("/logout")
  .post(authorize("admin", "operator", "user", "saler"), Wallets.logout);
router
  .route("/checkLogged")
  .post(authorize("admin", "operator", "user", "saler"), Wallets.checkLogged);

router
  .route("/my/:id")
  .post(authorize("user", "admin", "operator", "saler"), Wallets.getMyWallet);
router.route("/info").post(authorize("user"), Wallets.myInfo);

router
  .route("/list")
  .get(authorize("admin", "operator"), Wallets.getAllWallets);
router
  .route("/list-operator")
  .get(authorize("admin", "operator"), Wallets.getAllWalletsOperator);
router
  .route("/list-variance")
  .get(authorize("admin", "operator"), Wallets.getAllWalletsVariance);
router
  .route("/list-store")
  .get(authorize("admin", "operator"), Wallets.getAllWalletsStore);
router
  .route("/list-users")
  .get(authorize("admin", "operator"), Wallets.getAllWalletsUser); //ok
router.route("/unblock").post(authorize("admin"), Wallets.unBlock); //ok

router
  .route("/:id")
  .get(authorize("admin", "operator"), Wallets.getwallets)
  .put(authorize("admin", "user"), Wallets.updatewallets)
  .delete(authorize("admin"), Wallets.deletewallets);

module.exports = router;
