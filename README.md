markdown
# Auth Backend — MERN Social Feed System

A full-stack authentication and social feed backend built with Node.js, Express, and MongoDB.

## 🚀 Live URL
https://authentication-bakend-rclb.onrender.com

## 🛠️ Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT + Passport.js (Google OAuth)
- **File Upload:** Multer + Cloudinary
- **Email:** Nodemailer (Brevo SMTP)

## 📁 Project Structure

src/
├── config/
│ └── passport.js # Google OAuth setup
├── controllers/
│ ├── auth.controller.js # Auth logic
│ └── post.controller.js # Post CRUD
├── db/
│ └── index.js # MongoDB connection
├── middlewares/
│ ├── auth.middleware.js # JWT verify + isAdmin
│ └── multer.middleware.js # File upload
├── models/
│ ├── user.model.js # User schema
│ └── post.model.js # Post schema
├── routes/
│ ├── index.routes.js # Central router
│ ├── auth.routes.js # Auth routes
│ └── post.routes.js # Post routes
├── utils/
│ ├── ApiError.js # Error class
│ ├── ApiResponse.js # Response class
│ ├── asyncHandler.js # Async wrapper
│ └── sendEmail.js # Email service
├── app.js # Express setup
└── server.js # Entry point


## 🔑 Environment Variables
```env
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=1d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=your_frontend_url
ADMIN_SECRET=your_admin_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
EMAIL_FROM=your_sender_email
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📡 API Endpoints

### Auth Routes — `/api/v1/auth`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/signup` | Public | Register new user |
| POST | `/login` | Public | Login user |
| GET | `/google` | Public | Google OAuth |
| GET | `/google/callback` | Public | Google OAuth callback |
| GET | `/admin/dashbord` | Admin | Get all users |

### Post Routes — `/api/v1/posts`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/feed` | Public | Get all posts |
| POST | `/create` | User | Create post |
| GET | `/my-posts` | User | Get my posts |
| PATCH | `/update/:postId` | User | Update post |
| DELETE | `/delet/:postId` | User | Delete own post |
| PATCH | `/like/:postId` | User | Like/Unlike post |
| PATCH | `/comment/:postId` | User | Add comment |
| PATCH | `/share/:postId` | User | Share post |
| PATCH | `/softdeletpost/:postId` | Admin | Soft delete post |
| PATCH | `/restore/:postId` | Admin | Restore post |
| DELETE | `/admin/delete/:postId` | Admin | Hard delete post |
| PATCH | `/appealpost` | User | Appeal soft delete |

## 🔐 Authentication
- **JWT Token** — Bearer token in Authorization header
- **Google OAuth** — Passport.js strategy
- **Role Based Access** — user / admin roles

## 📦 Installation

```bash
# Clone karo
git clone https://github.com/aditya265254/authentication-bakend.git

# Dependencies install karo
npm install

# .env file banao aur variables add karo

# Development server chalao
npm run dev
```

## 👤 Author
**Aditya Singh**