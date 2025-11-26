# Dietin Backend

Backend API untuk aplikasi Dietin - aplikasi manajemen diet dan kesehatan.

## ✨ Features

- 🔐 **Authentication & Authorization** - JWT-based authentication dengan refresh token
- 👤 **User Management** - User registration, login, profile management
- 📋 **Onboarding System** - Complete user health profile setup
- 🍕 **Food Database** - Comprehensive food database dengan nutrition facts, ingredients, dan cooking steps
- 📊 **Food Logging** - Track makanan yang dikonsumsi per waktu makan (Breakfast, Lunch, Dinner, Snack)
- 🔄 **Multi-food Support** - Log multiple foods dalam satu waktu makan
- 📈 **Nutrition Tracking** - Automatic nutrition calculation dari foods yang di-log
- 🛡️ **Data Security** - Protected endpoints dengan JWT authorization

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

### Endpoints Overview

| Category | Endpoint | Method | Auth Required | Description |
|----------|----------|--------|---------------|-------------|
| **Authentication** | `/register` | POST | ❌ | Register new user |
| | `/login` | POST | ❌ | User login |
| | `/token` | POST | ❌ | Refresh access token |
| | `/logout` | DELETE | ✅ | User logout |
| **Onboarding** | `/onboard` | POST | ✅ | Complete user onboarding |
| **User Profile** | `/user` | GET | ✅ | Get user profile |
| | `/user` | PUT | ✅ | Update user profile |
| **Food** | `/foods` | GET | ❌ | Get all foods |
| | `/foods/:id` | GET | ❌ | Get food by ID |
| | `/foods` | POST | ❌ | Create new food |
| | `/foods/:id` | PUT | ❌ | Update food |
| | `/foods/:id` | DELETE | ❌ | Delete food |
| **Food Log** | `/food-logs` | POST | ✅ | Add food consumption log |
| | `/food-logs/date` | GET | ✅ | Get food logs by date |
| | `/food-logs` | GET | ✅ | Get all food logs |
| | `/food-logs/:id` | DELETE | ✅ | Delete food log |

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
  "status": 201,
  "message": "User registered successfully",
  "response": {
    "payload": {
      "id": 1,
      "email": "john@example.com",
      "name": "John Doe"
    }
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
  "status": 200,
  "message": "Login successful",
  "response": {
    "payload": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "email": "john@example.com",
        "name": "John Doe"
      }
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
  "status": 200,
  "message": "Token refreshed successfully",
  "response": {
    "payload": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
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
  "status": 200,
  "message": "Logged out successfully",
  "response": {
    "payload": null
  }
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
  "status": 200,
  "message": "Onboarding completed successfully",
  "response": {
    "payload": {
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
  "status": 200,
  "message": "User profile retrieved successfully",
  "response": {
    "payload": {
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
}
```

##### Update User Profile

```http
PUT /user
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "birthDate": "1990-01-01",
  "height": 172.0,
  "weight": 68.0,
  "gender": "Male",
  "mainGoal": "Muscle Gain",
  "weightGoal": 75.0,
  "activityLevel": "Active",
  "allergies": ["Peanuts", "Dairy"]
}
```

**Note:** Semua field bersifat opsional. Kirim hanya field yang ingin diupdate.

**Response Success (200):**
```json
{
  "status": 200,
  "message": "User profile updated successfully",
  "response": {
    "payload": {
      "id": 1,
      "email": "john@example.com",
      "name": "John Doe Updated",
      "gender": "Male",
      "birthDate": "1990-01-01T00:00:00.000Z",
      "height": 172.0,
      "weight": 68.0,
      "mainGoal": "Muscle Gain",
      "weightGoal": 75.0,
      "activityLevel": "Active",
      "allergies": ["Peanuts", "Dairy"]
    }
  }
}
```

**Response Error (404):**
```json
{
  "status": 404,
  "message": "User not found",
  "response": {
    "payload": null
  }
}
```

#### 4. Food Management

##### Get All Foods

```http
GET /foods
```

**Response Success (200):**
```json
{
  "status": 200,
  "message": "Foods retrieved successfully",
  "response": {
    "payload": [
      {
        "id": 1,
        "name": "Pizza Margherita",
        "description": "Pizza klasik dengan keju mozzarella",
        "imageUrl": "https://example.com/pizza.jpg",
        "prepTime": 70,
        "cookTime": 15,
        "servings": 4,
        "steps": [
          {
            "title": "Siapkan Adonan",
            "substeps": [
              "Campur tepung, ragi, gula, dan garam.",
              "Tambahkan air hangat dan minyak.",
              "Uleni hingga kalis (±10 menit).",
              "Diamkan 1 jam sampai mengembang 2×."
            ]
          },
          {
            "title": "Bentuk Kulit Pizza",
            "substeps": [
              "Pipihkan adonan di loyang (diameter ±25 cm).",
              "Tusuk-tusuk ringan permukaan dengan garpu."
            ]
          }
        ],
        "nutritionFacts": [
          {"name": "Kalori", "value": "285 kkal"},
          {"name": "Protein", "value": "12 g"},
          {"name": "Lemak", "value": "10 g"},
          {"name": "Karbohidrat", "value": "36 g"}
        ],
        "ingredients": [
          {"name": "Tepung Terigu", "quantity": "250 g"},
          {"name": "Ragi Instan", "quantity": "7 g"},
          {"name": "Keju Mozzarella", "quantity": "150 g"}
        ],
        "createdAt": "2025-11-26T00:00:00.000Z",
        "updatedAt": "2025-11-26T00:00:00.000Z"
      }
    ]
  }
}
```

##### Get Food by ID

```http
GET /foods/:id
```

**Response Success (200):**
```json
{
  "status": 200,
  "message": "Food retrieved successfully",
  "response": {
    "payload": {
      "id": 1,
      "name": "Pizza Margherita",
      "description": "Pizza klasik dengan keju mozzarella",
      "imageUrl": "https://example.com/pizza.jpg",
      "prepTime": 70,
      "cookTime": 15,
      "servings": 4,
      "steps": [
        {
          "title": "Siapkan Adonan",
          "substeps": [
            "Campur tepung, ragi, gula, dan garam.",
            "Tambahkan air hangat dan minyak."
          ]
        }
      ],
      "nutritionFacts": [
        {"name": "Kalori", "value": "285 kkal"},
        {"name": "Protein", "value": "12 g"}
      ],
      "ingredients": [
        {"name": "Tepung Terigu", "quantity": "250 g"},
        {"name": "Ragi Instan", "quantity": "7 g"}
      ],
      "createdAt": "2025-11-26T00:00:00.000Z",
      "updatedAt": "2025-11-26T00:00:00.000Z"
    }
  }
}
```

**Response Error (404):**
```json
{
  "status": 404,
  "message": "Food not found",
  "response": {
    "payload": null
  }
}
```

##### Create Food

```http
POST /foods
```

**Request Body:**
```json
{
  "name": "Pizza Margherita",
  "description": "Pizza klasik dengan keju mozzarella",
  "imageUrl": "https://example.com/pizza.jpg",
  "prepTime": 70,
  "cookTime": 15,
  "servings": 4,
  "steps": [
    {
      "title": "Siapkan Adonan",
      "substeps": [
        "Campur tepung, ragi, gula, dan garam.",
        "Tambahkan air hangat dan minyak.",
        "Uleni hingga kalis (±10 menit).",
        "Diamkan 1 jam sampai mengembang 2×."
      ]
    },
    {
      "title": "Bentuk Kulit Pizza",
      "substeps": [
        "Pipihkan adonan di loyang (diameter ±25 cm).",
        "Tusuk-tusuk ringan permukaan dengan garpu."
      ]
    }
  ],
  "nutritionFacts": [
    {"name": "Kalori", "value": "285 kkal"},
    {"name": "Protein", "value": "12 g"},
    {"name": "Lemak", "value": "10 g"},
    {"name": "Karbohidrat", "value": "36 g"},
    {"name": "Serat", "value": "2 g"},
    {"name": "Gula", "value": "4 g"}
  ],
  "ingredients": [
    {"name": "Tepung Terigu", "quantity": "250 g"},
    {"name": "Ragi Instan", "quantity": "7 g"},
    {"name": "Gula Pasir", "quantity": "1 sdt"},
    {"name": "Garam", "quantity": "1/2 sdt"},
    {"name": "Air Hangat", "quantity": "150 ml"},
    {"name": "Minyak Zaitun", "quantity": "2 sdm"},
    {"name": "Saus Tomat", "quantity": "100 g"},
    {"name": "Keju Mozzarella", "quantity": "150 g"},
    {"name": "Oregano/Basil Kering", "quantity": "secukupnya"}
  ]
}
```

**Response Success (201):**
```json
{
  "status": 201,
  "message": "Food created successfully",
  "response": {
    "payload": {
      "id": 1,
      "name": "Pizza Margherita",
      "description": "Pizza klasik dengan keju mozzarella",
      "imageUrl": "https://example.com/pizza.jpg",
      "prepTime": 70,
      "cookTime": 15,
      "servings": 4,
      "steps": [...],
      "nutritionFacts": [...],
      "ingredients": [...],
      "createdAt": "2025-11-26T00:00:00.000Z",
      "updatedAt": "2025-11-26T00:00:00.000Z"
    }
  }
}
```

**Response Error (400):**
```json
{
  "status": 400,
  "message": "Name is required",
  "response": {
    "payload": null
  }
}
```

##### Update Food

```http
PUT /foods/:id
```

**Request Body:**
```json
{
  "name": "Pizza Margherita Special",
  "description": "Pizza klasik dengan keju mozzarella premium",
  "prepTime": 60,
  "steps": [
    {
      "title": "Siapkan Adonan",
      "substeps": [
        "Campur tepung, ragi, gula, dan garam.",
        "Tambahkan air hangat dan minyak."
      ]
    }
  ],
  "nutritionFacts": [
    {"name": "Kalori", "value": "300 kkal"},
    {"name": "Protein", "value": "15 g"}
  ],
  "ingredients": [
    {"name": "Tepung Terigu Premium", "quantity": "300 g"},
    {"name": "Keju Mozzarella Premium", "quantity": "200 g"}
  ]
}
```

**Response Success (200):**
```json
{
  "status": 200,
  "message": "Food updated successfully",
  "response": {
    "payload": {
      "id": 1,
      "name": "Pizza Margherita Special",
      "description": "Pizza klasik dengan keju mozzarella premium",
      "prepTime": 60,
      "steps": [...],
      "nutritionFacts": [...],
      "ingredients": [...],
      "createdAt": "2025-11-26T00:00:00.000Z",
      "updatedAt": "2025-11-26T02:00:00.000Z"
    }
  }
}
```

**Response Error (404):**
```json
{
  "status": 404,
  "message": "Food not found",
  "response": {
    "payload": null
  }
}
```

##### Delete Food

```http
DELETE /foods/:id
```

**Response Success (200):**
```json
{
  "status": 200,
  "message": "Food deleted successfully",
  "response": {
    "payload": null
  }
}
```

**Response Error (404):**
```json
{
  "status": 404,
  "message": "Food not found",
  "response": {
    "payload": null
  }
}
```

#### 5. Food Log Management

##### Add Food Log

Menyimpan makanan yang telah dikonsumsi untuk waktu tertentu (Breakfast, Lunch, Dinner, Snack).

```http
POST /food-logs
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "date": "2025-11-26",
  "mealType": "Breakfast",
  "foods": [
    {
      "foodId": 1,
      "servings": 1
    },
    {
      "foodId": 2,
      "servings": 0.5
    }
  ]
}
```

**Field Description:**
- `date` (optional): Tanggal konsumsi (YYYY-MM-DD). Jika tidak diisi, akan menggunakan tanggal sekarang.
- `mealType` (required): Jenis waktu makan. Valid values: `Breakfast`, `Lunch`, `Dinner`, `Snack`
- `foods` (required): Array of food objects
  - `foodId`: ID makanan dari tabel Food
  - `servings` (optional): Jumlah porsi yang dikonsumsi. Default = 1

**Response Success (201):**
```json
{
  "status": 201,
  "message": "Food log added successfully",
  "response": {
    "payload": {
      "id": 1,
      "date": "2025-11-26T00:00:00.000Z",
      "mealType": "Breakfast",
      "foods": [
        {
          "id": 1,
          "name": "Pizza Margherita",
          "description": "Pizza klasik dengan keju mozzarella",
          "imageUrl": "https://example.com/pizza.jpg",
          "servings": 1,
          "nutritionFacts": [
            {"name": "Kalori", "value": "285 kkal"},
            {"name": "Protein", "value": "12 g"}
          ]
        },
        {
          "id": 2,
          "name": "Nasi Goreng",
          "description": "Nasi goreng spesial",
          "imageUrl": "https://example.com/nasigoreng.jpg",
          "servings": 0.5,
          "nutritionFacts": [
            {"name": "Kalori", "value": "450 kkal"},
            {"name": "Protein", "value": "15 g"}
          ]
        }
      ]
    }
  }
}
```

**Response Error (400):**
```json
{
  "status": 400,
  "message": "Meal type is required (Breakfast, Lunch, Dinner, or Snack)",
  "response": {
    "payload": null
  }
}
```

**Response Error (404):**
```json
{
  "status": 404,
  "message": "One or more food IDs not found",
  "response": {
    "payload": null
  }
}
```

##### Get Food Logs by Date

Mengambil semua food log untuk tanggal tertentu.

```http
GET /food-logs/date?date=2025-11-26
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `date` (required): Tanggal dalam format YYYY-MM-DD

**Response Success (200):**
```json
{
  "status": 200,
  "message": "Food logs retrieved successfully",
  "response": {
    "payload": [
      {
        "id": 1,
        "date": "2025-11-26T07:00:00.000Z",
        "mealType": "Breakfast",
        "foods": [
          {
            "id": 1,
            "name": "Pizza Margherita",
            "description": "Pizza klasik dengan keju mozzarella",
            "imageUrl": "https://example.com/pizza.jpg",
            "servings": 1,
            "nutritionFacts": [
              {"name": "Kalori", "value": "285 kkal"},
              {"name": "Protein", "value": "12 g"}
            ]
          }
        ]
      },
      {
        "id": 2,
        "date": "2025-11-26T12:00:00.000Z",
        "mealType": "Lunch",
        "foods": [
          {
            "id": 3,
            "name": "Spaghetti Carbonara",
            "description": "Pasta dengan saus carbonara",
            "imageUrl": "https://example.com/spaghetti.jpg",
            "servings": 1,
            "nutritionFacts": [
              {"name": "Kalori", "value": "520 kkal"},
              {"name": "Protein", "value": "20 g"}
            ]
          }
        ]
      }
    ]
  }
}
```

**Response Error (400):**
```json
{
  "status": 400,
  "message": "Date parameter is required (YYYY-MM-DD)",
  "response": {
    "payload": null
  }
}
```

##### Get All Food Logs

Mengambil semua food log user (default 30 terakhir).

```http
GET /food-logs?limit=30
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (optional): Jumlah maksimal record yang diambil. Default = 30

**Response Success (200):**
```json
{
  "status": 200,
  "message": "Food logs retrieved successfully",
  "response": {
    "payload": [
      {
        "id": 1,
        "date": "2025-11-26T07:00:00.000Z",
        "mealType": "Breakfast",
        "foods": [...]
      },
      {
        "id": 2,
        "date": "2025-11-25T12:00:00.000Z",
        "mealType": "Lunch",
        "foods": [...]
      }
    ]
  }
}
```

##### Delete Food Log

Menghapus food log berdasarkan ID.

```http
DELETE /food-logs/:id
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response Success (200):**
```json
{
  "status": 200,
  "message": "Food log deleted successfully",
  "response": {
    "payload": null
  }
}
```

**Response Error (404):**
```json
{
  "status": 404,
  "message": "Food log not found",
  "response": {
    "payload": null
  }
}
```

**Response Error (403):**
```json
{
  "status": 403,
  "message": "Unauthorized to delete this food log",
  "response": {
    "payload": null
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

### Food Table

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| name | String | Nama makanan |
| description | String | Deskripsi makanan |
| imageUrl | String | URL gambar makanan |
| prepTime | Int | Waktu persiapan (menit) |
| cookTime | Int | Waktu memasak (menit) |
| servings | Int | Jumlah porsi |
| createdAt | DateTime | Waktu pembuatan |
| updatedAt | DateTime | Waktu update terakhir |

### Step Table

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| title | String | Judul langkah |
| order | Int | Urutan langkah |
| foodId | Int | Foreign key ke Food |
| createdAt | DateTime | Waktu pembuatan |
| updatedAt | DateTime | Waktu update terakhir |

### Substep Table

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| description | String | Deskripsi sub-langkah |
| order | Int | Urutan sub-langkah |
| stepId | Int | Foreign key ke Step |
| createdAt | DateTime | Waktu pembuatan |
| updatedAt | DateTime | Waktu update terakhir |

### NutritionFact Table

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| name | String | Nama nutrisi (contoh: Kalori, Protein) |
| value | String | Nilai nutrisi (contoh: 285 kkal, 12 g) |
| order | Int | Urutan tampilan |
| foodId | Int | Foreign key ke Food |
| createdAt | DateTime | Waktu pembuatan |
| updatedAt | DateTime | Waktu update terakhir |

### Ingredient Table

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| name | String | Nama bahan |
| quantity | String | Jumlah bahan (contoh: 250 g, 1 sdt) |
| order | Int | Urutan tampilan |
| foodId | Int | Foreign key ke Food |
| createdAt | DateTime | Waktu pembuatan |
| updatedAt | DateTime | Waktu update terakhir |

### FoodLog Table

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| userId | Int | Foreign key ke User |
| date | DateTime | Tanggal konsumsi makanan |
| mealType | Enum | Jenis waktu makan (Breakfast, Lunch, Dinner, Snack) |
| createdAt | DateTime | Waktu pembuatan |
| updatedAt | DateTime | Waktu update terakhir |

### FoodLogItem Table

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| foodLogId | Int | Foreign key ke FoodLog |
| foodId | Int | Foreign key ke Food |
| servings | Float | Jumlah porsi yang dikonsumsi |
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
│   │   ├── userController.js
│   │   ├── foodController.js
│   │   └── foodLogController.js
│   ├── middleware/            # Middleware functions
│   │   └── authorization.js
│   ├── model/                 # Data models
│   │   └── User.js
│   ├── routes/                # Route definitions
│   │   ├── loginRoute.js
│   │   ├── registerRoute.js
│   │   ├── onboardRoute.js
│   │   ├── userRoute.js
│   │   ├── foodRoute.js
│   │   └── foodLogRoute.js
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

# Update User Profile
curl -X PUT http://localhost:3000/user \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "height": 172.0,
    "weight": 68.0,
    "mainGoal": "Muscle Gain"
  }'

# Get All Foods
curl -X GET http://localhost:3000/foods

# Get Food by ID
curl -X GET http://localhost:3000/foods/1

# Create Food
curl -X POST http://localhost:3000/foods \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Margherita",
    "description": "Pizza klasik dengan keju mozzarella",
    "imageUrl": "https://example.com/pizza.jpg",
    "prepTime": 70,
    "cookTime": 15,
    "servings": 4,
    "steps": [
      {
        "title": "Siapkan Adonan",
        "substeps": [
          "Campur tepung, ragi, gula, dan garam.",
          "Tambahkan air hangat dan minyak."
        ]
      }
    ],
    "nutritionFacts": [
      {"name": "Kalori", "value": "285 kkal"},
      {"name": "Protein", "value": "12 g"}
    ],
    "ingredients": [
      {"name": "Tepung Terigu", "quantity": "250 g"},
      {"name": "Ragi Instan", "quantity": "7 g"}
    ]
  }'

# Update Food
curl -X PUT http://localhost:3000/foods/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Margherita Special",
    "prepTime": 60
  }'

# Delete Food
curl -X DELETE http://localhost:3000/foods/1

# Add Food Log
curl -X POST http://localhost:3000/food-logs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-11-26",
    "mealType": "Breakfast",
    "foods": [
      {"foodId": 1, "servings": 1},
      {"foodId": 2, "servings": 0.5}
    ]
  }'

# Get Food Logs by Date
curl -X GET "http://localhost:3000/food-logs/date?date=2025-11-26" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get All Food Logs
curl -X GET "http://localhost:3000/food-logs?limit=30" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Delete Food Log
curl -X DELETE http://localhost:3000/food-logs/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Food Log Use Cases

#### Use Case 1: Log Breakfast with Multiple Foods
```bash
# User makan breakfast dengan Pizza dan Jus Jeruk
POST /food-logs
{
  "date": "2025-11-26",
  "mealType": "Breakfast",
  "foods": [
    {"foodId": 1, "servings": 1},      // Pizza 1 porsi
    {"foodId": 5, "servings": 2}       // Jus Jeruk 2 gelas
  ]
}
```

#### Use Case 2: Log Half Portion
```bash
# User hanya makan setengah porsi
POST /food-logs
{
  "mealType": "Dinner",
  "foods": [
    {"foodId": 3, "servings": 0.5}     // Setengah porsi Nasi Goreng
  ]
}
```

#### Use Case 3: Track Daily Intake
```bash
# Get all meals for today
GET /food-logs/date?date=2025-11-26

# Response akan menampilkan:
# - Breakfast: Pizza (285 kkal) + Jus Jeruk (200 kkal)
# - Lunch: Spaghetti (520 kkal)
# - Dinner: Nasi Goreng 0.5 porsi (225 kkal)
# Total: ~1230 kkal
```

#### Use Case 4: View Last 7 Days History
```bash
# Get recent food logs
GET /food-logs?limit=50

# Returns all meals from last 7 days sorted by date descending
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
