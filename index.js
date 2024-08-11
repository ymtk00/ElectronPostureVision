const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const db = new sqlite3.Database("./my_database.db");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });
  win.loadFile('index.html');
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  ipcMain.handle('createDb', (eve) =>
    new Promise((resolve, reject) => {
      db.run('CREATE TABLE IF NOT EXISTS my_memo ([id] integer primary key autoincrement, [memo] text, [date_time] datetime, [image_url] text);', err => {
        if (err) reject(err);
        resolve();
      });
    }));

  ipcMain.handle('selectAll', (eve) =>
    new Promise((resolve, reject) => {
      db.all('SELECT * FROM my_memo ORDER BY date_time DESC', (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    })
  );

  ipcMain.handle('insertData', (eve, memoText, imageData) =>
    new Promise((resolve, reject) => {
      let imageUrl = null;
      if (imageData) {
        const fileName = `${uuidv4()}.png`;
        const filePath = path.join(app.getPath('userData'), 'images', fileName);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ""), 'base64'));
        imageUrl = `file://${filePath}`;
      }
      db.run('INSERT INTO my_memo (memo, date_time, image_url) VALUES (?, datetime("now", "localtime"), ?);', [memoText, imageUrl], err => {
        if (err) reject(err);
        resolve();
      });
    })
  );

  function getFilePathFromUrl(fileUrl) {
    // Remove the 'file://' protocol
    let filePath = fileUrl.replace(/^file:\/\//, '');
    
    // Remove any leading slashes
    filePath = filePath.replace(/^\/+/, '');
    
    // On Windows, add the drive letter back if it's missing
    if (process.platform === 'win32' && !/^[A-Za-z]:/.test(filePath)) {
      filePath = `C:${filePath}`;
    }
    
    return filePath;
  }

  ipcMain.handle('updateData', (eve, id, memoText, imageData) =>
    new Promise((resolve, reject) => {
      db.get('SELECT image_url FROM my_memo WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
  
        let imageUrl = row ? row.image_url : null;
        
        const updateDB = () => {
          db.run('UPDATE my_memo SET memo = ?, date_time = datetime("now", "localtime"), image_url = ? WHERE id = ?;', [memoText, imageUrl, id], err => {
            if (err) reject(err);
            else resolve();
          });
        };
  
        if (imageData) {
          // 古い画像を削除
          if (imageUrl) {
            const oldImagePath = getFilePathFromUrl(imageUrl);
            fs.unlink(oldImagePath, (err) => {
              if (err && err.code !== 'ENOENT') {
                console.error('Failed to delete old image:', err);
              }
              // ファイルが存在しない場合でも続行
            });
          }
  
          // 新しい画像を保存
          const fileName = `${uuidv4()}.png`;
          const filePath = path.join(app.getPath('userData'), 'images', fileName);
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
          fs.writeFileSync(filePath, Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ""), 'base64'));
          imageUrl = `file://${filePath}`;
        }
  
        updateDB();
      });
    })
  );

  ipcMain.handle('deleteData', (eve, id) =>
    new Promise((resolve, reject) => {
      db.get('SELECT image_url FROM my_memo WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
  
        const deleteFromDB = () => {
          db.run('DELETE FROM my_memo WHERE id = ?;', id, err => {
            if (err) reject(err);
            else resolve();
          });
        };
  
        if (row && row.image_url) {
          const imagePath = getFilePathFromUrl(row.image_url);
          fs.unlink(imagePath, (err) => {
            if (err && err.code !== 'ENOENT') {
              console.error('Failed to delete image:', err);
            }
            // ファイルが存在しない場合でも続行
            deleteFromDB();
          });
        } else {
          deleteFromDB();
        }
      });
    })
  );
  

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  })
})

app.on('window-all-closed', () => {
  db.close();
  if (process.platform !== 'darwin') app.quit();
})