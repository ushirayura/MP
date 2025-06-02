const { updateProductRating } = require('../services/rating.service');

module.exports = (Review) => {
  Review.afterCreate(updateProductRating);
  Review.afterUpdate(updateProductRating);
  Review.afterDestroy(updateProductRating);
};