
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserRound, Mail, LockKeyhole, ArrowRight } from "lucide-react";
import API from "../services/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const response = await API.post("/auth/register", {
        name,
        email,
        password,
      });

      alert(response.data.message);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-icon">W</div>
          <span>WhoHasIt?</span>
        </div>

        <h1>Create Account</h1>
        <p className="subtitle">Join WhoHasIt and manage your belongings.</p>

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <div className="input-wrapper">
            <UserRound size={18} />
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name" required />
          </div>

          <label>Email Address</label>
          <div className="input-wrapper">
            <Mail size={18} />
            <input type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" required />
          </div>

          <label>Password</label>
          <div className="input-wrapper">
            <LockKeyhole size={18} />
            <input type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password" minLength={6} required />
          </div>

          <label>Confirm Password</label>
          <div className="input-wrapper">
            <LockKeyhole size={18} />
            <input type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password" minLength={6} required />
          </div>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button type="submit" className="primary-button">
            Create Account <ArrowRight size={18} />
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
