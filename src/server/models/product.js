import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userNickname: { type: String, required: true },
    name: { type: String, required: true },
    rating: { type: Number, default: 0 },
    comment: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);
const prodctSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: false },
    brand: { type: String, required: true },
    price: { type: Number, default: 0, required: true },
    category: { type: String, required: true },
    countInStock: { type: Number, default: 0, required: true },
    description: { type: String, default: 'Description', required: false },
    rating: { type: Number, default: 0, required: true },
    numReviews: { type: Number, default: 0, required: true },
    reviews: [reviewSchema],
  },
  {
    timestamps: true,
  },
);

const productModel = mongoose.model('product', prodctSchema);

export default productModel;
