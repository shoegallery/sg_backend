var axios = require("axios");

// async..await is not allowed in global scope, must use a wrapper

const sendMessage = async (options) => {
  console.log("---------" + options);
  var zochil_data = {
    phone: process.env.ZOCHIL_USERNAME,
    password: process.env.ZOCHIL_PASSWORD,
  };

  // await axios({
  //   method: "post",
  //   maxBodyLength: Infinity,
  //   url: "https://api5.shoppy.mn/api/back_office/sms",
  //   headers: {
  //     "sec-ch-ua":
  //       '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
  //     "X-Signature": "A+oh5m+zNNDzVOTRai12vJzmsWc=",
  //     DNT: "1",
  //     "sec-ch-ua-mobile": "?0",
  //     Authorization: "Bearer wldtBG-LUr7ukN0yDN1hHoltikFgOU0OVR7iyJZoALM",
  //     "User-Agent":
  //       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  //     "Content-Type": "application/json",
  //     Accept: "application/json",
  //     "X-Date": "2024-04-07T05:46:22.458Z",
  //     "X-Signature-Version": "2",
  //     "sec-ch-ua-platform": '"Windows"',
  //     host: "api5.shoppy.mn",
  //   },
  //   data: options.message,
  // })
  //   .then(function (send_sms) {
  //     console.log(send_sms);
  //   })
  //   .catch(function (error) {
  //     console.log("Sent алдаа");
  //   });
};

module.exports = sendMessage;
