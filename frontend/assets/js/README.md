# School Management System

A comprehensive web-based school management system for managing students, teachers, classes, and payments.

## Project Structure

- **Backend**: Node.js, Express, MySQL
- **Frontend**: HTML, CSS, JavaScript (Vanilla)

## Features

- **Admin Dashboard**: Manage students, teachers, classes, subjects, and payments.
- **Teacher Dashboard**: View assigned classes, students, and enter grades.
- **Student Dashboard**: View profile, grades, timetable, and payment history.
- **PDF Generation**: Generate certificates and transcripts.

## Setup

1.  **Database Setup**:
    - Ensure your MySQL database is running.
    - Configure database connection in `backend/config/database.js` or `.env`.

2.  **Backend**:
    ```bash
    cd backend
    npm install
    npm start
    ```

3.  **Frontend**:
    - Open the `frontend` directory.
    - Serve the files using a static file server (e.g., Live Server in VS Code).

## Technologies

- Node.js
- Express.js
- MySQL
- Vanilla JavaScript