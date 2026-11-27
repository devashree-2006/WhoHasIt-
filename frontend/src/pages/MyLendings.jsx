
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Handshake,
  Bell,
  Clock,
  CalendarDays
} from "lucide-react";
import API from "../services/api";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";

export default function MyLendings() {
  const [lendings, setLendings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [extensionDates, setExtensionDates] = useState({});
  const [busyId, setBusyId] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [activeScanId, setActiveScanId] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = user.id || user._id;

  const getTokenConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  });

  const fetchLendings = async () => {
    try {
      const response = await API.get("/lendings", getTokenConfig());
      setLendings(response.data.lendings || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load lending records"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLendings();
  }, []);

  const handleAcknowledge = async (id) => {
    try {
      setBusyId(id);
      setMessage("");
      setError("");

      const response = await API.put(
        `/lendings/${id}/acknowledge`,
        {},
        getTokenConfig()
      );

      setMessage(response.data.message);
      await fetchLendings();
    } catch (err) {
      setError(err.response?.data?.message || "Acknowledgement failed");
    } finally {
      setBusyId("");
    }
  };

  const handleExtensionRequest = async (id) => {
    const requestedReturnDate = extensionDates[id];

    if (!requestedReturnDate) {
      setError("Please select a new return date");
      return;
    }

    try {
      setBusyId(id);
      setMessage("");
      setError("");

      const response = await API.post(
        `/lendings/${id}/extension`,
        { requestedReturnDate },
        getTokenConfig()
      );

      setMessage(response.data.message);
      setExtensionDates((prev) => ({ ...prev, [id]: "" }));
      await fetchLendings();
    } catch (err) {
      setError(err.response?.data?.message || "Extension request failed");
    } finally {
      setBusyId("");
    }
  };

  const handleExtensionResponse = async (id, action) => {
    try {
      setBusyId(id);
      setMessage("");
      setError("");

      const response = await API.put(
        `/lendings/${id}/extension/respond`,
        { action },
        getTokenConfig()
      );

      setMessage(response.data.message);
      await fetchLendings();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update extension");
    } finally {
      setBusyId("");
    }
  };

  const handleConfirmReturn = async (qrToken) => {
    try {
      setError("");
      setMessage("");

      const response = await API.post(
        "/lendings/confirm-return",
        { qrToken },
        getTokenConfig()
      );

      setMessage(response.data.message || "Item returned successfully!");
      setScanOpen(false);
      setActiveScanId("");

      await fetchLendings();
    } catch (err) {
      setError(
        err.response?.data?.message || "Return confirmation failed"
      );
    }
  };

  useEffect(() => {
    if (!scanOpen || !activeScanId) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear().catch(() => {});
        handleConfirmReturn(decodedText);
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scanOpen, activeScanId]);

  const pendingReturns = lendings.filter(
    (lending) => lending.status !== "returned"
  ).length;

  const overdueItems = lendings.filter(
    (lending) =>
      lending.status !== "returned" &&
      new Date(lending.expectedReturnDate) < new Date()
  ).length;

  const getMinimumDate = (dateValue) => {
    const date = new Date(dateValue);
    date.setDate(date.getDate() + 1);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

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

          <Link to="/lendings" className="active">
            <Handshake size={19} /> My Lendings
          </Link>

          <Link to="/notifications">
            <Bell size={19} /> Notifications
          </Link>
        </nav>

        <Link to="/login" className="logout-link">Logout</Link>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>My Lendings</h1>
            <p>Keep track of items you lend and borrow.</p>
          </div>
          <Handshake size={30} />
        </header>

        {message && <p style={{ color: "green" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {scanOpen && (
          <section className="activity-section">
            <h3>Scan Return QR Code</h3>
            <p>Scan the QR code to confirm the item return.</p>

            <div
              id="qr-reader"
              style={{ width: "100%", maxWidth: "500px" }}
            />

            <button
              className="primary-button"
              onClick={() => {
                setScanOpen(false);
                setActiveScanId("");
              }}
            >
              Cancel Scan
            </button>
          </section>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <Handshake size={25} />
            <h3>{lendings.length}</h3>
            <p>Total Lendings</p>
          </div>

          <div className="stat-card">
            <Clock size={25} />
            <h3>{pendingReturns}</h3>
            <p>Pending Returns</p>
          </div>

          <div className="stat-card">
            <CalendarDays size={25} />
            <h3>{overdueItems}</h3>
            <p>Overdue Items</p>
          </div>
        </section>

        <section className="activity-section">
          <h2>Lending History</h2>

          {loading ? (
            <p>Loading lending records...</p>
          ) : lendings.length === 0 ? (
            <div className="empty-state">
              <Handshake size={45} />
              <h3>No lending records yet</h3>
              <p>Your lending and borrowing records will appear here.</p>
              <Link to="/items" className="primary-button">
                View My Items
              </Link>
            </div>
          ) : (
            <div className="stats-grid">
              {lendings.map((lending) => {
                const isBorrower =
                  lending.borrower?._id === currentUserId;

                const isLender =
                  lending.lender?._id === currentUserId;

                const isReturned = lending.status === "returned";
                const isBusy = busyId === lending._id;

                return (
                  <div className="stat-card" key={lending._id}>
                    <h3>{lending.item?.name || "Unknown Item"}</h3>

                    <p>Lender: {lending.lender?.name || "Unknown"}</p>
                    <p>Borrower: {lending.borrower?.name || "Unknown"}</p>

                    <p>
                      Return Date:{" "}
                      {new Date(
                        lending.expectedReturnDate
                      ).toLocaleDateString()}
                    </p>

                    <p>
                      Status: <strong>{lending.status}</strong>
                    </p>

                    {!isReturned && isBorrower && (
                      <>
                        {lending.borrowerAcknowledged ? (
                          <p>Receipt acknowledged ✓</p>
                        ) : (
                          <button
                            className="primary-button"
                            disabled={isBusy}
                            onClick={() => handleAcknowledge(lending._id)}
                          >
                            {isBusy ? "Please wait..." : "Acknowledge Item"}
                          </button>
                        )}

                        {/* Borrower's Return QR Code */}
                        {lending.qrToken && (
                          <div style={{ marginTop: "15px" }}>
                            <h4>Item Return QR Code</h4>
                            <p>
                              Show this QR code to the lender when returning
                              the item.
                            </p>

                            <QRCodeSVG
                              value={lending.qrToken}
                              size={220}
                            />

                            <p>Keep this QR code private.</p>
                          </div>
                        )}

                        <div style={{ marginTop: "15px" }}>
                          <h4>Request Return Date Extension</h4>

                          {lending.extensionStatus === "pending" ? (
                            <p>
                              Extension request awaiting lender approval.
                            </p>
                          ) : (
                            <>
                              <input
                                type="date"
                                min={getMinimumDate(
                                  lending.expectedReturnDate
                                )}
                                value={extensionDates[lending._id] || ""}
                                onChange={(e) =>
                                  setExtensionDates((prev) => ({
                                    ...prev,
                                    [lending._id]: e.target.value
                                  }))
                                }
                              />

                              <button
                                className="primary-button"
                                disabled={isBusy}
                                onClick={() =>
                                  handleExtensionRequest(lending._id)
                                }
                              >
                                Request Extension
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}

                    {!isReturned &&
                      isLender &&
                      lending.extensionStatus === "pending" && (
                        <div style={{ marginTop: "15px" }}>
                          <h4>Extension Request</h4>

                          <p>
                            Requested Date:{" "}
                            {new Date(
                              lending.requestedReturnDate
                            ).toLocaleDateString()}
                          </p>

                          <button
                            className="primary-button"
                            disabled={isBusy}
                            onClick={() =>
                              handleExtensionResponse(
                                lending._id,
                                "approved"
                              )
                            }
                          >
                            Approve
                          </button>

                          <button
                            className="primary-button"
                            disabled={isBusy}
                            onClick={() =>
                              handleExtensionResponse(
                                lending._id,
                                "rejected"
                              )
                            }
                          >
                            Reject
                          </button>
                        </div>
                      )}

                    {!isReturned && isLender && (
                      <button
                        className="primary-button"
                        disabled={scanOpen}
                        onClick={() => {
                          setActiveScanId(lending._id);
                          setScanOpen(true);
                        }}
                      >
                        Scan Return QR
                      </button>
                    )}

                    {isReturned && <p>Item returned ✓</p>}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
