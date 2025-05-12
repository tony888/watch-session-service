# watch-session-service

This project, "watch-session-service," is designed to track and manage user viewing activities. It is a monorepo containing a backend API and AWS CDK infrastructure definitions.

## Project Structure

-   **`apps/gateway/`**: Contains the API Gateway application. (Details might be inferred from `scripts/cicd/update-semantic-version.sh` which mentions `gw/` branches and `deploy:apigateway`)
-   **`apps/watch-session-api/`**: A backend service built with Bun and the Hono framework. It manages user watch sessions, watch histories, and "continue watching" items, using DynamoDB for data storage and Zod for validation. More details can be found in [apps/watch-session-api/README.md](apps/watch-session-api/README.md).
-   **`aws-cdk/`**: Contains the AWS Cloud Development Kit (CDK) infrastructure as code. This is used to define and deploy AWS resources like Lambda functions and API Gateway. See [aws-cdk/README.md](aws-cdk/README.md) for CDK-specific commands.
-   **`scripts/`**: Contains utility scripts, including those for CI/CD.

## Getting Started

### 1. Watch Session API (`apps/watch-session-api`)

This service is responsible for the core logic of tracking user watch behavior.

**Prerequisites:**

-   [Bun](https://bun.sh/)
-   A configured DynamoDB instance (either local for development or an AWS DynamoDB table).
-   [Docker](https://www.docker.com/) (optional, for containerized deployment).

**Installation & Running:**

1.  Navigate to the API directory:
    ```sh
    cd apps/watch-session-api
    ```
2.  Install dependencies:
    ```sh
    bun install
    ```
3.  Run the application:
    -   For production mode:
        ```sh
        bun start
        ```
    -   For development with hot reload:
        ```sh
        bun dev
        ```
    The API will typically be available at `http://localhost:3000`.

**Docker Deployment:**

1.  From the `apps/watch-session-api` directory:
    ```sh
    docker-compose up --build
    ```
    The service will run on `http://localhost:3000`.

Refer to the [apps/watch-session-api/README.md](apps/watch-session-api/README.md) for more detailed information on API endpoints, testing, and project structure. Style guidelines can be found in [apps/watch-session-api/CLAUDE.md](apps/watch-session-api/CLAUDE.md).

### 2. AWS CDK Infrastructure (`aws-cdk`)

This part of the project manages the AWS cloud resources.

**Prerequisites:**

-   Node.js and npm
-   AWS CLI configured with appropriate credentials and region.
-   AWS CDK Toolkit (`npm install -g aws-cdk`).

**Setup & Deployment:**

1.  Navigate to the CDK directory:
    ```sh
    cd aws-cdk
    ```
2.  Install dependencies:
    ```sh
    npm install
    ```
3.  Configure environment variables:
    Copy [aws-cdk/.env.example](aws-cdk/.env.example) to `.env` (e.g., `.env.dev`) and update the values for your AWS account and region. The application loads these variables (e.g., `OWNER`, `PROJECT`, `CDK_DEFAULT_REGION`, `CDK_DEFAULT_ACCOUNT` as seen in [aws-cdk/bin/watch-session.ts](aws-cdk/bin/watch-session.ts)).
4.  Useful CDK commands (from [aws-cdk/README.md](aws-cdk/README.md)):
    -   Compile TypeScript to JavaScript: `npm run build`
    -   Synthesize CloudFormation template: `npx cdk synth`
    -   Compare deployed stack with current state: `npx cdk diff`
    -   Deploy stack to your AWS account/region: `npx cdk deploy` (You might need to specify a profile or environment, e.g., `npx cdk deploy --profile your-profile -c env=dev`)

Refer to [aws-cdk/README.md](aws-cdk/README.md) and [aws-cdk/lambda/CLAUDE.md](aws-cdk/lambda/CLAUDE.md) for more specific guidelines on the CDK and Lambda development.

### 3. API Gateway (`apps/gateway/`)

Deployment and updates for the API Gateway seem to be handled via npm scripts within the `aws-cdk` directory, triggered by the CI/CD script [scripts/cicd/update-semantic-version.sh](scripts/cicd/update-semantic-version.sh). For example:
```sh
npm run diff:apigateway:<ENV>
npm run deploy:apigateway:<ENV>
```
These commands are likely defined in `aws-cdk/package.json`.

## Development Guidelines

-   **Watch Session API**: Follow guidelines in [apps/watch-session-api/CLAUDE.md](apps/watch-session-api/CLAUDE.md).
-   **AWS Lambda (within CDK)**: Follow guidelines in [aws-cdk/lambda/CLAUDE.md](aws-cdk/lambda/CLAUDE.md).
