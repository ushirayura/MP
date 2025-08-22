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

    async getProfile(req, res, next) {
        try {
            const userId = req.user.id; // берем id из токена

            const user = await User.findByPk(userId, {
                attributes: ['idUser', 'name', 'phone', 'email', 'birthday']
            });

            if (!user) {
                return next(ApiError.notFound('Пользователь не найден'));
            }

            return res.json({
                id: user.idUser,
                name: user.name,
                phone: user.phone,
                email: user.email,
                birthday: user.birthday
            });
        } catch (e) {
            console.error('Get profile error:', e);
            return next(ApiError.internal('Ошибка при получении данных пользователя'));
        }
    }

    async updateProfile(req, res, next) {
        try {
            const userId = req.user.id; // берём id из токена
            const { name, phone, email, birthday } = req.body;
            
            // Ищем пользователя по idUser
            const user = await User.findOne({ where: { idUser: userId } });
            if (!user) {
                return next(ApiError.notFound('Пользователь не найден'));
            }

            // Проверяем уникальность телефона
            if (phone && phone !== user.phone) {
                const existingPhone = await User.findOne({ where: { phone } });
                if (existingPhone) {
                    return next(ApiError.badRequest('Пользователь с таким номером телефона уже существует'));
                }
                user.phone = phone;
            }

            // Проверяем уникальность email
            if (email && email !== user.email) {
                const existingEmail = await User.findOne({ where: { email } });
                if (existingEmail) {
                    return next(ApiError.badRequest('Пользователь с таким email уже существует'));
                }
                user.email = email;
            }

            if (name) user.name = name;
            if (birthday) user.birthday = birthday;

            await user.save();

            return res.json({
                message: 'Данные пользователя успешно обновлены',
                user: {
                    id: user.idUser,
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                    birthday: user.birthday
                }
            });
        } catch (e) {
            console.error('Update profile error:', e);
            return next(ApiError.internal('Ошибка при обновлении данных пользователя'));
        }
    }

    async updatePassword(req, res, next) {
        try {
            const userId = req.user.id; // берём id пользователя из токена
            const { oldPassword, newPassword } = req.body;

            if (!oldPassword || !newPassword) {
                return next(ApiError.badRequest('Необходимо указать старый и новый пароли'));
            }

            const user = await User.findByPk(userId);
            if (!user) {
                return next(ApiError.notFound('Пользователь не найден'));
            }

            // Проверяем старый пароль
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return next(ApiError.badRequest('Старый пароль указан неверно'));
            }

            // Хэшируем и сохраняем новый пароль
            const hash = await bcrypt.hash(newPassword, 5);
            user.password = hash;
            await user.save();

            return res.json({ message: 'Пароль успешно изменён' });
        } catch (e) {
            console.error('Update password error:', e);
            return next(ApiError.internal('Ошибка при изменении пароля'));
        }
    }
}

module.exports = new UserController();
