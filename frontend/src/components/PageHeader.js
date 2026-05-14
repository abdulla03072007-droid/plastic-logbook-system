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
          <div className="search-box-container" style={{ 
            maxWidth: 500, 
            flex: 1, 
            marginTop: '10px'
          }}>
            <div className="search-box" style={{ 
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)', 
              borderRadius: '30px', /* Pill shaped */
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              padding: '0 20px',
              height: '54px'
            }}>
              <span style={{ fontSize: '1.2rem', color: '#94a3b8', marginRight: '12px' }}>🔍</span>
              <input
                placeholder={placeholder || "Search by customer name or shop..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ 
                  fontSize: 14, 
                  border: 'none', 
                  background: 'transparent', 
                  width: '100%',
                  outline: 'none',
                  color: '#1e293b',
                  fontWeight: 500
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
