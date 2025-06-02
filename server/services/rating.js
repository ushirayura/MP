const { Product } = require('../models');

module.exports = {
  async updateProductRating(review) {
    const product = await review.getProduct();
    const reviews = await product.getReviews();
    
    const ratingData = reviews.length > 0
      ? {
          rating: calculateAverageRating(reviews),
          reviewsCount: reviews.length
        }
      : {
          rating: 0,
          reviewsCount: 0
        };

    await product.update(ratingData);
  },

  async recalculateAllProductsRatings() {
    const products = await Product.findAll();
    await Promise.all(products.map(p => this.updateProductRatingsForProduct(p.id)));
  }
};

function calculateAverageRating(reviews) {
  const total = reviews.reduce((sum, r) => sum + r.rate, 0);
  return parseFloat((total / reviews.length).toFixed(2));
}
