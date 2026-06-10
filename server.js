const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const CONFIG_FILE = path.join(__dirname, 'config.json');
const DB_FILE = path.join(__dirname, 'db.json');

// Default root folder is the parent of the current workspace directory (i.e. "1.Фурнітура")
let bazisRoot = path.resolve(__dirname, '..');

// Load settings from config.json if exists
function loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
            if (config.bazisRoot) {
                // If it is '..', resolve it relative to this folder
                if (config.bazisRoot === '..') {
                    bazisRoot = path.resolve(__dirname, '..');
                } else {
                    bazisRoot = path.resolve(config.bazisRoot);
                }
            }
        } catch (e) {
            console.error('Помилка зчитування файлу конфігурації:', e);
        }
    }
}

loadConfig();

// Read JSON database for virtual folders and documents
function readDb() {
    if (!fs.existsSync(DB_FILE)) {
        return { folders: [], notes: {} };
    }
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
        console.error('Помилка зчитування db.json:', e);
        return { folders: [], notes: {} };
    }
}

// Write to JSON database
function writeDb(db) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
        return true;
    } catch (e) {
        console.error('Помилка запису db.json:', e);
        return false;
    }
}

// Helper to check if a directory should be ignored
function shouldIgnore(name, relPath = '') {
    const lowerName = name.toLowerCase();
    const normalizedRelPath = relPath.replace(/\\/g, '/').toLowerCase();
    
    // Ignore hidden folders, git, modules
    if (name.startsWith('.') || name.startsWith('$')) return true;
    if (['node_modules', '.git', '.vscode', 'dist'].includes(lowerName)) return true;
    
    // Ignore the old hardware folder
    if (lowerName === '0001.стара фурнітура') return true;
    
    // Ignore the app itself! (hardware-manager)
    if (normalizedRelPath.includes('01. кріпильна фурнітура/hardware-manager')) return true;
    if (lowerName === 'hardware-manager') return true;
    
    return false;
}

// Attach document names from db.json to a node
function attachDocuments(node, db) {
    if (db.notes && db.notes[node.path]) {
        node.documents = Object.keys(db.notes[node.path]);
    } else {
        node.documents = [];
    }
}

// Recursively scan directories on disk (completely ignore files for speed!)
function buildTree(dirPath, relPath = '', db) {
    const name = path.basename(dirPath);
    if (shouldIgnore(name, relPath)) return null;

    let stats;
    try {
        stats = fs.statSync(dirPath);
    } catch (e) {
        return null;
    }

    // Since we ignore files, only process directories
    if (!stats.isDirectory()) {
        return null;
    }

    const node = {
        name,
        path: relPath.replace(/\\/g, '/'),
        isDir: true,
        children: []
    };
    
    attachDocuments(node, db);

    let items = [];
    try {
        items = fs.readdirSync(dirPath);
    } catch (e) {
        // Permission error
    }

    const subDirs = [];
    for (const item of items) {
        const fullSubPath = path.join(dirPath, item);
        const subRelPath = relPath ? path.join(relPath, item) : item;
        
        const childNode = buildTree(fullSubPath, subRelPath, db);
        if (childNode) {
            subDirs.push(childNode);
        }
    }

    // Sort alphabetically
    subDirs.sort((a, b) => a.name.localeCompare(b.name));
    node.children = subDirs;

    return node;
}

// Merge virtual folders from db.json into the tree
function mergeVirtualFolders(tree, virtualPaths, db) {
    virtualPaths.forEach(vPath => {
        const parts = vPath.split('/');
        let currentLevel = tree;
        let accumulatedPath = '';
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
            
            // Search for existing directory with this name
            let node = currentLevel.find(n => n.name === part && n.isDir);
            
            if (!node) {
                // If it doesn't exist, create it as virtual
                node = {
                    name: part,
                    path: accumulatedPath,
                    isDir: true,
                    children: [],
                    isVirtual: true
                };
                attachDocuments(node, db);
                currentLevel.push(node);
                // Sort current level to maintain alphabetical order
                currentLevel.sort((a, b) => a.name.localeCompare(b.name));
            }
            
            currentLevel = node.children;
        }
    });
}

// API Endpoints

// Get current settings
app.get('/api/settings', (req, res) => {
    res.json({ success: true, bazisRoot });
});

// Update settings
app.post('/api/settings', (req, res) => {
    const { newRoot } = req.body;
    if (!newRoot) {
        return res.status(400).json({ success: false, error: 'Шлях не вказано' });
    }

    const resolvedPath = path.resolve(newRoot);

    if (!fs.existsSync(resolvedPath)) {
        return res.status(400).json({ success: false, error: 'Вказаний шлях не існує на вашому комп’ютері' });
    }

    try {
        bazisRoot = resolvedPath;
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({ bazisRoot }, null, 2), 'utf-8');
        res.json({ success: true, message: 'Шлях до папки успішно змінено', bazisRoot });
    } catch (error) {
        console.error('Помилка збереження конфігурації:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get directory tree (Merged Disk + Virtual)
app.get('/api/tree', (req, res) => {
    try {
        if (!fs.existsSync(bazisRoot)) {
            return res.status(400).json({ 
                success: false, 
                error: `Папка не знайдена за шляхом: ${bazisRoot}. Перевірте налаштування.` 
            });
        }

        const db = readDb();
        const rootItems = fs.readdirSync(bazisRoot);
        const tree = [];
        
        for (const item of rootItems) {
            const fullPath = path.join(bazisRoot, item);
            const node = buildTree(fullPath, item, db);
            if (node) {
                tree.push(node);
            }
        }
        
        // Merge virtual folders
        mergeVirtualFolders(tree, db.folders, db);
        
        res.json({ success: true, tree });
    } catch (error) {
        console.error('Error generating tree:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create a new folder (Virtual in db.json)
app.post('/api/folder', (req, res) => {
    const { parentPath, folderName } = req.body;
    if (!folderName) {
        return res.status(400).json({ success: false, error: 'Назва папки обов’язкова' });
    }

    const safeFolderName = folderName.replace(/[\\/:*?"<>|]/g, '_'); // sanitize folder name
    const newFolderRelPath = parentPath ? `${parentPath}/${safeFolderName}` : safeFolderName;

    // Check if it already exists physically on disk
    const targetDirOnDisk = path.join(bazisRoot, newFolderRelPath);
    if (fs.existsSync(targetDirOnDisk)) {
        return res.status(400).json({ success: false, error: 'Папка з такою назвою вже існує фізично на диску' });
    }

    try {
        const db = readDb();
        
        // Check if already exists virtually
        if (db.folders.includes(newFolderRelPath)) {
            return res.status(400).json({ success: false, error: 'Папка з такою назвою вже існує у базі' });
        }
        
        db.folders.push(newFolderRelPath);
        writeDb(db);
        
        res.json({ 
            success: true, 
            message: 'Віртуальну папку успішно створено', 
            path: newFolderRelPath 
        });
    } catch (error) {
        console.error('Error creating virtual folder:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete a folder and its subfolders (and all notes inside them)
app.delete('/api/folder', (req, res) => {
    const { folderPath } = req.body;
    if (!folderPath) {
        return res.status(400).json({ success: false, error: 'Параметр folderPath обов’язковий' });
    }
    try {
        const db = readDb();
        // Remove folder and all its subfolders
        db.folders = db.folders.filter(f => f !== folderPath && !f.startsWith(`${folderPath}/`));
        
        // Delete notes for this folder and subfolders
        let deletedNotesCount = 0;
        Object.keys(db.notes).forEach(fPath => {
            if (fPath === folderPath || fPath.startsWith(`${folderPath}/`)) {
                deletedNotesCount += Object.keys(db.notes[fPath]).length;
                delete db.notes[fPath];
            }
        });
        
        writeDb(db);
        res.json({ success: true, message: `Папку та її підпапки видалено. Видалено документів: ${deletedNotesCount}` });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rename a folder (and its subfolders and notes)
app.put('/api/folder', (req, res) => {
    const { oldFolderPath, newFolderName } = req.body;
    if (!oldFolderPath || !newFolderName) {
        return res.status(400).json({ success: false, error: 'Параметри oldFolderPath та newFolderName обов’язкові' });
    }
    
    const parts = oldFolderPath.split('/');
    const parentPath = parts.slice(0, -1).join('/');
    const safeFolderName = newFolderName.replace(/[\\/:*?"<>|]/g, '_');
    const newFolderPath = parentPath ? `${parentPath}/${safeFolderName}` : safeFolderName;
    
    try {
        const db = readDb();
        
        if (db.folders.includes(newFolderPath)) {
            return res.status(400).json({ success: false, error: 'Папка з такою назвою вже існує у базі' });
        }
        
        // Rename in folders array
        db.folders = db.folders.map(f => {
            if (f === oldFolderPath) return newFolderPath;
            if (f.startsWith(`${oldFolderPath}/`)) {
                return f.replace(oldFolderPath, newFolderPath);
            }
            return f;
        });
        
        // Rename in notes object
        const updatedNotes = {};
        Object.keys(db.notes).forEach(fPath => {
            if (fPath === oldFolderPath) {
                updatedNotes[newFolderPath] = db.notes[fPath];
            } else if (fPath.startsWith(`${oldFolderPath}/`)) {
                const newPath = fPath.replace(oldFolderPath, newFolderPath);
                updatedNotes[newPath] = db.notes[fPath];
            } else {
                updatedNotes[fPath] = db.notes[fPath];
            }
        });
        db.notes = updatedNotes;
        
        writeDb(db);
        res.json({ success: true, newFolderPath });
    } catch (error) {
        console.error('Error renaming folder:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Import entire database from JSON
app.post('/api/import', (req, res) => {
    const { folders, notes } = req.body;
    if (!folders || !notes) {
        return res.status(400).json({ success: false, error: 'Некоректна структура бази даних (мають бути folders та notes)' });
    }
    try {
        writeDb({ folders, notes });
        res.json({ success: true, message: 'Базу даних успішно імпортовано' });
    } catch (error) {
        console.error('Error importing database:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Read content of a specific text document in a folder
app.get('/api/file', (req, res) => {
    const { folderPath, docName } = req.query;
    if (folderPath === undefined || !docName) {
        return res.status(400).json({ success: false, error: 'Параметри folderPath та docName обов’язкові' });
    }

    try {
        const db = readDb();
        const folderNotes = db.notes[folderPath] || {};
        const content = folderNotes[docName] || '';
        const exists = docName in folderNotes;
        
        res.json({ success: true, content, exists });
    } catch (error) {
        console.error('Error reading virtual document:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Save content of a specific text document in a folder
app.post('/api/file', (req, res) => {
    const { folderPath, docName, content } = req.body;
    if (folderPath === undefined || !docName) {
        return res.status(400).json({ success: false, error: 'Параметри folderPath та docName обов’язкові' });
    }

    try {
        const db = readDb();
        if (!db.notes[folderPath]) {
            db.notes[folderPath] = {};
        }
        
        db.notes[folderPath][docName] = content;
        writeDb(db);
        
        res.json({ success: true, message: 'Документ успішно збережено' });
    } catch (error) {
        console.error('Error saving virtual document:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete a specific text document in a folder
app.delete('/api/file', (req, res) => {
    const { folderPath, docName } = req.body;
    if (folderPath === undefined || !docName) {
        return res.status(400).json({ success: false, error: 'Параметри folderPath та docName обов’язкові' });
    }

    try {
        const db = readDb();
        if (db.notes[folderPath] && db.notes[folderPath][docName] !== undefined) {
            delete db.notes[folderPath][docName];
            
            // Cleanup empty parent folder notes
            if (Object.keys(db.notes[folderPath]).length === 0) {
                delete db.notes[folderPath];
            }
            
            writeDb(db);
            return res.json({ success: true, message: 'Документ успішно видалено' });
        }
        res.status(404).json({ success: false, error: 'Документ не знайдено у базі' });
    } catch (error) {
        console.error('Error deleting virtual document:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Serve frontend in production
const frontendDist = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendDist, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Сервер працює. Фронтенд ще не зібрано. Запустіть складання фронтенду.');
    });
}

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
