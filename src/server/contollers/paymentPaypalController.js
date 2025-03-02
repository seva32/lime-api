// 1. Set up your server to make calls to PayPal

// 1a. Import the SDK package
import paypal from '@paypal/checkout-server-sdk';
import axios from 'axios';
import { client } from '../functions/paypalCheckoutSdk';

// 1b. Import the PayPal SDK client that was created in `Set up Server-Side SDK`.
/**
 *
 * PayPal HTTP client dependency
 */
// const payPalClient = require('../Common/payPalClient');
const payPalClient = client;

export function createAccessToken(req, res) {
  axios({
    url: 'https://api.sandbox.paypal.com/v1/identity/generate-token',
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en_US',
    },
    auth: {
      username: process.env.PAYPAL_CLIENT,
      password: process.env.PAYPAL_SECRET,
    },
    data: { grant_type: 'client_credentials' },
  })
    .then(({ data }) => {
      res.send({ data });
    })
    .catch((e) => {
      console.log(e.message);
      return res.status(401).send({ message: 'Unauthorized' });
    });
}

// 2. Set up your server to receive a call from the client
export async function handleRequest(req, res) {
  // 3. Call PayPal to set up a transaction
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: '220.00',
        },
      },
    ],
  });

  let order;
  try {
    order = await payPalClient.client().execute(request);
  } catch (err) {
    // 4. Handle any errors from the call
    console.error(err);
    return res.send(500);
  }

  // 5. Return a successful response to the client with the order ID
  return res.status(200).json({
    orderID: order.result.id,
  });
}

export async function handleRequestAuth(req, res) {
  // 3. Call PayPal to set up an authorization transaction
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'AUTHORIZE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: '220.00',
        },
      },
    ],
  });

  let order;
  try {
    order = await payPalClient.client().execute(request);
  } catch (err) {
    // 4. Handle any errors from the call
    console.error(err);
    return res.send(500);
  }

  // 5. Return a successful response to the client with the order ID
  return res.status(200).json({
    orderID: order.result.id,
  });
}

// Get Transaction order details from paypal
export async function handleRequestTransactionDetails(req, res) {
  // 2a. Get the order ID from the request body
  const { orderID } = req.body;

  // 3. Call PayPal to get the transaction details
  const request = new paypal.orders.OrdersGetRequest(orderID);

  let order;
  try {
    order = await payPalClient.client().execute(request);
  } catch (err) {
    // 4. Handle any errors from the call
    console.error(err);
    return res.send(500);
  }

  // 5. Validate the transaction details are as expected
  if (order.result.purchase_units[0].amount.value !== '220.00') {
    return res.send(400);
  }

  // 6. Save the transaction in your database
  // await database.saveTransaction(orderID);

  // 7. Return a successful response to the client
  return res.send(200);
}

//
// client and server are set up to call the Orders API to capture funds from an order
export async function handleRequestCaptureFunds(req, res) {
  // 2a. Get the order ID from the request body
  const { orderID } = req.body;

  // 3. Call PayPal to capture the order
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await payPalClient.client().execute(request);

    // 4. Save the capture ID to your database. Implement logic to save
    // capture to your database for future reference.
    // eslint-disable-next-line no-unused-vars
    const captureID = capture.result.purchase_units[0].payments.captures[0].id;
    // await database.saveCaptureID(captureID);
  } catch (err) {
    // 5. Handle any errors from the call
    console.error(err);
    return res.send(500);
  }

  // 6. Return a successful response to the client
  return res.send(200);
}

export async function handleRequestAuthTransactionId(req, res) {
  // 2a. Get the order ID from the request body
  const { orderID } = req.body;

  // 3. Call PayPal to create the authorization
  const request = new paypal.orders.OrdersAuthorizeRequest(orderID);
  request.requestBody({});

  try {
    const authorization = await payPalClient.client().execute(request);

    // 4. Save the authorization ID to your database
    // eslint-disable-next-line no-unused-vars
    const authorizationID =
      authorization.result.purchase_units[0].payments.authorizations[0].id;
    // await database.saveAuthorizationID(authorizationID);
  } catch (err) {
    // 5. Handle any errors from the call
    console.error(err);
    return res.send(500);
  }

  // 6. Return a successful response to the client
  return res.send(200);
}

// get the capture id for refunding
export async function captureAuthorization() {
  // 2. Get the authorization ID from your database
  const authorizationID = 123; // database.lookupAuthorizationID();

  // 3. Call PayPal to capture the authorization
  const request = new paypal.payments.AuthorizationsCaptureRequest(
    authorizationID,
  );
  request.requestBody({});
  try {
    const capture = await payPalClient.client().execute(request);

    // 4. Save the capture ID to your database for future reference.
    // eslint-disable-next-line no-unused-vars
    const captureID = capture.result.purchase_units[0].payments.captures[0].id;
    // await database.saveCaptureID(captureID);

    // The capture request generates a response with a capture ID that
    // you can use for refunding transactions:
    // {
    //   "id": "1HW32023TU4585620"
    // }
  } catch (err) {
    // 5. Handle any errors from the call
    console.error(err);
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
