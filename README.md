# K-Map Solver

This project is a web-based Karnaugh Map (K-Map) solver designed to assist students and engineers in digital logic design. It provides a user-friendly interface to minimize boolean functions and generate corresponding logic representations.

The application features a modern frontend built with React and a high-performance Python backend using the FastAPI framework.

## Key Features

*   **Variable Input Methods**: Supports boolean functions with 2 to 15 variables. Users can define functions using:
    *   Minterms
    *   Maxterms
    *   Boolean Expressions

*   **Advanced Minimization Algorithm**: Implements a highly optimized Quine-McCluskey algorithm. It leverages bit-slicing and a branch-and-bound strategy for efficient and exact minimization, even with a higher number of variables.

*   **Comprehensive Solution Output**: The tool provides a complete set of results, including:
    *   Minimal Sum of Products (SOP) expression.
    *   Minimal Product of Sums (POS) expression.
    *   Lists of all prime implicants, with essential prime implicants clearly identified.
    *   Full truth table for the function.

*   **Interactive K-Map Visualization**: A visual representation of the Karnaugh Map is displayed, with colored groupings that correspond to the terms in the minimized SOP expression.

*   **Verilog HDL Generation**: Automatically generates synthesizable Verilog code for the minimized logic function in multiple standard modeling styles:
    *   Behavioral
    *   Dataflow
    *   Gate-level
    *   A complete Verilog testbench is also created to verify the functionality of the generated module.

*   **Performance Metrics**: The backend reports detailed performance data for each minimization, offering insights into the efficiency of the algorithm.

## Technology Stack

*   **Backend**: Python, FastAPI
*   **Frontend**: React.js, Tailwind CSS, shadcn/ui
*   **Core Algorithm**: Optimized Bit-Slice Quine-McCluskey with Branch-and-Bound

## Getting Started

### Prerequisites

*   Node.js and npm (for the frontend)
*   Python 3.x and pip (for the backend)

### Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn server:app --reload
```

### Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Run the development server
npm start
```

The application will be available at `http://localhost:3000`.
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
