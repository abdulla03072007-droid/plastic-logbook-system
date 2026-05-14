import React from "react";

const PageHeader = ({ title, icon, subtitle, rightElement, search, setSearch, placeholder }) => {
  return (
    <div className="page-header" style={{ marginBottom: '30px', borderBottom: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)', 
            padding: '12px', 
            borderRadius: '15px',
            boxShadow: '0 8px 16px rgba(29, 78, 216, 0.2)'
          }}>
            <span style={{ fontSize: '1.8rem' }}>{icon || '📋'}</span>
          </div>
          <div>
            <h1 style={{ color: '#0f172a', fontWeight: 900, fontSize: '2.2rem', margin: 0, letterSpacing: '-0.5px' }}>
              {title}
            </h1>
            {subtitle && <p style={{ margin: '5px 0 0 0', color: '#64748b', fontWeight: 500 }}>{subtitle}</p>}
          </div>
        </div>
        
        {rightElement && <div>{rightElement}</div>}

        {setSearch && (
          <div className="search-box" style={{ 
            maxWidth: 400, 
            flex: 1, 
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)', 
            borderRadius: '20px',
            border: '2px solid white',
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 15px'
          }}>
            <span style={{ fontSize: '1.1rem', color: '#94a3b8' }}>🔍</span>
            <input
              placeholder={placeholder || "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ 
                height: 50, 
                fontSize: 15, 
                border: 'none', 
                background: 'transparent', 
                width: '100%',
                padding: '0 10px',
                outline: 'none',
                color: '#1e293b',
                fontWeight: 500
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
