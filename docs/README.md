# Documentation

This folder contains project documentation and testing resources.

## Contents

- **Smart-Study-Planner-API.postman_collection.json**: Postman collection for testing all API endpoints
  - Import this file into Postman to test the API
  - Contains all endpoints: Auth, Courses, Tasks, Schedule, Progress, Analytics, AI Insights

## Using Postman Collection

1. Import the JSON file into Postman
2. Create an environment with:
   - `base_url`: http://localhost/Smart-Study-Planner-with
   - `auth_token`: (will be set automatically after login)
3. Start with the "Login" request to get your authentication token
4. All other requests will use the token automatically
