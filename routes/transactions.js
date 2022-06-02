const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const Transactions = require("../controllers/transactions");
//Авах

router.post("/ecosystem", Transactions.ecoSystem); //ok

router.use(protect);
//Хэрэглэгчийн хийх шилжүүлэг
router.route("/purchase").post(authorize("user"), Transactions.userPurchase);
//Test

// Хэрэглэгчийн хувьд авах дансны мэдээлэл
router
  .route("/wallet/:id")
  .post(
    authorize("user", "admin", "operator", "saler"),
    Transactions.getUserTransfers
  );
router
  .route("/wallet/:id/credit")
  .post(
    authorize("user", "admin", "operator"),
    Transactions.getUserTransfersCredit
  );
router
  .route("/wallet/:id/debit")
  .post(
    authorize("user", "admin", "operator", "saler"),
    Transactions.getUserTransfersDebit
  );

//Операторын хийх шилжүүлэг

router
  .route("/giftcardcharge")
  .post(authorize("admin", "operator"), Transactions.userGiftCardCharge);

router
  .route("/charge")
  .post(authorize("admin", "operator"), Transactions.userCharge);
router
  .route("/bonus")
  .post(authorize("admin", "operator"), Transactions.userChargeBonus);

//Админы хийх шилжүүлэг
router
  .route("/operatorcharge")
  .post(authorize("admin"), Transactions.operatorCharge);

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

//Админы харах Charge шилжүүлгүүд
router
  .route("/statistic")
  .post(authorize("admin", "operator"), Transactions.statisticData);



/*
router
  .route("/list/charge")
  .post(authorize("admin", "operator"), Transactions.getAllCharge);
router
  .route("/list/charge/credit")
  .post(authorize("admin", "operator"), Transactions.getAllChargeCredit);
router
  .route("/list/charge/debit")
  .post(authorize("admin", "operator"), Transactions.getAllChargeDebit);
*/


/*Админы харах GiftCard шилжүүлгүүд*/

router
  .route("/list/giftcard")
  .post(authorize("admin", "operator"), Transactions.getAllGiftCard);
router
  .route("/list/giftcard/credit")
  .post(authorize("admin", "operator"), Transactions.getAllGiftCardCredit);
router
  .route("/list/giftcard/debit")
  .post(authorize("admin", "operator"), Transactions.getAllGiftCardDebit);


router
  .route("/list/universal")
  .post(authorize("admin", "operator"), Transactions.getAllUniversalStatement);

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
router
  .route("/test")
  .post(authorize("admin", "operator"), Transactions.getTest);


module.exports = router;
