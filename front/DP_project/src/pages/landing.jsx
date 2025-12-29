import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ECGChart from "../components/ECGChart";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(useGSAP);

function generateNormalECG(length = 600) {
  const signal = [];
  for (let i = 0; i < length; i++) {
    const t = i / length;
    const beat =
      Math.sin(t * Math.PI * 8) * 0.3 +
      Math.exp(-Math.pow((((t * 8) % 1) - 0.3) * 10, 2)) * 1.5 +
      Math.exp(-Math.pow((((t * 8) % 1) - 0.5) * 15, 2)) * 0.5;
    signal.push(beat + (Math.random() - 0.5) * 0.05);
  }
  return signal;
}

function generateAbnormalECG(length = 600) {
  const signal = [];
  for (let i = 0; i < length; i++) {
    const t = i / length;
    const beat =
      Math.sin(t * Math.PI * 8) * 0.3 +
      Math.exp(-Math.pow((((t * 8) % 1) - 0.3) * 10, 2)) * 2.5 +
      Math.exp(-Math.pow((((t * 8) % 1) - 0.7) * 8, 2)) * 1.2 +
      Math.sin(t * Math.PI * 16) * 0.4;
    signal.push(beat + (Math.random() - 0.5) * 0.08);
  }
  return signal;
}

function Landing() {
  const navigate = useNavigate();
  const normalSignal = generateNormalECG();
  const abnormalSignal = generateAbnormalECG();

  // Refs for animations
  const pipelineRef = useRef(null);
  const itemsRef = useRef([]);
  const heroRef = useRef(null);
  const explanationRef = useRef(null);
  const chartsRef = useRef(null);
  const circlesContainer = useRef(null);
  const imageContainerRef = useRef(null);
  const imageRef = useRef(null);
  const ctaRef = useRef(null);

  // GSAP Animations
  useGSAP(() => {
    // Hero section animation
    if (heroRef.current) {
      gsap.from(heroRef.current.children, {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
      });
    }

    // Pipeline explanation section
    if (explanationRef.current) {
      gsap.from(explanationRef.current.children, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: explanationRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });
    }

    // Charts animation
    if (chartsRef.current) {
      const charts = chartsRef.current.querySelectorAll(".chart-card");
      gsap.from(charts, {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: chartsRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
        },
      });
    }

    // Pipeline steps animation with scroll
    if (pipelineRef.current) {
      const stepItems = pipelineRef.current.querySelectorAll(".pipeline-step");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pipelineRef.current,
          start: "center 300",
          end: () => `+=${stepItems.length * 400}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      stepItems.forEach((item, index) => {
        const circle = item.querySelector(".step-circle");
        const content = item.querySelector(".step-content");

        if (circle && content) {
          tl.from(circle, {
            scale: 0,
            rotation: -180,
            duration: 0.6,
            ease: "back.out(1.7)",
          })
            .from(
              content,
              {
                x: -30,
                opacity: 0,
                duration: 0.6,
                ease: "power2.out",
              },
              "-=0.3"
            )
            .to({}, { duration: 0.5 });
        }
      });
    }

    // CTA section animation
    if (ctaRef.current) {
      gsap.from(ctaRef.current, {
        y: 50,
        opacity: 0,
        scale: 0.95,
        duration: 0.8,
        ease: "back.out(1.2)",
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });
    }
  }, []);

  // ECG pulse animation
  useEffect(() => {
    const circles = circlesContainer.current?.querySelectorAll(".circle");
    if (circles) {
      gsap.to(circles, {
        keyframes: [
          { y: 0, duration: 0.1 },
          { y: -5, duration: 0.1, ease: "none" },
          { y: 0, duration: 0.1 },
          { y: 2, duration: 0.05 },
          { y: -40, duration: 0.1, ease: "power4.out" },
          { y: 10, duration: 0.1, ease: "none" },
          { y: -5, duration: 0.05, ease: "sine.out" },
          { y: 0, duration: 0.1, ease: "sine.in" },
        ],
        stagger: {
          each: 0.05,
          repeat: -1,
          repeatDelay: 1,
        },
      });
    }
  }, []);

  useEffect(() => {
    // 2. Parallax Reveal Effect for the Image
    // The image moves at a different speed than the scroll
    gsap.fromTo(
      imageRef.current,
      { y: "-60%" }, // Start slightly higher
      {
        y: "60%", // Move lower as we scroll
        ease: "none",
        scrollTrigger: {
          trigger: imageContainerRef.current,
          start: "top bottom", // Start when container enters viewport
          end: "bottom top", // End when container leaves viewport
          scrub: true, // Smoothly tie animation to scroll
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const circles = Array.from({ length: 300 });

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-bg-secondary)" }}
    >
      {/* Hero Section */}
      <section
        className="py-20 px-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
        }}
      >
        <div
          className="max-w-6xl mx-auto text-center text-white relative z-10"
          ref={heroRef}
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            ECG Arrhythmia Detection
          </h1>
          <p className="text-xl md:text-2xl mb-4 opacity-90">
            Powered by Dynamic Time Warping Algorithm
          </p>
          <p className="text-lg max-w-3xl mx-auto opacity-80 my-10">
            Advanced signal processing to detect cardiac arrhythmias by
            comparing ECG heartbeat patterns using dynamic programming
            techniques.
          </p>

          <button
            onClick={() => navigate("/analysis")}
            className="px-10 py-4 rounded-lg font-bold text-xl transition-all hover:scale-110 shadow-lg"
            style={{
              backgroundColor: "white",
              color: "var(--color-primary)",
            }}
          >
            Start Analysis →
          </button>
        </div>

        {/* Animated ECG Pulse */}
        <div
          className="flex absolute left-[-100px] gap-1 p-10 z-0"
          ref={circlesContainer}
        >
          {circles.map((_, index) => (
            <div
              key={index}
              className="w-1 h-2 rounded-full bg-[#F472B6] circle"
            ></div>
          ))}
        </div>
      </section>

      {/* Pipeline Explanation Section */}
      <section
        className="py-16 w-full"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <h2
            className="text-4xl font-bold mb-12 text-center"
            style={{ color: "var(--color-primary)" }}
          >
            How Our Detection System Works
          </h2>

          {/* Overview Cards */}
          <div ref={explanationRef} className="mb-16">
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div
                className="p-8 rounded-lg shadow-lg"
                style={{ backgroundColor: "var(--color-bg-tertiary)" }}
              >
                <h3
                  className="text-2xl font-semibold mb-4"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Step-by-Step Process
                </h3>
                <p
                  className="mb-4 text-lg"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Our system processes your ECG signal through a carefully
                  designed pipeline that cleans the data, extracts meaningful
                  patterns, and compares them against known reference 
                  to identify arrhythmia type.
                </p>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  Each heartbeat is analyzed individually.
                </p>
              </div>

              <div
                className="p-8 rounded-lg shadow-lg"
                style={{ backgroundColor: "var(--color-bg-tertiary)" }}
              >
                <h3
                  className="text-2xl font-semibold mb-4"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Why This Approach?
                </h3>
                <ul
                  className="space-y-3"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <li className="flex items-start">
                    <span
                      className="mr-3 text-xl"
                      style={{ color: "var(--color-primary)" }}
                    >
                      ✓
                    </span>
                    <span>
                      <strong>Accurate filtering</strong> removes noise and
                      artifacts
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span
                      className="mr-3 text-xl"
                      style={{ color: "var(--color-primary)" }}
                    >
                      ✓
                    </span>
                    <span>
                      <strong>Smart segmentation</strong> isolates complete
                      heartbeats
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span
                      className="mr-3 text-xl"
                      style={{ color: "var(--color-primary)" }}
                    >
                      ✓
                    </span>
                    <span>
                      <strong>Pattern matching</strong> handles heart rate
                      variations
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span
                      className="mr-3 text-xl"
                      style={{ color: "var(--color-primary)" }}
                    >
                      ✓
                    </span>
                    <span>
                      <strong>Reliable classification</strong> uses multiple
                      references
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Detailed Pipeline - Full Width */}
          <div
            className="w-full py-12 px-6 mb-12"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
            ref={pipelineRef}
          >
            <h3
              className="text-3xl font-semibold mb-8 text-center"
              style={{ color: "var(--color-text-primary)" }}
            >
              Our 5-Step Processing Pipeline
            </h3>

            <div className="max-w-6xl mx-auto">
              <div className="space-y-8">
                {[
                  {
                    step: "1",
                    title: "Signal Loading",
                    desc: "Read ECG files and extract raw heartbeat data",
                    details:
                      "Process all four required files (.atr, .dat, .hea, .xws) to extract complete ECG waveform with timing and annotation information.",
                  },
                  {
                    step: "2",
                    title: "Advanced Filtering",
                    desc: "Three-stage filtering removes noise and interference",
                    details:
                      "Remove baseline drift (0.5 Hz high-pass), eliminate powerline noise (60 Hz notch), filter high-frequency artifacts (50 Hz low-pass).",
                  },
                  {
                    step: "3",
                    title: "Heartbeat Segmentation",
                    desc: "Extract each complete heartbeat as individual pattern",
                    details:
                      "Identify R-wave peaks and extract 200ms pre-R + 400ms post-R windows, capturing complete P-QRS-T complex.",
                  },
                  {
                    step: "4",
                    title: "DTW Pattern Matching",
                    desc: "Compare against reference beat using dynamic time warping",
                    details:
                      "Each beat compared with a reference beat. DTW finds optimal alignment accounting for timing variations.",
                  },
                  {
                    step: "5",
                    title: "Classification ",
                    desc: "Identify arrhythmia type ",
                    details:
                      "Calculate the dtw score and classifiy based on a thershold.",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-6 items-start p-4 rounded-lg pipeline-step"
                    style={{ backgroundColor: "var(--color-bg-primary)" }}
                  >
                    <div
                      className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-2xl shadow-lg step-circle"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      {item.step}
                    </div>
                    <div className="flex-1 step-content">
                      <h4
                        className="text-xl font-semibold mb-2"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {item.title}
                      </h4>
                      <p
                        className="font-medium mb-2"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {item.desc}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {item.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Parallax Image - Full Width */}
          <div
            ref={imageContainerRef}
            className="relative h-[60vh] w-screen overflow-hidden my-20"
            style={{ marginLeft: "calc(-50vw + 50%)" }}
          >
            <img
              ref={imageRef}
              className="absolute top-[-20%] left-0 w-full h-[140%] object-cover"
              src="https://images.unsplash.com/photo-1682706841289-9d7ddf5eb999?q=80&w=1350&auto=format&fit=crop"
              alt="ECG signal visualization"
            />
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          <div className="max-w-6xl mx-auto px-6">
            {/* Signal Examples */}
            <div ref={chartsRef}>
              <h3
                className="text-3xl font-semibold mb-8 text-center"
                style={{ color: "var(--color-text-primary)" }}
              >
                Signal Comparison Examples
              </h3>

              <div className="grid md:grid-cols-2 gap-8">
                <div
                  className="p-6 rounded-lg shadow-lg transform transition-transform hover:scale-105 chart-card"
                  style={{
                    backgroundColor: "var(--color-bg-secondary)",
                    borderLeft: "4px solid var(--color-success)",
                  }}
                >
                  <ECGChart
                    data={normalSignal}
                    title="Normal ECG Signal"
                    width={500}
                    height={200}
                    color="var(--color-success)"
                  />
                  <div className="mt-4 text-center">
                    <p
                      className="font-semibold text-lg"
                      style={{ color: "var(--color-success)" }}
                    >
                      Normal Sinus Rhythm
                    </p>
                    <p
                      className="text-sm mt-2"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Regular P-QRS-T complex with consistent intervals. System
                      recognizes this pattern as normal.
                    </p>
                  </div>
                </div>

                <div
                  className="p-6 rounded-lg shadow-lg transform transition-transform hover:scale-105 chart-card"
                  style={{
                    backgroundColor: "var(--color-bg-secondary)",
                    borderLeft: "4px solid var(--color-error)",
                  }}
                >
                  <ECGChart
                    data={abnormalSignal}
                    title="Abnormal ECG Signal"
                    width={500}
                    height={200}
                    color="var(--color-error)"
                  />
                  <div className="mt-4 text-center">
                    <p
                      className="font-semibold text-lg"
                      style={{ color: "var(--color-error)" }}
                    >
                      Ventricular Arrhythmia
                    </p>
                    <p
                      className="text-sm mt-2"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Irregular morphology with widened QRS. System detects
                      deviations and classifies accordingly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20 px-6"
        style={{ backgroundColor: "var(--color-bg-secondary)" }}
      >
        <div
          ref={ctaRef}
          className="max-w-4xl mx-auto text-center p-12 rounded-lg shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
          }}
        >
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Analyze Your ECG Data?
          </h2>
          <p className="text-xl mb-8 text-white opacity-90">
            Upload your MIT-BIH format files and get instant DTW-based
            arrhythmia classification
          </p>
          <button
            onClick={() => navigate("/analysis")}
            className="px-12 py-4 rounded-lg font-bold text-2xl transition-all hover:scale-110 shadow-xl"
            style={{
              backgroundColor: "white",
              color: "var(--color-primary)",
            }}
          >
            Start Analysis Now →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-6 text-center"
        style={{
          backgroundColor: "var(--color-bg-tertiary)",
          color: "var(--color-text-secondary)",
        }}
      >
        <p>ECG Arrhythmia Detection using Dynamic Time Warping</p>
        <p className="text-sm mt-2">Powered by MIT-BIH Arrhythmia Database</p>
      </footer>
    </div>
  );
}

export default Landing;
