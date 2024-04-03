var axios = require("axios");

// async..await is not allowed in global scope, must use a wrapper
var udid = 'e596cd6a-bb31-4055-a42e-6e16530373f0';


const sendMessage = async (options) => {
  console.log(options);
  var zochil_data = {
    phone: process.env.ZOCHIL_USERNAME,
    password: process.env.ZOCHIL_PASSWORD,
  };
  
  // create reusable transporter object using the default SMTP transport
  await axios({
    method: "post",
    url: `https://api.zochil.io/v3/user/users/login`,
    headers: {
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'DNT': '1',
      'sec-ch-ua-mobile': '?0',
      'access-token': 'lyn4MgQ3eJOm140VN2mVxjtMwIaLX7yaByCyLo5DxWlMPRfu58R0RuSYwBgVYTKs',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'device-id': 'e596cd6a-bb31-4055-a42e-6e16530373f0',
      'sec-ch-ua-platform': '"Windows"',
      'host': 'api.zochil.io'
    },
    data: zochil_data,
  })
    .then(function (login_response) {
      if (login_response.data.status === "ok") {
        axios({
          method: "post",
          url: `https://api.zochil.io/v3/merchant/broadcasts/send`,
          headers: {
            "merchant-id": process.env.ZOCHIL_MERCHANT_ID,
            "Content-Type": "application/json",
            "access-token": login_response.data.access_token,
            "device-id": udid,
          },
          data: options.message,
        })
          .then(function (send_sms) {
            console.log(send_sms)
            if (send_sms.data.status === "ok") {
            }
          })
          .catch(function (error) {
            console.log("Sent алдаа");
          });
      }
    })
    .catch(function (error) {
      console.log(options.message);
    });
};

module.exports = sendMessage;
