import { useState, useMemo } from 'react';
import { migrationItems, MigrationItem, MigrationStatus, Layer } from './migrationData';
import './App.css';

const LAYERS: Layer[] = ['DB', 'Backend', 'Frontend', 'Scripts', 'Config'];

const LAYER_COLORS: Record<Layer, string> = {
  DB: '#3b82f6',
  Backend: '#8b5cf6',
  Frontend: '#10b981',
  Scripts: '#f59e0b',
  Config: '#ef4444',
};

function App() {
  const [items, setItems] = useState<MigrationItem[]>(migrationItems);
  const [filterLayer, setFilterLayer] = useState<Layer | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<MigrationStatus | 'All'>('All');
  const [expandedLayer, setExpandedLayer] = useState<Layer | null>(null);

  const toggleStatus = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: item.status === 'pending' ? 'fixed' : 'pending' }
          : item
      )
    );
  };

  const markAllInLayer = (layer: Layer, status: MigrationStatus) => {
    setItems(prev =>
      prev.map(item => (item.layer === layer ? { ...item, status } : item))
    );
  };

  const stats = useMemo(() => {
    const total = items.length;
    const fixed = items.filter(i => i.status === 'fixed').length;
    const pending = total - fixed;
    const byLayer = LAYERS.map(layer => {
      const layerItems = items.filter(i => i.layer === layer);
      const layerFixed = layerItems.filter(i => i.status === 'fixed').length;
      return { layer, total: layerItems.length, fixed: layerFixed, pending: layerItems.length - layerFixed };
    });
    return { total, fixed, pending, byLayer };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filterLayer !== 'All' && item.layer !== filterLayer) return false;
      if (filterStatus !== 'All' && item.status !== filterStatus) return false;
      return true;
    });
  }, [items, filterLayer, filterStatus]);

  const overallPercent = stats.total > 0 ? Math.round((stats.fixed / stats.total) * 100) : 0;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🏦 Bank Code Migration Dashboard</h1>
        <p className="subtitle">
          Bank of Israel Directive — 2-digit → 3-digit zero-padded bank codes
        </p>
      </header>

      {/* Overall Progress */}
      <section className="overall-progress">
        <div className="progress-ring-container">
          <svg className="progress-ring" viewBox="0 0 120 120">
            <circle className="ring-bg" cx="60" cy="60" r="52" />
            <circle
              className="ring-fill"
              cx="60"
              cy="60"
              r="52"
              strokeDasharray={`${overallPercent * 3.267} 326.7`}
            />
          </svg>
          <div className="progress-ring-text">
            <span className="percent">{overallPercent}%</span>
            <span className="label">Complete</span>
          </div>
        </div>
        <div className="progress-stats">
          <div className="stat">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="stat stat-fixed">
            <span className="stat-number">{stats.fixed}</span>
            <span className="stat-label">Fixed</span>
          </div>
          <div className="stat stat-pending">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Remaining</span>
          </div>
        </div>
      </section>

      {/* Layer Breakdown */}
      <section className="layer-breakdown">
        <h2>Progress by Layer</h2>
        <div className="layer-cards">
          {stats.byLayer.map(({ layer, total, fixed, pending }) => {
            const pct = total > 0 ? Math.round((fixed / total) * 100) : 0;
            return (
              <div
                key={layer}
                className={`layer-card ${expandedLayer === layer ? 'expanded' : ''}`}
                onClick={() => setExpandedLayer(expandedLayer === layer ? null : layer)}
                style={{ borderTopColor: LAYER_COLORS[layer] }}
              >
                <div className="layer-card-header">
                  <span className="layer-name">{layer}</span>
                  <span className="layer-badge" style={{ backgroundColor: LAYER_COLORS[layer] }}>
                    {fixed}/{total}
                  </span>
                </div>
                <div className="layer-progress-bar">
                  <div
                    className="layer-progress-fill"
                    style={{ width: `${pct}%`, backgroundColor: LAYER_COLORS[layer] }}
                  />
                </div>
                <div className="layer-card-footer">
                  <span>{pct}% complete</span>
                  <span>{pending} remaining</span>
                </div>
                {expandedLayer === layer && (
                  <div className="layer-actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-fix-all"
                      onClick={() => markAllInLayer(layer, 'fixed')}
                    >
                      Mark All Fixed
                    </button>
                    <button
                      className="btn btn-reset-all"
                      onClick={() => markAllInLayer(layer, 'pending')}
                    >
                      Reset All
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Detailed Item List */}
      <section className="item-list-section">
        <h2>Migration Items</h2>
        <div className="filters">
          <select
            value={filterLayer}
            onChange={e => setFilterLayer(e.target.value as Layer | 'All')}
          >
            <option value="All">All Layers</option>
            {LAYERS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as MigrationStatus | 'All')}
          >
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="fixed">Fixed</option>
          </select>
          <span className="filter-count">
            Showing {filteredItems.length} of {items.length}
          </span>
        </div>

        <div className="item-table">
          <div className="item-table-header">
            <span className="col-status">Status</span>
            <span className="col-layer">Layer</span>
            <span className="col-file">File</span>
            <span className="col-line">Line</span>
            <span className="col-desc">Description</span>
            <span className="col-category">Category</span>
          </div>
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`item-row ${item.status}`}
              onClick={() => toggleStatus(item.id)}
            >
              <span className="col-status">
                <input
                  type="checkbox"
                  checked={item.status === 'fixed'}
                  onChange={() => toggleStatus(item.id)}
                  onClick={e => e.stopPropagation()}
                />
              </span>
              <span className="col-layer">
                <span className="layer-dot" style={{ backgroundColor: LAYER_COLORS[item.layer] }} />
                {item.layer}
              </span>
              <span className="col-file" title={item.file}>{item.file.split('/').pop()}</span>
              <span className="col-line">L{item.line}</span>
              <span className="col-desc">{item.description}</span>
              <span className="col-category">
                <span className="category-tag">{item.category}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <footer className="dashboard-footer">
        <p>
          Israeli Payroll System — Bank of Israel Regulation Compliance
          <br />
          Effective date: 2026-07-01 | Migration rule: <code>bankCode.padStart(3, '0')</code>
        </p>
      </footer>
    </div>
  );
}

export default App;
