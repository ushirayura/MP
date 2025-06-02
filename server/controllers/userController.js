const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/models');

const generateJwt = (id, phone) => {
    const secretKey = process.env.SECRET_KEY || 'my_secret_key';
    return jwt.sign({ id, phone }, secretKey, { expiresIn: '24h' });
};

class UserController {
    async registration(req, res, next) {
        try {
            const { email, password, name, birthday, phone } = req.body;

            if (!phone || !password || !name || !birthday) {
                return next(ApiError.badRequest('Необходимо указать телефон, пароль, имя и дату рождения'));
            }

            const existingPhone = await User.findOne({ where: { phone } });
            if (existingPhone) {
                return next(ApiError.badRequest('Пользователь с таким номером телефона уже существует'));
            }

            if (email) {
                const existingEmail = await User.findOne({ where: { email } });
                if (existingEmail) {
                    return next(ApiError.badRequest('Пользователь с таким email уже существует'));
                }
            }

            const hashPassword = await bcrypt.hash(password, 5);

            const user = await User.create({
                email: email || null,
                password: hashPassword,
                name: name,
                birthday,
                phone
            });

            const token = generateJwt(user.idUser, user.phone);

            return res.json({
                token,
                user: {
                    id: user.idUser,
                    email: user.email,
                    name: user.name,
                    birthday: user.birthday,
                    phone: user.phone
                }
            });

        } catch (e) {
            console.error('Registration error:', e);
            return next(ApiError.internal(e.message));
        }
    }

    async login(req, res, next) {
        try {
            const { email, phone, password } = req.body;
    
            if (!password || (!phone && !email)) {
                return next(ApiError.badRequest('Необходимо указать пароль и номер телефона или email'));
            }
    
            let user;
            if (phone) {
                user = await User.findOne({ where: { phone } });
            }

            if (!user && email) {
                user = await User.findOne({ where: { email } });
            }
    
            if (!user) {
                return next(ApiError.internal('Пользователь не найден'));
            }

            const comparePassword = await bcrypt.compare(password, user.password);
            if (!comparePassword) {
                return next(ApiError.internal('Указан неверный пароль'));
            }
    
            const token = generateJwt(user.idUser, user.phone);
            return res.json({
                token,
                user: {
                    id: user.idUser,
                    email: user.email,
                    name: user.name,
                    birthday: user.birthday,
                    phone: user.phone
                }
            });
        } catch (e) {
            console.error('Login error:', e);
            return next(ApiError.internal(e.message));
        }    
    }

    async check(req, res, next) {
        const token = generateJwt(req.user.id, req.user.phone);
        res.json({token});
    }
}

module.exports = new UserController();
