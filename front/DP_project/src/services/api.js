const API_BASE_URL = 'http://localhost:5000';

export const api = {
  /**
   * Upload ECG files to the backend
   * @param {Object} files - Object containing atr, dat, hea, xws files
   * @returns {Promise} - Response with session_id and beat count
   */
  async uploadFiles(files) {
    const formData = new FormData();
    formData.append('atr', files.atr);
    formData.append('dat', files.dat);
    formData.append('hea', files.hea);
    formData.append('xws', files.xws);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  /**
   * Analyze a specific beat using DTW algorithm
   * @param {string} sessionId - Session ID from upload
   * @param {number} beatIndex - Index of beat to analyze
   * @returns {Promise} - Analysis results
   */
  async analyzeBeat(sessionId, beatIndex) {
    const response = await fetch(`${API_BASE_URL}/analyze/${sessionId}/${beatIndex}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }

    return response.json();
  },

  /**
   * Get beat data without analysis
   * @param {string} sessionId - Session ID from upload
   * @param {number} beatIndex - Index of beat to get
   * @returns {Promise} - Beat data
   */
  async getBeat(sessionId, beatIndex) {
    const response = await fetch(`${API_BASE_URL}/get_beat/${sessionId}/${beatIndex}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get beat');
    }

    return response.json();
  },

  /**
   * Cleanup session files
   * @param {string} sessionId - Session ID to cleanup
   * @returns {Promise} - Cleanup confirmation
   */
  async cleanupSession(sessionId) {
    const response = await fetch(`${API_BASE_URL}/cleanup/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Cleanup failed');
    }

    return response.json();
  },

  /**
   * Check backend health
   * @returns {Promise} - Health status
   */
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      throw new Error('Backend is not available');
    }

    return response.json();
  },
};
