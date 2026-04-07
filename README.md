# K-Map Solver Web Application

A full-stack web application that simplifies Boolean expressions using Karnaugh Maps (K-Maps). This project provides an interactive interface for users to input variables and visualize simplified logic expressions efficiently.

---

## Live Demo

* Frontend: https://kmap-vqc.vercel.app/
* Backend: https://kmap-backend-7jz4.onrender.com

---

## Project Structure

```
kmap/
 ├── frontend/   # React-based user interface
 └── backend/    # FastAPI backend for logic processing
```

---

## Tech Stack

### Frontend

* React.js
* JavaScript
* CSS

### Backend

* Python
* FastAPI
* Uvicorn

### Deployment

* Vercel (Frontend)
* Render (Backend)

---

## Features

* Supports multiple variables (2–15 variables)
* Efficient Boolean expression simplification
* Performance comparison between algorithms
* Interactive and user-friendly UI
* Real-time communication with backend API

---

## Setup Instructions (Local)

### 1️. Clone the repository

```
git clone https://github.com/rekhadhorigol/kmap.git
cd kmap
```

---

### 2️. Backend Setup

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload
```

---

### 3️. Frontend Setup

```
cd frontend
yarn install
yarn add konva react-konva
yarn start
```

---

## Environment Variables

Create a `.env` file inside `frontend/`:

```
REACT_APP_BACKEND_URL=https://kmap-backend-7jz4.onrender.com
```

---

## Notes

* Older separate repositories (frontend & backend) have now been merged into this single repository for better structure and deployment.
* This project demonstrates full-stack development, deployment and real-world problem-solving.

---

Feel free to connect or give feedback!

If you like this project, consider giving it a star!
