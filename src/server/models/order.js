import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const counter = mongoose.model('counter', counterSchema);

const shippingSchema = {
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
};

const paymentSchema = {
  paymentMethod: { type: String, required: true },
};

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  image: { type: String, required: true },
  price: { type: String, required: true },
  category: { type: String },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product',
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    orderItems: [orderItemSchema],
    shipping: shippingSchema,
    payment: paymentSchema,
    promo: { type: String },
    itemsPrice: { type: Number },
    taxPrice: { type: Number },
    shippingPrice: { type: Number },
    totalPrice: { type: Number },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    sort: { type: String },
  },
  {
    timestamps: true,
  },
);

orderSchema.pre('save', function (next) {
  const doc = this;
  counter
    .findByIdAndUpdate(
      { _id: 'entityId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    )
    .then((count) => {
      doc.sort = count.seq;
      next();
    })
    .catch((error) => {
      throw error;
    });
});

const orderModel = mongoose.model('order', orderSchema);

export default orderModel;
