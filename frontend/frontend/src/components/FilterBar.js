import React, { useState } from "react";

export default function FilterBar({ onApply }) {
  const [category, setCategory] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  return (
    <div style={{ marginBottom: 12 }}>
      <input
        placeholder="category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <input
        placeholder="min price"
        value={min}
        onChange={(e) => setMin(e.target.value)}
      />
      <input
        placeholder="max price"
        value={max}
        onChange={(e) => setMax(e.target.value)}
      />
      <button
        onClick={() => onApply({ category, min_price: min, max_price: max })}
      >
        Apply
      </button>
    </div>
  );
}
