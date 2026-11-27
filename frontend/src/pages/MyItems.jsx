
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Package, Handshake, Bell,
  Plus, Trash2, X
} from "lucide-react";
import API from "../services/api";

export default function MyItems() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [lendingItem, setLendingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [borrowerId, setBorrowerId] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchItems = async () => {
    try {
      const response = await API.get("/items", config);
      setItems(response.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    API.get("/items", config).then((response) => {
      if (active) setItems(response.data.items || []);
    }).catch((err) => {
      if (active) setError(err.response?.data?.message || "Failed to load items");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  // The first load intentionally runs once when this page mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post(
        "/items",
        { name, category, description },
        config
      );

      setItems((prev) => [...prev, response.data.item]);
      setName("");
      setCategory("");
      setDescription("");
      setShowForm(false);
      setError("");
      setMessage("Item added successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add item");
    }
  };

  const deleteItem = async (id) => {
    try {
      await API.delete(`/items/${id}`, config);
      setItems((prev) => prev.filter((item) => item._id !== id));
      setMessage("Item removed successfully!");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete item");
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const response = await API.put(`/items/${editingItem._id}`, {
        name, category, description
      }, config);
      setItems((prev) => prev.map((item) => item._id === editingItem._id ? response.data.item : item));
      setEditingItem(null);
      setName(""); setCategory(""); setDescription("");
      setMessage("Item updated successfully!"); setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update item");
    }
  };

const handleLendItem = async (e) => {
  e.preventDefault();

  try {
    await API.post(
      "/lendings",
      {
        itemId: lendingItem._id,
        borrowerId,
        expectedReturnDate
      },
      config
    );

    setLendingItem(null);
    setBorrowerId("");
    setExpectedReturnDate("");
    setMessage("Item lent successfully!");
    setError("");

    await fetchItems();
  } catch (err) {
    setError(err.response?.data?.message || "Failed to lend item");
  }
};

  const availableItems = items.filter(
    (item) => item.availability === "available"
  ).length;

  const today = new Date().toLocaleDateString("en-CA");

  return (
    <div className="dashboard-page">
      <aside className="sidebar">
        <h2 className="sidebar-brand">WhoHasIt<span>?</span></h2>
        <nav>
          <Link to="/dashboard"><LayoutDashboard size={19} /> Dashboard</Link>
          <Link to="/items" className="active"><Package size={19} /> My Items</Link>
          <Link to="/lendings"><Handshake size={19} /> My Lendings</Link>
          <Link to="/notifications"><Bell size={19} /> Notifications</Link>
        </nav>
        <Link to="/login" className="logout-link" onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); }}>Logout</Link>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>My Items</h1>
            <p>Manage the belongings you own and share.</p>
          </div>
          <button className="primary-button" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} /> Add Item
          </button>
        </header>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {message && <p style={{ color: "green" }}>{message}</p>}

        {(showForm || editingItem) && (
          <section className="activity-section">
            <div className="dashboard-header">
              <h2>{editingItem ? "Edit Item" : "Add New Item"}</h2>
              <button onClick={() => { setShowForm(false); setEditingItem(null); }}><X size={20} /></button>
            </div>
            <form onSubmit={editingItem ? handleUpdateItem : handleAddItem}>
              <label>Item Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter item name" required />

              <label>Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Eg: Electronics, Books" required />

              <label>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your item" />

              <button className="primary-button" type="submit">{editingItem ? "Save Changes" : "Save Item"}</button>
            </form>
          </section>
        )}

        {lendingItem && (
          <section className="activity-section">
            <div className="dashboard-header">
              <h2>Lend: {lendingItem.name}</h2>
              <button onClick={() => setLendingItem(null)}><X size={20} /></button>
            </div>

            <form onSubmit={handleLendItem}>
              <label>Borrower's User ID</label>
              <input
                value={borrowerId}
                onChange={(e) => setBorrowerId(e.target.value)}
                placeholder="Enter borrower's MongoDB User ID"
                required
              />

              <label>Expected Return Date</label>
              <input
                type="date"
                min={today}
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                required
              />

              <button className="primary-button" type="submit">
                Confirm Lending
              </button>
            </form>
          </section>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <Package size={25} />
            <h3>{items.length}</h3>
            <p>Total Items Added</p>
          </div>
          <div className="stat-card">
            <Package size={25} />
            <h3>{availableItems}</h3>
            <p>Available Items</p>
          </div>
        </section>

        <section className="activity-section">
          <h2>Your Items</h2>

          {loading ? (
            <p>Loading items...</p>
          ) : items.length === 0 ? (
            <p>No items added yet. Click Add Item to get started.</p>
          ) : (
            <div className="stats-grid">
              {items.map((item) => (
                <div className="stat-card" key={item._id}>
                  <Package size={25} />
                  <h3>{item.name}</h3>
                  <p>{item.category}</p>
                  <p>{item.description}</p>
                  <span>{item.availability}</span>

                  <button onClick={() => { setEditingItem(item); setName(item.name); setCategory(item.category); setDescription(item.description || ""); setShowForm(false); }}>
                    Edit Item
                  </button>

                  {item.availability === "available" && (
                    <button onClick={() => setLendingItem(item)}>
                      <Handshake size={16} /> Lend Item
                    </button>
                  )}

                  <button onClick={() => deleteItem(item._id)}>
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
