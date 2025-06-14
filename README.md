# Recommendo Server

Recommendo is a backend REST API built with **Node.js**, **Express**, **MongoDB**, and **Firebase Authentication**. This service handles user-submitted boycott queries and recommendations for various products, secured using Firebase JWT-based authentication.

---

## 🔗 Live URL

- **Client**: [https://recommendo-91de5.web.app](https://recommendo-91de5.web.app)
- **Server**: [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Tech Stack

- **Backend Framework**: Express.js
- **Database**: MongoDB (native `mongodb` driver)
- **Authentication**: Firebase Authentication using ID tokens and Admin SDK
- **Token Verification**: Middleware checks `Authorization: Bearer <idToken>` header
- **Deployment Options**: Vercel, Render, etc.

---

## 🛠️ Environment Variables (`.env`)

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
FB_SERVICE_KEY=your_base64_encoded_firebase_service_key
```

The `FB_SERVICE_KEY` is a base64-encoded version of your Firebase Admin SDK private key JSON.

---

## 🔐 Authentication

- Uses Firebase ID Tokens for authentication.
- The token must be sent in the `Authorization` header:
  ```http
  Authorization: Bearer <your_firebase_id_token>
  ```
- On the backend, the token is verified using Firebase Admin SDK.

Middleware example:

```js
const verifyJWT = async(req, res, next) => {
    const token = req?.headers?.authorization?.split(" ")[1];
    if (!token) return res.status(401).send({ message: "Unauthorized Access" });
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.tokenEmail = decoded.email;
        next();
    } catch (err) {
        console.error(err);
        return res.status(401).send({ message: "Unauthorized Access" });
    }
};
```

---

## 📦 API Endpoints

### 🔹 Public Routes

- `GET /` — Welcome message
- `GET /api/queries` — List all boycott queries
- `GET /api/query/:id` — Get a specific query by ID
- `GET /api/update/:id` — Get data for update (for frontend editing)
- `GET /api/recommendations/:queryId` — Get all recommendations for a query
- `GET /api/my-recommendations/:email` — Get all recommendations made by a user
- `GET /api/recommended?userEmail=email` — Get queries by a user with recommendation details
- `PUT /api/update/:id` — Update a query
- `DELETE /api/delete/:id` — Delete a query
- `POST /api/add-recommendation` — Submit a recommendation
- `DELETE /api/delete-rec/:id/:queryId` — Delete a recommendation and update counter

### 🔒 Protected Routes (Requires Firebase Token)

Include middleware `verifyJWT`

- `POST /api/add-query` — Submit a new boycott query
- `GET /api/my-queries?email=email` — Get queries submitted by a specific user


---

## 🧱 Collections

### `queries`

Each document represents a boycott query:

```json
{
  "productName": "FastClean Detergent",
  "productBrand": "Sparkle Corp",
  "queryTitle": "Boycott FastClean due to harmful ingredients",
  "boycottingReason": "Contains microplastics harmful to aquatic life",
  "userEmail": "user@example.com",
  "recommendationCount": 0,
  "createdAt": "ISODate"
}
```

### `recommendations`

Each document represents a user recommendation for a query:

```json
{
  "queryId": "<ObjectId of query>",
  "recommenderEmail": "user@example.com",
  "recommendationReason": "Supports environmentally friendly brands"
}
```

---

## 📜 License

This is an open source project.

---

## 👨‍💻 Author

Developed by JOSEPH AHMED for the **Recommendo** project.

