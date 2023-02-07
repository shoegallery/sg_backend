const asyncHandler = require("express-async-handler");
const { Expo } = require("expo-server-sdk");
const notificationList = require("../models/notification");
const { stringify } = require("uuid");
const PushNof = asyncHandler(async (req, res) => {
    const { body, title } = req.body;
    const lastTenTransActions = await notificationList.find({});
    let allData = [];
    let somePushTokens = [];
    lastTenTransActions.map((el) => {
        somePushTokens.push(el.expoNoticationToken);
    });

    // Create a new Expo SDK client
    // optionally providing an access token if you have enabled push security
    {
        let expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
        // Create the messages that you want to send to clients
        let messages = [];

        for (let pushToken of somePushTokens) {
            // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

            // Check that all your push tokens appear to be valid Expo push tokens
            if (!Expo.isExpoPushToken(pushToken)) {
                // console.error(`Push token ${pushToken} is not a valid Expo push token`);
                continue;
            }

            // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
            messages.push({
                to: pushToken,
                sound: "default",
                title: `${title}`,
                body: `${body}`,
                data: { withSome: "data" },
            });
        }

        // The Expo push notification service accepts batches of notifications so
        // that you don't need to send 1000 requests to send 1000 notifications. We
        // recommend you batch your notifications to reduce the number of requests
        // and to compress them (notifications with similar content will get
        // compressed).
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];
        (async () => {
            // Send the chunks to the Expo push notification service. There are
            // different strategies you could use. A simple one is to send one chunk at a
            // time, which nicely spreads the load out over time:
            for (let chunk of chunks) {
                try {
                    let ticketChunk = await expo.sendPushNotificationsAsync(chunk);

                    if (ticketChunk.length > 0) {
                        return res.status(200).json({
                            success: false,
                            message: `ok`,
                        });
                    }

                    tickets.push(...ticketChunk);
                    // NOTE: If a ticket contains an error code in ticket.details.error, you
                    // must handle it appropriately. The error codes are listed in the Expo
                    // documentation:
                    // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
                } catch (error) {
                    console.error(error);
                }
            }
        })();

        // Later, after the Expo push notification service has delivered the
        // notifications to Apple or Google (usually quickly, but allow the the service
        // up to 30 minutes when under load), a "receipt" for each notification is
        // created. The receipts will be available for at least a day; stale receipts
        // are deleted.
        //
        // The ID of each receipt is sent back in the response "ticket" for each
        // notification. In summary, sending a notification produces a ticket, which
        // contains a receipt ID you later use to get the receipt.
        //
        // The receipts may contain error codes to which you must respond. In
        // particular, Apple or Google may block apps that continue to send
        // notifications to devices that have blocked notifications or have uninstalled
        // your app. Expo does not control this policy and sends back the feedback from
        // Apple and Google so you can handle it appropriately.
        let receiptIds = [
            "ExponentPushToken[ikwDKqHfhSEz-aIaAtDdEM]",
            "ExponentPushToken[ikwDKqHfhSEz-aIaAtDdEM]",
        ];
        for (let ticket of tickets) {
            // NOTE: Not all tickets have IDs; for example, tickets for notifications
            // that could not be enqueued will have error information and no receipt ID.
            if (ticket.id) {
                receiptIds.push(ticket.id);
            }
        }

        let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

        (async () => {
            // Like sending notifications, there are different strategies you could use
            // to retrieve batches of receipts from the Expo service.
            for (let chunk of receiptIdChunks) {
                try {
                    let receipts = await expo.getPushNotificationReceiptsAsync(chunk);

                    // The receipts specify whether Apple or Google successfully received the
                    // notification and information about an error, if one occurred.
                    for (let receiptId in receipts) {
                        let { status, message, details } = receipts[receiptId];
                        if (status === "ok") {
                            continue;
                        } else if (status === "error") {
                            statusCheck = false;
                            console.error(
                                `There was an error sending a notification: ${message}`
                            );
                            if (details && details.error) {
                                // The error codes are listed in the Expo documentation:
                                // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
                                // You must handle the errors appropriately.
                                console.error(`The error code is ${details.error}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        })();
    }
});

const getToken = asyncHandler(async (req, res, next) => {
    const { token } = req.body;
    console.log(typeof token === "string");
    if (typeof token === "string") {
        const result = await notificationList.create({
            expoNoticationToken: token,
        });
        return res.status(200).json({
            success: true,
            status: true,
            message: result,
        });
    }
    else {
        return res.status(471).json({
            success: false,
            message: "Type buruu",
        });
    }
});
module.exports = { PushNof, getToken };
