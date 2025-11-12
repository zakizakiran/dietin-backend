# Dietin Backend

Backend API untuk aplikasi Dietin - aplikasi manajemen diet dan kesehatan.

## 📋 Deskripsi

Dietin Backend adalah REST API yang dibangun dengan Node.js, Express.js, dan Prisma ORM untuk mengelola data user, autentikasi, onboarding, dan profil pengguna dalam aplikasi Dietin.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Token)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Environment Variables**: dotenv

## 📦 Prerequisites

Pastikan Anda telah menginstall:

- [Node.js](https://nodejs.org/) (v14 atau lebih tinggi)
- [MySQL](https://www.mysql.com/) (v5.7 atau lebih tinggi)
- [npm](https://www.npmjs.com/) atau [yarn](https://yarnpkg.com/)

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/zakizakiran/dietin-backend.git
cd dietin-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env` di root directory dan isi dengan konfigurasi berikut:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/dietin_db"

# Server Configuration
PORT=3000

# JWT Configuration
ACCESS_TOKEN_SECRET=your_access_token_secret_key_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key_here
```

**Catatan**: 
- Ganti `username` dan `password` dengan kredensial MySQL Anda
- Ganti `your_access_token_secret_key_here` dan `your_refresh_token_secret_key_here` dengan secret key yang aman

### 4. Setup Database

#### a. Generate Prisma Client

```bash
npx prisma generate
```

#### b. Run Database Migration

```bash
npx prisma migrate deploy
```

Atau jika dalam development mode:

```bash
npx prisma migrate dev
```

### 5. Jalankan Aplikasi

#### Development Mode (dengan nodemon)

```bash
npm run dev
```

#### Production Mode

```bash
node src/index.js
```

Server akan berjalan di `http://localhost:3000` (atau port yang Anda tentukan di `.env`)

## 📚 API Documentation

### Base URL

```
http://localhost:3000
```

### Endpoints

#### 1. Authentication

##### Register User

```http
POST /register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response Success (201):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

##### Login

```http
POST /login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "john@example.com",
      "name": "John Doe"
    }
  }
}
```

##### Refresh Token

```http
POST /token
```

**Request Body:**
```json
{
  "token": {refreshToken}
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

##### Logout

```http
DELETE /logout
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

#### 2. Onboarding

##### Complete User Onboarding

```http
POST /onboard
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "birthDate": "1990-01-01",
  "height": 170.5,
  "weight": 70.0,
  "gender": "Male",
  "mainGoal": "Weight Loss",
  "weightGoal": 65.0,
  "activityLevel": "Moderate",
  "allergies": ["Peanuts", "Shellfish"]
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Onboarding completed successfully",
  "data": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "gender": "Male",
    "birthDate": "1990-01-01T00:00:00.000Z",
    "height": 170.5,
    "weight": 70.0,
    "mainGoal": "Weight Loss",
    "weightGoal": 65.0,
    "activityLevel": "Moderate"
  }
}
```

#### 3. User Profile

##### Get User Profile

```http
GET /user
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "gender": "Male",
    "birthDate": "1990-01-01T00:00:00.000Z",
    "height": 170.5,
    "weight": 70.0,
    "mainGoal": "Weight Loss",
    "weightGoal": 65.0,
    "activityLevel": "Moderate",
    "allergies": ["Peanuts", "Shellfish"]
  }
}
```

### Authentication

Sebagian besar endpoint memerlukan autentikasi menggunakan JWT. Sertakan token di header:

```
Authorization: Bearer <your_access_token>
```

## 🗄️ Database Schema

### User Table

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| email | String | Email pengguna (unique) |
| password | String | Password terenkripsi |
| name | String | Nama pengguna |
| gender | Gender | Jenis kelamin (Male/Female) |
| birthDate | DateTime | Tanggal lahir |
| height | Float | Tinggi badan (cm) |
| weight | Float | Berat badan (kg) |
| mainGoal | String | Tujuan utama |
| weightGoal | Float | Target berat badan |
| activityLevel | String | Level aktivitas |
| refreshToken | String | Refresh token untuk autentikasi |
| accessToken | String | Access token untuk autentikasi |
| createdAt | DateTime | Waktu pembuatan |
| updatedAt | DateTime | Waktu update terakhir |

### Allergy Table

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| allergy | Json | Data alergi dalam format JSON |
| userId | Int | Foreign key ke User |
| createdAt | DateTime | Waktu pembuatan |
| updatedAt | DateTime | Waktu update terakhir |

## 🔧 Database Management

### Membuka Prisma Studio

Untuk melihat dan mengelola data secara visual:

```bash
npx prisma studio
```

Prisma Studio akan terbuka di browser pada `http://localhost:5555`

### Membuat Migration Baru

Jika Anda mengubah schema:

```bash
npx prisma migrate dev --name migration_name
```

### Reset Database

**⚠️ PERINGATAN**: Ini akan menghapus semua data!

```bash
npx prisma migrate reset
```

## 📁 Project Structure

```
dietin-backend/
├── prisma/
│   ├── schema.prisma          # Prisma schema definition
│   └── migrations/            # Database migrations
├── src/
│   ├── controller/            # Business logic
│   │   ├── loginController.js
│   │   ├── registerController.js
│   │   ├── onboardController.js
│   │   └── userController.js
│   ├── middleware/            # Middleware functions
│   │   └── authorization.js
│   ├── model/                 # Data models
│   │   └── User.js
│   ├── routes/                # Route definitions
│   │   ├── loginRoute.js
│   │   ├── registerRoute.js
│   │   ├── onboardRoute.js
│   │   └── userRoute.js
│   ├── index.js               # Application entry point
│   └── responseScheme.js      # Response formatter
├── .env                       # Environment variables
├── package.json               # Dependencies
└── README.md                  # Documentation
```

## 🧪 Testing

Untuk menguji API, Anda dapat menggunakan:

- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)
- [Thunder Client](https://www.thunderclient.com/) (VS Code Extension)
- cURL

### Contoh Testing dengan cURL

```bash
# Register
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Get User Profile
curl -X GET http://localhost:3000/user \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## ⚠️ Common Issues & Solutions

### Issue: Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solution**: 
- Ganti PORT di file `.env`
- Atau matikan aplikasi yang menggunakan port tersebut

### Issue: Database Connection Failed

**Error**: `Can't reach database server`

**Solution**:
- Pastikan MySQL server berjalan
- Periksa konfigurasi DATABASE_URL di `.env`
- Pastikan credentials database benar

### Issue: Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
npx prisma generate
```

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | MySQL connection string | mysql://user:pass@localhost:3306/dietin_db |
| PORT | Server port | 3000 |
| ACCESS_TOKEN_SECRET | Secret key untuk access token | your_secret_key_here |
| REFRESH_TOKEN_SECRET | Secret key untuk refresh token | your_refresh_secret_here |

**Happy Coding! 🚀**
