import React, { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then((r) => {
        if (!r.ok) throw new Error("Network response was not ok");
        return r.json();
      })
      .then((data) => {
        setProducts(data.products || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "Inter, Arial, sans-serif" }}>
      <h1>Booking — Products</h1>

      <p>
        This frontend is a minimal demo. It lists products from the API Gateway
        at <code>{API_BASE}</code>.
      </p>

      {loading && <p>Loading products…</p>}
      {error && <div style={{ color: "crimson" }}>Error: {error}</div>}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {products.map((p) => (
          <div key={p.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
            <h3 style={{ margin: "0 0 8px 0" }}>{p.name}</h3>
            <div style={{ color: "#666", marginBottom: 8 }}>{p.category}</div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>₹ {p.price}</div>
            <div style={{ marginBottom: 8 }}>Available: {p.available_quantity}</div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => alert("To demo booking, copy a JWT (see README) and call the booking API via curl.")}
                style={{ padding: "8px 12px", cursor: "pointer" }}
              >
                Book (demo)
              </button>
              <button
                onClick={() => navigator.clipboard?.writeText(p.id).then(()=>alert("Product id copied"))}
                style={{ padding: "8px 12px", cursor: "pointer" }}
              >
                Copy product id
              </button>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && !loading && <p>No products found.</p>}

      <hr style={{ margin: "24px 0" }} />
      <h4>Quick manual booking (for demo)</h4>
      <ol>
        <li>Get a JWT: run the command in README to print a token from the Django container.</li>
        <li>Pick a product id (use Copy product id button).</li>
        <li>Call the API Gateway booking endpoint (example shown in README).</li>
      </ol>
    </div>
  );
}
