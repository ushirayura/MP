# Запросы API
---

## UserController

Функция registration принимает HTTP-запрос с полями email, password, name, birthday и phone из объекта req.body. Она проверяет, что обязательные поля phone, password, name и birthday присутствуют, и возвращает ошибку 400 Bad Request, если какое-либо из них отсутствует. Далее функция обращается к базе данных через модель User и проверяет, не существует ли уже пользователь с указанным номером телефона. Если пользователь с таким телефоном найден, возвращается ошибка 400 Bad Request. Если в запросе указан email, выполняется дополнительная проверка на его уникальность аналогичным образом. После успешных проверок пароль хешируется с помощью bcrypt, после чего создается новая запись пользователя в базе данных с сохранением email (или null, если email не передан), захешированного пароля, имени, даты рождения и телефона. Затем генерируется JWT-токен, содержащий id пользователя и номер телефона, с помощью функции generateJwt, в которой секретный ключ берется из переменной окружения SECRET_KEY (или используется значение по умолчанию 'my_secret_key'), а срок действия токена устанавливается в 24 часа. В конце функция возвращает ответ в формате JSON, включающий сгенерированный токен и данные о новом пользователе (id, email, name, birthday, phone). В случае любых ошибок во время выполнения операций функция перехватывает исключение и передает его в следующий middleware в виде ApiError.internal с сообщением ошибки и кодом 500 Internal Server Error.

### Пример входных данных

```json
POST http://localhost:PORT/api/user/registration
Content-Type: application/json

{
  "email": "ivan.ivanov@example.com",
  "password": "MySecurePassword123",
  "name": "Иван Иванов",
  "birthday": "1990-05-15",
  "phone": "+79161234567"
}
```

### Возможные ошибки

- **400 Bad Request**: Отсутствует одно из обязательных полей:
  - `"phone" или "password" или "name" или "birthday"`.
  - Сообщение: `"Необходимо указать телефон, пароль, имя и дату рождения"`.
- **400 Bad Request**: Пользователь с указанным номером телефона уже существует.
  - Сообщение: `"Пользователь с таким номером телефона уже существует"`.
- **400 Bad Request**: (если передан email) Пользователь с указанным email уже существует.
  - Сообщение: `"Пользователь с таким email уже существует"`.
- **500 Internal Server Error**: Любые другие ошибки при работе с базой данных или хешированием.
  - Сообщение: информация об ошибке из `ApiError.internal`.

### Успешный выход

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicGhvbmUiOiIrNzkxNjEyMzQ1NjciLCJpYXQiOjE2ODA4MzE2MDAsImV4cCI6MTY4MDg2NDAwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "user": {
    "id": 1,
    "email": "ivan.ivanov@example.com",
    "name": "Иван Иванов",
    "birthday": "1990-05-15",
    "phone": "+79161234567"
  }
}
```

---

Функция login принимает HTTP-запрос с полями email, phone и password из объекта req.body. Она проверяет, что передан пароль и хотя бы одно из полей phone или email, и возвращает ошибку 400 Bad Request, если это условие не выполнено. Затем функция пытается найти пользователя в базе данных: если указан phone, поиск идет по этому полю, иначе, если пользователя не найден по телефону, проверяется наличие пользователя по переданному email. Если пользователь не найден, возвращается ошибка 500 Internal Server Error с сообщением 'Пользователь не найден'. После успешного поиска пользовательского объекта получается его сохраненный хеш пароля, и выполняется сравнение переданного пароля с хешем через bcrypt.compare. Если пароли не совпадают, возвращается ошибка 500 Internal Server Error с сообщением 'Указан неверный пароль'. В случае успешной верификации генерируется новый JWT-токен через generateJwt с id и телефоном пользователя, срок его действия также составляет 24 часа. Функция формирует и отправляет JSON-ответ, содержащий токен и данные пользователя (id, email, name, birthday, phone). При возникновении ошибок функция перехватывает исключение и возвращает ApiError.internal с соответствующим сообщением и кодом 500 Internal Server Error.

### Пример входных данных

```json
POST http://localhost:PORT/api/user/login
Content-Type: application/json

{
  "phone": "+79161234567",
  "password": "MySecurePassword123"
}
```
Или (при входе по email):
```json
POST /api/user/login
Content-Type: application/json

{
  "email": "ivan.ivanov@example.com",
  "password": "MySecurePassword123"
}
```

### Возможные ошибки

- **400 Bad Request**: Не передан пароль или не передан ни `phone`, ни `email`.  
  - Сообщение: `"Необходимо указать пароль и номер телефона или email"`.  
- **500 Internal Server Error**: Пользователь не найден ни по телефону, ни по email.  
  - Сообщение: `"Пользователь не найден"`.  
- **500 Internal Server Error**: Неверный пароль.  
  - Сообщение: `"Указан неверный пароль"`.  
- **500 Internal Server Error**: Любые другие ошибки при работе с базой данных или сравнения паролей.  
  - Сообщение: информация об ошибке из `ApiError.internal`.

### Успешный выход

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicGhvbmUiOiIrNzkxNjEyMzQ1NjciLCJpYXQiOjE2ODA4MzE2MDAsImV4cCI6MTY4MDg2NDAwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "user": {
    "id": 1,
    "email": "ivan.ivanov@example.com",
    "name": "Иван Иванов",
    "birthday": "1990-05-15",
    "phone": "+79161234567"
  }
}
```

---

### `getProfile(req, res, next)`

**Что делает:**  
1. Извлекает `userId` из `req.user.id` (предполагается, что аутентификационный middleware установил `req.user`).  
2. Находит пользователя в базе по первичному ключу через `User.findByPk`, запрашивая поля `idUser`, `name`, `phone`, `email`, `birthday`.  
3. Если пользователь не найден — вызывает `next(ApiError.notFound('Пользователь не найден'))`.  
4. Если пользователь найден — возвращает JSON с полями `id`, `name`, `phone`, `email`, `birthday`.  
5. При любой непредвиденной ошибке логгирует ошибку в консоль и вызывает `next(ApiError.internal('Ошибка при получении данных пользователя'))`.

**Пример запроса (HTTP GET `http://localhost:PORT/api/user/profile`):**  
```http
GET /api/user/profile HTTP/1.1
Host: localhost:PORT
Authorization: Bearer <JWT_TOKEN>
```

**Пример успешного ответа:**  
```json
{
  "id": 42,
  "name": "Иван Иванов",
  "phone": "+7 (900) 123-45-67",
  "email": "ivan@example.com",
  "birthday": "1990-05-20"
}
```

**Возможные ошибки:**  
- **404 Not Found** — пользователь с указанным `id` не найден.  
  - Сообщение: `Пользователь не найден`.  
- **500 Internal Server Error** — ошибка при выполнении запроса к базе или другая непредвиденная ошибка.  
  - Сообщение: `Ошибка при получении данных пользователя`.  
- **401 Unauthorized** — возможна, если аутентификационный middleware не установил `req.user` (т.е. отсутствует или недействителен токен).  
  - Поведение не реализовано в функции напрямую — предполагается, что аутентификация обрабатывается отдельно.

---

### `updateProfile(req, res, next)`

**Что делает:**  
1. Извлекает `userId` из `req.user.id` (предполагается, что аутентификационный middleware установил `req.user`).  
2. Извлекает из `req.body` поля `name`, `phone`, `email`, `birthday`.  
3. Находит пользователя в базе по `idUser` через `User.findOne({ where: { idUser: userId } })`.  
4. Если пользователь не найден — вызывает `next(ApiError.notFound('Пользователь не найден'))`.  
5. Если передан `phone` и он отличается от текущего, проверяет, существует ли другой пользователь с таким номером; если существует — вызывает `next(ApiError.badRequest('Пользователь с таким номером телефона уже существует'))`, иначе обновляет `user.phone`.  
6. Аналогично для `email`: проверяет уникальность и в случае совпадения — возвращает `ApiError.badRequest('Пользователь с таким email уже существует')`, иначе обновляет `user.email`.  
7. Обновляет `user.name` и `user.birthday`, если соответствующие поля переданы.  
8. Сохраняет изменения вызовом `user.save()`.  
9. Возвращает JSON с сообщением об успешном обновлении и данными обновлённого пользователя.  
10. При ошибке логгирует её в консоль и возвращает `next(ApiError.internal('Ошибка при обновлении данных пользователя'))`.

**Пример входных данных (HTTP PUT `http://localhost:PORT/api/user/updateProfile`):**  
```http
PUT /api/user/profile HTTP/1.1
Host: localhost:PORT
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "name": "Иван Петров",
  "phone": "+7 (900) 765-43-21",
  "email": "ivan.petrov@example.com",
  "birthday": "1988-11-02"
}
```

**Пример успешного ответа:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Данные пользователя успешно обновлены",
  "user": {
    "id": 42,
    "name": "Иван Петров",
    "phone": "+7 (900) 765-43-21",
    "email": "ivan.petrov@example.com",
    "birthday": "1988-11-02"
  }
}
```

**Возможные ошибки:**  
- **404 Not Found** — пользователь с указанным `id` не найден.  
  - Сообщение: `Пользователь не найден`.  
- **400 Bad Request** — попытка обновить `phone`, который уже используется другим пользователем.  
  - Сообщение: `Пользователь с таким номером телефона уже существует`.  
- **400 Bad Request** — попытка обновить `email`, который уже используется другим пользователем.  
  - Сообщение: `Пользователь с таким email уже существует`.  
- **500 Internal Server Error** — ошибка при выполнении операции сохранения или другая непредвиденная ошибка.  
  - Сообщение: `Ошибка при обновлении данных пользователя`.  
- **401 Unauthorized** — возможна, если аутентификационный middleware не установил `req.user` (отсутствует или недействителен токен).

---

### `updatePassword(req, res, next)`

**Что делает:**  
1. Извлекает `userId` из `req.user.id` (предполагается, что аутентификационный middleware установил `req.user`).  
2. Извлекает из `req.body` поля `oldPassword` и `newPassword`.  
3. Если одно из полей отсутствует — возвращает `next(ApiError.badRequest('Необходимо указать старый и новый пароли'))`.  
4. Находит пользователя по `userId` через `User.findByPk(userId)`.  
5. Если пользователь не найден — вызывает `next(ApiError.notFound('Пользователь не найден'))`.  
6. Сравнивает `oldPassword` с хешированным паролем пользователя с помощью `bcrypt.compare`. Если пароли не совпадают — возвращает `next(ApiError.badRequest('Старый пароль указан неверно'))`.  
7. Хеширует `newPassword` с помощью `bcrypt.hash(newPassword, 5)` и сохраняет в `user.password`.  
8. Сохраняет пользователя вызовом `user.save()`.  
9. Возвращает JSON-сообщение `{ message: 'Пароль успешно изменён' }`.  
10. При ошибке логгирует её в консоль и вызывает `next(ApiError.internal('Ошибка при изменении пароля'))`.

**Пример входных данных (HTTP PUT `http://localhost:PORT/api/user/updatePassword`):**
```http
PUT /api/user/password HTTP/1.1
Host: localhost:PORT
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "oldPassword": "old_pass_123",
  "newPassword": "NewSecurePass!234"
}
```

**Пример успешного ответа:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Пароль успешно изменён"
}
```

**Возможные ошибки:**  
- **400 Bad Request** — отсутствует `oldPassword` или `newPassword`.  
  - Сообщение: `Необходимо указать старый и новый пароли`.  
- **404 Not Found** — пользователь с указанным `id` не найден.  
  - Сообщение: `Пользователь не найден`.  
- **400 Bad Request** — указанный старый пароль не совпадает с текущим.  
  - Сообщение: `Старый пароль указан неверно`.  
- **500 Internal Server Error** — ошибка при хешировании или сохранении пользователя, либо другая непредвиденная ошибка.  
  - Сообщение: `Ошибка при изменении пароля`.  
- **401 Unauthorized** — возможна, если аутентификационный middleware не установил `req.user` (отсутствует или недействителен токен).

---

Функция check предназначена для проверки и обновления JWT-токена. Она вызывается после того, как промежуточный обрабатывающий слой (middleware) аутентифицировал пользователя и записал в объект req.user его id и phone. Функция генерирует новый JWT-токен через generateJwt на основе req.user.id и req.user.phone, тем самым продлевая срок действия токена еще на 24 часа. Затем она возвращает ответ в формате JSON, содержащий обновленный токен.

### Пример входных данных

```http
GET http://localhost:PORT/api/user/auth
Authorization: Bearer <существующий_jwt_токен>
```

### Возможные ошибки

- **401 Unauthorized**: Если токен в заголовке Authorization отсутствует или недействителен (это проверяется middleware).  
  - Сообщение: стандартное сообщение middleware о недействительном токене.  
- **500 Internal Server Error**: Любые другие ошибки при генерации нового токена.  
  - Сообщение: информация об ошибке из `ApiError.internal`.

### Успешный выход

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicGhvbmUiOiIrNzkxNjEyMzQ1NjciLCJpYXQiOjE2ODA4MzE2MDAsImV4cCI6MTY4MDg2NDAwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
}
```

---

## ProductController

### `create(req, res, next)`

**Что делает:**  
1. Извлекает из `req.body` поля `name`, `description`, `userId`, `category`, `photo`, `price` и опционально `rating`.  
2. Проверяет наличие обязательных полей `name`, `description`, `userId`, `category`, `photo`, `price`; при их отсутствии возвращает `ApiError.badRequest`.  
3. Создаёт новую запись продукта в базе данных через модель `Product.create` с указанными полями.  
4. Возвращает в ответе статус `201 Created` и JSON-объект, содержащий данные созданного продукта.  
5. В случае ошибки (например, ошибка валидации Sequelize) вызывает `next(ApiError.badRequest(e.message))`, возвращая ошибку `400 Bad Request` с сообщением ошибки.

**Пример входных данных (HTTP POST `http://localhost:PORT/api/product/create`):**  
```json
{
  "name": "iPhone 14 Pro",
  "description": "Смартфон Apple последнего поколения",
  "userId": 1,
  "category": "Electronics",
  "photo": "https://example.com/photos/iphone14pro.png",
  "price": 999.99,
  "rating": 4.8
}
```

**Возможные ошибки:**  
- **400 Bad Request** — отсутствуют обязательные поля `name`, `description`, `userId`, `category`, `photo` или `price`.  
  - Сообщение: `Поля name, description, userId, category, photo и price обязательны`.  
- **400 Bad Request** — ошибка валидации или другая ошибка при создании записи (например, сообщение из `Sequelize`).  
  - Сообщение: текст ошибки из `e.message`.

**Успешный выход:**  
```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 10,
  "name": "iPhone 14 Pro",
  "description": "Смартфон Apple последнего поколения",
  "userId": 1,
  "category": "Electronics",
  "photo": "https://example.com/photos/iphone14pro.png",
  "price": 999.99,
  "rating": 4.8,
  "createdAt": "2025-06-03T10:15:30.000Z",
  "updatedAt": "2025-06-03T10:15:30.000Z"
}
```

---

### `sort(req, res, next)`

**Что делает:**  
1. Извлекает из `req.query` параметры фильтрации: `category`, `name`, `minPrice`, `maxPrice`, `onlyTopRated`, `userId`.  
2. Формирует объект `where` для фильтрации записей в базе данных:  
   - Если указан `userId`, добавляет условие `where.userId = userId`.  
   - Если указана `category`, добавляет условие `where.category = category`.  
   - Если указано `name`, добавляет условие типа `ILIKE %name%` для поиска по подстроке (независимо от регистра).  
   - Если указаны `minPrice` или `maxPrice`, добавляет диапазон для поля `price` (используя операторы `Op.gte` и `Op.lte`).  
   - Если параметр `onlyTopRated` равен `"true"`, добавляет фильтрацию по рейтингу: `rating` от `4` до `5`.  
3. Вызывает `Product.findAll({ where })` и возвращает JSON-массив продуктов, удовлетворяющих условиям.  
4. Если возникает ошибка при запросе к базе, вызывает `next(ApiError.internal(e))`, возвращая ошибку `500 Internal Server Error`.  

---

**Пример входных данных (HTTP GET `http://localhost:PORT/api/product/sort`):**  
```
GET http://localhost:PORT/api/product/sort?category=Electronics&name=iPhone&minPrice=500&maxPrice=1500&onlyTopRated=true&userId=1
```

---

**Возможные ошибки:**  
- **500 Internal Server Error**: Ошибка при формировании или выполнении запроса к базе данных (например, некорректное значение фильтра).  
  - Сообщение: информация об ошибке из `ApiError.internal`.  

---

**Успешный выход:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": 10,
    "name": "iPhone 14 Pro",
    "description": "Смартфон Apple последнего поколения",
    "userId": 1,
    "category": "Electronics",
    "price": 999.99,
    "rating": 4.8,
    "createdAt": "2025-06-03T10:15:30.000Z",
    "updatedAt": "2025-06-03T10:15:30.000Z"
  }
]
```


### `getOne(req, res, next)`

**Что делает:**  
1. Извлекает из `req.params` параметр `id`, который трактуется как `userId`.  
2. Вызывает `Product.findAll({ where: { userId: id } })` для получения всех продуктов пользователя с указанным `userId`.  
3. Если массив `products` пустой (пользователь не имеет ни одного продукта), возвращает `400 Bad Request` с сообщением `'Товары пользователя не найдены'`.  
4. В противном случае возвращает JSON-массив всех найденных продуктов.  
5. В случае ошибки при выполнении запроса к базе данных вызывает `next(ApiError.badRequest(e))`.

**Пример входных данных (HTTP GET `http://localhost:PORT/api/product/1`):**  
```
GET http://localhost:PORT/api/product/1
```
(где `1` — это `userId`)

**Возможные ошибки:**  
- **400 Bad Request**: Пользователь с указанным `userId` не имеет ни одного продукта.  
  - Сообщение: `"Товары пользователя не найдены"`.  
- **400 Bad Request**: Любая другая ошибка при выполнении запроса (например, некорректный `id`).  
  - Сообщение: информация об ошибке из `ApiError.badRequest`.

**Успешный выход:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": 10,
    "name": "iPhone 14 Pro",
    "description": "Смартфон Apple последнего поколения",
    "userId": 1,
    "category": "Electronics",
    "price": 999.99,
    "rating": 4.8,
    "createdAt": "2025-06-03T10:15:30.000Z",
    "updatedAt": "2025-06-03T10:15:30.000Z"
  },
  {
    "id": 11,
    "name": "MacBook Pro 16",
    "description": "Ноутбук Apple для профессионалов",
    "userId": 1,
    "category": "Electronics",
    "price": 2499.99,
    "rating": 4.9,
    "createdAt": "2025-04-10T12:00:00.000Z",
    "updatedAt": "2025-04-10T12:00:00.000Z"
  }
]
```

---

### `remove(req, res, next)`

**Что делает:**  
1. Извлекает из `req.body` параметры: `userId` и `productId`.  
2. Проверяет:  
   - Если один из параметров отсутствует, вызывает ошибку `400 Bad Request` с сообщением:  
     *"Не указан userId или productId"*.  
3. Выполняет удаление записи из базы (`Product.destroy`) с условием:  
   - `userId` совпадает с переданным;  
   - `idProduct` совпадает с переданным `productId`.  
4. Если удаление не произошло (`deletedCount === 0`), возвращает ошибку `400 Bad Request` с сообщением:  
   *"Данный товар уже удалён или не принадлежит пользователю"*.  
5. Если удаление прошло успешно — возвращает JSON-ответ с сообщением об успешном удалении.  
6. В случае исключения возвращает ошибку `400 Bad Request` через `ApiError.badRequest`.  

---

**Пример входных данных (HTTP DELETE `http://localhost:PORT/api/product/delete`):**  
```json
{
  "userId": 1,
  "productId": 12
}
```

---

**Возможные ошибки:**  
- **400 Bad Request**:  
  - Не указан `userId` или `productId`;  
  - Указанный товар не существует или не принадлежит пользователю;  
  - Ошибка при выполнении операции (текст ошибки из `ApiError.badRequest`).  

---

**Успешный выход:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Объявление удалено"
}
```

---

## FavouriteController

### `create(req, res, next)`

**Что делает:**  
1. Извлекает из `req.body` поля `userId` и `productId`.  
2. Проверяет, что оба поля переданы; если нет — возвращает ошибку `400 Bad Request` с сообщением `"Не указан userId или productId"`.  
3. В базе данных через модель `User.findByPk` проверяет, существует ли пользователь с указанным `userId`; если нет — возвращает ошибку `400 Bad Request` с сообщением `"Пользователь с id=<userId> не найден"`.  
4. Через модель `Product.findByPk` проверяет, существует ли товар с указанным `productId`; если нет — возвращает ошибку `400 Bad Request` с сообщением `"Товар с id=<productId> не найден"`.  
5. Проверяет, есть ли уже запись о добавлении данного товара в избранное для этого пользователя: `Favourite.findOne({ where: { userId, idProduct: productId } })`. Если запись найдена — возвращает ошибку `409 Conflict` с сообщением `"Этот товар уже находится в избранном у данного пользователя"`.  
6. Создаёт новую запись в таблице избранного: `Favourite.create({ userId, idProduct: productId })`.  
7. Возвращает JSON-ответ с сообщением `"Товар успешоно добавлен в избранное"` и информацией о созданной записи `favourite`.  
8. В случае любых других ошибок вызывает `next(ApiError.internal(e))`, возвращая ошибку `500 Internal Server Error`.

**Пример входных данных (HTTP POST `http://localhost:PORT/api/favourite/create`):**  
```json
{
  "userId": 1,
  "productId": 10
}
```

**Возможные ошибки:**  
- **400 Bad Request**: Не передан `userId` или `productId`.  
  - Сообщение: `"Не указан userId или productId"`.  
- **400 Bad Request**: Пользователь с указанным `userId` не найден.  
  - Сообщение: `"Пользователь с id=<userId> не найден"`.  
- **400 Bad Request**: Товар с указанным `productId` не найден.  
  - Сообщение: `"Товар с id=<productId> не найден"`.  
- **409 Conflict**: Запись уже существует в избранном.  
  - Сообщение: `"Этот товар уже находится в избранном у данного пользователя"`.  
- **500 Internal Server Error**: Любые другие ошибки при работе с базой данных.  
  - Сообщение: информация об ошибке из `ApiError.internal`.

**Успешный выход:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Товар успешоно добавлен в избранное",
  "favourite": {
    "id": 5,
    "userId": 1,
    "idProduct": 10,
    "createdAt": "2025-06-03T11:00:00.000Z",
    "updatedAt": "2025-06-03T11:00:00.000Z"
  }
}
```

---

### `remove(req, res, next)`

**Что делает:**  
1. Извлекает из `req.body` поля `userId` и `productId`.  
2. Проверяет, что оба поля переданы; если нет — возвращает ошибку `400 Bad Request` с сообщением `"Не указан userId или productId"`.  
3. Вызывает `Favourite.destroy({ where: { userId, idProduct: productId } })` для удаления записи из таблицы избранного.  
4. Если `deletedCount === 0` (не найдено ни одной записи для удаления) — возвращает ошибку `400 Bad Request` с сообщением `"Запись не найдена в избранном"`.  
5. В случае успешного удаления возвращает JSON-ответ с сообщением `"Товар удалён из избранного"`.  
6. В случае любых других ошибок вызывает `next(ApiError.internal(e))`, возвращая ошибку `500 Internal Server Error`.

**Пример входных данных (HTTP DELETE `http://localhost:PORT/api/favourite/delete`):**  
```json
{
  "userId": 1,
  "productId": 10
}
```

**Возможные ошибки:**  
- **400 Bad Request**: Не передан `userId` или `productId`.  
  - Сообщение: `"Не указан userId или productId"`.  
- **400 Bad Request**: Запись не найдена в избранном (ничего не удалено).  
  - Сообщение: `"Запись не найдена в избранном"`.  
- **500 Internal Server Error**: Любые другие ошибки при работе с базой данных.  
  - Сообщение: информация об ошибке из `ApiError.internal`.

**Успешный выход:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Товар удалён из избранного"
}
```

---

### `getOne(req, res, next)`

**Что делает:**  
1. Извлекает из `req.params` параметр `userId`.  
2. Проверяет, что `userId` передан; если нет — возвращает ошибку `400 Bad Request` с сообщением `"Не указан userId"`.  
3. Через модель `User.findByPk(userId)` проверяет, существует ли пользователь с данным `userId`; если нет — возвращает ошибку `400 Bad Request` с сообщением `"Пользователь с id=<userId> не найден"`.  
4. Получает все записи избранного пользователя: `Favourite.findAll({ where: { userId }, attributes: ['idProduct'] })`.  
5. Если не найдено ни одной записи (массив пустой) — возвращает JSON-ответ `{ userId: <userId>, products: [] }`.  
6. Извлекает массив `productIds` из результатов (поле `idProduct` каждой записи).  
7. Получает список продуктов по этим `productIds`: `Product.findAll({ where: { idProduct: productIds }, attributes: ['idProduct', 'name', 'description', 'price', 'category', 'rating'] })`.  
8. Возвращает JSON-ответ `{ userId: <userId>, products: [...] }` со списком найденных продуктов.  
9. В случае любых других ошибок вызывает `next(ApiError.internal(e))`, возвращая ошибку `500 Internal Server Error`.

**Пример входных данных (HTTP GET `http://localhost:PORT/api/favourite/1`):**  
```
GET http://localhost:PORT/api/favourite/1
```
(где `1` — значение `userId`)

**Возможные ошибки:**  
- **400 Bad Request**: Не передан `userId` в параметрах.  
  - Сообщение: `"Не указан userId"`.  
- **400 Bad Request**: Пользователь с указанным `userId` не найден.  
  - Сообщение: `"Пользователь с id=<userId> не найден"`.  
- **500 Internal Server Error**: Любые другие ошибки при работе с базой данных.  
  - Сообщение: информация об ошибке из `ApiError.internal`.

**Успешный выход:**  
1. Если у пользователя нет товаров в избранном:
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "userId": 1,
  "products": []
}
```
2. Если у пользователя есть товары в избранном:
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "userId": 1,
  "products": [
    {
      "idProduct": 10,
      "name": "iPhone 14 Pro",
      "description": "Смартфон Apple последнего поколения",
      "price": 999.99,
      "category": "Electronics",
      "rating": 4.8
    },
    {
      "idProduct": 11,
      "name": "MacBook Pro 16",
      "description": "Ноутбук Apple для профессионалов",
      "price": 2499.99,
      "category": "Electronics",
      "rating": 4.9
    }
  ]
}
```


## RentController

### `create(req, res, next)`

**Что делает:**
1. Извлекает из `req.body` поля `idProduct`, `dataStart`, `dataEnd` и `req.user.idUser` (арендатор).
2. Проверяет, что все поля переданы; если нет — возвращает ошибку `400 Bad Request` с сообщением `"idProduct, dataStart и dataEnd обязательны"`.
3. Валидирует даты: они должны быть корректными и `dataStart < dataEnd`. Иначе возвращается ошибка `400 Bad Request`.
4. Проверяет наличие товара по `idProduct`. Если товар не найден — возвращает ошибку `404 Not Found`.
5. Запрещает арендовать собственный товар (`product.userId === renterId`).
6. Проверяет пересечение дат с уже существующими подтверждёнными (`status: accepted`) арендами. Если есть конфликт — возвращает ошибку `400 Bad Request` с сообщением `"Товар уже арендован в этот период"`.
7. Создаёт новую запись в таблице аренды (`Rent.create`) со статусом `"pending"`.
8. Возвращает JSON-ответ с созданной записью и статусом `201 Created`.

**Пример входных данных (HTTP POST `http://localhost:PORT/api/rent/create`):**
```json
{
  "idProduct": 10,
  "dataStart": "2025-06-03",
  "dataEnd": "2025-06-10"
}
```

**Возможные ошибки:**
- **400 Bad Request**: Не переданы обязательные поля или некорректные даты.
- **400 Bad Request**: Нельзя арендовать собственный товар.
- **400 Bad Request**: Даты пересекаются с существующей арендой.
- **404 Not Found**: Товар не найден.
- **500 Internal Server Error**: Любые другие ошибки при работе с базой данных.

**Успешный выход:**
```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "idRent": 7,
  "idUser": 2,
  "idProduct": 10,
  "status": "pending",
  "dataStart": "2025-06-03T00:00:00.000Z",
  "dataEnd": "2025-06-10T00:00:00.000Z",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### `getAll(req, res, next)`

**Что делает:**  
1. Извлекает `userId` из `req.user.idUser` или `req.user.id`.  
2. Если `userId` не найден — возвращает `ApiError.unauthorized('Не авторизован')`.  
3. Получает список продуктов текущего пользователя через `Product.findAll`, возвращая только `idProduct`.  
4. Формирует условие поиска `where`, включающее:
   - все аренды, где `idUser` равен `userId` (текущий пользователь арендатор),  
   - а также аренды продуктов, принадлежащих пользователю (`idProduct` входит в список продуктов пользователя).  
5. Выполняет запрос `Rent.findAll` с `include`:
   - `Product` (атрибуты: `name`, `photo`, плюс вложенный `User` с атрибутами `name`, `phone`),  
   - `User` (атрибуты: `name`, `phone`).  
6. Сортирует результаты по `dataStart` в порядке убывания.  
7. Преобразует результат в удобный формат, определяя роль пользователя (арендатор или владелец).  
   - Если текущий пользователь арендатор (`r.idUser === userId`), то поле `other` заполняется владельцем продукта.  
   - Если владелец — то поле `other` заполняется арендатором.  
8. Возвращает массив объектов с полями:  
   - `idRent`  
   - `productName`  
   - `photo`  
   - `dataStart`  
   - `dataEnd`  
   - `otherName`  
   - `otherPhone`  
   - `status`  
9. В случае ошибки передаёт её в `next(e)`.

**Пример запроса (HTTP GET `http://localhost:PORT/api/rent/getAll`):**  
```http
GET /api/rent/all HTTP/1.1
Host: localhost:PORT
Authorization: Bearer <JWT_TOKEN>
```

**Пример успешного ответа:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "idRent": 101,
    "productName": "iPhone 14 Pro",
    "photo": "https://example.com/photos/iphone14pro.png",
    "dataStart": "2025-07-01T10:00:00.000Z",
    "dataEnd": "2025-07-10T18:00:00.000Z",
    "otherName": "Иван Иванов",
    "otherPhone": "+7 (900) 123-45-67",
    "status": "active"
  },
  {
    "idRent": 102,
    "productName": "PlayStation 5",
    "photo": "https://example.com/photos/ps5.png",
    "dataStart": "2025-06-15T12:00:00.000Z",
    "dataEnd": "2025-06-20T20:00:00.000Z",
    "otherName": "Петр Петров",
    "otherPhone": "+7 (900) 987-65-43",
    "status": "completed"
  }
]
```

**Возможные ошибки:**  
- **401 Unauthorized** — если `req.user` отсутствует или не содержит `idUser`/`id`.  
  - Сообщение: `Не авторизован`.  
- **500 Internal Server Error** — ошибка при запросе к базе данных или любая другая непредвиденная ошибка.  
```

---

### `updateStatus(req, res, next)`

**Что делает:**
1. Извлекает `id` аренды из `req.params` и новый `status` из `req.body`.
2. Проверяет корректность параметров: `id` должен быть числом, `status` — одним из `"accepted"` или `"rejected"`.
3. Ищет аренду по ID. Если не найдена — возвращает `404 Not Found`.
4. Проверяет, что арендодатель (`req.user.id`) действительно владелец товара.
5. Обновляет статус аренды и сохраняет изменения.
6. Возвращает обновлённую запись.

**Пример входных данных (HTTP PATCH `http://localhost:PORT/api/rent/5/status`):**
```json
{
  "status": "accepted"
}
```

**Возможные ошибки:**
- **400 Bad Request**: Некорректные параметры.
- **403 Forbidden**: Пользователь не является владельцем товара.
- **404 Not Found**: Запрос на аренду не найден.
- **500 Internal Server Error**: Ошибка базы данных.

**Успешный выход:**
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "idRent": 5,
  "idUser": 2,
  "idProduct": 10,
  "status": "accepted",
  "dataStart": "2025-06-03T00:00:00.000Z",
  "dataEnd": "2025-06-10T00:00:00.000Z",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### `getPending(req, res, next)`

**Что делает:**  
1. Извлекает `userId` из `req.user.idUser` или `req.user.id`.  
2. Если `userId` отсутствует — возвращает `ApiError.unauthorized('Не авторизован')`.  
3. Выполняет запрос `Rent.findAll`, выбирая все аренды, где:  
   - `idUser` = текущий пользователь,  
   - `status` = `'pending'`.  
4. Включает связанные данные `Product` (поля: `name`, `photo`).  
5. Сортирует результаты по `dataStart` в порядке возрастания.  
6. Преобразует результат в массив объектов с полями:  
   - `idRent`  
   - `productName`  
   - `photo`  
   - `dataStart`  
   - `dataEnd`  
7. Возвращает массив в JSON-формате.  
8. В случае ошибки передаёт её в `next(e)`.

**Пример запроса (HTTP GET `http://localhost:PORT/api/rent/pending`):**
```http
GET /api/rent/pending HTTP/1.1
Host: localhost:PORT
Authorization: Bearer <JWT_TOKEN>
```

**Пример успешного ответа:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "idRent": 201,
    "productName": "MacBook Pro 16",
    "photo": "https://example.com/photos/macbook.png",
    "dataStart": "2025-08-01T09:00:00.000Z",
    "dataEnd": "2025-08-10T18:00:00.000Z"
  },
  {
    "idRent": 202,
    "productName": "Велосипед Trek",
    "photo": "https://example.com/photos/bike.png",
    "dataStart": "2025-08-05T08:00:00.000Z",
    "dataEnd": "2025-08-07T20:00:00.000Z"
  }
]
```

**Возможные ошибки:**  
- **401 Unauthorized** — если `req.user` отсутствует или не содержит `idUser`/`id`.  
  - Сообщение: `Не авторизован`.  
- **500 Internal Server Error** — ошибка при запросе к базе данных или любая другая непредвиденная ошибка.  


## ReviewController

### `create(req, res, next)`

**Что делает:**  
1. Извлекает `userId` из `req.user.idUser` или `req.user.id`.  
2. Извлекает из `req.body` поля `idProduct`, `rate`, `comment`.  
3. Если `userId` отсутствует — возвращает `ApiError.unauthorized('Не авторизован')`.  
4. Валидирует входные данные:  
   - `idProduct` должен быть числом, иначе возвращается `ApiError.badRequest('Неверный idProduct')`.  
   - `rate` должен быть числом от `1` до `5`. При неверном формате или диапазоне возвращается ошибка `ApiError.badRequest`.  
5. Находит товар по `idProduct` через `Product.findByPk`. Если не найден — `ApiError.notFound('Товар не найден')`.  
6. Проверяет, имеет ли пользователь право оставить отзыв (`canUserLeaveReview`). Если нет — `ApiError.forbidden('Нельзя оставлять отзыв: нет завершённой аренды этого товара')`.  
7. Создаёт транзакцию `sequelize.transaction()`.  
   - Проверяет, существует ли уже отзыв пользователя для данного товара (`Review.findOne`). Если да — откат транзакции и ошибка `ApiError.badRequest('Вы уже оставили отзыв для этого товара')`.  
   - Создаёт новый отзыв (`Review.create`) с полями `idUser`, `idProduct`, `rate`, `comment`, `uploadDate`.  
   - Пересчитывает средний рейтинг (`AVG(rate)`) по всем отзывам товара.  
   - Обновляет поле `rating` в `Product` через `Product.update`.  
   - Фиксирует транзакцию `commit`.  
8. Возвращает ответ со статусом `201 Created` и созданным отзывом.  
9. В случае ошибки — откатывает транзакцию и передаёт ошибку в `next(e)`.

**Пример входных данных (HTTP POST `http://localhost:PORT/api/review/create`):**  
```json
{
  "idProduct": 10,
  "rate": 5,
  "comment": "Отличный товар, всё понравилось!"
}
```

**Пример успешного ответа:**  
```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "idReview": 55,
  "idUser": 42,
  "idProduct": 10,
  "rate": 5,
  "comment": "Отличный товар, всё понравилось!",
  "uploadDate": "2025-08-22T15:40:00.000Z"
}
```

**Возможные ошибки:**  
- **401 Unauthorized** — пользователь не авторизован.  
  - Сообщение: `Не авторизован`.  
- **400 Bad Request** — неверный формат `idProduct` или `rate`, либо уже существует отзыв для этого товара.  
  - Сообщения:  
    - `Неверный idProduct`  
    - `Неверный формат rate`  
    - `rate вне допустимого диапазона (1-5)`  
    - `Вы уже оставили отзыв для этого товара`  
- **404 Not Found** — товар не найден.  
  - Сообщение: `Товар не найден`.  
- **403 Forbidden** — пользователь не имеет права оставить отзыв (нет завершённой аренды).  
  - Сообщение: `Нельзя оставлять отзыв: нет завершённой аренды этого товара`.  
- **500 Internal Server Error** — ошибка при сохранении отзыва или обновлении рейтинга.
```

---

### `getAllByProduct(req, res, next)`

**Что делает:**  
1. Извлекает `idProduct` из `req.body.idProduct` и преобразует его в число.  
   - Если `idProduct` не число — возвращает `ApiError.badRequest('Неверный idProduct в теле запроса')`.  
2. Проверяет существование продукта через `Product.findByPk`.  
   - Если продукт не найден — возвращает `ApiError.notFound('Товар не найден')`.  
3. Находит все отзывы (`Review.findAll`) по указанному `idProduct`, включая данные пользователя (`User` с атрибутами `idUser`, `name`, `secondName`, `middleName`).  
   - Сортирует отзывы по `uploadDate` в порядке убывания (сначала новые).  
4. Считает агрегаты:  
   - средний рейтинг (`AVG(rate)`),  
   - количество отзывов (длина массива `rows`).  
5. Возвращает JSON с полями:  
   - `productId`  
   - `stats` (средний рейтинг и количество отзывов)  
   - `reviews` (массив отзывов).  
6. В случае ошибки — передаёт её в `next(e)`.

**Пример входных данных (HTTP POST `http://localhost:PORT/api/review/getAllByProduct`):**  
```json
{
  "idProduct": 10
}
```

**Пример успешного ответа:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "productId": 10,
  "stats": {
    "avgRating": 4.5,
    "countReviews": 2
  },
  "reviews": [
    {
      "idReview": 101,
      "idUser": 42,
      "idProduct": 10,
      "rate": 5,
      "comment": "Отличный товар!",
      "uploadDate": "2025-08-15T10:00:00.000Z",
      "user": {
        "idUser": 42,
        "name": "Иван",
        "secondName": "Иванов",
        "middleName": "Иванович"
      }
    },
    {
      "idReview": 95,
      "idUser": 43,
      "idProduct": 10,
      "rate": 4,
      "comment": "Хороший товар, но доставка задержалась",
      "uploadDate": "2025-08-10T12:30:00.000Z",
      "user": {
        "idUser": 43,
        "name": "Петр",
        "secondName": "Петров",
        "middleName": "Сергеевич"
      }
    }
  ]
}
```

**Возможные ошибки:**  
- **400 Bad Request** — `idProduct` не является числом.  
  - Сообщение: `Неверный idProduct в теле запроса`.  
- **404 Not Found** — товар с указанным `idProduct` не найден.  
  - Сообщение: `Товар не найден`.  
- **500 Internal Server Error** — ошибка при запросе отзывов или подсчёте агрегатов.
```

---

### `getAllByUser(req, res, next)`

**Что делает:**  
1. Извлекает `idUser` из авторизованного пользователя (`req.user.id`).  
2. Проверяет существование пользователя в базе (`User.findByPk`).  
3. Если пользователь не найден, возвращает ошибку `404 Not Found`.  
4. Ищет все отзывы (`Review.findAll`) пользователя с указанным `idUser`.  
   - Подгружает связанные товары (`Product`) с полями: `idProduct`, `name`, `description`, `price`.  
   - Сортирует по дате загрузки (`uploadDate`) в порядке убывания.  
5. Возвращает JSON с `userId` и списком отзывов.  
6. В случае ошибки логирует её и возвращает `500 Internal Server Error`.

**Пример запроса (HTTP GET `http://localhost:PORT/api/review/getAllByUser`):**  
```json
Headers: {
  "Authorization": "Bearer <token>"
}
```

**Пример успешного ответа:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "userId": 7,
  "reviews": [
    {
      "idReview": 12,
      "idUser": 7,
      "idProduct": 101,
      "rate": 4,
      "comment": "Хороший товар",
      "uploadDate": "2025-08-01T12:00:00.000Z",
      "product": {
        "idProduct": 101,
        "name": "Наушники",
        "description": "Беспроводные Bluetooth-наушники",
        "price": 2999.99
      }
    }
  ]
}
```

**Возможные ошибки:**  
- **401 Unauthorized**: отсутствует или неверный токен авторизации.  
- **404 Not Found**: пользователь не найден.  
  - Сообщение: `"Пользователь не найден"`.  
- **500 Internal Server Error**: ошибка при получении отзывов.  
  - Сообщение: `"Ошибка при получении отзывов пользователя"`.
```

---

### `getStatsByProduct(req, res, next)`

**Что делает:**  
1. Проверяет наличие тела запроса и поля `idProduct`.  
2. Валидирует `idProduct` (ожидается число).  
3. Проверяет существование товара в базе (`Product.findByPk`).  
4. Выполняет запрос к таблице `Review` для получения агрегатов:  
   - количество отзывов (`COUNT`)  
   - средний рейтинг (`AVG`)  
5. Возвращает объект JSON с `productId`, количеством отзывов и средним рейтингом.  
6. В случае ошибки возвращает соответствующую ошибку через `ApiError`.  

**Пример входных данных (HTTP POST `http://localhost:PORT/api/review/getStatsByProduct`):**  
```json
{
  "idProduct": 5
}
```

**Возможные ошибки:**  
- **400 Bad Request**:  
  - Тело запроса отсутствует.  
  - `idProduct` отсутствует или имеет неверный формат (не число).  
  - Сообщение: `"Тело запроса отсутствует..."`, `"В теле запроса не найден idProduct"`, `"Неверный idProduct..."`.  
- **404 Not Found**:  
  - Товар с указанным `idProduct` не найден.  
  - Сообщение: `"Товар не найден"`.  
- **500 Internal Server Error**:  
  - Непредвиденная ошибка при получении статистики.  
  - Сообщение: `"Непредвиденная ошибка при получении статистики отзывов."`.

**Успешный выход:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "productId": 5,
  "countReviews": 12,
  "avgRating": 4.3
}
```

---

### `getStatsByUser(req, res, next)`

**Что делает:**  
1. Определяет `idUser` из авторизованного пользователя (`req.user.id`).  
2. Проверяет, существует ли пользователь в базе (`User.findByPk`). Если нет — возвращает ошибку `404 Not Found`.  
3. Считает средний рейтинг (`AVG(rate)`) и количество отзывов (`COUNT`) из таблицы `Review` для данного пользователя.  
4. Возвращает JSON-объект со статистикой отзывов: `userId`, средняя оценка (`avgRating`), общее количество отзывов (`totalReviews`).  

**Пример запроса (HTTP GET `http://localhost:PORT/api/review/getStatsByUser`):**  
```json
Headers:
{
  "Authorization": "Bearer <token>"
}
```

**Пример успешного ответа:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "userId": 12,
  "avgRating": 4.3,
  "totalReviews": 15
}
```

**Возможные ошибки:**  
- **401 Unauthorized**: если пользователь не авторизован или `req.user` отсутствует.  
  - Сообщение: `"Не авторизован"`.  
- **404 Not Found**: если пользователь не найден в базе.  
  - Сообщение: `"Пользователь не найден"`.  
- **500 Internal Server Error**: внутренняя ошибка при выполнении запроса.  
  - Сообщение: `"Ошибка при получении статистики отзывов пользователя"`.  
```

---

### `getOne(req, res, next)`

**Что делает:**  
1. Извлекает `idReview` из параметров запроса (`req.params`).  
2. Проверяет корректность `idReview` (должно быть числом). Если невалидно — возвращает `400 Bad Request`.  
3. Ищет отзыв по `idReview` в базе (`Review.findByPk`), включая данные:  
   - Пользователя (`idUser`, `name`, `secondName`, `middleName`)  
   - Товара (`idProduct`, `name`, `description`, `price`)  
4. Если отзыв не найден — возвращает `404 Not Found`.  
5. Проверяет, совпадает ли `idUser` из отзыва с текущим авторизованным пользователем. Если нет — `403 Forbidden`.  
6. Если всё корректно — возвращает JSON-объект отзыва.  

**Пример запроса (HTTP GET `http://localhost:PORT/api/review/getOne/15`):**  
```json
Headers:
{
  "Authorization": "Bearer <token>"
}
```

**Пример успешного ответа:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "idReview": 15,
  "rate": 5,
  "comment": "Отличный товар!",
  "uploadDate": "2025-05-01T12:34:56.000Z",
  "user": {
    "idUser": 12,
    "name": "Иван",
    "secondName": "Иванов",
    "middleName": "Иванович"
  },
  "product": {
    "idProduct": 7,
    "name": "Велосипед",
    "description": "Горный велосипед с амортизатором",
    "price": 15000
  }
}
```

**Возможные ошибки:**  
- **400 Bad Request**: некорректный параметр `idReview`.  
  - Сообщение: `"Некорректный idReview"`.  
- **404 Not Found**: отзыв не найден.  
  - Сообщение: `"Отзыв не найден"`.  
- **403 Forbidden**: пользователь пытается просмотреть чужой отзыв.  
  - Сообщение: `"Вы не можете просматривать чужой отзыв"`.  
- **500 Internal Server Error**: внутренняя ошибка при выполнении запроса.  
  - Сообщение: `"Ошибка при получении отзыва"`.  
```

---

### `update(req, res, next)`

**Что делает:**  
1. Извлекает `idReview`, `rate` и `comment` из тела запроса (`req.body`).  
2. Проверяет наличие `idReview`. Если не передан — возвращает `400 Bad Request`.  
3. Ищет отзыв по `idReview` в базе (`Review.findByPk`).  
4. Если отзыв не найден — возвращает `404 Not Found`.  
5. Проверяет, совпадает ли `idUser` из отзыва с текущим авторизованным пользователем. Если нет — `403 Forbidden`.  
6. Обновляет поля `rate` и/или `comment` (если они переданы).  
7. Перезаписывает дату обновления (`uploadDate`) текущим временем.  
8. Сохраняет изменения в базе.  
9. Возвращает подтверждение и обновлённый объект отзыва.  

**Пример запроса (HTTP PUT `http://localhost:PORT/api/review/update`):**  
```json
Headers:
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

Body:
{
  "idReview": 12,
  "rate": 4,
  "comment": "Немного доработали товар, теперь всё отлично!"
}
```

**Пример успешного ответа:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Отзыв успешно обновлён",
  "review": {
    "idReview": 12,
    "idUser": 5,
    "idProduct": 3,
    "rate": 4,
    "comment": "Немного доработали товар, теперь всё отлично!",
    "uploadDate": "2025-08-22T14:55:00.000Z"
  }
}
```

**Возможные ошибки:**  
- **400 Bad Request**: не передан `idReview`.  
  - Сообщение: `"Не передан idReview"`.  
- **404 Not Found**: отзыв с указанным `idReview` не найден.  
  - Сообщение: `"Отзыв не найден"`.  
- **403 Forbidden**: пользователь пытается изменить чужой отзыв.  
  - Сообщение: `"Вы не можете изменять чужой отзыв"`.  
- **500 Internal Server Error**: внутренняя ошибка при выполнении запроса.  
  - Сообщение: `"Ошибка при обновлении отзыва"`.  
```

---

### `delete(req, res, next)`

**Что делает:**  
1. Извлекает `idReview` из тела запроса (`req.body`).  
2. Проверяет, что `idReview` передан. Если нет — возвращает `400 Bad Request`.  
3. Ищет отзыв по `idReview` в базе (`Review.findByPk`).  
4. Если отзыв не найден — возвращает `404 Not Found`.  
5. Проверяет, совпадает ли `idUser` из отзыва с текущим авторизованным пользователем. Если нет — `403 Forbidden`.  
6. Если всё корректно — удаляет отзыв (`review.destroy()`).  
7. Возвращает сообщение об успешном удалении.  

**Пример запроса (HTTP DELETE `http://localhost:PORT/api/review/delete`):**  
```json
{
  "idReview": 12
}
```

**Пример успешного ответа:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Отзыв успешно удалён"
}
```

**Возможные ошибки:**  
- **400 Bad Request**: не передан `idReview`.  
  - Сообщение: `"Не передан idReview"`.  
- **404 Not Found**: отзыв не найден.  
  - Сообщение: `"Отзыв не найден"`.  
- **403 Forbidden**: пользователь пытается удалить чужой отзыв.  
  - Сообщение: `"Вы не можете удалять чужой отзыв"`.  
- **500 Internal Server Error**: внутренняя ошибка при выполнении запроса.  
  - Сообщение: `"Ошибка при удалении отзыва"`.  

---

# Структура БД

---

База данных содержит пять основных сущностей: `User` (пользователи), `Product` (товары), `Rent` (аренды), `Review` (отзывы) и `Favourite` (избранное). Пользователи создают продукты, другие пользователи могут брать эти продукты в аренду, оставлять отзывы и добавлять в избранное. Модель построена на отношениях «один-ко-многим».

---

## Описание таблиц и полей

*User*  
- `idUser` — уникальный идентификатор пользователя.  
- `name`, `secondName`, `middleName` — имя и вторые имена (фамилия/отчество).  
- `birthday` — дата рождения.  
- `phone`, `email` — контактные данные (в модели отмечены как уникальные).  
- `password` — хеш пароля.  
- `admin` — флаг администратора.

*Product*  
- `idProduct` — уникальный идентификатор товара.  
- `userId` — владелец товара (ссылка на `User.idUser`).  
- `name`, `description`, `category`, `photo` — информация о товаре.  
- `price` — цена (в модели как FLOAT).  
- `rating` — средний рейтинг товара (агрегат из отзывов).

*Rent*  
- `idRent` — идентификатор аренды.  
- `idUser` — арендатор (ссылка на `User`).  
- `idProduct` — арендованный продукт (ссылка на `Product`).  
- `status` — состояние аренды (`pending`, `accepted`, `rejected`).  
- `dataStart`, `dataEnd` — даты начала и окончания аренды.

*Review*  
- `idReview` — идентификатор отзыва.  
- `idUser` — автор отзыва (ссылка на `User`).  
- `idProduct` — товар, к которому оставлен отзыв (ссылка на `Product`).  
- `rate` — оценка (1–5).  
- `comment` — текст отзыва.  
- `uploadDate` — время создания/обновления отзыва.

*Favourite*  
- `idFavourite` — идентификатор записи в избранном.  
- `userId` — пользователь, добавивший в избранное.  
- `idProduct` — добавленный в избранное товар.

## Связи между таблицами

---

Основные сущности: `User`, `Product`, `Rent`, `Review`, `Favourite`. Все связи — стандартные «один-ко-многим» (1 → N) в различных комбинациях.

---

1. User ↔ Product
Sequelize:
```
User.hasMany(Product, { foreignKey: 'userId' });
Product.belongsTo(User, { foreignKey: 'userId' });
```
Кардинальность: `User (1) — (N) Product`
FK: `product.userId` → `user.idUser`
Смысл: каждый продукт принадлежит одному пользователю (владельцу), пользователь может иметь много продуктов.

---

2. User ↔ Rent (как арендатор)
Sequelize:
```
User.hasMany(Rent, { foreignKey: 'idUser' });
Rent.belongsTo(User, { foreignKey: 'idUser' });
```
Кардинальность: `User (1) — (N) Rent`
FK: `rent.idUser` → `user.idUser`
Смысл: пользователь (арендатор) может иметь много записей аренды.

---

3. Product ↔ Rent
Sequelize:
```
Product.hasMany(Rent, { foreignKey: 'idProduct' });
Rent.belongsTo(Product, { foreignKey: 'idProduct' });
```
Кардинальность: `Product (1) — (N) Rent`
FK: `rent.idProduct` → `product.idProduct`
Смысл: один продукт может участвовать во многих арендах (разные периоды/пользователи).

---

4. Product ↔ Review
Sequelize:
```
Product.hasMany(Review, { foreignKey: 'idProduct' });
Review.belongsTo(Product, { foreignKey: 'idProduct' });
```
Кардинальность: `Product (1) — (N) Review`
FK: `review.idProduct` → `product.idProduct`
Смысл: один продукт — много отзывов.

---

5. User ↔ Review
Sequelize:
```
User.hasMany(Review, { foreignKey: 'idUser' });
Review.belongsTo(User, { foreignKey: 'idUser' });
```
Кардинальность: `User (1) — (N) Review`
FK: `review.idUser` → `user.idUser`
Смысл: пользователь может написать много отзывов.

---

6. User ↔ Favourite
Sequelize:
```
User.hasMany(Favourite, { foreignKey: 'userId' });
Favourite.belongsTo(User, { foreignKey: 'userId' });
```
Кардинальность: `User (1) — (N) Favourite`
FK: `favourite.userId` → `user.idUser`
Смысл: пользователь может иметь много записей в избранном.

---

7. Product ↔ Favourite
Sequelize:
```
Product.hasMany(Favourite, { foreignKey: 'idProduct' });
Favourite.belongsTo(Product, { foreignKey: 'idProduct' });
```
Кардинальность: `Product (1) — (N) Favourite`
FK: `favourite.idProduct` → `product.idProduct`
Смысл: продукт может быть в избранном у многих пользователей.

---

Визуализация

Легенда: `1` — одна, `N` — много. Стрелки показывают направление foreign key.

ASCII-диаграмма (компактно)
```
User (idUser)
  |1
  |---< Product (userId)                Product (idProduct)
  |1                                      |1
  |---< Rent (idUser)  <--- Rent ---->---|---< Review (idProduct)
  |1                                      |
  |---< Review (idUser)                   |
  |1                                      |1
  |---< Favourite (userId)  <--- Favourite --->--- (idProduct)
```

Более читаемо (разбивка по сущностям):

```
User
  PK idUser
  ├─< Product.userId     (User 1 -> N Product)
  ├─< Rent.idUser        (User 1 -> N Rent)
  ├─< Review.idUser      (User 1 -> N Review)
  └─< Favourite.userId   (User 1 -> N Favourite)

Product
  PK idProduct
  ├─> Product.userId -> User.idUser  (belongsTo)
  ├─< Rent.idProduct      (Product 1 -> N Rent)
  ├─< Review.idProduct    (Product 1 -> N Review)
  └─< Favourite.idProduct (Product 1 -> N Favourite)
```

Mermaid (если платформа рендерит mermaid, вставьте этот блок)
```mermaid
erDiagram
    USER ||--o{ PRODUCT : "owns"
    USER ||--o{ RENT : "rents_as_user"
    PRODUCT ||--o{ RENT : "has_rents"
    PRODUCT ||--o{ REVIEW : "has_reviews"
    USER ||--o{ REVIEW : "writes"
    USER ||--o{ FAVOURITE : "favorites"
    PRODUCT ||--o{ FAVOURITE : "fav_by"
```

