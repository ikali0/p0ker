import { useState } from "react";

export default function Simulation() {
  const [edge, setEdge] = useState(null);
  const [net, setNet] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);

    const res = await fetch("http://127.0.0.1:8000/simulate", {
      method: "POST"
    });

    const data = await res.json();

    setNet(data.house_net);
    setEdge(data.house_edge);
    setLoading(false);
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Simulation Tab</h2>

      <button onClick={runSimulation}>
        Run 20,000 Round Simulation
      </button>

      {loading && <p>Running simulation...</p>}

      {edge !== null && (
        <div style={{ marginTop: 20 }}>
          <p>House Net: {net}</p>
          <p>House Edge: {(edge * 100).toFixed(2)}%</p>

          {edge >= 0.03 && edge <= 0.07 ? (
            <p style={{ color: "lime" }}>
              ✔ Within 3–7% Target Range
            </p>
          ) : (
            <p style={{ color: "red" }}>
              Outside Target Range
            </p>
          )}
        </div>
      )}
    </div>
  );
}
