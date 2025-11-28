import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
function App(){ return <div style={{padding:20,fontFamily:"Arial"}}><h1>Booking Frontend (Demo)</h1><p>Frontend ready.</p></div> }
const root = createRoot(document.getElementById("root"));
root.render(<App />);
