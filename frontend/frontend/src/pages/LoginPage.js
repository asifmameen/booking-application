import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/authSlice";

export default function LoginPage() {
  const dispatch = useDispatch();
  const status = useSelector((s) => s.auth.status);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e) => {
    e.preventDefault();
    dispatch(login({ username, password }));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div>
          <input
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <input
            placeholder="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={status === "loading"}>
          Login
        </button>
      </form>
    </div>
  );
}
