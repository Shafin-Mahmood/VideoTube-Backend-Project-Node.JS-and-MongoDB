# VideoTube Backend Project

## Overview

VideoTube Backend API is a scalable RESTful backend for a video-sharing platform inspired by modern streaming applications. It provides authentication, user management, video handling, subscriptions, playlists, comments, likes, tweets (community posts), and dashboard analytics. The project follows modular architecture using Node.js, Express, MongoDB, and Mongoose, with secure authentication using JWT and refresh tokens.

## Features

### Authentication and User Management

* User registration and login
* JWT-based authentication
* Access token and refresh token flow
* Secure logout with token invalidation
* Password change functionality
* User profile and channel profile management
* Avatar and cover image upload support

### Video Management

* Upload videos
* Update video details
* Fetch video information
* Video publishing workflow
* Watch history tracking

### Social Features

* Like and unlike videos, comments, and tweets
* Comment system
* Subscription management
* Community tweets/posts
* Channel subscriber tracking

### Playlist Management

* Create playlists
* Update playlists
* Add and remove videos from playlists
* Fetch user playlists

### Dashboard and Analytics

* Channel statistics
* Video-related metrics
* Dashboard aggregation endpoints

### Utility and Infrastructure

* Healthcheck route
* Cloudinary integration for media handling
* File upload with Multer
* Centralized error handling
* Async handler abstraction
* Standardized API response structure

## Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

### Authentication and Security

* JSON Web Token (JWT)
* Bcrypt
* Cookie Parser
* CORS

### Media and Uploads

* Multer
* Cloudinary

### Development Tools

* Nodemon
* Prettier

## Project Structure

```bash
src/
├── controllers/
│   ├── user.controller.js
│   ├── video.controller.js
│   ├── comment.controller.js
│   ├── like.controller.js
│   ├── playlist.controller.js
│   ├── subscription.controller.js
│   ├── tweet.controller.js
│   └── dashboard.controller.js
│
├── models/
│   ├── user.model.js
│   ├── video.model.js
│   ├── comment.model.js
│   ├── like.model.js
│   ├── playlist.model.js
│   ├── subscription.model.js
│   └── tweet.model.js
│
├── routes/
├── middlewares/
├── utils/
├── db/
├── app.js
└── index.js
```

## API Routes

### User Routes

```http
/api/v1/users
```

* Register
* Login
* Logout
* Refresh Token
* Change Password
* Get Current User
* Update Account
* Update Avatar
* Update Cover Image
* Channel Profile
* Watch History

### Video Routes

```http
/api/v1/videos
```

* Upload video
* Get all videos
* Get single video
* Update video
* Delete video

### Comment Routes

```http
/api/v1/comments
```

### Like Routes

```http
/api/v1/likes
```

### Subscription Routes

```http
/api/v1/subscriptions
```

### Playlist Routes

```http
/api/v1/playlist
```

### Tweet Routes

```http
/api/v1/tweets
```

### Dashboard Routes

```http
/api/v1/dashboard
```

## Installation

### Clone Repository

```bash
git clone https://github.com/your-username/videotube-backend.git
cd videotube-backend
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection
CORS_ORIGIN=http://localhost:3000
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Run Development Server

```bash
npm run dev
```

## Architecture Highlights

* MVC-based project structure
* Modular route separation
* Aggregation pipelines for advanced queries
* Middleware-driven authentication
* Reusable utility abstractions
* Secure cookie-based token handling

## Security Practices

* Password hashing using bcrypt
* HTTP-only cookies
* Refresh token rotation
* Protected routes using middleware
* Input validation and error handling

## Sample Request

```http
POST /api/v1/users/login
```

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

## Future Improvements

* Video transcoding pipeline
* Notification system
* Real-time chat
* Recommendation engine
* Full-text search
* Microservices migration
* Docker deployment
* CI/CD integration

## Learning Objectives

This project demonstrates practical implementation of:

* REST API development
* Authentication systems
* Media handling
* MongoDB aggregation
* Backend architecture patterns
* Production-oriented Express development

## Author

Shafin Mahmood

## License

This project is licensed under the MIT License.
