# MP

## UserController

Функция registration принимает HTTP-запрос с полями email, password, name, birthday и phone из объекта req.body. Она проверяет, что обязательные поля phone, password, name и birthday присутствуют, и возвращает ошибку 400 Bad Request, если какое-либо из них отсутствует. Далее функция обращается к базе данных через модель User и проверяет, не существует ли уже пользователь с указанным номером телефона. Если пользователь с таким телефоном найден, возвращается ошибка 400 Bad Request. Если в запросе указан email, выполняется дополнительная проверка на его уникальность аналогичным образом. После успешных проверок пароль хешируется с помощью bcrypt, после чего создается новая запись пользователя в базе данных с сохранением email (или null, если email не передан), захешированного пароля, имени, даты рождения и телефона. Затем генерируется JWT-токен, содержащий id пользователя и номер телефона, с помощью функции generateJwt, в которой секретный ключ берется из переменной окружения SECRET_KEY (или используется значение по умолчанию 'my_secret_key'), а срок действия токена устанавливается в 24 часа. В конце функция возвращает ответ в формате JSON, включающий сгенерированный токен и данные о новом пользователе (id, email, name, birthday, phone). В случае любых ошибок во время выполнения операций функция перехватывает исключение и передает его в следующий middleware в виде ApiError.internal с сообщением ошибки и кодом 500 Internal Server Error.

### Пример входных данных

```json
POST http://localhost:PORT/api/user/login
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
POST http://localhost:PORT/api/user/auth
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

Функция check предназначена для проверки и обновления JWT-токена. Она вызывается после того, как промежуточный обрабатывающий слой (middleware) аутентифицировал пользователя и записал в объект req.user его id и phone. Функция генерирует новый JWT-токен через generateJwt на основе req.user.id и req.user.phone, тем самым продлевая срок действия токена еще на 24 часа. Затем она возвращает ответ в формате JSON, содержащий обновленный токен.

### Пример входных данных

```http
GET http://localhost:PORT/api/user/check
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
1. Извлекает из `req.body` поля `name`, `description`, `userId`, `category`, `price` и `rating`.  
2. Создаёт новую запись продукта в базе данных через модель `Product.create` с указанными полями.  
3. Возвращает в ответе JSON-объект, содержащий данные созданного продукта.  
4. В случае ошибки при создании (например, ошибки валидации Sequelize) вызывает `next(ApiError.badRequest(e.message))`, возвращая ошибку `400 Bad Request`.

**Пример входных данных (HTTP POST `http://localhost:PORT/api/product/create`):**  
```json
{
  "name": "iPhone 14 Pro",
  "description": "Смартфон Apple последнего поколения",
  "userId": 1,
  "category": "Electronics",
  "price": 999.99,
  "rating": 4.8
}
```

**Возможные ошибки:**  
- **400 Bad Request**: Ошибка валидации полей (например, отсутствие обязательных полей, неверный тип данных).  
  - Сообщение: текст ошибки из `Sequelize` или собственного валидатора.  
- **400 Bad Request**: Любая другая ошибка при создании записи продукта.  
  - Сообщение: информация об ошибке из `ApiError.badRequest`.

**Успешный выход:**  
```json
HTTP/1.1 200 OK
Content-Type: application/json

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
```

---

### `sort(req, res, next)`

**Что делает:**  
1. Извлекает из `req.query` параметры фильтрации: `category`, `name`, `minPrice`, `maxPrice`, `minRating`, `maxRating`, `userId`.  
2. Формирует объект `where` для фильтрации записей в базе данных:  
   - Если указан `userId`, добавляет условие `where.userId = userId`.  
   - Если указана `category`, добавляет условие `where.category = category`.  
   - Если указано `name`, добавляет условие типа `ILIKE %name%` для поиска по подстроке (независимо от регистра).  
   - Если указаны `minPrice` или `maxPrice`, добавляет диапазон для поля `price` (используя операторы `Op.gte` и `Op.lte`).  
   - Если указаны `minRating` или `maxRating`, добавляет диапазон для поля `rating` (используя `Op.gte` и `Op.lte`).  
3. Вызывает `Product.findAll({ where })` и возвращает в ответе JSON-массив продуктов, удовлетворяющих условиям.  
4. Если возникает ошибка при запросе к базе, вызывает `next(ApiError.internal(e))`, возвращая ошибку `500 Internal Server Error`.

**Пример входных данных (HTTP GET `http://localhost:PORT/api/product/sort`):**  
```
GET http://localhost:PORT/api/product/sort?category=Electronics&name=iPhone&minPrice=500&maxPrice=1500&minRating=4.5&userId=1
```

**Возможные ошибки:**  
- **500 Internal Server Error**: Ошибка при формировании или выполнении запроса к базе данных (например, некорректное значение для фильтра).  
  - Сообщение: информация об ошибке из `ApiError.internal`.

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
    "id": 12,
    "name": "iPhone 13",
    "description": "Смартфон Apple предыдущего поколения",
    "userId": 1,
    "category": "Electronics",
    "price": 699.00,
    "rating": 4.6,
    "createdAt": "2025-05-20T08:45:00.000Z",
    "updatedAt": "2025-05-20T08:45:00.000Z"
  }
]
```

---

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
