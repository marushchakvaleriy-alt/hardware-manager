import os
import json

def sync_folders():
    # Current folder is d:/Bazis/# Кріплення та фурнітура/1.Фурнітура/01. Кріпильна фурнітура/hardware-manager
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Root of scanning is 1.Фурнітура (two levels up from hardware-manager)
    # i.e., current_dir -> 01. Кріпильна фурнітура -> 1.Фурнітура
    parent_dir = os.path.dirname(os.path.dirname(current_dir))
    
    db_file = os.path.join(current_dir, 'db.json')
    
    # Load existing database
    db = {'folders': [], 'notes': {}}
    if os.path.exists(db_file):
        try:
            with open(db_file, 'r', encoding='utf-8') as f:
                db = json.load(f)
        except Exception as e:
            print(f"Помилка зчитування db.json: {e}")
            
    # Ensure notes structure is initialized
    if 'notes' not in db:
        db['notes'] = {}
        
    folders_list = []
    
    # Helper to check if folder should be ignored
    def should_ignore(name, rel_path):
        lower_name = name.toLowerCase() if hasattr(name, 'toLowerCase') else name.lower()
        normalized_rel_path = rel_path.replace('\\', '/').lower()
        
        if name.startswith('.') or name.startswith('$'):
            return True
        if name in ['node_modules', '.git', '.vscode', 'dist', 'hardware-manager']:
            return True
        if lower_name == '0001.стара фурнітура':
            return True
        if '01. кріпильна фурнітура/hardware-manager' in normalized_rel_path:
            return True
        return False

    # Scan directories on disk
    for dirpath, dirnames, filenames in os.walk(parent_dir):
        # Calculate relative path from parent_dir (1.Фурнітура)
        rel_path = os.path.relpath(dirpath, parent_dir)
        
        if rel_path == '.':
            continue
            
        # Filter dirnames in-place to prevent os.walk from entering ignored directories
        dirnames[:] = [d for d in dirnames if not should_ignore(d, os.path.relpath(os.path.join(dirpath, d), parent_dir))]
        
        folder_name = os.path.basename(dirpath)
        if should_ignore(folder_name, rel_path):
            continue
            
        # Add relative path with forward slashes
        normalized_path = rel_path.replace('\\', '/')
        folders_list.append(normalized_path)
        
    # Merge with existing virtual folders in db (to keep folders created in app)
    existing_folders = db.get('folders', [])
    
    # Combine lists and remove duplicates, preserving alphabetical order
    combined_folders = list(set(folders_list + existing_folders))
    combined_folders.sort()
    
    db['folders'] = combined_folders
    
    # Save db.json
    try:
        with open(db_file, 'w', encoding='utf-8') as f:
            json.dump(db, f, ensure_ascii=False, indent=2)
        print(f"Успішно оновлено базу {db_file}")
        print(f"Знайдено папок на диску: {len(folders_list)}")
        print(f"Загальна кількість папок у базі: {len(combined_folders)}")
    except Exception as e:
        print(f"Помилка запису db.json: {e}")

if __name__ == '__main__':
    sync_folders()
