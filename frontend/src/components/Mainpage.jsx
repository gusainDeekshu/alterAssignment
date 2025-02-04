import { googleLogout } from "@react-oauth/google";
import { useState } from "react";

import { useNavigate } from "react-router-dom";

function Mainpage() {
  const token = localStorage.getItem("google_token");

  const [longUrl, setLongUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [topic, setTopic] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");
  const url = import.meta.env.VITE_SERVER_URL;
  console.log(url);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShortUrl("");

    try {
      const response = await fetch(`${url}/api/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token,
        },
        body: JSON.stringify({ longUrl, customAlias, topic }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to shorten URL");
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      setShortUrl(data.data.shortUrl);
      console.log(data.data.createdAt);
    } catch (err) {
      setError(err.message);
    }
  };

  const navigate = useNavigate();

  function handleLogout() {
    googleLogout();
    localStorage.removeItem("google_token");
    navigate("/");
  }
  return (
    <div>
      <button onClick={handleLogout}>Logout</button>
      <div
        style={{
          maxWidth: "400px",
          margin: "20px auto",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <h2>Shorten a URL</h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <input
            type="url"
            placeholder="Enter long URL"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            required
            style={{ padding: "8px" }}
          />
          <input
            type="text"
            placeholder="Custom alias (optional)"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
            style={{ padding: "8px" }}
          />
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            style={{ padding: "8px" }}
          >
            <option value="">Select Topic (Optional)</option>
            <option value="acquisition">Acquisition</option>
            <option value="activation">Activation</option>
            <option value="retention">Retention</option>
          </select>
          <button
            type="submit"
            style={{
              padding: "10px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Shorten URL
          </button>
        </form>
        {shortUrl && (
          <p style={{ marginTop: "10px", color: "green" }}>
            Short URL:{" "}
            <a href={shortUrl} target="_blank" rel="noopener noreferrer">
              {shortUrl}
            </a>
          </p>
        )}
        {error && <p style={{ marginTop: "10px", color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}

export default Mainpage;
