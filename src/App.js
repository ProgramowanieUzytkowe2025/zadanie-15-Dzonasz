import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const distance = (a, b) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

const totalDistance = (points, order) => {
  let sum = 0;
  for (let i = 0; i < order.length - 1; i++) {
    sum += distance(points[order[i]], points[order[i + 1]]);
  }
  return sum;
};

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const PointsVisualization = ({ points, order, showPath, togglePath }) => {
  if (!points.length) return null;

  const size = 500;
  const pad = 20;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);

  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const sx = x => pad + ((x - minX) / (maxX - minX)) * (size - 2 * pad);
  const sy = y => pad + ((y - minY) / (maxY - minY)) * (size - 2 * pad);

  return (
    <div className="box">
      <h2>Wizualizacja</h2>

      <button onClick={togglePath}>
        {showPath ? "Ukryj rozwiązanie" : "Pokaż rozwiązanie"}
      </button>

      <svg width={size} height={size} className="svg">
        {showPath && order.length > 0 && (
          <polyline
            fill="none"
            stroke="blue"
            strokeWidth="2"
            points={order.map(i => `${sx(points[i].x)},${sy(points[i].y)}`).join(" ")}
          />
        )}

        {points.map(p => (
          <circle
            key={p.id}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={4}
            fill="red"
          />
        ))}
      </svg>
    </div>
  );
};


const Solution = ({ points, order, length }) => (
  <div className="box">
    <h2>Rozwiązanie</h2>
    <div className="path">
      {order.map((i, idx) => (
        <span key={idx}>
          {points[i].id}
          {idx < order.length - 1 && " → "}
        </span>
      ))}
    </div>
    <p><strong>Długość trasy:</strong> {length.toFixed(2)}</p>
  </div>
);

const Chart = ({ history }) => {
  if (history.length < 2) return null;

  const w = 500, h = 200, pad = 20;
  const maxY = Math.max(...history);
  const minY = Math.min(...history);

  const px = i => pad + (i / (history.length - 1)) * (w - 2 * pad);
  const py = v =>
    h - pad - ((v - minY) / (maxY - minY)) * (h - 2 * pad);

  return (
    <div className="box">
      <h2>Wykres</h2>
      <svg width={w} height={h} className="svg">
        <polyline
          fill="none"
          stroke="green"
          strokeWidth="2"
          points={history.map((v, i) => `${px(i)},${py(v)}`).join(" ")}
        />
      </svg>
    </div>
  );
};

const MonteCarlo = ({
  points,
  bestLength,
  setBestOrder,
  setBestLength,
  history,
  setHistory
}) => {
  const [running, setRunning] = useState(false);
  const [iterations, setIterations] = useState(0);
  const ref = useRef(null);

  const toggle = () => {
    if (running) {
      clearInterval(ref.current);
      setRunning(false);
      return;
    }

    ref.current = setInterval(() => {
      const order = shuffle(points.map((_, i) => i));
      const len = totalDistance(points, order);

      setIterations(i => i + 1);
      setHistory(h => [...h, len]);

      if (len < bestLength) {
        setBestOrder(order);
        setBestLength(len);
      }
    }, 5000);

    setRunning(true);
  };

  useEffect(() => () => clearInterval(ref.current), []);

  return (
    <div className="box">
      <button onClick={toggle}>
        {running ? "Przerwa" : "Szukaj rozwiązania"}
      </button>
      <span className="iterations">Iteracje: {iterations}</span>
    </div>
  );
};

export default function App() {
  const [points, setPoints] = useState([]);
  const [bestOrder, setBestOrder] = useState([]);
  const [bestLength, setBestLength] = useState(Infinity);
  const [history, setHistory] = useState([]);
  const [showPath, setShowPath] = useState(false);

  const loadFile = e => {
    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target.result
        .split("\n")
        .filter(Boolean)
        .map(l => {
          const [id, x, y] = l.split(","); //pliki csv przyjmuje po 
          return { id: +id, x: +x, y: +y };
        });

      const order = shuffle(data.map((_, i) => i));
      const len = totalDistance(data, order);

      setPoints(data);
      setBestOrder(order);
      setBestLength(len);
      setHistory([len]);
    };
    reader.readAsText(e.target.files[0]);
  };

  return (
    <div className="App">
      <h1>Problemu Komiwojażera</h1>
      <input type="file" onChange={loadFile} />

      <PointsVisualization
        points={points}
        order={bestOrder}
        showPath={showPath}
        togglePath={() => setShowPath(p => !p)}
      />

      {points.length > 0 && (
        <>
          <Solution points={points} order={bestOrder} length={bestLength} />
          <MonteCarlo
            points={points}
            bestLength={bestLength}
            setBestOrder={setBestOrder}
            setBestLength={setBestLength}
            history={history}
            setHistory={setHistory}
          />
          <Chart history={history} />
        </>
      )}
    </div>
  );
}
