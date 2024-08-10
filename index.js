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

  ipcMain.handle('updateData', (eve, id, memoText, imageData) =>
    new Promise((resolve, reject) => {
      let imageUrl = null;
      if (imageData) {
        const fileName = `${uuidv4()}.png`;
        const filePath = path.join(app.getPath('userData'), 'images', fileName);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ""), 'base64'));
        imageUrl = `file://${filePath}`;
      }
      db.run('UPDATE my_memo SET memo = ?, date_time = datetime("now", "localtime"), image_url = ? WHERE id = ?;', [memoText, imageUrl, id], err => {
        if (err) reject(err);
        resolve();
      });
    })
  );

  ipcMain.handle('deleteData', (eve, id) =>
    new Promise((resolve, reject) => {
      db.run('DELETE FROM my_memo WHERE id = ?;', id, err => {
        if (err) reject(err);
        resolve();
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