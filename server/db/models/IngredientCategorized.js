const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const IngredientCategorized = sequelize.define('IngredientCategorized', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  foodClass: DataTypes.TEXT,
  description: { type: DataTypes.TEXT, allowNull: false },
  modifiedDate: DataTypes.DATE,
  availableDate: DataTypes.DATE,
  marketCountry: DataTypes.STRING,
  brandOwner: DataTypes.STRING,
  brandName: DataTypes.STRING,
  gtinUpc: DataTypes.STRING,
  dataSource: DataTypes.STRING,
  ingredients: DataTypes.TEXT,
  servingSize: DataTypes.DOUBLE,
  servingSizeUnit: DataTypes.STRING,
  householdServingFullText: DataTypes.STRING,
  shortDescription: DataTypes.STRING,
  brandedFoodCategory: DataTypes.TEXT,
  dataType: DataTypes.STRING,
  fdcId: DataTypes.INTEGER,
  publicationDate: DataTypes.DATE,
  packageWeight: DataTypes.STRING,
  allergens: DataTypes.ARRAY(DataTypes.STRING),
  SubcategoryID: DataTypes.INTEGER,
  canonicalTag: DataTypes.STRING,
  canonicalTagConfidence: DataTypes.STRING,
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false },
  canonicalTags: DataTypes.ARRAY(DataTypes.STRING),
  // Seller ownership fields
  seller_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Foreign key to Users table for seller ownership'
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0,
    },
    comment: 'Current stock quantity for this product'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Whether this product is available for purchase'
  }
}, {
  tableName: 'IngredientCategorized',
  timestamps: true,
  // Add model-level validations
  validate: {
    // Ensure stock quantity is non-negative
    stockQuantityNonNegative() {
      if (this.stock_quantity < 0) {
        throw new Error('Stock quantity cannot be negative');
      }
    },
    // Auto-deactivate if out of stock
    autoDeactivateOutOfStock() {
      if (this.stock_quantity === 0) {
        this.is_active = false;
      }
    },
  },
});

// Instance methods for product management
IngredientCategorized.prototype.isInStock = function() {
  return this.stock_quantity > 0 && this.is_active === true;
};

IngredientCategorized.prototype.isOutOfStock = function() {
  return this.stock_quantity === 0 || this.is_active === false;
};

IngredientCategorized.prototype.canBePurchased = function() {
  return this.isInStock();
};

// Class methods for product queries
IngredientCategorized.findActiveProducts = function() {
  return this.findAll({ 
    where: { 
      is_active: true 
    } 
  });
};

IngredientCategorized.findBySeller = function(sellerId) {
  return this.findAll({ 
    where: { 
      seller_id: sellerId,
      is_active: true 
    } 
  });
};

IngredientCategorized.findInStock = function() {
  return this.findAll({ 
    where: { 
      stock_quantity: { [sequelize.Op.gt]: 0 },
      is_active: true 
    } 
  });
};

IngredientCategorized.findOutOfStock = function() {
  return this.findAll({ 
    where: { 
      [sequelize.Op.or]: [
        { stock_quantity: 0 },
        { is_active: false }
      ]
    } 
  });
};

module.exports = IngredientCategorized;
