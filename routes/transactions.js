const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");
const Transactions = require("../controllers/transactions");



router.post("/ecosystem", Transactions.ecoSystem);

router.use(protect);


//Хэрэглэгчийн хийх шилжүүлэг
router.route("/purchase").post(authorize("user"), Transactions.userPurchase);

// Хэрэглэгчийн хувьд авах дансны мэдээлэл
router
  .route("/wallet/:id")
  .post(
    authorize("user", "admin", "operator", "saler"),
    Transactions.getMyWalletTransfers
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




//Админы харах Charge шилжүүлгүүд
router
  .route("/statistic")
  .post(authorize("admin", "operator"), Transactions.statisticData);

router
  .route("/bosschecklist")
  .post(authorize("admin"), Transactions.bossUnchecked);

router
  .route("/bosscheckit")
  .post(authorize("admin"), Transactions.bossChecked);




/*Админы харах GiftCard шилжүүлгүүд*/
router
  .route("/list/universal")
  .post(authorize("admin", "operator"), Transactions.getAllUniversalStatement);
router
  .route("/bonus/salary")
  .post(authorize("admin", "operator"), Transactions.bonusSalary);




module.exports = router;
