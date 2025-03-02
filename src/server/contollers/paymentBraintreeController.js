import braintree from 'braintree';

const gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export const braintreeClientToken = (req, res) => {
  try {
    gateway.clientToken.generate({}, (err, response) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(response);
      }
    });
  } catch (err) {
    res.status(500).send(err);
  }
};

export const braintreeCheckout = (req, res) => {
  const nonceFromTheClient = req.body.paymentMethodNonce;

  // eslint-disable-next-line no-unused-vars
  const newTransaction = gateway.transaction.sale(
    {
      amount: '15.00',
      paymentMethodNonce: nonceFromTheClient,
      options: {
        // This option requests the funds from the transaction
        // once it has been authorized successfully
        submitForSettlement: true,
      },
    },
    (error, result) => {
      if (result) {
        res.send(result);
      } else {
        console.log(error);
        res.status(500).send(error);
      }
    },
  );
};
