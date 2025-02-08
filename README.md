
# Advance Url Shortner

URL Shortener & Analytics 

link:https://shortuurlweb.onrender.com/check
documentation link:https://shortuurlweb.onrender.com/api-docs

Overview

This project is a URL shortener and analytics tool designed for tracking engagement on LinkedIn posts. It allows users to create short links and gather insights on their performance, including click tracking and user interactions. The backend is built using Node.js, with Google authentication implemented for secure access.

Features

URL Shortening: Convert long URLs into short, trackable links.

Analytics Tracking: Monitor click counts, user engagement, and traffic sources.

Google Login Integration: Secure authentication for managing shortened links.

Custom Aliases: Users can create custom short URLs for branding purposes.

Getting Started

Prerequisites

Ensure you have the following installed:

Node.js

MongoDB (or any other configured database)

Installation

Clone the repository:

git clone https://github.com/gusainDeekshu/alterAssignment.git
cd alterAssignment

Install dependencies:

npm install

PORT=3001
MONGO_URI="mongodb://127.0.0.1:27017/alterAssignment"
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_session_secret (choose any secure value)
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback  # Ensure this matches the Authorized Redirect URI in your Google Client settings
REDIS_URL=redis://yoururl:port  # Leave empty if running Redis locally or via Docker
MAX_REQUESTS=10
TIME_WINDOW=60

Start the server:

npm run server

Open http://localhost:3001/check in your browser to verify that the API is running.
Open http://localhost:3001/api-docs to view all Swagger API documentation.
Open http://localhost:3001/login/google to generate a token and access Swagger responses related to Google authentication.

Challenges Faced & Solutions

1. Implementing Google Authentication

Challenge: Ensuring secure OAuth 2.0 authentication.

Solution: Used jwt with Google Strategy and session management for user authentication.

2. Tracking Clicks Efficiently

Challenge: Accurately logging and analyzing URL clicks.

Solution: Stored click data in MongoDB and optimized queries for performance.

3. Ensuring Scalable Short URL Generation

Challenge: Avoiding URL conflicts and ensuring unique short links.

Solution: Used a shortid encoding system with a collision-resistant approach.

4. Handling  URL Previews

Challenge:  link preview mechanism prefetches URLs, affecting click analytics.

Solution: Identified and filtered out traffic using User-Agent detection.

5. Deployment on AWS

Challenges Faced: Successfully deployed using ECR, ECS, and Load Balancing, but it cost $2 per day.

Solution:Due to high costs, switched to Render for a more cost-effective solution.

Future Improvements

Add QR code generation for shortened URLs.

Enhance analytics with geolocation and device tracking.

Implement a browser extension for easy URL shortening.




