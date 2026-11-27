
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Handshake,
  Bell,
  Plus,
  ArrowRight,
  Clock
} from "lucide-react";
import API from "../services/api";

export default function Dashboard() {
  const [itemCount, setItemCount] = useState(0);
  const [lendingCount, setLendingCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [lendingSummary, setLendingSummary] = useState({ lent: 0, borrowed: 0, dueSoon: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        const [itemsRes, lendingsRes, notificationsRes] =
          await Promise.all([
            API.get("/items", config),
            API.get("/lendings", config),
            API.get("/notifications", config)
          ]);

        const items = itemsRes.data.items || [];
        const lendings = lendingsRes.data.lendings || [];
        const notifications =
          notificationsRes.data.notifications || [];

        setItemCount(items.length);
        setLendingCount(lendings.length);
        setNotificationCount(
          notifications.filter((notification) => !notification.isRead).length
        );

        setRecentActivity(lendings.slice(0, 3));
        const active = lendings.filter((lending) => lending.status !== "returned");
        const now = new Date();
        const dueSoonLimit = new Date(now);
        dueSoonLimit.setDate(dueSoonLimit.getDate() + 3);
        const userId = JSON.parse(localStorage.getItem("user") || "{}").id;
        setLendingSummary({
          lent: active.filter((lending) => lending.lender?._id === userId).length,
          borrowed: active.filter((lending) => lending.borrower?._id === userId).length,
          dueSoon: active.filter((lending) => new Date(lending.expectedReturnDate) >= now && new Date(lending.expectedReturnDate) <= dueSoonLimit).length,
          overdue: active.filter((lending) => new Date(lending.expectedReturnDate) < now).length
        });
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-page">
      <aside className="sidebar">
        <h2 className="sidebar-brand">
          WhoHasIt<span>?</span>
        </h2>

        <nav>
          <Link to="/dashboard" className="active">
            <LayoutDashboard size={19} /> Dashboard
          </Link>
          <Link to="/items">
            <Package size={19} /> My Items
          </Link>
          <Link to="/lendings">
            <Handshake size={19} /> My Lendings
          </Link>
          <Link to="/notifications">
            <Bell size={19} /> Notifications
          </Link>
        </nav>

        <Link to="/login" className="logout-link" onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); }}>
          Logout
        </Link>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome to WhoHasIt!</p>
          </div>

          <Link to="/notifications" className="notification-link">
            <Bell size={21} />
            {notificationCount > 0 && <span>{notificationCount}</span>}
          </Link>
        </header>

        <section className="welcome-section">
          <div>
            <h2>Keep track of what you lend.</h2>
            <p>
              Manage your belongings and never lose track of borrowed items.
            </p>
            <Link to="/items" className="primary-button">
              Manage My Items <ArrowRight size={17} />
            </Link>
          </div>
          <Package size={75} />
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <Package size={25} />
            <h3>{loading ? "..." : itemCount}</h3>
            <p>My Items</p>
            <Link to="/items">
              Explore <ArrowRight size={15} />
            </Link>
          </div>

          <div className="stat-card">
            <Handshake size={25} />
            <h3>{loading ? "..." : lendingCount}</h3>
            <p>My Lendings</p>
            <Link to="/lendings">
              Explore <ArrowRight size={15} />
            </Link>
          </div>

          <div className="stat-card">
            <Bell size={25} />
            <h3>{loading ? "..." : notificationCount}</h3>
            <p>Unread Notifications</p>
            <Link to="/notifications">
              Explore <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card"><Handshake size={25} /><h3>{loading ? "..." : lendingSummary.lent}</h3><p>Items I Lent</p><Link to="/lendings">View records</Link></div>
          <div className="stat-card"><Handshake size={25} /><h3>{loading ? "..." : lendingSummary.borrowed}</h3><p>Items I Borrowed</p><Link to="/lendings">View records</Link></div>
          <div className="stat-card"><Clock size={25} /><h3>{loading ? "..." : lendingSummary.dueSoon}</h3><p>Due in the Next 3 Days</p><Link to="/lendings">View reminders</Link></div>
          <div className="stat-card"><Clock size={25} /><h3>{loading ? "..." : lendingSummary.overdue}</h3><p>Overdue Items</p><Link to="/lendings">View overdue</Link></div>
        </section>

        <section className="activity-section">
          <div>
            <h2>Recent Activity</h2>

            {loading ? (
              <p>Loading activity...</p>
            ) : error ? (
              <p>{error}</p>
            ) : recentActivity.length === 0 ? (
              <p>Your lending activity will appear here.</p>
            ) : (
              recentActivity.map((lending) => (
                <p key={lending._id}>
                  {lending.item?.name || "Item"} — {lending.status}
                </p>
              ))
            )}
          </div>
          <Clock size={28} />
        </section>

        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <Link to="/items">
            <Plus size={18} /> Manage Items
          </Link>
          <Link to="/lendings">
            <Handshake size={18} /> View Lendings
          </Link>
        </section>
      </main>
    </div>
  );
}
