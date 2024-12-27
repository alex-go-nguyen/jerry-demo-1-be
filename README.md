# My Back End GoPass

Welcome to **My Back End GoPass**! This is a NestJS application designed to handle request from [My Front End GoPass](https://github.com/Devbeee/G-Weather-Forecast-FE.git). Follow the instructions below to get started with the project.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Directory Structure](#directory-structure)
- [Architecture Diagram](#architecture-diagram)
- [Settings](#settings)
- [Running the Project](#running-the-project)
- [Deployment](#deployment)
 
## Prerequisites

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Npm](https://www.npmjs.com/) (comes with Node.js) or [Yarn](https://classic.yarnpkg.com/)
- [Git](https://git-scm.com/)
- [Redis](https://redis.io/)

## Installation

1. Install the Nest CLI globally:

  ```bash
    npm i -g @nestjs/cli
  ```

2. Clone the repository:

    ```bash
    git clonehttps://github.com/alex-go-nguyen/jerry-demo-1-be
    ```

3. Navigate into the project directory:

    ```bash
    cd jerry-demo-1-be
    ```

4. Install the project dependencies:

    Using npm:

    ```bash
    npm install
    ```
## Directory Structure
![image](https://github.com/user-attachments/assets/d2840d66-3870-4887-b3a8-999be60a7b09)

## Settings

At the root of the project, create a .env file and add the following environment variables
```
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=
NODE_ENV=stagng
WEB_CLIENT_URL =
SERVER_API_URL = 
PORT=
EMAIL_USER = 
EMAIL_PASS = 
EMAIL_PORT = 
EMAIL_HOST = 
EMAIL_SENDER = 
JWT_SECRET=
ENCRYPTION_KEY=
ENCRYPTION_IV=
COOKIE_EXPIRE_TIME = 
ACCESS_TOKEN_EXPIRATION=   
REFRESH_TOKEN_EXPIRATION=
RATE_LIMIT = 
TIME_TO_LIVE =
CAPTCHA_API_KEY =

REDIS_HOST=
REDIS_PORT=

BASIC_AUTH_PASSWORD=
```
## Architecture Diagram
![GoPass Architecture Diagram](https://github.com/user-attachments/assets/c6846892-310f-42a3-beb1-d58ddd7fb513)

## Running the Project

To start the development server and run the project locally, use the following command:

Using npm:

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Deployment

The server is deployed with Render: [GoPass](https://gopass.onrender.com/api) 
