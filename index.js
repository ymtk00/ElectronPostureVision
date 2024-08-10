const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3');
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
      db.run('CREATE TABLE IF NOT EXISTS my_memo ([id] integer primary key autoincrement, [memo] text, [date_time] datetime);', err => {
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

  ipcMain.handle('insertData', (eve, memoText) =>
    new Promise((resolve, reject) => {
      db.run('INSERT INTO my_memo (memo, date_time) VALUES (?, datetime("now", "localtime"));', memoText, err => {
        if (err) reject(err);
        resolve();
      });
    })
  );

  ipcMain.handle('updateData', (eve, id, memoText) =>
    new Promise((resolve, reject) => {
      db.run('UPDATE my_memo SET memo = ?, date_time = datetime("now", "localtime") WHERE id = ?;', [memoText, id], err => {
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