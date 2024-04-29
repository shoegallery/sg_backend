const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");
const Transactions = require("../controllers/transactions");
const CouponCode = require("../controllers/couponcode");
const generateLoan = require("../controllers/loan");
router.post("/ecosystem", Transactions.ecoSystem);

router.use(protect);

//Хэрэглэгчийн хийх шилжүүлэг
router.route("/purchase").post(authorize("user"), Transactions.userPurchase);
router.route("/transfer").post(authorize("user"), Transactions.userTransfer);

// Хэрэглэгчийн хувьд авах дансны мэдээлэл
router
  .route("/wallet/:id")
  .post(
    authorize("user", "admin", "operator", "saler"),
    Transactions.getMyWalletTransfers
  );
router
  .route("/use_coupon")
  .post(authorize("user"), Transactions.userCouponBonus);

//Операторын хийх шилжүүлэг
router
  .route("/membercharge")
  .post(authorize("admin", "operator"), Transactions.userMemberCardCharge);

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

router.route("/get_odoo_coupon").post(authorize("admin"), CouponCode.odooData);

router
  .route("/generate_coupon")
  .post(authorize("admin"), CouponCode.generate_coupon);
router.route("/test").post(authorize("admin"), CouponCode.test);
//Админы харах Charge шилжүүлгүүд
router
  .route("/statistic")
  .post(authorize("admin", "operator"), Transactions.statisticData);

router
  .route("/bosschecklist")
  .post(authorize("admin"), Transactions.bossUnchecked);

router.route("/bosscheckit").post(authorize("admin"), Transactions.bossChecked);
router.route("/coupon_list").post(authorize("admin"), Transactions.couponList);

/*Админы харах GiftCard шилжүүлгүүд*/
router
  .route("/list/universal")
  .post(authorize("admin", "operator"), Transactions.getAllUniversalStatement);
router
  .route("/bonus/salary")
  .post(authorize("admin", "operator"), Transactions.bonusSalary);

module.exports = router;
