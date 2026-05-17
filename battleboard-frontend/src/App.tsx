import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState<string>("Učitavanje...");

  useEffect(() => {
    fetch("http://localhost:8080/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("Backend nije dostupan"));
  }, []);

  return (
    <div>
      <h1>DnD Battle Board</h1>
      <p>Backend status: {status}</p>
    </div>
  );
}

export default App;
