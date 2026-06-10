import React, { useState, useEffect } from 'react';
import './App.css';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, deleteField, runTransaction, increment } from 'firebase/firestore';

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

// Helper functions for path encoding/decoding for Firestore doc IDs
const encodePath = (path) => {
  return path.replace(/\//g, '___');
};

const initFirebase = (config) => {
  if (!config || !config.apiKey || !config.projectId) return null;
  try {
    const apps = getApps();
    if (apps.length > 0) {
      return getFirestore(apps[0]);
    }
    const app = initializeApp(config);
    return getFirestore(app);
  } catch (e) {
    console.error("Помилка ініціалізації Firebase:", e);
    return null;
  }
};

function App() {
  const [db, setDb] = useState({ folders: [], notes: {} }); // Fallback local database
  const [folders, setFolders] = useState([]);
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

  // Settings states for Firebase
  const [showSettings, setShowSettings] = useState(false);
  const [firebaseConfig, setFirebaseConfig] = useState(() => {
    const local = localStorage.getItem('firebase_config');
    return local ? JSON.parse(local) : null;
  });

  const [apiKey, setApiKey] = useState(firebaseConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(firebaseConfig?.projectId || '');
  const [authDomain, setAuthDomain] = useState(firebaseConfig?.authDomain || '');
  const [storageBucket, setStorageBucket] = useState(firebaseConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(firebaseConfig?.messagingSenderId || '');
  const [appId, setAppId] = useState(firebaseConfig?.appId || '');

  const [firestore, setFirestore] = useState(null);
  const [selectedFolderNotes, setSelectedFolderNotes] = useState({});
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);

  // 1. Try to load config from static firebase-config.json
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('./firebase-config.json');
        if (res.ok) {
          const config = await res.json();
          if (config && config.apiKey && config.projectId) {
            setFirebaseConfig(config);
            setApiKey(config.apiKey);
            setProjectId(config.projectId);
            setAuthDomain(config.authDomain || '');
            setStorageBucket(config.storageBucket || '');
            setMessagingSenderId(config.messagingSenderId || '');
            setAppId(config.appId || '');
            localStorage.setItem('firebase_config', JSON.stringify(config));
            return;
          }
        }
      } catch (e) {
        console.log("Локальний файл конфігурації Firebase не знайдено, використовується локальне сховище чи db.json.");
      }
      
      // Fallback: If no config in JSON and none in localStorage, load static local db.json
      if (!localStorage.getItem('firebase_config')) {
        await loadFallbackDb();
      }
    };
    loadConfig();
  }, []);

  const loadFallbackDb = async () => {
    try {
      setLoading(true);
      const res = await fetch('./db.json', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDb(data);
        const folderList = data.folders || [];
        setFolders(folderList);
        const parsedTree = buildTreeFromPaths(folderList);
        setTree(parsedTree);
        
        let docsCount = 0;
        if (data.notes) {
          Object.values(data.notes).forEach(folderDocs => {
            docsCount += Object.keys(folderDocs).length;
          });
        }
        setStats({ folders: folderList.length, files: docsCount });
      }
    } catch (e) {
      console.error("Не вдалося завантажити локальний файл db.json", e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Initialize Firebase instance when config changes
  useEffect(() => {
    if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId) {
      try {
        const fs = initFirebase(firebaseConfig);
        if (fs) {
          setFirestore(fs);
          setIsFirebaseLoaded(true);
        } else {
          setIsFirebaseLoaded(false);
          loadFallbackDb();
        }
      } catch (e) {
        console.error("Помилка ініціалізації Firebase:", e);
        setIsFirebaseLoaded(false);
        loadFallbackDb();
      }
    } else {
      setFirestore(null);
      setIsFirebaseLoaded(false);
    }
  }, [firebaseConfig]);

  // 3. Real-time folder tree listener (Firebase mode)
  useEffect(() => {
    if (!firestore) return;
    
    setLoading(true);
    const docRef = doc(firestore, 'metadata', 'structure');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const folderList = data.folders || [];
        setFolders(folderList);
        
        const parsedTree = buildTreeFromPaths(folderList);
        setTree(parsedTree);
        
        setStats({
          folders: folderList.length,
          files: data.notesCount || 0
        });
        
        // Auto-expand first level folders on initial load
        if (Object.keys(expandedFolders).length === 0) {
          const initialExpanded = {};
          parsedTree.forEach(node => {
            if (node.isDir) {
              initialExpanded[node.path] = true;
            }
          });
          setExpandedFolders(initialExpanded);
        }
        
        setLoading(false);
      } else {
        setFolders([]);
        setTree([]);
        setStats({ folders: 0, files: 0 });
        setLoading(false);
      }
    }, (error) => {
      console.error("Помилка завантаження структури з Firestore:", error);
      showToast("Помилка підключення до Firestore. Режим читання.", "error");
      loadFallbackDb();
    });
    
    return () => unsubscribe();
  }, [firestore]);

  // 4. Real-time folder notes listener (Firebase or fallback mode)
  useEffect(() => {
    if (isFirebaseLoaded && firestore && selectedNode) {
      const docId = encodePath(selectedNode.path);
      const docRef = doc(firestore, 'folder_notes', docId);
      
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSelectedFolderNotes(data.notes || {});
        } else {
          setSelectedFolderNotes({});
        }
      }, (error) => {
        console.error("Помилка отримання нотаток папки:", error);
      });
      
      return () => unsubscribe();
    } else if (!isFirebaseLoaded && selectedNode && db.notes) {
      const notes = db.notes[selectedNode.path] || {};
      setSelectedFolderNotes(notes);
    } else {
      setSelectedFolderNotes({});
    }
  }, [isFirebaseLoaded, firestore, selectedNode?.path, db.notes]);

  // 5. Update editor if note is updated in background and state is idle
  useEffect(() => {
    if (selectedDoc && selectedFolderNotes[selectedDoc] !== undefined) {
      if (noteStatus === 'idle') {
        setNoteContent(selectedFolderNotes[selectedDoc]);
      }
    }
  }, [selectedFolderNotes, selectedDoc, noteStatus]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Build hierarchical folder tree from paths array
  const buildTreeFromPaths = (paths) => {
    const rootTree = [];
    paths.forEach(p => {
      const parts = p.split('/');
      let currentLevel = rootTree;
      let accumulatedPath = '';
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
        
        let node = currentLevel.find(n => n.name === part && n.isDir);
        if (!node) {
          node = {
            name: part,
            path: accumulatedPath,
            isDir: true,
            children: [],
          };
          currentLevel.push(node);
          currentLevel.sort((a, b) => a.name.localeCompare(b.name));
        }
        currentLevel = node.children;
      }
    });
    return rootTree;
  };

  const saveSettings = (e) => {
    e.preventDefault();
    const newConfig = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };
    
    if (!newConfig.apiKey || !newConfig.projectId) {
      showToast("Помилка: API Key та Project ID обов'язкові!", "error");
      return;
    }
    
    localStorage.setItem('firebase_config', JSON.stringify(newConfig));
    setFirebaseConfig(newConfig);
    showToast('Налаштування Firebase збережено у браузері!', 'success');
    setShowSettings(false);
    setSelectedNode(null);
    setSelectedDoc(null);
  };

  const resetSettings = () => {
    localStorage.removeItem('firebase_config');
    setFirebaseConfig(null);
    setApiKey('');
    setProjectId('');
    setAuthDomain('');
    setStorageBucket('');
    setMessagingSenderId('');
    setAppId('');
    showToast('Налаштування скинуто!', 'success');
    setShowSettings(false);
    setSelectedNode(null);
    setSelectedDoc(null);
    loadFallbackDb();
  };

  const selectFolder = (node) => {
    setSelectedNode(node);
    setSelectedDoc(null);
    setNoteContent('');
    setNoteStatus('idle');
    setNewFolderName('');
    setNewDocName('');
  };

  const selectDocument = (docName) => {
    if (!selectedNode) return;
    setSelectedDoc(docName);
    setNoteContent(selectedFolderNotes[docName] || '');
    setNoteStatus('idle');
  };

  const saveDocument = async () => {
    if (!firestore || !selectedNode || !selectedDoc) return;
    setNoteStatus('saving');

    try {
      const docId = encodePath(selectedNode.path);
      const docRef = doc(firestore, 'folder_notes', docId);
      
      await setDoc(docRef, {
        notes: {
          [selectedDoc]: noteContent
        }
      }, { merge: true });
      
      setNoteStatus('saved');
      showToast(`Документ "${selectedDoc}" успішно збережено в Firestore!`, 'success');
      setTimeout(() => setNoteStatus('idle'), 2000);
    } catch (err) {
      console.error(err);
      setNoteStatus('error');
      showToast(`Помилка збереження: ${err.message}`, 'error');
    }
  };

  const createDocument = async (e) => {
    e.preventDefault();
    if (!firestore || !selectedNode || !newDocName.trim()) return;

    const docName = newDocName.trim();

    if (selectedFolderNotes[docName] !== undefined) {
      showToast('Документ з такою назвою вже існує', 'error');
      return;
    }

    try {
      const docId = encodePath(selectedNode.path);
      const docRef = doc(firestore, 'folder_notes', docId);
      
      await setDoc(docRef, {
        notes: {
          [docName]: ''
        }
      }, { merge: true });

      // Increment note count globally
      const structureRef = doc(firestore, 'metadata', 'structure');
      await updateDoc(structureRef, {
        notesCount: increment(1)
      });
      
      setNewDocName('');
      setSelectedDoc(docName);
      setNoteContent('');
      setNoteStatus('idle');
      showToast(`Документ "${docName}" створено!`, 'success');
    } catch (err) {
      console.error(err);
      showToast(`Помилка створення документа: ${err.message}`, 'error');
    }
  };

  const deleteDocument = async (docName, e) => {
    e.stopPropagation();
    if (!firestore || !selectedNode) return;
    if (!window.confirm(`Ви дійсно бажаєте видалити документ "${docName}"?`)) {
      return;
    }

    try {
      const docId = encodePath(selectedNode.path);
      const docRef = doc(firestore, 'folder_notes', docId);
      
      await updateDoc(docRef, {
        [`notes.${docName}`]: deleteField()
      });

      // Decrement note count globally
      const structureRef = doc(firestore, 'metadata', 'structure');
      await updateDoc(structureRef, {
        notesCount: increment(-1)
      });
      
      if (selectedDoc === docName) {
        setSelectedDoc(null);
        setNoteContent('');
        setNoteStatus('idle');
      }
      
      showToast(`Документ "${docName}" видалено!`, 'success');
    } catch (err) {
      console.error(err);
      showToast(`Помилка видалення: ${err.message}`, 'error');
    }
  };

  const createSubfolder = async (e) => {
    e.preventDefault();
    if (!firestore || !selectedNode || !newFolderName.trim()) return;

    const safeFolderName = newFolderName.trim().replace(/[\\/:*?"<>|]/g, '_');
    const newFolderRelPath = `${selectedNode.path}/${safeFolderName}`;

    if (folders.includes(newFolderRelPath)) {
      showToast('Папка з такою назвою вже існує в базі', 'error');
      return;
    }

    try {
      const docRef = doc(firestore, 'metadata', 'structure');
      
      await runTransaction(firestore, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        let currentFolders = [];
        if (docSnap.exists()) {
          currentFolders = docSnap.data().folders || [];
        }
        if (!currentFolders.includes(newFolderRelPath)) {
          currentFolders.push(newFolderRelPath);
          transaction.set(docRef, { folders: currentFolders }, { merge: true });
        }
      });
      
      setNewFolderName('');
      showToast(`Папку "${safeFolderName}" створено!`, 'success');
      
      setExpandedFolders(prev => ({ ...prev, [selectedNode.path]: true }));
    } catch (err) {
      console.error(err);
      showToast(`Помилка створення папки: ${err.message}`, 'error');
    }
  };

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
        setSelectedDoc(reselectDoc);
      } else {
        setSelectedDoc(null);
        setNoteContent('');
      }
    }
  };

  const toggleFolder = (path, e) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const nodeMatchesSearch = (node, query) => {
    if (!query) return true;
    const normalizedQuery = query.toLowerCase();
    const nameMatches = node.name.toLowerCase().includes(normalizedQuery);
    
    if (nameMatches) return true;
    if (node.children) {
      return node.children.some(child => nodeMatchesSearch(child, query));
    }
    return false;
  };

  const renderTree = (nodes, depth = 0) => {
    return nodes
      .filter(node => nodeMatchesSearch(node, searchQuery))
      .map(node => {
        const hasDirs = node.children && node.children.length > 0;
        const isExpanded = !!expandedFolders[node.path];
        const isSelected = selectedNode && selectedNode.path === node.path;
        
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
                <span style={{ width: '1.4rem' }}></span>
              )}
              
              <FolderIcon isVirtual={true} />
              <span className="tree-node-text" title={node.name}>
                {node.name}
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

  const currentDocs = Object.keys(selectedFolderNotes).sort();

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
              <h3>Налаштування підключення Firebase</h3>
              <button className="modal-close-btn" onClick={() => setShowSettings(false)}>×</button>
            </div>
            <form onSubmit={saveSettings} className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>API Key (apiKey):</label>
                  <input 
                    type="text" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="input-field"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Project ID (projectId):</label>
                  <input 
                    type="text" 
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="my-project-123"
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div className="form-group">
                  <label>Auth Domain:</label>
                  <input 
                    type="text" 
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    placeholder="my-project-123.firebaseapp.com"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label>Storage Bucket:</label>
                  <input 
                    type="text" 
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                    placeholder="my-project-123.appspot.com"
                    className="input-field"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div className="form-group">
                  <label>Messaging Sender ID:</label>
                  <input 
                    type="text" 
                    value={messagingSenderId}
                    onChange={(e) => setMessagingSenderId(e.target.value)}
                    placeholder="1234567890"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label>App ID (appId):</label>
                  <input 
                    type="text" 
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="1:123:web:abc..."
                    className="input-field"
                  />
                </div>
              </div>
              <p className="form-help-text" style={{ marginTop: '0.75rem' }}>
                Для підключення бази даних у реальному часі введіть ваші Firebase ключі. Ви можете знайти їх у налаштуваннях вашого Firebase-проекту. 
                Рекомендується скопіювати їх у файл <code>firebase-config.json</code> у проекті, щоб вони завантажувалися автоматично для всієї команди.
              </p>
              <div className="modal-footer" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ marginRight: 'auto', background: '#ef4444', color: '#fff' }} onClick={resetSettings}>Скинути налаштування</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSettings(false)}>Скасувати</button>
                <button type="submit" className="btn btn-primary">Зберегти</button>
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
          <span>Хмарний Менеджер Документів (Firestore)</span>
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
            title="Налаштування Firebase"
            onClick={() => setShowSettings(true)}
            style={{ border: isFirebaseLoaded ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)' }}
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
                <p>Завантаження бази даних...</p>
              </div>
            ) : tree.length > 0 ? (
              renderTree(tree)
            ) : (
              <div className="empty-state">
                <p style={{ color: '#ef4444' }}>База даних порожня або не знайдена.</p>
                <button 
                  className="btn btn-secondary" 
                  style={{ marginTop: '1rem', fontSize: '0.8rem' }}
                  onClick={() => setShowSettings(true)}
                >
                  Налаштувати Firebase
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
                  <span className="breadcrumb-item" onClick={() => setSelectedNode(null)}>Колекція</span>
                  {selectedNode.path.split('/').map((part, index, arr) => (
                    <React.Fragment key={index}>
                      <span className="breadcrumb-separator">/</span>
                      <span 
                        className="breadcrumb-item"
                        onClick={() => {
                          const partialPath = arr.slice(0, index + 1).join('/');
                          findAndSelectNode(tree, partialPath);
                        }}
                      >
                        {part}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
                <div className="panel-title-container">
                  <h2 className="panel-title">
                    <FolderIcon isVirtual={true} />
                    {selectedNode.name}
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
                              <span className="file-ext">Документ Firestore</span>
                            </div>
                            {isFirebaseLoaded && (
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
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="no-files-placeholder">
                      У цій папці ще немає створених текстових документів. {isFirebaseLoaded ? 'Створіть перший документ нижче!' : 'Налаштуйте Firebase ⚙️ для редагування.'}
                    </div>
                  )}

                  {/* Add document form */}
                  {isFirebaseLoaded && (
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
                  )}
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
                        readOnly={!isFirebaseLoaded}
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
                        {isFirebaseLoaded ? (
                          <button 
                            onClick={saveDocument}
                            disabled={noteStatus === 'saving'}
                            className="btn btn-primary"
                          >
                            <SaveIcon />
                            Зберегти вміст у Firestore
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Режим читання (налаштуйте Firebase ⚙️ для редагування)</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="section-card" style={{ alignItems: 'center', justifyContent: 'center', padding: '2.5rem', color: 'var(--text-muted)', textAlign: 'center', borderStyle: 'dashed' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '3.5rem', height: '3.5rem', opacity: 0.15, marginBottom: '0.75rem' }}>
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <p style={{ fontSize: '0.95rem' }}>Оберіть документ зі списку вище, або створіть новий, щоб почати писати інформацію.</p>
                  </div>
                )}

                {/* 3. Folder Creation Section */}
                {isFirebaseLoaded && (
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
                )}
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
                Статус підключення: <code style={{ color: isFirebaseLoaded ? '#10b981' : '#ef4444' }}>
                  {isFirebaseLoaded ? 'Firebase Firestore (Спільний онлайн-режим)' : 'Локальний файл db.json (Тільки читання)'}
                </code>
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
