const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const Transactions = require("../controllers/transactions");

router.use(protect);

router
  .route("/wallet/:id")
  .get(authorize("user"), Transactions.getUserAllTransfers);
// router
//   .route("/wallet/:id/credit")
//   .get(authorize("admin", "operator"), Transactions.getwallets);
// router
//   .route("/wallet/:id/profit")
//   .get(authorize("admin", "operator"), Transactions.getwallets);

router.route("/transfer").post(authorize("user"), Transactions.transfer); //ok
router.route("/list").post(authorize("admin"), Transactions.getAllTransfer);
router
  .route("/list/credit")
  .post(authorize("admin"), Transactions.getAllTransferCredit);
router
  .route("/list/profit")
  .post(authorize("admin"), Transactions.getAllTransferProfit);
module.exports = router;
