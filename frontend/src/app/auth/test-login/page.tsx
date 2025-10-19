"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TestLoginPage() {
  const [email, setEmail] = useState("admin@comet.dev");
  const [password, setPassword] = useState("password123");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Attempting login...");

    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      setMessage(`Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);

      if (response.ok && data?.data?.tokens?.accessToken) {
        localStorage.setItem("comet_jwt", data.data.tokens.accessToken);
        setMessage("Login successful! Redirecting...");
        setTimeout(() => router.push("/dashboard"), 1000);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: "50px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Test Login Page</h1>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "15px" }}>
          <label>Email:</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>Password:</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <button type="submit" style={{ padding: "10px 20px" }}>
          Login
        </button>
      </form>
      <pre style={{ marginTop: "20px", padding: "15px", background: "#f5f5f5" }}>
        {message}
      </pre>
    </div>
  );
}
