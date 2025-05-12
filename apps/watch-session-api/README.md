# Watch Session Service API

The Watch Session Service API is a backend service built with Bun and the Hono framework to manage user watch sessions, watch histories, and continue watching items. It leverages Dynamoose for DynamoDB data modeling and Zod for request validation. The service enables clients to create, update, retrieve, and delete session and watch history records, ensuring a smooth media consumption experience with support for concurrent session control and progress tracking.

---

## Table of Contents

- [Overview](#overview)  
- [Features](#features)  
- [Setup & Installation](#setup--installation)  
- [Development](#development)  
- [Usage Examples](#usage-examples)  
  - [API Endpoints](#api-endpoints)
  - [HTTP Examples](#http-examples)
- [Docker Deployment](#docker-deployment)  
- [Testing](#testing)  
- [Project Structure](#project-structure)  
- [Style Guidelines & Contributing](#style-guidelines--contributing)  
- [Additional Information](#additional-information)

---

## Overview

The Watch Session Service API tracks and manages users’ viewing activities. It comprises three primary domains:
- **Sessions:** Creating, updating, listing, and terminating user sessions.
- **Watch Histories:** Storing and retrieving a user’s view history.
- **Continue Watching:** Managing playback progress to resume media consumption.

This service is tailored for scalable media applications and includes built-in validation, error handling, and logging to streamline development and production operations.

---

## Features

- **Robust Session Management:**  
  Create sessions with unique identifiers, maintain active sessions, enforce maximum concurrent sessions, and terminate sessions after expiration.

- **Watch History Tracking:**  
  Record viewing events including progress, timestamps, and sections. Easily filter history by content or base sections.

- **Continue Watching Support:**  
  Save and retrieve in-progress media details for a seamless resume experience.  
 
- **Validation & Error Handling:**  
  Uses Zod and custom error classes (e.g., NotFoundException, BadRequestException) to provide meaningful error responses.

- **Logging & Monitoring:**  
  Integrated logging (varying by environment) to aid in debugging and monitoring.

- **Docker Ready:**  
  With a Dockerfile and docker-compose configuration, the service can be containerized for production deployment.

---

## Setup & Installation

### Prerequisites

- [Bun](https://bun.sh/) – a fast JavaScript runtime.
- A configured DynamoDB instance (or local DynamoDB for development).
- [Docker](https://www.docker.com/) (optional, for containerized deployment).

### Installation Steps

1. **Clone the repository:**

   ```sh
   git clone https://gitlab.com/bbtvnewmedia/superapp/watch-session-service.git
   cd watch-session-service
   ```

2. **Install dependencies using Bun:**

   ```sh
   bun install
   ```

3. **Configure Environment Variables:**

   Ensure that required environment variables are set. At minimum, define the TABLE_NAME and NODE_ENV. You can create a `.env` file as needed.

4. **Build and Run the Service:**

   For development with hot reload:

   ```sh
   bun run dev
   ```

   For production:

   ```sh
   bun run start
   ```

5. **Access the application:**  
   The API will be running on [http://localhost:3000](http://localhost:3000).

---

## Development

- **Source Code:**  
  The source code is organized under the `src/` directory with separate folders for common utilities, database models/repositories, and API routes.
  
- **TypeScript & Validation:**  
  The project runs in strict TypeScript mode using Zod for request validation via the Hono framework.
  
- **Code Style:**  
  Follow the guidelines in `CLAUDE.md` for consistent import order, error handling, naming conventions, and overall project structure.

- **Releases:**  
  Automated releases are configured via Semantic Release with additional configurations in `.releaserc.json`.

---

## Usage Examples

### API Endpoints

The API is organized under the `/api` base path.

- **Session Routes:**
  - **Start a Session:** `POST /api/sessions/start`
  - **Get Session by ID:** `GET /api/sessions/{sessionId}`
  - **List Sessions by User:** `GET /api/sessions?userId={userId}`
  - **Update Session:** `PUT /api/sessions/{sessionId}`
  - **Terminate Session:** `DELETE /api/sessions/{sessionId}`
  - **Get Session Count:** `GET /api/sessions/count?userId={userId}`

- **Watch History Routes:**
  - **Get All History:** `GET /api/watch-histories?userId={userId}&profileId={profileId}`
  - **Get History by Content:** `GET /api/watch-histories?userId={userId}&profileId={profileId}&contentId={contentId}`
  - **Create History:** `POST /api/watch-histories`
  - **Delete History:** `DELETE /api/watch-histories`

- **Continue Watching Routes:**
  - **List Continue Watching Items:** `GET /api/continue-watchings?userId={userId}&profileId={profileId}`
  - **Get Specific Continue Watching Item:**  
    - By Content ID: `GET /api/continue-watchings?userId={userId}&profileId={profileId}&contentId={contentId}`
    - By Media Video ID: `GET /api/continue-watchings?userId={userId}&profileId={profileId}&contentId={contentId}&mediaVideoId={mediaVideoId}`
  - **Create/Update Continue Watching:** `POST /api/continue-watchings`
  - **Delete Continue Watching Items:** `DELETE /api/continue-watchings`

### HTTP Examples (using example.http)

The repository includes an `example.http` file with pre-configured HTTP requests for testing the API endpoints. Here’s a snippet for starting a new session:

```http
### Start a new session
POST http://localhost:3000/api/sessions/start
Content-Type: application/json
User-Agent: test-user-agent

{
    "userId": "f1ddc02c-120a-4904-8ea6-cd87b58e01a3",
    "profileId": "38f3a5b2-714a-4a29-9b04-2d2860e135ab",
    "contentId": "ff7f8b3e-152a-413e-99c7-71bd8453fd18"
}
```

You can use similar requests to test watch history and continue watching endpoints.

---

## Docker Deployment

The repository is Docker-ready. Use the provided Dockerfile and docker-compose configuration:

1. **Build and Run via Docker Compose:**

   ```sh
   docker-compose up --build
   ```

2. **Access the API:**  
   The service will run on [http://localhost:3000](http://localhost:3000).

---

## Testing

Tests are written using Bun's built-in testing framework and can be found in the `test/` directory.

### Run All Tests:

```sh
bun test
```

### Run a Specific Test:

```sh
bun test test/session.test.ts
```

---

## Project Structure

- **src/**  
  - **common/**: Constants, error classes, logger, utility functions, and response types.  
  - **database/**: DynamoDB models, repositories, and configuration.  
  - **routes/**: API route handlers for session, watch history, and continue watching endpoints.  
  - **index.ts**: Application entry point that sets up middleware, security headers, routing, and API documentation (via Swagger).
  
- **test/**: Contains integration tests for API endpoints.
- **Dockerfile** & **docker-compose.yaml**: Containerization setup.
- **example.http**: HTTP request examples for testing the API.

---

## Style Guidelines & Contributing

Please refer to `CLAUDE.md` for detailed code style guidelines including:

- Import ordering and structure.
- Naming conventions (camelCase for variables/functions, PascalCase for classes/types).
- Error handling practices and async utilities.
- Using Zod for request validation with Hono.

Contributions are welcome! Please open issues or pull requests following the repository’s contribution guidelines.

---

## Additional Information

- **Environment Variables:**  
  Configure required settings such as `TABLE_NAME` and `NODE_ENV` either via the environment or a `.env` file.

- **API Documentation:**  
  When not in production, access built-in API documentation (Swagger) at `/api/swagger`.

- **Security Considerations:**  
  The merged repository content may contain sensitive configurations. Ensure proper handling of environment variables and secure deployment practices.

For any questions or further assistance, please refer to the repository issues or contact the maintainers.

---

Happy coding!
