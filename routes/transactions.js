const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const Transactions = require("../controllers/transactions");

router.use(protect);
//Хэрэглэгчийн хийх шилжүүлэг
router.route("/purchase").post(authorize("user"), Transactions.userPurchase);
router.route("/cash-out").post(authorize("user"), Transactions.userCashOut);

//Хэрэглэгчийн хувьд авах дансны мэдээлэл
router
  .route("/wallet/:id")
  .get(authorize("user", "admin", "operator"), Transactions.getUserTransfers);
router
  .route("/wallet/:id/credit")
  .get(
    authorize("user", "admin", "operator"),
    Transactions.getUserTransfersCredit
  );
router
  .route("/wallet/:id/debit")
  .get(
    authorize("user", "admin", "operator", "saler"),
    Transactions.getUserTransfersDebit
  );

//Операторын хийх шилжүүлэг
router
  .route("/charge")
  .post(authorize("admin", "operator"), Transactions.userCharge);
router
  .route("/bonus")
  .post(authorize("admin", "operator"), Transactions.userChargeBonus);

//Админы харах бүх шилжүүлгүүд
router
  .route("/list")
  .post(authorize("admin", "operator"), Transactions.getAllTransfer);
router
  .route("/list/credit")
  .post(authorize("admin", "operator"), Transactions.getAllTransferCredit);
router
  .route("/list/debit")
  .post(authorize("admin", "operator"), Transactions.getAllTransferDebit);
module.exports = router;

//Админы харах Charge шилжүүлгүүд
router
  .route("/list/charge")
  .post(authorize("admin", "operator"), Transactions.getAllCharge);
router
  .route("/list/charge/credit")
  .post(authorize("admin", "operator"), Transactions.getAllChargeCredit);
router
  .route("/list/charge/debit")
  .post(authorize("admin", "operator"), Transactions.getAllChargeDebit);
module.exports = router;

//Админы харах Bonus шилжүүлгүүд
router
  .route("/list/bonus")
  .post(authorize("admin", "operator"), Transactions.getAllBonus);
router
  .route("/list/bonus/credit")
  .post(authorize("admin", "operator"), Transactions.getAllBonusCredit);
router
  .route("/list/bonus/debit")
  .post(authorize("admin", "operator"), Transactions.getAllBonusDebit);
module.exports = router;

//Админы харах CashOut шилжүүлгүүд
router
  .route("/list/cash-out")
  .post(authorize("admin", "operator"), Transactions.getAllCashOut);
router
  .route("/list/cash-out/credit")
  .post(authorize("admin", "operator"), Transactions.getAllCashOutCredit);
router
  .route("/list/cash-out/debit")
  .post(authorize("admin", "operator"), Transactions.getAllCashOutDebit);

module.exports = router;
