import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ECGChart from "../components/ECGChart";
import { api } from "../services/api";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

function Analysis() {
  const navigate = useNavigate();

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState({
    atr: null,
    dat: null,
    hea: null,
    xws: null,
  });

  // Upload response state
  const [sessionId, setSessionId] = useState(null);
  const [totalBeats, setTotalBeats] = useState(0);
  const [beatPreviews, setBeatPreviews] = useState([]);

  // Beat selection state
  const [selectedBeatIndex, setSelectedBeatIndex] = useState("");

  // Analysis state
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Backend health state
  const [backendHealthy, setBackendHealthy] = useState(false);

  // Refs for animations
  const uploadSectionRef = useRef(null);
  const beatSelectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const health = await api.healthCheck();
      setBackendHealthy(
        health.status === "healthy" && health.normal_reference_loaded
      );
      if (!health.normal_reference_loaded) {
        setError(
          "Backend Normal reference not loaded. Please check the server."
        );
      }
    } catch (err) {
      setBackendHealthy(false);
      setError(
        "Backend server is not running. Please start the Flask server on port 5000."
      );
    }
  };

  const handleFileChange = (fileType, event) => {
    const file = event.target.files[0];
    setUploadedFiles((prev) => ({
      ...prev,
      [fileType]: file,
    }));
    setError(null);
  };

  const handleUpload = async () => {
    const allFilesUploaded = Object.values(uploadedFiles).every(
      (file) => file !== null
    );

    if (!allFilesUploaded) {
      setError("Please upload all 4 required files (.atr, .dat, .hea, .xws)");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await api.uploadFiles(uploadedFiles);
      setSessionId(response.session_id);
      setTotalBeats(response.total_beats);
      setBeatPreviews(response.beat_previews);
      setAnalysisResult(null);
      setSelectedBeatIndex("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedBeatIndex || selectedBeatIndex === "") {
      setError("Please select a beat to analyze");
      return;
    }

    const beatIndex = parseInt(selectedBeatIndex);
    if (beatIndex < 0 || beatIndex >= totalBeats) {
      setError(`Beat index must be between 0 and ${totalBeats - 1}`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await api.analyzeBeat(sessionId, beatIndex);
      setAnalysisResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = async () => {
    if (sessionId) {
      try {
        await api.cleanupSession(sessionId);
      } catch (err) {
        console.error("Cleanup failed:", err);
      }
    }
    setUploadedFiles({ atr: null, dat: null, hea: null, xws: null });
    setSessionId(null);
    setTotalBeats(0);
    setBeatPreviews([]);
    setSelectedBeatIndex("");
    setAnalysisResult(null);
    setError(null);
  };

  // GSAP Animations
  useGSAP(() => {
    // Upload section animation
    if (uploadSectionRef.current) {
      gsap.from(uploadSectionRef.current.children, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power2.out",
      });
    }

    // Beat selection animation (when it appears)
    if (beatSelectionRef.current && sessionId) {
      gsap.from(beatSelectionRef.current, {
        y: 30,
        opacity: 0,
        scale: 0.95,
        duration: 0.6,
        ease: "back.out(1.2)",
      });
    }

    // Results animation (when it appears)
    if (resultsSectionRef.current && analysisResult) {
      const resultCards =
        resultsSectionRef.current.querySelectorAll(".result-card");
      gsap.from(resultCards, {
        y: 40,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
      });
    }
  }, [sessionId, analysisResult]);

  return (
    <div
      className="min-h-screen py-12"
      style={{ backgroundColor: "var(--color-bg-secondary)" }}
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <button
          onClick={() => navigate("/")}
          className="mb-6 px-4 py-2 rounded-lg transition-all hover:opacity-80"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "white",
          }}
        >
          ← Back to Home
        </button>

        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: "var(--color-primary)" }}
        >
          ECG Signal Analysis
        </h1>
        <p
          className="text-lg mb-6"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Upload your ECG files and analyze individual heartbeats using our DTW algorithm
        </p>

        {/* Backend Status */}
          {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-bg-primary)" }}>
            <div
              className={`w-3 h-3 rounded-full ${
                backendHealthy ? "bg-green-400" : "bg-red-400"
              }`}
            ></div>
            <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>
              Backend: {backendHealthy ? "Connected" : "Disconnected"}
            </span>
          </div> */}
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-6xl mx-auto px-6 mb-6">
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: "var(--color-error-light)",
              borderLeft: "4px solid var(--color-error)",
            }}
          >
            <p style={{ color: "var(--color-error)" }}>{error}</p>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      <section className="max-w-6xl mx-auto px-6 mb-12" ref={uploadSectionRef}>
        <div
          className="p-8 rounded-lg shadow-lg"
          style={{ backgroundColor: "var(--color-bg-primary)" }}
        >
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: "var(--color-primary)" }}
          >
            Step 1: Upload ECG Files
          </h2>

          <p
            className="mb-6"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Upload all 4 required files from the MIT-BIH Arrhythmia Database format:
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {[
              {
                type: "atr",
                extension: ".atr",
                description: "Annotation file with beat labels",
              },
              {
                type: "dat",
                extension: ".dat",
                description: "Binary ECG signal data",
              },
              {
                type: "hea",
                extension: ".hea",
                description: "Header file with metadata",
              },
              {
                type: "xws",
                extension: ".xws",
                description: "Additional waveform data",
              },
            ].map((fileType) => (
              <div
                key={fileType.type}
                className="border-2 border-dashed rounded-lg p-4 transition-all"
                style={{
                  borderColor: uploadedFiles[fileType.type]
                    ? "var(--color-success)"
                    : "var(--color-border)",
                }}
              >
                <label className="block cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {fileType.extension} file
                    </span>
                    {uploadedFiles[fileType.type] && (
                      <span
                        className="text-sm px-2 py-1 rounded"
                        style={{
                          backgroundColor: "var(--color-success-light)",
                          color: "var(--color-success)",
                        }}
                      >
                        ✓ Uploaded
                      </span>
                    )}
                  </div>
                  <p
                    className="text-sm mb-3"
                    style={{ color: "var(--color-text-light)" }}
                  >
                    {fileType.description}
                  </p>
                  <input
                    type="file"
                    accept={fileType.extension}
                    onChange={(e) => handleFileChange(fileType.type, e)}
                    className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:cursor-pointer hover:file:opacity-80"
                  />
                  {uploadedFiles[fileType.type] && (
                    <p
                      className="text-sm mt-2"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {uploadedFiles[fileType.type].name}
                    </p>
                  )}
                </label>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={handleUpload}
              disabled={
                isUploading ||
                !backendHealthy ||
                Object.values(uploadedFiles).some((file) => file === null)
              }
              className="px-8 py-3 rounded-lg font-semibold text-white text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              style={{
                backgroundColor: "var(--color-primary)",
              }}
            >
              {isUploading ? "Processing..." : "Upload & Process Files"}
            </button>
          </div>
        </div>
      </section>

      {/* Beat Selection Section */}
      {sessionId && totalBeats > 0 && (
        <section className="max-w-6xl mx-auto px-6 mb-12" ref={beatSelectionRef}>
          <div
            className="p-8 rounded-lg shadow-lg"
            style={{ backgroundColor: "var(--color-bg-primary)" }}
          >
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: "var(--color-success)" }}
            >
              ✓ Step 2: Select a Beat to Analyze
            </h2>

            <div
              className="p-4 rounded-lg mb-6"
              style={{ backgroundColor: "var(--color-bg-tertiary)" }}
            >
              <p
                className="text-lg mb-2"
                style={{ color: "var(--color-text-primary)" }}
              >
                Total Heartbeats Found: <strong>{totalBeats}</strong>
              </p>
              <p
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Select a beat index (0 to {totalBeats - 1}) to analyze
              </p>
            </div>

            <div className="mb-6">
              <label
                className="block mb-2 font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Select Beat Index:
              </label>
              <input
                type="number"
                min="0"
                max={totalBeats - 1}
                value={selectedBeatIndex}
                onChange={(e) => setSelectedBeatIndex(e.target.value)}
                placeholder={`Enter a number between 0 and ${totalBeats - 1}`}
                className="w-full px-4 py-3 rounded-lg border-2 text-lg"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                  backgroundColor: "var(--color-bg-secondary)",
                }}
              />
            </div>

            {/* Beat Previews */}
            {beatPreviews.length > 0 && (
              <div className="mb-6">
                <p
                  className="text-sm mb-3 font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Quick Select - First {beatPreviews.length} beats:
                </p>
                <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                  {beatPreviews.map((preview) => (
                    <button
                      key={preview.index}
                      onClick={() =>
                        setSelectedBeatIndex(preview.index.toString())
                      }
                      className="p-3 rounded border-2 hover:scale-105 transition-all"
                      style={{
                        borderColor:
                          selectedBeatIndex === preview.index.toString()
                            ? "var(--color-primary)"
                            : "var(--color-border)",
                        backgroundColor:
                          selectedBeatIndex === preview.index.toString()
                            ? "var(--color-primary-light)"
                            : "var(--color-bg-tertiary)",
                      }}
                    >
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        Beat {preview.index}
                      </p>
                      
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !selectedBeatIndex}
                className="px-8 py-3 rounded-lg font-semibold text-white text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                style={{
                  backgroundColor: "var(--color-secondary)",
                }}
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Selected Beat"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Analysis Results Section - Binary Classification */}
      {analysisResult && (
        <section className="max-w-7xl mx-auto px-6 mb-12" ref={resultsSectionRef}>
          <div
            className="p-8 rounded-lg shadow-lg"
            style={{ backgroundColor: "var(--color-bg-primary)" }}
          >
            <h2
              className="text-3xl font-bold mb-8 text-center"
              style={{ color: "var(--color-primary)" }}
            >
              Binary Classification Results
            </h2>

            {/* Classification Result - Big Banner */}
            <div
              className="p-8 rounded-lg shadow-lg mb-8 text-center result-card"
              style={{
                backgroundColor: analysisResult.predicted_class === 'Normal' ?
                  'var(--color-success-light)' : 'var(--color-error-light)',
                border: `4px solid ${analysisResult.predicted_class === 'Normal' ?
                  'var(--color-success)' : 'var(--color-error)'}`,
              }}
            >
              <h3
                className="text-lg font-semibold mb-3 uppercase tracking-wide"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Classification Result
              </h3>
              <p
                className="text-4xl font-bold mb-4"
                style={{
                  color: analysisResult.predicted_class === 'Normal' ?
                    'var(--color-success)' : 'var(--color-error)',
                }}
              >
                {analysisResult.predicted_class}
              </p>
              <p
                className="text-xl"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {analysisResult.predicted_class === 'Normal'
                  ? '✓ This heartbeat appears normal'
                  : '⚠ This heartbeat shows abnormalities'}
              </p>
            </div>

            {/* Metrics Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div
                className="p-6 rounded-lg shadow-md text-center result-card"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  borderLeft: "4px solid var(--color-primary)",
                }}
              >
                <h3
                  className="text-sm font-semibold mb-2 uppercase"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  DTW Distance
                </h3>
                <p
                  className="text-4xl font-bold mb-2"
                  style={{ color: "var(--color-primary)" }}
                >
                  {analysisResult.dtw_distance.toFixed(2)}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-light)" }}
                >
                  Distance to Normal reference
                </p>
              </div>

              <div
                className="p-6 rounded-lg shadow-md text-center result-card"
                style={{
                  backgroundColor: "var(--color-bg-elevated)",
                  borderLeft: "4px solid var(--color-accent)",
                }}
              >
                <h3
                  className="text-sm font-semibold mb-2 uppercase"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Beat Index
                </h3>
                <p
                  className="text-4xl font-bold mb-2"
                  style={{ color: "var(--color-accent)" }}
                >
                  {analysisResult.beat_index}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-light)" }}
                >
                  Actual label: {analysisResult.actual_label}
                </p>
              </div>
            </div>

            {/* Visualizations from Backend */}
            <div className="mb-8">
              <h3
                className="text-2xl font-semibold mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                Signal Overlay Comparison
              </h3>
              <div
                className="p-6 rounded-lg shadow-md result-card"
                style={{ backgroundColor: "var(--color-bg-secondary)" }}
              >
                <img
                  src={analysisResult.plots.overlay}
                  alt="Signal Overlay"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* DTW Alignment Visualization */}
            <div className="mb-8">
              <h3
                className="text-2xl font-semibold mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                DTW Alignment Visualization
              </h3>
              <div
                className="p-6 rounded-lg shadow-md result-card"
                style={{ backgroundColor: "var(--color-bg-secondary)" }}
              >
                <img
                  src={analysisResult.plots.alignment}
                  alt="DTW Alignment"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* DTW Cost Matrix Heatmap */}
            <div className="mb-8">
              <h3
                className="text-2xl font-semibold mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                DTW Cost Matrix Heatmap
              </h3>
              <div
                className="p-6 rounded-lg shadow-md result-card"
                style={{ backgroundColor: "var(--color-bg-secondary)" }}
              >
                <img
                  src={analysisResult.plots.heatmap}
                  alt="DTW Heatmap"
                  className="w-[60vw] h-[50vw] mx-auto"
                />
              </div>
            </div>

            {/* Classification Details */}
            <div
              className="p-6 rounded-lg shadow-md mb-8 result-card"
              style={{ backgroundColor: "var(--color-bg-tertiary)" }}
            >
              <h3
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                Classification Details
              </h3>
              <div
                className="space-y-2 text-lg"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <p>
                  <strong>Algorithm:</strong> Dynamic Time Warping (DTW) with Binary Classification
                </p>
                <p>
                  <strong>Method:</strong> Compare patient beat against synthetic Normal reference
                </p>
                <p>
                  <strong>DTW Distance:</strong> {analysisResult.dtw_distance.toFixed(4)}
                </p>
                <p>
                  <strong>Classification:</strong> The patient beat is classified as <strong>{analysisResult.predicted_class}</strong>
                </p>
                <p>
                  <strong>Interpretation:</strong> {
                    analysisResult.predicted_class === 'Normal'
                      ? 'The heartbeat pattern closely matches the normal reference.'
                      : 'The heartbeat pattern shows significant deviation from the normal reference.'
                  }
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setSelectedBeatIndex("");
                }}
                className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                style={{
                  backgroundColor: "var(--color-secondary)",
                  color: "white",
                }}
              >
                Analyze Another Beat
              </button>
              <button
                onClick={resetAnalysis}
                className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 border-2"
                style={{
                  borderColor: "var(--color-primary)",
                  color: "var(--color-primary)",
                  backgroundColor: "transparent",
                }}
              >
                Upload New Signal
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Analysis;
