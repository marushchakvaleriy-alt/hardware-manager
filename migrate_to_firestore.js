const fs = require('fs');
const path = require('path');

async function run() {
  console.log("=== Початок міграції у Firebase Firestore ===");
  
  // 1. Load Firebase configuration
  let configPath = path.join(__dirname, 'frontend', 'public', 'firebase-config.json');
  if (!fs.existsSync(configPath)) {
    configPath = path.join(__dirname, 'firebase-config.json');
  }
  
  if (!fs.existsSync(configPath)) {
    console.error("Помилка: Не знайдено файл конфігурації firebase-config.json!");
    console.error("Будь ласка, створіть файл 'frontend/public/firebase-config.json' та введіть ваші ключі Firebase.");
    process.exit(1);
  }
  
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error("Помилка зчитування файлу конфігурації:", e.message);
    process.exit(1);
  }
  
  const projectId = config.projectId;
  
  if (!projectId || projectId.includes("YOUR_PROJECT_ID")) {
    console.error("Помилка: Неправильний Project ID у конфігурації Firebase!");
    process.exit(1);
  }
  
  console.log(`Використовуємо проект Firebase: ${projectId}`);
  
  // 2. Load db.json
  const dbPath = path.join(__dirname, 'db.json');
  if (!fs.existsSync(dbPath)) {
    console.error("Помилка: Файл db.json не знайдено!");
    process.exit(1);
  }
  
  let db;
  try {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {
    console.error("Помилка зчитування файлу db.json:", e.message);
    process.exit(1);
  }
  
  const folders = db.folders || [];
  const notes = db.notes || {};
  
  console.log(`Знайдено папок: ${folders.length}`);
  const foldersWithNotes = Object.keys(notes).filter(p => Object.keys(notes[p]).length > 0);
  console.log(`Папок з документами: ${foldersWithNotes.length}`);
  
  // Count total notes
  let totalNotesCount = 0;
  for (const folderPath of foldersWithNotes) {
    totalNotesCount += Object.keys(notes[folderPath]).length;
  }
  console.log(`Загальна кількість документів: ${totalNotesCount}`);
  
  // Helper to convert JS object to Firestore REST API fields structure
  function toFirestoreFields(obj) {
    const fields = {};
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'string') {
        fields[key] = { stringValue: val };
      } else if (typeof val === 'number') {
        fields[key] = { integerValue: val };
      } else if (Array.isArray(val)) {
        fields[key] = {
          arrayValue: {
            values: val.map(item => ({ stringValue: String(item) }))
          }
        };
      } else if (typeof val === 'object' && val !== null) {
        fields[key] = {
          mapValue: {
            fields: toFirestoreFields(val)
          }
        };
      }
    }
    return fields;
  }
  
  // 3. Upload structure document
  console.log("Завантажуємо структуру папок...");
  const structureUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/metadata/structure`;
  try {
    const res = await fetch(structureUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: toFirestoreFields({
          folders: folders,
          notesCount: totalNotesCount
        })
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Помилка Firestore: ${errText}`);
    }
    console.log("Структуру папок успішно завантажено!");
  } catch (e) {
    console.error("Не вдалося завантажити структуру папок:", e.message);
    process.exit(1);
  }
  
  // 4. Upload notes
  console.log("Завантажуємо текстові документи...");
  let successCount = 0;
  
  for (let i = 0; i < foldersWithNotes.length; i++) {
    const folderPath = foldersWithNotes[i];
    const folderNotes = notes[folderPath];
    
    // Firestore doc ID cannot contain forward slashes, replace with ___
    const docId = folderPath.replace(/\//g, '___');
    const noteUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/folder_notes/${docId}`;
    
    try {
      const res = await fetch(noteUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: toFirestoreFields({
            notes: folderNotes
          })
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error(`Помилка завантаження для папки [${folderPath}]: ${errText}`);
      } else {
        successCount++;
        if (successCount % 10 === 0 || successCount === foldersWithNotes.length) {
          console.log(`Прогрес: ${successCount}/${foldersWithNotes.length} папок завантажено...`);
        }
      }
    } catch (e) {
      console.error(`Не вдалося завантажити документи для папки [${folderPath}]:`, e.message);
    }
  }
  
  console.log(`=== Міграцію завершено! Завантажено папок з документами: ${successCount}/${foldersWithNotes.length} ===`);
}

run();
