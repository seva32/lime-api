import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
request.headers.prefer = 'return=representation';
// request.headers['PayPal-Partner-Attribution-Id'] =
//   'PARTNER_ID_ASSIGNED_BY_YOUR_PARTNER_MANAGER';

function environment() {
  const clientId = process.env.PAYPAL_CLIENT || 'PAYPAL-SANDBOX-CLIENT-ID';
  const clientSecret =
    process.env.PAYPAL_SECRET || 'PAYPAL-SANDBOX-CLIENT-SECRET';

  return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
}

export function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

export async function prettyPrint(jsonData, pre = '') {
  let pretty = '';
  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const key in jsonData) {
    // eslint-disable-next-line no-prototype-builtins
    if (jsonData.hasOwnProperty(key)) {
      // eslint-disable-next-line no-restricted-globals
      if (isNaN(key)) {
        pretty += `${pre + capitalize(key)}: `;
      } else {
        // eslint-disable-next-line radix
        pretty += `${pre + (parseInt(key) + 1)}: `;
      }
      if (typeof jsonData[key] === 'object') {
        pretty += '\n';
        // eslint-disable-next-line no-await-in-loop
        pretty += await prettyPrint(jsonData[key], `${pre}    `);
      } else {
        pretty += `${jsonData[key]}\n`;
      }
    }
  }
  return pretty;
}
export default { request };
