import React from "react";

const PageHeader = ({ title, icon, subtitle, rightElement, search, setSearch, placeholder }) => {
  return (
    <div className="page-header" style={{ marginBottom: 24 }}>
      {/* Title Row */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: setSearch ? 14 : 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            padding: "10px", borderRadius: 14,
            boxShadow: "0 8px 20px rgba(99,102,241,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>{icon || "📋"}</span>
          </div>
          <div>
            <h1 style={{
              color: "#0f172a", fontWeight: 900,
              fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
              margin: 0, letterSpacing: -0.5, lineHeight: 1.1
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ margin: "4px 0 0", color: "#64748b", fontWeight: 500, fontSize: 13 }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {rightElement && <div>{rightElement}</div>}
      </div>

      {/* Search Row */}
      {setSearch && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "white",
          borderRadius: 16,
          border: "1.5px solid #e2e8f0",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          padding: "0 16px",
          height: 52
        }}>
          <span style={{ fontSize: "1.1rem", color: "#94a3b8", flexShrink: 0 }}>🔍</span>
          <input
            placeholder={placeholder || "Search..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              height: "100%",
              fontSize: 15,
              border: "none",
              background: "transparent",
              outline: "none",
              color: "#1e293b",
              fontWeight: 500
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                background: "#f1f5f9", border: "none", borderRadius: "50%",
                width: 26, height: 26, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", fontSize: 12,
                color: "#64748b", flexShrink: 0
              }}
            >✕</button>
          )}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
