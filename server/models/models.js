const sequelize = require('../db');
const { DataTypes } = require('sequelize');

const User = sequelize.define('user', {
    idUser: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    secondName: { type: DataTypes.STRING },
    middleName: { type: DataTypes.STRING },
    birthday: { type: DataTypes.DATE, allowNull: false },
    phone: { type: DataTypes.STRING, unique: true },
    email: { type: DataTypes.STRING, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    admin: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { freezeTableName: true });

const Product = sequelize.define('product', {
    idProduct: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'user', key: 'idUser' }
    },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: "active", allowNull: false },
    photo: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    rating: { type: DataTypes.FLOAT, defaultValue: 0 },
}, { freezeTableName: true });

const Rent = sequelize.define('rent', {
    idRent: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'user', key: 'idUser' }
    },
    idProduct: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'product', key: 'idProduct' }
    },
    status: { type: DataTypes.STRING, allowNull: false },
    dataStart: { type: DataTypes.DATE },
    dataEnd: { type: DataTypes.DATE },
}, { freezeTableName: true });

const Review = sequelize.define('review', {
    idReview: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'user', key: 'idUser' },
    },
    idProduct: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'product', key: 'idProduct' },
    },
    rate: { type: DataTypes.FLOAT, allowNull: false },
    comment: { type: DataTypes.TEXT },
    uploadDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { freezeTableName: true });

const Favourite = sequelize.define('favourite', {
    idFavourite: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'user', key: 'idUser' },
    },
    idProduct: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'product', key: 'idProduct' },
    }
}, { freezeTableName: true });

// Associations
User.hasMany(Product, { foreignKey: 'userId' });
User.hasMany(Rent, { foreignKey: 'idUser' });

Product.belongsTo(User, { foreignKey: 'userId' });
Product.hasMany(Rent, { foreignKey: 'idProduct' });

Rent.belongsTo(User, { foreignKey: 'idUser' });
Rent.belongsTo(Product, { foreignKey: 'idProduct' });

Product.hasMany(Review, { foreignKey: 'idProduct' });
Review.belongsTo(Product, { foreignKey: 'idProduct' });

User.hasMany(Review, { foreignKey: 'idUser' });
User.hasMany(Favourite, { foreignKey: 'userId' });
Favourite.belongsTo(User, { foreignKey: 'userId' });

Product.hasMany(Favourite, { foreignKey: 'idProduct' });
Favourite.belongsTo(Product, { foreignKey: 'idProduct' });

Review.belongsTo(User, { foreignKey: 'idUser' });

module.exports = {
    User,
    Product,
    Rent,
    Review,
    Favourite,
};
