
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Handshake,
  Bell,
  CheckCheck,
  Info
} from "lucide-react";
import API from "../services/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await API.get("/notifications", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setNotifications(response.data.notifications || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Failed to load notifications"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <div className="dashboard-page">
      <aside className="sidebar">
        <h2 className="sidebar-brand">
          WhoHasIt<span>?</span>
        </h2>

        <nav>
          <Link to="/dashboard">
            <LayoutDashboard size={19} /> Dashboard
          </Link>
          <Link to="/items">
            <Package size={19} /> My Items
          </Link>
          <Link to="/lendings">
            <Handshake size={19} /> My Lendings
          </Link>
          <Link to="/notifications" className="active">
            <Bell size={19} /> Notifications
          </Link>
        </nav>

        <Link to="/login" className="logout-link">Logout</Link>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Notifications</h1>
            <p>Stay updated about your lending activities.</p>
          </div>
          <Bell size={30} />
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <Bell size={25} />
            <h3>{notifications.length}</h3>
            <p>Total Notifications</p>
          </div>

          <div className="stat-card">
            <CheckCheck size={25} />
            <h3>{unreadCount}</h3>
            <p>Unread Notifications</p>
          </div>
        </section>

        <section className="activity-section">
          <h2>Recent Notifications</h2>

          {loading ? (
            <p>Loading notifications...</p>
          ) : error ? (
            <p>{error}</p>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <Info size={45} />
              <h3>You're all caught up!</h3>
              <p>Your reminders and updates will appear here.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div className="stat-card" key={notification._id}>
                <Bell size={20} />
                <h3>{notification.message}</h3>
                <p>{notification.type}</p>
                <p>
                  {notification.isRead ? "Read" : "Unread"}
                </p>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
