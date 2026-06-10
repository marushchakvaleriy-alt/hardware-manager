import React, { useState, useEffect } from 'react';
import './App.css';

// SVG Icons
const FolderIcon = ({ isVirtual }) => (
  <svg className={`tree-node-icon folder ${isVirtual ? 'virtual' : ''}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
  </svg>
);

const DocIcon = () => (
  <svg className="tree-node-icon file" style={{ color: '#6366f1' }} viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
  </svg>
);

const SearchIcon = () => (
  <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const ChevronIcon = ({ expanded }) => (
  <svg className={`tree-toggle-icon ${expanded ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const SaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.95rem', height: '0.95rem' }}>
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin" style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}/>
    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
  </svg>
);

// CSS animation inline for spinner
const style = document.createElement('style');
style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);

function App() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  
  const [newFolderName, setNewFolderName] = useState('');
  const [newDocName, setNewDocName] = useState('');
  
  const [noteContent, setNoteContent] = useState('');
  const [noteStatus, setNoteStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ folders: 0, files: 0 });

  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPath, setSettingsPath] = useState('');
  const [activePathOnServer, setActivePathOnServer] = useState('');

  // API base URL (uses localhost:3001 in dev, relative in production)
  const API_BASE = window.location.port === '5173' ? 'http://localhost:3001' : '';

  useEffect(() => {
    fetchTree();
    fetchSettings();
  }, []);

  // Compute statistics (total folders and text documents)
  const computeStats = (nodes) => {
    let foldersCount = 0;
    let docsCount = 0;

    const traverse = (nodeList) => {
      nodeList.forEach(node => {
        if (node.isDir) {
          foldersCount++;
          if (node.documents) {
            docsCount += node.documents.length;
          }
          if (node.children) traverse(node.children);
        }
      });
    };

    traverse(nodes);
    setStats({ folders: foldersCount, files: docsCount });
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      if (data.success) {
        setSettingsPath(data.bazisRoot);
        setActivePathOnServer(data.bazisRoot);
      }
    } catch (err) {
      console.error('Не вдалося зчитати налаштування', err);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRoot: settingsPath })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Шлях до папки успішно змінено!', 'success');
        setActivePathOnServer(data.bazisRoot);
        setShowSettings(false);
        setSelectedNode(null); // Reset selection
        setSelectedDoc(null);
        fetchTree();
      } else {
        showToast(data.error || 'Помилка зміни шляху', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Помилка з’єднання із сервером', 'error');
    }
  };

  const fetchTree = async (reselectPath = null, reselectDoc = null) => {
    try {
      if (!reselectPath) setLoading(true);
      const res = await fetch(`${API_BASE}/api/tree`);
      const data = await res.json();
      if (data.success) {
        setTree(data.tree);
        computeStats(data.tree);
        
        // Auto-expand first level folders on initial load
        if (!reselectPath) {
          const initialExpanded = {};
          data.tree.forEach(node => {
            if (node.isDir) {
              initialExpanded[node.path] = true;
            }
          });
          setExpandedFolders(prev => ({ ...prev, ...initialExpanded }));
        }

        // Reselect folder and document if specified
        if (reselectPath) {
          findAndSelectNode(data.tree, reselectPath, reselectDoc);
        }
      } else {
        showToast(data.error || 'Не вдалося завантажити дерево папок.', 'error');
        setTree([]);
        setStats({ folders: 0, files: 0 });
      }
    } catch (err) {
      console.error(err);
      showToast('Помилка підключення до сервера', 'error');
      setTree([]);
    } finally {
      if (!reselectPath) setLoading(false);
    }
  };

  const selectFolder = (node) => {
    setSelectedNode(node);
    setSelectedDoc(null);
    setNoteContent('');
    setNoteStatus('idle');
    setNewFolderName('');
    setNewDocName('');
  };

  const selectDocument = async (docName) => {
    if (!selectedNode) return;
    setSelectedDoc(docName);
    setNoteContent('');
    setNoteStatus('idle');

    try {
      const res = await fetch(
        `${API_BASE}/api/file?folderPath=${encodeURIComponent(selectedNode.path)}&docName=${encodeURIComponent(docName)}`
      );
      const data = await res.json();
      if (data.success) {
        setNoteContent(data.content);
      } else {
        showToast(data.error || 'Не вдалося зчитати документ', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Помилка зчитування документа', 'error');
    }
  };

  const saveDocument = async () => {
    if (!selectedNode || !selectedDoc) return;
    setNoteStatus('saving');

    try {
      const res = await fetch(`${API_BASE}/api/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath: selectedNode.path,
          docName: selectedDoc,
          content: noteContent
        })
      });
      const data = await res.json();
      if (data.success) {
        setNoteStatus('saved');
        showToast(`Документ "${selectedDoc}" збережено`, 'success');
        
        // Refresh tree to maintain state
        await fetchTree(selectedNode.path, selectedDoc);
      } else {
        setNoteStatus('error');
        showToast(data.error || 'Помилка збереження документа', 'error');
      }
    } catch (err) {
      console.error(err);
      setNoteStatus('error');
      showToast('Помилка збереження на сервері', 'error');
    }
  };

  const createDocument = async (e) => {
    e.preventDefault();
    if (!selectedNode || !newDocName.trim()) return;

    const docName = newDocName.trim();

    // Check if it already exists in the selected node documents
    if (selectedNode.documents && selectedNode.documents.includes(docName)) {
      showToast('Документ з такою назвою вже існує в цій папці', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath: selectedNode.path,
          docName: docName,
          content: '' // empty content on creation
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Документ "${docName}" успішно створено`, 'success');
        setNewDocName('');
        
        // Refresh and automatically select the new document
        await fetchTree(selectedNode.path, docName);
      } else {
        showToast(data.error || 'Помилка створення документа', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Помилка з’єднання із сервером', 'error');
    }
  };

  const deleteDocument = async (docName, e) => {
    e.stopPropagation(); // Prevent choosing the document when deleting
    
    if (!window.confirm(`Ви дійсно бажаєте видалити документ "${docName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/file`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath: selectedNode.path,
          docName: docName
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Документ "${docName}" успішно видалено`, 'success');
        
        let nextSelectedDoc = selectedDoc;
        if (selectedDoc === docName) {
          nextSelectedDoc = null;
          setNoteContent('');
          setNoteStatus('idle');
        }
        
        // Refresh tree and reselect folder
        await fetchTree(selectedNode.path, nextSelectedDoc);
      } else {
        showToast(data.error || 'Помилка видалення документа', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Помилка з’єднання із сервером', 'error');
    }
  };

  // Helper to re-select node by path after tree refresh
  const findAndSelectNode = (nodeList, path, reselectDoc = null) => {
    let found = null;
    const search = (nodes) => {
      for (const node of nodes) {
        if (node.path === path) {
          found = node;
          return;
        }
        if (node.children) search(node.children);
      }
    };
    search(nodeList);
    if (found) {
      setSelectedNode(found);
      if (reselectDoc) {
        // Find if the doc still exists in this folder
        if (found.documents && found.documents.includes(reselectDoc)) {
          setSelectedDoc(reselectDoc);
          // Reload content
          fetchDocContentOnly(found.path, reselectDoc);
        } else {
          setSelectedDoc(null);
          setNoteContent('');
        }
      }
    }
  };

  const fetchDocContentOnly = async (folderPath, docName) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/file?folderPath=${encodeURIComponent(folderPath)}&docName=${encodeURIComponent(docName)}`
      );
      const data = await res.json();
      if (data.success) {
        setNoteContent(data.content);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createSubfolder = async (e) => {
    e.preventDefault();
    if (!selectedNode || !newFolderName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPath: selectedNode.path,
          folderName: newFolderName.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Папку "${newFolderName}" створено`, 'success');
        setNewFolderName('');
        
        // Expand the parent so the new folder is visible
        setExpandedFolders(prev => ({ ...prev, [selectedNode.path]: true }));
        
        // Refresh tree and reselect parent
        await fetchTree(selectedNode.path, selectedDoc);
      } else {
        showToast(data.error || 'Не вдалося створити папку', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Помилка з’єднання із сервером', 'error');
    }
  };

  const toggleFolder = (path, e) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Recursive search to check if a node matches the query, or has children that match
  const nodeMatchesSearch = (node, query) => {
    if (!query) return true;
    const normalizedQuery = query.toLowerCase();
    const nameMatches = node.name.toLowerCase().includes(normalizedQuery);
    
    if (nameMatches) return true;
    
    if (node.children) {
      return node.children.some(child => child.isDir && nodeMatchesSearch(child, query));
    }
    
    return false;
  };

  // Render directory tree recursively (only directory nodes)
  const renderTree = (nodes, depth = 0) => {
    return nodes
      .filter(node => node.isDir && nodeMatchesSearch(node, searchQuery))
      .map(node => {
        const hasDirs = node.children && node.children.some(child => child.isDir);
        const isExpanded = !!expandedFolders[node.path];
        const isSelected = selectedNode && selectedNode.path === node.path;
        
        // Automatically expand node if searching
        const expandedState = searchQuery ? true : isExpanded;

        return (
          <div key={node.path} className="tree-node-wrapper">
            <div 
              className={`tree-node-content ${isSelected ? 'selected' : ''}`}
              style={{ paddingLeft: `${depth * 0.8 + 0.5}rem` }}
              onClick={() => selectFolder(node)}
            >
              {hasDirs ? (
                <button 
                  className="tree-toggle-btn" 
                  onClick={(e) => toggleFolder(node.path, e)}
                >
                  <ChevronIcon expanded={expandedState} />
                </button>
              ) : (
                <span style={{ width: '1.4rem' }}></span> // Spacer matching toggle button width
              )}
              
              <FolderIcon isVirtual={node.isVirtual} />
              <span className="tree-node-text" title={node.name}>
                {node.name}
                {node.isVirtual && (
                  <span style={{ fontSize: '0.7rem', opacity: 0.6, fontStyle: 'italic', marginLeft: '0.4rem' }}>
                    (віртуальна)
                  </span>
                )}
              </span>
            </div>

            {hasDirs && expandedState && (
              <div className="tree-children">
                {renderTree(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      });
  };

  const currentDocs = selectedNode && selectedNode.documents ? selectedNode.documents : [];

  return (
    <div className="app-container">
      {/* Toast Messages */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <div className="toast-message">{toast.message}</div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Налаштування шляху до бази</h3>
              <button className="modal-close-btn" onClick={() => setShowSettings(false)}>×</button>
            </div>
            <form onSubmit={saveSettings} className="modal-body">
              <div className="form-group">
                <label>Повний шлях до вашої папки фурнітури на комп'ютері:</label>
                <input 
                  type="text" 
                  value={settingsPath}
                  onChange={(e) => setSettingsPath(e.target.value)}
                  placeholder="Наприклад: D:\Bazis\# Кріплення та фурнітура\1.Фурнітура"
                  className="input-field"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  required
                />
                <p className="form-help-text">
                  Ви можете вказати шлях до вашого синхронізованого <strong>Google Диску</strong> (наприклад, на диску G: або в іншому місці). Скрипт автоматично підвантажить всі папки.
                </p>
                <p className="form-help-text">
                  Шлях за замовчуванням (якщо залишити батьківську папку додатка): <code>{window.location.origin}</code> скануватиме папку, де встановлено додаток.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSettings(false)}>Скасувати</button>
                <button type="submit" className="btn btn-primary">Зберегти та оновити</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <svg className="logo-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
          </svg>
          <h1>База Фурнітури</h1>
          <span>Менеджер Документів</span>
        </div>
        <div className="stats-container">
          <div className="stat-item">
            Папок: <span className="stat-value">{stats.folders}</span>
          </div>
          <div className="stat-item">
            Текстових документів: <span className="stat-value">{stats.files}</span>
          </div>
          <button 
            className="settings-btn" 
            title="Налаштування бази папок"
            onClick={() => {
              fetchSettings();
              setShowSettings(true);
            }}
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      {/* Workspace */}
      <div className="app-workspace">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="search-box">
            <SearchIcon />
            <input 
              type="text" 
              placeholder="Швидкий пошук папки..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="tree-container">
            {loading ? (
              <div className="empty-state">
                <SpinnerIcon />
                <p>Сканування файлової структури...</p>
              </div>
            ) : tree.length > 0 ? (
              renderTree(tree)
            ) : (
              <div className="empty-state">
                <p style={{ color: '#ef4444' }}>Папка бази порожня або не знайдена.</p>
                <button 
                  className="btn btn-secondary" 
                  style={{ marginTop: '1rem', fontSize: '0.8rem' }}
                  onClick={() => setShowSettings(true)}
                >
                  Вказати шлях до бази
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Details Panel */}
        <main className="detail-panel">
          {selectedNode ? (
            <>
              {/* Header */}
              <div className="panel-header">
                <div className="breadcrumbs">
                  <span className="breadcrumb-item" onClick={() => fetchTree()}>Колекція</span>
                  {selectedNode.path.split('/').map((part, index, arr) => (
                    <React.Fragment key={index}>
                      <span className="breadcrumb-separator">/</span>
                      <span 
                        className="breadcrumb-item"
                        onClick={() => {
                          const partialPath = arr.slice(0, index + 1).join('/');
                          findAndSelectNode(tree, partialPath, selectedDoc);
                        }}
                      >
                        {part}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
                <div className="panel-title-container">
                  <h2 className="panel-title">
                    <FolderIcon isVirtual={selectedNode.isVirtual} />
                    {selectedNode.name}
                    {selectedNode.isVirtual && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '0.15rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem' }}>
                        Спільна (JSON)
                      </span>
                    )}
                  </h2>
                </div>
              </div>

              {/* Scrollable details */}
              <div className="panel-body">
                {/* 1. Documents List Section */}
                <div className="section-card">
                  <h3 className="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '1.1rem', height: '1.1rem', color: 'var(--accent-color)' }}>
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    Текстові документи
                  </h3>
                  
                  {currentDocs.length > 0 ? (
                    <div className="file-grid">
                      {currentDocs.map(docName => {
                        const isDocSelected = selectedDoc === docName;
                        return (
                          <div 
                            key={docName} 
                            className={`file-card ${isDocSelected ? 'selected' : ''}`}
                            onClick={() => selectDocument(docName)}
                            style={{ 
                              cursor: 'pointer',
                              border: isDocSelected ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                              background: isDocSelected ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                              position: 'relative'
                            }}
                          >
                            <DocIcon />
                            <div className="file-info" style={{ flex: 1 }}>
                              <span className="file-name" style={{ fontWeight: isDocSelected ? '600' : '400', color: isDocSelected ? 'var(--text-bright)' : 'var(--text-normal)' }}>{docName}</span>
                              <span className="file-ext">JSON документ</span>
                            </div>
                            <button
                              onClick={(e) => deleteDocument(docName, e)}
                              className="tree-toggle-btn"
                              style={{ 
                                padding: '0.2rem', 
                                color: 'rgba(239, 68, 68, 0.7)',
                                background: 'transparent'
                              }}
                              title="Видалити цей документ"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="no-files-placeholder">
                      У цій папці ще немає створених текстових документів. Створіть перший документ нижче!
                    </div>
                  )}

                  {/* Add document form */}
                  <form onSubmit={createDocument} className="action-row" style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem' }}>
                    <input 
                      type="text" 
                      placeholder="Назва нового текстового документа (наприклад: Петля накладна)..." 
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      className="input-field"
                      required
                    />
                    <button type="submit" className="btn btn-primary">
                      <PlusIcon />
                      Створити документ
                    </button>
                  </form>
                </div>

                {/* 2. Text Note Editor Section */}
                {selectedDoc ? (
                  <div className="section-card">
                    <h3 className="section-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '1.1rem', height: '1.1rem', color: 'var(--accent-color)' }}>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/>
                      </svg>
                      Редагування документа: <strong style={{ color: 'var(--text-bright)', marginLeft: '0.25rem' }}>{selectedDoc}</strong>
                    </h3>
                    <div className="note-editor-wrapper">
                      <textarea
                        placeholder={`Введіть вміст документа "${selectedDoc}" (характеристики, супутні планки, заглушки)...`}
                        value={noteContent}
                        onChange={(e) => {
                          setNoteContent(e.target.value);
                          if (noteStatus === 'saved') setNoteStatus('idle');
                        }}
                        className="note-textarea"
                        style={{ height: '220px' }}
                      />
                      <div className="editor-footer">
                        <div className="save-status-container">
                          {noteStatus === 'saving' && (
                            <span className="save-status saving">
                              <SpinnerIcon /> Збереження...
                            </span>
                          )}
                          {noteStatus === 'saved' && (
                            <span className="save-status saved">
                              <CheckIcon /> Збережено
                            </span>
                          )}
                          {noteStatus === 'error' && (
                            <span className="save-status error">
                              Помилка збереження
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={saveDocument}
                          disabled={noteStatus === 'saving'}
                          className="btn btn-primary"
                        >
                          <SaveIcon />
                          Зберегти вміст
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="section-card" style={{ alignItems: 'center', justifyContent: 'center', padding: '2.5rem', color: 'var(--text-muted)', textAlign: 'center', borderStyle: 'dashed' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '3.5rem', height: '3.5rem', opacity: 0.15, marginBottom: '0.75rem' }}>
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <p style={{ fontSize: '0.95rem' }}>Оберіть документ зі списку вище, або створіть новий, щоб почати писати інформацію.</p>
                  </div>
                )}

                {/* 3. Folder Creation Section */}
                <div className="section-card">
                  <h3 className="section-title">
                    <PlusIcon />
                    Створити підпапку тут
                  </h3>
                  <form onSubmit={createSubfolder} className="action-row">
                    <input 
                      type="text" 
                      placeholder="Назва нової підпапки..." 
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="input-field"
                      required
                    />
                    <button type="submit" className="btn btn-primary">
                      <PlusIcon />
                      Створити
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <svg className="empty-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 11H5c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v8c0 .55-.45 1-1 1z"/>
              </svg>
              <h2>Робоча область менеджера</h2>
              <p>Оберіть папку у лівій панелі, щоб переглянути, створити або редагувати її текстові документи.</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '1rem' }}>
                Поточна папка бази на сервері: <code style={{ color: 'var(--accent-color)', wordBreak: 'break-all' }}>{activePathOnServer}</code>
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
