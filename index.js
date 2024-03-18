const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const sendMessage = require("./utils/sendMessage");

const helmet = require("helmet");

const mongoSanitize = require("express-mongo-sanitize");
var path = require("path");
var rfs = require("rotating-file-stream");
const colors = require("colors");
var morgan = require("morgan");
var cron = require("node-cron");
const cookieParser = require("cookie-parser");
const xss = require("xss-clean");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const axios = require("axios");
const walletRoutes = require("./routes/wallets");
const transactionRoutes = require("./routes/transactions");
const marketingRoutes = require("./routes/marketing");
const adminPanelRoutes = require("./routes/adminPanel");

dotenv.config({ path: "./config/config.env" });

const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");

const app = express();
//заавал нээ
// cron.schedule("* * * * *", () => {
//   let data = JSON.stringify({
//     walletSuperId:
//       "SA3ODr3jyRiYKz178juYxvDLTcI8RRq4aBAtcJGYjpzJRC1IypjBMfbOwHD4v7Iu",
//   });
//   let config = {
//     method: "post",
//     url: "https://dolphin-app-3r9tk.ondigitalocean.app/api/v1/transactions/ecosystem",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     maxRedirects: 0,
//     data: data,
//   };
//   axios(config)
//     .then((response) => {
//       if (response.data.success === true) {
//         if (response.data.data === "warning") {
//           console.log("Хэвийн бус");
//           process.kill(process.pid, "SIGTERM");
//         } else if (response.data.data === "success") {
//           console.log("систем хэвийн");
//         }
//       }
//     })
//     .catch((error) => {
//       process.kill(process.pid, "SIGTERM");
//       console.log("system шалгах боломжгүй");
//     });
// });

app.use(helmet());
// MongoDB өгөгдлийн сантай холбогдох
connectDB();
app.disable("x-powered-by");
app.use(express.json());



var whitelist = [
  "http://localhost:3000",
  "http://localhost:19006",
  "http://172.26.96.1:3000",
  "http://192.168.21.117",
  "http://192.168.1.16",
  "http://172.20.10.6",
  "http://192.168.1.5",
  "http://192.168.134.117",
  "https://dolphin-app-3r9tk.ondigitalocean.app",
];

// Өөр домэйн дээр байрлах клиент вэб аппуудаас шаардах шаардлагуудыг энд тодорхойлно
var corsOptions = {
  // Ямар ямар домэйнээс манай рест апиг дуудаж болохыг заана
  origin: function (origin, callback) {
    if (origin === undefined || whitelist.indexOf(origin) !== -1) {
      // Энэ домэйнээс манай рест рүү хандахыг зөвшөөрнө
      callback(null, true);
    } else {
      // Энэ домэйнд хандахыг хориглоно.
      callback(new Error("Horigloj baina.."));
    }
  },
  // Клиент талаас эдгээр http header-үүдийг бичиж илгээхийг зөвшөөрнө
  allowedHeaders: "Authorization, Set-Cookie, Content-Type",
  // Клиент талаас эдгээр мэссэжүүдийг илгээхийг зөвшөөрнө
  methods: "GET, POST, PUT, DELETE",
  // Клиент тал authorization юмуу cookie мэдээллүүдээ илгээхийг зөвшөөрнө
  credentials: true,
};

// Express rate limit : Дуудалтын тоог хязгаарлав
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 100 requests per windowMs
  message: "15 минутанд 200 удаа л хандаж болно! ",
});
app.use(limiter);
// http parameter pollution халдлагын эсрэг books?name=aaa&name=bbb  ---> name="bbb"
app.use(hpp());
// Cookie байвал req.cookie рүү оруулж өгнө0
app.use(cookieParser());
// логгер

// Клиент вэб аппуудыг мөрдөх ёстой нууцлал хамгаалалтыг http header ашиглан зааж өгнө
app.use(cors(corsOptions));
// клиент сайтаас ирэх Cross site scripting халдлагаас хамгаална
app.use(xss());
// Клиент сайтаас дамжуулж буй MongoDB өгөгдлүүдийг халдлагаас цэвэрлэнэ
app.use(mongoSanitize());
// Morgan logger-ийн тохиргоо
var accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
  path: path.join(__dirname, "log"),
});
app.use(morgan("combined", { stream: accessLogStream }));




app.use("/api/v1/wallets", walletRoutes);
app.use("/api/v1/marketing", marketingRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/adminpanel", adminPanelRoutes);

app.use(errorHandler);

// express сэрвэрийг асаана.
const server = app.listen(
  
  process.env.PORT,
  console.log(`сэрвэр ${process.env.PORT} порт дээр аслаа... `)
);

// Баригдалгүй цацагдсан бүх алдаануудыг энд барьж авна
process.on("unhandledRejection", (err, promise) => {
  console.log(`Алдаа гарлаа : ${err.message}`.underline.red.bold);
  server.close(() => {
    process.exit(1);
  });
});
process.on("SIGTERM", async () => {
  const message = {
    channel: "sms",
    title: "",
    body: `Server untarsan baina.`,
    receivers: ["86218721"],
    shop_id: "2706",
  };
  await sendMessage({
    message,
  });
  server.close(() => {
    console.log("Process terminated");
  });
});
