from flask import Flask, request, jsonify
from flask_cors import CORS
import wfdb
import numpy as np
from scipy import signal
from scipy.special import erf
import os
import tempfile
from werkzeug.utils import secure_filename
import json
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend
import matplotlib.pyplot as plt
import io
import base64

app = Flask(__name__)
CORS(app)

# Global storage for uploaded files and processing state
upload_sessions = {}

# BINARY CLASSIFICATION THRESHOLD (Change here to adjust threshold)
CLASSIFICATION_THRESHOLD = 67

def apply_advanced_filtering(input_signal: np.ndarray, sampling_rate: int) -> np.ndarray:
    """
    Applies a multi-stage filtering process to clean the raw ECG.
    """
    nyq = 0.5 * sampling_rate

    # STAGE 1: Baseline Wander Removal
    low_cutoff = 0.5 / nyq
    b_high, a_high = signal.butter(3, low_cutoff, btype="high")
    sig_no_base = signal.filtfilt(b_high, a_high, input_signal)

    # STAGE 2: Powerline Interference Removal
    f0 = 60
    q = 30
    b_notch, a_notch = signal.iirnotch(f0, q, sampling_rate)
    sig_no_power = signal.filtfilt(b_notch, a_notch, sig_no_base)

    # STAGE 3: High-Frequency Denoising
    high_cutoff = 50 / nyq
    b_low, a_low = signal.butter(3, high_cutoff, btype="low")
    clean_signal = signal.filtfilt(b_low, a_low, sig_no_power)

    return clean_signal

def segmentation(signal_data, r_peaks, labels, fs):
    """
    Segment ECG signal into individual heartbeats centered on R-peaks.
    """
    pre = int(0.2 * fs)   # 200 ms before R-peak
    post = int(0.4 * fs)  # 400 ms after R-peak
    segments = []
    segment_labels = []

    for r, label in zip(r_peaks, labels):
        start = r - pre
        end = r + post

        # Skip incomplete windows at signal boundaries
        if start < 0 or end > len(signal_data):
            continue

        segment = signal_data[start:end]
        segments.append(segment)
        segment_labels.append(label)

    segments = np.array(segments)
    segment_labels = np.array(segment_labels)
    return segments, segment_labels

def apply_normalization(segments_array: np.ndarray) -> np.ndarray:
    """
    Normalizes a 2D numpy array of heartbeats using Z-score.
    """
    means = np.mean(segments_array, axis=1, keepdims=True)
    stds = np.std(segments_array, axis=1, keepdims=True)
    stds[stds == 0] = 1
    normalized_segments = (segments_array - means) / stds
    return normalized_segments

def transform(raw_signal: np.ndarray, r_peaks, labels, sampling_rate: int):
    """
    Complete transformation: filtering + segmentation + normalization
    """
    cleaned_signal = apply_advanced_filtering(raw_signal, sampling_rate)
    heart_beats, beat_labels = segmentation(cleaned_signal, r_peaks, labels, sampling_rate)
    heart_beats = apply_normalization(heart_beats)
    return heart_beats, beat_labels

def compute_dtw_with_path(s1, s2):
    """
    Computes DTW distance and retrieves the optimal warping path (Backtracking).
    s1: Patient beat signal
    s2: Reference template signal
    """
    n, m = len(s1), len(s2)
    dtw_matrix = np.full((n + 1, m + 1), np.inf)
    dtw_matrix[0, 0] = 0

    # Fill the cost matrix
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost = abs(s1[i-1] - s2[j-1])
            dtw_matrix[i, j] = cost + min(
                dtw_matrix[i-1, j],    # Insertion
                dtw_matrix[i, j-1],    # Deletion
                dtw_matrix[i-1, j-1]   # Match
            )

    # Extract the Backtracking Path
    path = []
    i, j = n, m
    while i > 0 and j > 0:
        path.append((i - 1, j - 1))
        option = np.argmin([dtw_matrix[i-1, j-1], dtw_matrix[i-1, j], dtw_matrix[i, j-1]])
        if option == 0:
            i, j = i-1, j-1
        elif option == 1:
            i -= 1
        else:
            j -= 1

    return dtw_matrix[n, m], dtw_matrix[1:, 1:], path[::-1]

def diagnose_binary(patient_beat, normal_reference, threshold):
    """
    Binary classification: Normal vs Abnormal
    Compares patient beat against Normal reference using DTW
    Returns prediction and full DTW information for visualization
    """
    # Compute DTW distance and get full matrix + path
    dtw_distance, cost_matrix, warping_path = compute_dtw_with_path(patient_beat, normal_reference)

    # Classification decision
    if dtw_distance < threshold:
        prediction = 'Normal'
    else:
        prediction = 'Abnormal'

    # Downsample cost matrix for visualization (to prevent browser freeze)
    # Reduce from 216x216 to max 100x100
    def downsample_matrix(matrix, target_size=100):
        """Downsample a 2D matrix to target_size x target_size"""
        original_size = len(matrix)
        if original_size <= target_size:
            return matrix

        step = original_size / target_size
        downsampled = []
        for i in range(target_size):
            row = []
            for j in range(target_size):
                orig_i = int(i * step)
                orig_j = int(j * step)
                row.append(matrix[orig_i][orig_j])
            downsampled.append(row)
        return downsampled

    # Downsample warping path (keep every Nth point)
    def downsample_path(path, max_points=200):
        """Keep only max_points from the warping path"""
        if len(path) <= max_points:
            return path
        step = len(path) // max_points
        return [path[i] for i in range(0, len(path), step)]

    downsampled_matrix = downsample_matrix(cost_matrix, target_size=100)
    downsampled_path = downsample_path(warping_path, max_points=200)

    return {
        'prediction': prediction,
        'dtw_distance': float(dtw_distance),
        'threshold': float(threshold),
        'cost_matrix': downsampled_matrix,
        'warping_path': downsampled_path,
        'normal_reference': normal_reference.tolist(),
        'matrix_size': len(downsampled_matrix)  # For frontend to know the size
    }

def generate_overlay_plot(patient_signal, normal_reference):
    """Generate overlay plot of patient signal and normal reference"""
    fig, ax = plt.subplots(figsize=(10, 4))

    # Plot both signals
    ax.plot(patient_signal, label='Patient Beat', color='#6366F1', linewidth=2, alpha=0.8)
    ax.plot(normal_reference, label='Normal Reference', color='#14B8A6', linewidth=2, alpha=0.6)

    ax.set_xlabel('Sample Index', fontsize=11, fontweight='bold')
    ax.set_ylabel('Normalized Amplitude', fontsize=11, fontweight='bold')
    ax.set_title('Signal Overlay Comparison', fontsize=13, fontweight='bold', pad=15)
    ax.legend(loc='upper right', fontsize=10)
    ax.grid(True, alpha=0.3)
    ax.set_facecolor('#0A0E27')
    fig.patch.set_facecolor('#0A0E27')
    ax.spines['bottom'].set_color('#D1D5DB')
    ax.spines['top'].set_color('#D1D5DB')
    ax.spines['left'].set_color('#D1D5DB')
    ax.spines['right'].set_color('#D1D5DB')
    ax.tick_params(colors='#D1D5DB')
    ax.xaxis.label.set_color('#D1D5DB')
    ax.yaxis.label.set_color('#D1D5DB')
    ax.title.set_color('#F9FAFB')

    # Convert to base64
    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='#0A0E27')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)

    return f"data:image/png;base64,{img_base64}"

def generate_alignment_plot(patient_signal, normal_reference, warping_path):
    """Generate DTW alignment plot with connection lines"""
    fig, ax = plt.subplots(figsize=(12, 5))

    # Offset for visual separation
    offset = 4

    # Plot patient signal (top)
    ax.plot(patient_signal, label='Patient Beat', color='#6366F1', linewidth=2)

    # Plot normal reference (bottom, shifted)
    ax.plot(normal_reference + offset, label='Normal Reference', color='#14B8A6', linewidth=2)

    # Draw warping path connections (every 10th point to avoid clutter)
    for i in range(0, len(warping_path), 10):
        p_idx, r_idx = warping_path[i]
        if p_idx < len(patient_signal) and r_idx < len(normal_reference):
            ax.plot([p_idx, r_idx],
                   [patient_signal[p_idx], normal_reference[r_idx] + offset],
                   color='#F472B6', linewidth=0.5, alpha=0.3)

    ax.set_xlabel('Sample Index', fontsize=11, fontweight='bold')
    ax.set_ylabel('Amplitude', fontsize=11, fontweight='bold')
    ax.set_title('DTW Alignment Visualization', fontsize=13, fontweight='bold', pad=15)
    ax.legend(loc='upper right', fontsize=10)
    ax.grid(True, alpha=0.3)
    ax.set_facecolor('#0A0E27')
    fig.patch.set_facecolor('#0A0E27')
    ax.spines['bottom'].set_color('#D1D5DB')
    ax.spines['top'].set_color('#D1D5DB')
    ax.spines['left'].set_color('#D1D5DB')
    ax.spines['right'].set_color('#D1D5DB')
    ax.tick_params(colors='#D1D5DB')
    ax.xaxis.label.set_color('#D1D5DB')
    ax.yaxis.label.set_color('#D1D5DB')
    ax.title.set_color('#F9FAFB')

    # Convert to base64
    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='#0A0E27')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)

    return f"data:image/png;base64,{img_base64}"

def generate_heatmap_plot(cost_matrix, warping_path, patient_len, ref_len):
    """Generate DTW cost matrix heatmap with optimal path"""
    fig, ax = plt.subplots(figsize=(8, 8))

    # Plot heatmap
    im = ax.imshow(cost_matrix, cmap='Blues', origin='lower', aspect='auto', interpolation='nearest')

    # Plot warping path
    if warping_path:
        matrix_size = len(cost_matrix)
        path_y = [(p / patient_len) * matrix_size for p, r in warping_path]
        path_x = [(r / ref_len) * matrix_size for p, r in warping_path]
        ax.plot(path_x, path_y, '#F472B6', linewidth=2, label='Optimal Path')

    ax.set_xlabel('Reference Beat Index', fontsize=11, fontweight='bold')
    ax.set_ylabel('Patient Beat Index', fontsize=11, fontweight='bold')
    ax.set_title('DTW Cost Matrix Heatmap', fontsize=13, fontweight='bold', pad=15)

    # Add colorbar
    cbar = plt.colorbar(im, ax=ax, pad=0.02)
    cbar.set_label('Cumulative Cost', fontsize=10, fontweight='bold')
    cbar.ax.tick_params(colors='#D1D5DB')
    cbar.ax.yaxis.label.set_color('#D1D5DB')

    ax.set_facecolor('#0A0E27')
    fig.patch.set_facecolor('#0A0E27')
    ax.spines['bottom'].set_color('#D1D5DB')
    ax.spines['top'].set_color('#D1D5DB')
    ax.spines['left'].set_color('#D1D5DB')
    ax.spines['right'].set_color('#D1D5DB')
    ax.tick_params(colors='#D1D5DB')
    ax.xaxis.label.set_color('#D1D5DB')
    ax.yaxis.label.set_color('#D1D5DB')
    ax.title.set_color('#F9FAFB')

    # Convert to base64
    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='#0A0E27')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)

    return f"data:image/png;base64,{img_base64}"

def build_synthetic_normal_reference():
    """
    Build synthetic normal ECG reference using Gaussian functions
    This creates a mathematically perfect Normal heartbeat
    """
    print("Building synthetic Normal reference...")

    t = np.linspace(0, 1, 216)

    def gaussian(t, mu, sigma, A):
        return A * np.exp(-((t - mu) ** 2) / (2 * sigma ** 2))

    def skewed_gaussian(t, mu, sigma, A, alpha):
        pdf = (1 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-((t - mu) ** 2) / (2 * sigma ** 2))
        cdf = 0.5 * (1 + erf((alpha * (t - mu) / sigma) / np.sqrt(2)))
        scale = A / np.max(2 * pdf * cdf)
        return scale * 2 * pdf * cdf

    # Define Waves
    P = gaussian(t, mu=0.2,  sigma=0.025, A=0.1)
    Q = gaussian(t, mu=0.38, sigma=0.010, A=-0.15)
    R = gaussian(t, mu=0.40, sigma=0.008, A=1)
    S = gaussian(t, mu=0.43, sigma=0.012, A=-0.25)
    T = skewed_gaussian(t, mu=0.65, sigma=0.050, A=0.1, alpha=2)

    ecg = P + Q + R + S + T
    normalized_ecg = apply_normalization(np.array([ecg]))[0]

    print(f"  Synthetic Normal reference created (length: {len(normalized_ecg)})")
    return normalized_ecg

# Build synthetic Normal reference on startup
print("Initializing binary classification system...")
NORMAL_REFERENCE = build_synthetic_normal_reference()
print(f"Binary classification ready! Threshold: {CLASSIFICATION_THRESHOLD}")

@app.route('/upload', methods=['POST'])
def upload_files():
    """
    Endpoint to upload the 4 ECG files and extract beats
    """
    try:
        # Check if all required files are present
        required_files = ['atr', 'dat', 'hea', 'xws']

        if not all(f in request.files for f in required_files):
            return jsonify({
                'error': 'Missing required files. Please upload .atr, .dat, .hea, and .xws files'
            }), 400

        # Create temporary directory for this upload session
        temp_dir = tempfile.mkdtemp()
        session_id = os.path.basename(temp_dir)

        # Get base filename from one of the files (they should all have same base name)
        base_filename = secure_filename(request.files['dat'].filename).replace('.dat', '')

        # Save all files to temp directory
        file_paths = {}
        for file_type in required_files:
            file = request.files[file_type]
            filename = f"{base_filename}.{file_type}"
            filepath = os.path.join(temp_dir, filename)
            file.save(filepath)
            file_paths[file_type] = filepath

        # Read ECG data using wfdb
        record_path = os.path.join(temp_dir, base_filename)

        try:
            record = wfdb.rdrecord(record_path)
            raw_signal = record.p_signal[:, 0]
            annotation = wfdb.rdann(record_path, 'atr')
            r_peaks = annotation.sample
            labels = annotation.symbol
            fs = record.fs

            # Transform the signal (filter + segment)
            heart_beats, beat_labels = transform(raw_signal, r_peaks, labels, int(fs))

            # Store session data
            upload_sessions[session_id] = {
                'temp_dir': temp_dir,
                'heart_beats': heart_beats,
                'beat_labels': beat_labels,
                'fs': fs,
                'raw_signal': raw_signal,
                'r_peaks': r_peaks
            }

            # Prepare response with beat previews
            beat_previews = []
            for i, (beat, label) in enumerate(zip(heart_beats[:50], beat_labels[:50])):  # Limit to first 50 for preview
                beat_previews.append({
                    'index': i,
                    'label': label,
                    'signal': beat.tolist()
                })

            return jsonify({
                'session_id': session_id,
                'total_beats': len(heart_beats),
                'sampling_rate': int(fs),
                'beat_previews': beat_previews,
                'message': f'Successfully processed {len(heart_beats)} heartbeats'
            }), 200

        except Exception as e:
            # Clean up temp directory on error
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
            return jsonify({'error': f'Error processing ECG files: {str(e)}'}), 500

    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/analyze/<session_id>/<int:beat_index>', methods=['GET'])
def analyze_beat(session_id, beat_index):
    """
    Analyze a specific beat using binary DTW classification
    """
    try:
        # Check if session exists
        if session_id not in upload_sessions:
            return jsonify({'error': 'Invalid session ID or session expired'}), 404

        session_data = upload_sessions[session_id]
        heart_beats = session_data['heart_beats']
        beat_labels = session_data['beat_labels']

        # Validate beat index
        if beat_index < 0 or beat_index >= len(heart_beats):
            return jsonify({'error': f'Beat index out of range. Valid range: 0-{len(heart_beats)-1}'}), 400

        # Get the selected beat
        test_beat = heart_beats[beat_index]
        actual_label = beat_labels[beat_index]

        # Run binary DTW diagnosis
        result = diagnose_binary(test_beat, NORMAL_REFERENCE, CLASSIFICATION_THRESHOLD)

        # Generate plots as base64 images
        print("Generating visualization plots...")
        overlay_plot = generate_overlay_plot(test_beat, NORMAL_REFERENCE)
        alignment_plot = generate_alignment_plot(test_beat, NORMAL_REFERENCE, result['warping_path'])
        heatmap_plot = generate_heatmap_plot(
            result['cost_matrix'],
            result['warping_path'],
            len(test_beat),
            len(NORMAL_REFERENCE)
        )
        print("Plots generated successfully!")

        return jsonify({
            'beat_index': beat_index,
            'actual_label': actual_label,
            'predicted_class': result['prediction'],
            'dtw_distance': result['dtw_distance'],
            'threshold': result['threshold'],
            'patient_signal': test_beat.tolist(),
            'normal_reference': result['normal_reference'],
            'classification': {
                'is_normal': result['prediction'] == 'Normal',
                'distance_to_threshold': abs(result['dtw_distance'] - result['threshold']),
                'confidence': abs(result['dtw_distance'] - result['threshold']) / result['threshold'] * 100
            },
            'plots': {
                'overlay': overlay_plot,
                'alignment': alignment_plot,
                'heatmap': heatmap_plot
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@app.route('/get_beat/<session_id>/<int:beat_index>', methods=['GET'])
def get_beat(session_id, beat_index):
    """
    Get a specific beat's data without running DTW analysis
    """
    try:
        if session_id not in upload_sessions:
            return jsonify({'error': 'Invalid session ID or session expired'}), 404

        session_data = upload_sessions[session_id]
        heart_beats = session_data['heart_beats']
        beat_labels = session_data['beat_labels']

        if beat_index < 0 or beat_index >= len(heart_beats):
            return jsonify({'error': f'Beat index out of range. Valid range: 0-{len(heart_beats)-1}'}), 400

        return jsonify({
            'beat_index': beat_index,
            'label': beat_labels[beat_index],
            'signal': heart_beats[beat_index].tolist()
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to retrieve beat: {str(e)}'}), 500

@app.route('/cleanup/<session_id>', methods=['DELETE'])
def cleanup_session(session_id):
    """
    Clean up temporary files for a session
    """
    try:
        if session_id in upload_sessions:
            import shutil
            temp_dir = upload_sessions[session_id]['temp_dir']
            shutil.rmtree(temp_dir, ignore_errors=True)
            del upload_sessions[session_id]
            return jsonify({'message': 'Session cleaned up successfully'}), 200
        else:
            return jsonify({'error': 'Session not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Cleanup failed: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'classification_mode': 'binary',
        'threshold': CLASSIFICATION_THRESHOLD,
        'normal_reference_loaded': NORMAL_REFERENCE is not None,
        'active_sessions': len(upload_sessions)
    }), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
