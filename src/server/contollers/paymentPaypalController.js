// 1. Set up your server to make calls to PayPal

// 1a. Import the SDK package
import paypal from "@paypal/checkout-server-sdk";
import axios from "axios";
import { client } from "../functions/paypalCheckoutSdk";

// 1b. Import the PayPal SDK client that was created in `Set up Server-Side SDK`.
/**
 *
 * PayPal HTTP client dependency
 */
// const payPalClient = require('../Common/payPalClient');
const payPalClient = client;

export function createAccessToken(req, res) {
  axios({
    url: "https://api.sandbox.paypal.com/v1/identity/generate-token",
    method: "post",
    headers: {
      Accept: "application/json",
      "Accept-Language": "en_US",
    },
    auth: {
      username: process.env.PAYPAL_CLIENT,
      password: process.env.PAYPAL_SECRET,
    },
    data: { grant_type: "client_credentials" },
  })
    .then(({ data }) => {
      res.send({ data });
    })
    .catch((e) => {
      console.log(e.message);
      return res.status(401).send({ message: "Unauthorized" });
    });
}

// 2. Set up your server to receive a call from the client
export async function handleRequest(req, res) {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: "220.00",
        },
      },
    ],
  });

  try {
    const order = await payPalClient.client().execute(request);
    return res.status(200).json({ orderID: order.result.id });
  } catch (err) {
    console.error("PayPal Order Creation Error:", err);
    return res.status(500).json({ error: "Failed to create PayPal order" });
  }
}

export async function handleRequestAuth(req, res) {
  // 3. Call PayPal to set up an authorization transaction
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "AUTHORIZE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: "220.00",
        },
      },
    ],
  });

  try {
    const order = await payPalClient.client().execute(request);
    return res.status(200).json({ orderID: order.result.id });
  } catch (err) {
    console.error("PayPal Authorization Error:", err);
    return res
      .status(500)
      .json({ error: "Failed to create PayPal authorization" });
  }
}

// Get Transaction order details from PayPal
export async function handleRequestTransactionDetails(req, res) {
  // 2a. Get the order ID from the request body
  const { orderID } = req.body;

  if (!orderID) {
    return res.status(400).json({ error: "Missing order ID" });
  }

  // 3. Call PayPal to get the transaction details
  const request = new paypal.orders.OrdersGetRequest(orderID);

  try {
    const order = await payPalClient.client().execute(request);

    // 5. Validate the transaction details are as expected
    if (order.result.purchase_units[0].amount.value !== "220.00") {
      return res.status(400).json({ error: "Transaction amount mismatch" });
    }

    // 6. Save the transaction in your database
    // await database.saveTransaction(orderID);

    // 7. Return a successful response to the client
    return res.status(200).json({ message: "Transaction verified", orderID });
  } catch (err) {
    // 4. Handle any errors from the call
    console.error("PayPal Transaction Details Error:", err);
    return res
      .status(500)
      .json({ error: "Failed to retrieve PayPal transaction details" });
  }
}

// client and server are set up to call the Orders API to capture funds from an order
export async function handleRequestCaptureFunds(req, res) {
  // 2a. Get the order ID from the request body
  const { orderID } = req.body;

  if (!orderID) {
    return res.status(400).json({ error: "Missing order ID" });
  }

  // 3. Call PayPal to capture the order
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await payPalClient.client().execute(request);

    // 4. Save the capture ID to your database for future reference
    const captureID = capture.result.purchase_units[0].payments.captures[0].id;
    // await database.saveCaptureID(captureID);

    // 6. Return a successful response to the client
    return res
      .status(200)
      .json({ message: "Funds captured successfully", captureID });
  } catch (err) {
    // 5. Handle any errors from the call
    console.error("PayPal Capture Funds Error:", err);
    return res.status(500).json({ error: "Failed to capture funds" });
  }
}

export async function handleRequestAuthTransactionId(req, res) {
  // 2a. Get the order ID from the request body
  const { orderID } = req.body;

  if (!orderID) {
    return res.status(400).json({ error: "Missing order ID" });
  }

  // 3. Call PayPal to create the authorization
  const request = new paypal.orders.OrdersAuthorizeRequest(orderID);
  request.requestBody({});

  try {
    const authorization = await payPalClient.client().execute(request);

    // 4. Save the authorization ID to your database
    const authorizationID =
      authorization.result.purchase_units[0].payments.authorizations[0].id;
    // await database.saveAuthorizationID(authorizationID);

    // 6. Return a successful response to the client
    return res
      .status(200)
      .json({ message: "Transaction authorized", authorizationID });
  } catch (err) {
    // 5. Handle any errors from the call
    console.error("PayPal Authorization Error:", err);
    return res.status(500).json({ error: "Failed to authorize transaction" });
  }
}

// Get the capture ID for refunding
export async function captureAuthorization() {
  // 2. Get the authorization ID from your database
  const authorizationID = 123; // database.lookupAuthorizationID();

  if (!authorizationID) {
    console.error("Error: Missing authorization ID");
    return;
  }

  // 3. Call PayPal to capture the authorization
  const request = new paypal.payments.AuthorizationsCaptureRequest(
    authorizationID
  );
  request.requestBody({});

  try {
    const capture = await payPalClient.client().execute(request);

    // 4. Save the capture ID to your database for future reference
    const captureID = capture.result.purchase_units[0].payments.captures[0].id;
    // await database.saveCaptureID(captureID);

    console.log("Capture successful, capture ID:", captureID);
  } catch (err) {
    // 5. Handle any errors from the call
    console.error("PayPal Capture Authorization Error:", err);
  }
}

// transaction returns:
// return {
//     "intent": "CAPTURE"||"AUTHORIZE"
//     "application_context": {
//       "return_url": "https://example.com",
//       "cancel_url": "https://example.com",
//       "brand_name": "EXAMPLE INC",
//       "locale": "en-US",
//       "landing_page": "BILLING",
//       "shipping_preference": "SET_PROVIDED_ADDRESS",
//       "user_action": "CONTINUE"
//     },
//     "purchase_units": [
//       {
//         "reference_id": "PUHF",
//         "description": "Sporting Goods",

//         "custom_id": "CUST-HighFashions",
//         "soft_descriptor": "HighFashions",
//         "amount": {
//           "currency_code": "USD",
//           "value": "230.00",
//           "breakdown": {
//             "item_total": {
//               "currency_code": "USD",
//               "value": "180.00"
//             },
//             "shipping": {
//               "currency_code": "USD",
//               "value": "30.00"
//             },
//             "handling": {
//               "currency_code": "USD",
//               "value": "10.00"
//             },
//             "tax_total": {
//               "currency_code": "USD",
//               "value": "20.00"
//             },
//             "shipping_discount": {
//               "currency_code": "USD",
//               "value": "10"
//             }
//           }
//         },
//         "items": [
//           {
//             "name": "T-Shirt",
//             "description": "Green XL",
//             "sku": "sku01",
//             "unit_amount": {
//               "currency_code": "USD",
//               "value": "90.00"
//             },
//             "tax": {
//               "currency_code": "USD",
//               "value": "10.00"
//             },
//             "quantity": "1",
//             "category": "PHYSICAL_GOODS"
//           },
//           {
//             "name": "Shoes",
//             "description": "Running, Size 10.5",
//             "sku": "sku02",
//             "unit_amount": {
//               "currency_code": "USD",
//               "value": "45.00"
//             },
//             "tax": {
//               "currency_code": "USD",
//               "value": "5.00"
//             },
//             "quantity": "2",
//             "category": "PHYSICAL_GOODS"
//           }
//         ],
//         "shipping": {
//           "method": "United States Postal Service",
//           "address": {
//             "name": {
//               "full_name":"John",
//               "surname":"Doe"
//             },
//             "address_line_1": "123 Townsend St",
//             "address_line_2": "Floor 6",
//             "admin_area_2": "San Francisco",
//             "admin_area_1": "CA",
//             "postal_code": "94107",
//             "country_code": "US"
//           }
//         }
//       }
//     ]
//   };
