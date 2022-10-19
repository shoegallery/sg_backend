var axios = require("axios");

// async..await is not allowed in global scope, must use a wrapper

const sendMessage = async (options) => {
  var zochil_data = {
    phone: process.env.ZOCHIL_USERNAME,
    password: process.env.ZOCHIL_PASSWORD,
  };

  // create reusable transporter object using the default SMTP transport
  await axios({
    method: "post",
    url: `https://api.zochil.cloud/v2/user/users/login`,

    data: zochil_data,
  })
    .then(function (login_response) {

      if (login_response.data.status === "ok") {
        axios({
          method: "post",
          url: `https://api.zochil.cloud/v2/merchant/broadcasts/send`,
          headers: {
            "merchant-id": process.env.ZOCHIL_MERCHANT_ID,
            "Content-Type": "application/json",
            "access-token": login_response.data.access_token,
          },
          data: options.message,
        })
          .then(function (send_sms) {
            if (send_sms.data.status === "ok") {
            }
          })
          .catch(function (error) {
            console.log("Sent алдаа");
          });
      }
    })
    .catch(function (error) {
      console.log("Логин алдаа");
    });
};

module.exports = sendMessage;
