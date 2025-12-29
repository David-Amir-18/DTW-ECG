# ECG Arrhythmia Detection Using Dynamic Time Warping

A web-based application for detecting cardiac arrhythmias from ECG signals using the Dynamic Time Warping (DTW) algorithm. This project implements a dynamic programming approach to classify heartbeats as Normal or Abnormal.

## Overview

This system analyzes ECG (electrocardiogram) signals from the MIT-BIH Arrhythmia Database and classifies heartbeats into two categories:
- **Normal** - Regular sinus rhythm
- **Abnormal** - Right Bundle Branch Block


The application uses a sophisticated signal processing pipeline followed by DTW pattern matching to identify abnormalities in heart rhythms.

## Features

- Interactive web interface for ECG analysis
- Real-time signal visualization
- Dynamic Time Warping algorithm for pattern matching
- Advanced signal processing (multi-stage filtering, segmentation, normalization)
- Visual outputs: signal overlays, DTW alignment plots, and cost matrix heatmaps
- Binary classification: Normal vs Abnormal heartbeats

## Technology Stack

**Backend:**
- Python 3.x with Flask
- NumPy & SciPy for signal processing
- WFDB library for MIT-BIH database reading
- Matplotlib for visualization

**Frontend:**
- React 19.2.0
- Vite (build tool & dev server)
- Tailwind CSS for styling
- Canvas API for signal visualization

## Prerequisites

Before running the application, ensure you have:
- **Python 3.8+** installed
- **Node.js 16+** and npm installed
- Git (optional, for cloning)

**Note:** Throughout this README, `path/to/DP_project` refers to wherever you've saved this project on your computer. Replace it with your actual project path (e.g., `C:\Users\YourName\Documents\DP_project` on Windows or `~/Documents/DP_project` on Mac/Linux).

## Installation & Setup

### 1. Clone or Download the Project

```bash
# Navigate to the project directory
cd path/to/DP_project
```

Replace `path/to/DP_project` with your actual project location.

### 2. Backend Setup

#### Install Python Dependencies

```bash
# Navigate to project root directory
cd path/to/DP_project

# Install required packages
pip install -r requirements.txt
```

Required packages:
- Flask >= 3.0.0
- flask-cors >= 4.0.0
- wfdb >= 4.1.0
- numpy >= 1.26.0
- scipy >= 1.11.0
- werkzeug >= 3.0.0

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd path/to/DP_project/front/DP_project

# Install dependencies
npm install
```

## Running the Application

You need to run **both** the backend and frontend servers simultaneously.

### Step 1: Start the Backend Server

Open a terminal and run:

```bash
# Navigate to project root
cd path/to/DP_project

# Start Flask server
python back.py
```

The backend will start on **http://localhost:5000**

You should see:
```
 * Running on http://127.0.0.1:5000
 * Restarting with stat
 * Debugger is active!
```

### Step 2: Start the Frontend Server

Open a **new terminal** (keep the backend running) and run:

```bash
# Navigate to frontend directory
cd path/to/DP_project/front/DP_project

# Start Vite dev server
npm run dev
```

The frontend will start on **http://localhost:5173** (or another port if 5173 is busy)

You should see:
```
  VITE v7.2.4  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 3: Open the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## How to Use the Application

### 1. Navigate to Analysis Page

From the landing page, click on **"Analysis"** or **"Get Started"** to access the analysis dashboard.

### 2. Upload ECG Files

You need to upload **4 files** from the MIT-BIH Arrhythmia Database for any signal record:

#### Required Files (all 4 files must have the same record number):

1. **`.atr` file** - Annotation file (contains beat labels and R-peak locations)
2. **`.dat` file** - Binary signal data (raw ECG waveform)
3. **`.hea` file** - Header file (metadata: sampling rate, signal format, etc.)
4. **`.xws` file** - Waveform signal (additional format data)

#### Where to Find These Files:

The ECG files are located in the `mit-bih-arrhythmia-database-1.0.0/` folder within your project directory:
```
path/to/DP_project/mit-bih-arrhythmia-database-1.0.0/
```

#### Example: Uploading Record 100

Select these 4 files:
- `100.atr`
- `100.dat`
- `100.hea`
- `100.xws`

#### Available Signals:

You can use any of these record numbers (all have the 4 required files):
```
100, 101, 102, 103, 104, 105, 106, 107, 108, 109,
111, 112, 113, 114, 115, 116, 117, 118, 119, 121,
122, 123, 124, 200, 201, 202, 203, 205, 207, 208,
209, 210, 212, 213, 214, 215, 217, 219, 220, 221,
222, 223, 228, 230, 231, 232, 233, 234
```

**Important:** All 4 files must be from the **same record number** (e.g., all from 100, or all from 101).

### 3. Select a Beat to Analyze

After uploading:
- The system will process the ECG signal and extract individual heartbeats
- You'll see a list of detected beats
- Click on any beat number to analyze it

### 4. View Analysis Results

The system will display:
- **Classification Result**: Normal or Abnormal
- **DTW Distance**: Similarity score (lower = more similar to normal)
- **Signal Overlay**: Your beat vs. normal reference pattern
- **DTW Alignment Plot**: How the algorithm matched the signals
- **Cost Matrix Heatmap**: Visual representation of the DTW computation

### 5. Analyze More Beats

- Click different beat numbers to analyze other heartbeats from the same signal
- Upload new files to analyze different ECG records

## Understanding the Results


### Classification Categories:

- **Normal (N)**
- **Abnormal**
## Project Structure

```
DP_project/
├── back.py                              # Flask backend server (main API)
├── requirements.txt                     # Python dependencies           
│
├── front/DP_project/                    # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── landing.jsx              # Landing page
│   │   │   └── Analysis.jsx             # Analysis dashboard
│   │   ├── components/
│   │   │   ├── ECGChart.jsx             # Signal visualization
│   │   │   └── nav.jsx                  # Navigation
│   │   └── services/
│   │       └── api.js                   # Backend API client
│   └── package.json                     # Frontend dependencies
│
├── mit-bih-arrhythmia-database-1.0.0/   # ECG database (upload files from here)
│   ├── 100.atr, 100.dat, 100.hea, 100.xws
│   ├── 101.atr, 101.dat, 101.hea, 101.xws
│   └── ... (more signals)
│
                             
```

## Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'flask'`
- **Solution:** Run `pip install -r requirements.txt`

**Problem:** Backend won't start / Port already in use
- **Solution:** Kill any process using port 5000 or change the port in `back.py`

**Problem:** `FileNotFoundError` when uploading files
- **Solution:** Ensure all 4 files (.atr, .dat, .hea, .xws) are selected and from the same record

### Frontend Issues

**Problem:** `npm: command not found`
- **Solution:** Install Node.js from https://nodejs.org/

**Problem:** Frontend won't connect to backend
- **Solution:** Ensure backend is running on http://localhost:5000 first

**Problem:** "Backend health check failed"
- **Solution:** Start the backend server before accessing the analysis page

### File Upload Issues

**Problem:** "Error processing ECG files"
- **Solution:** Verify you selected exactly 4 files with matching record numbers
- **Example:** If you select `100.atr`, also select `100.dat`, `100.hea`, and `100.xws`

**Problem:** "No beats detected"
- **Solution:** Try a different signal record (some signals may have processing issues)


## API Endpoints

- `POST /upload` - Upload 4 ECG files and extract beats
- `GET /analyze/<session_id>/<beat_index>` - Analyze specific beat with DTW
- `GET /get_beat/<session_id>/<beat_index>` - Get beat data without analysis
- `DELETE /cleanup/<session_id>` - Clean up session files
- `GET /health` - Backend health check


## Credits

- **MIT-BIH Arrhythmia Database:** https://physionet.org/content/mitdb/
- **WFDB Python Library:** https://github.com/MIT-LCP/wfdb-python

## License

Academic project for algorithms course - educational purposes only.

---

**Need Help?** Check the troubleshooting section or review the backend/frontend console logs for error messages.
