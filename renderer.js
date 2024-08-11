document.addEventListener('DOMContentLoaded', () => {
    const memoInput = document.getElementById('memoInput');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const submitButton = document.getElementById('submitButton');
    const updateButton = document.getElementById('updateButton');
    const cancelButton = document.getElementById('cancelButton');
    const tableContainer = document.getElementById('tableContainer');

    let currentId = null;
    let currentImageData = null;

    window.dbOp.createDb();

    function refreshTable() {
        window.dbOp.selectAll().then(rows => {
          let table = '<table border="1"><tr><th>ID</th><th>メモ</th><th>日時</th><th>画像</th><th>操作</th></tr>';
          rows.forEach(row => {
            table += `<tr>
              <td>${row.id}</td>
              <td>${row.memo}</td>
              <td>${row.date_time}</td>
              <td>${row.image_url ? `<img src="${row.image_url}" width="50" onclick="showFullImage('${row.image_url}')">` : ''}</td>
              <td>
                <button onclick="editMemo(${row.id}, '${row.memo}', '${row.image_url}')">編集</button>
                <button onclick="deleteMemo(${row.id})">削除</button>
              </td>
            </tr>`;
          });
          table += '</table>';
          tableContainer.innerHTML = table;
        });
      }

      submitButton.addEventListener('click', () => {
        const memoText = memoInput.value;
        window.dbOp.insertData(memoText, currentImageData).then(() => {
            memoInput.value = '';
            imagePreview.style.display = 'none';
            currentImageData = null;
            refreshTable();
        }).catch(err => {
            console.error('Failed to insert data:', err);
            alert('メモの追加に失敗しました。');
        });
    });

    updateButton.addEventListener('click', () => {
        const memoText = memoInput.value;
        window.dbOp.updateData(currentId, memoText, currentImageData).then(() => {
            memoInput.value = '';
            submitButton.style.display = 'inline';
            updateButton.style.display = 'none';
            cancelButton.style.display = 'none';
            imagePreview.style.display = 'none';
            currentId = null;
            currentImageData = null;
            refreshTable();
        }).catch(err => {
            console.error('Failed to update data:', err);
            alert('メモの更新に失敗しました。');
        });
    });

    cancelButton.addEventListener('click', () => {
        memoInput.value = '';
        submitButton.style.display = 'inline';
        updateButton.style.display = 'none';
        cancelButton.style.display = 'none';
        imagePreview.style.display = 'none';
        currentId = null;
        currentImageData = null;
    });

    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentImageData = e.target.result;
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    window.editMemo = (id, memo, imageUrl) => {
        currentId = id;
        memoInput.value = memo;
        submitButton.style.display = 'none';
        updateButton.style.display = 'inline';
        cancelButton.style.display = 'inline';
        if (imageUrl) {
            imagePreview.src = imageUrl;
            imagePreview.style.display = 'block';
            // 現在の画像URLを保存
            currentImageData = imageUrl;
        } else {
            imagePreview.style.display = 'none';
            currentImageData = null;
        }
    };

    window.deleteMemo = (id) => {
        if (confirm('本当に削除しますか？')) {
            window.dbOp.deleteData(id).then(() => {
                refreshTable();
            }).catch(err => {
                console.error('Failed to delete memo:', err);
                alert('メモの削除に失敗しました。');
            });
        }
    };

    window.showFullImage = (imageUrl) => {
        const fullImage = document.createElement('div');
        fullImage.style.position = 'fixed';
        fullImage.style.top = '0';
        fullImage.style.left = '0';
        fullImage.style.width = '100%';
        fullImage.style.height = '100%';
        fullImage.style.backgroundColor = 'rgba(0,0,0,0.8)';
        fullImage.style.display = 'flex';
        fullImage.style.justifyContent = 'center';
        fullImage.style.alignItems = 'center';
        fullImage.style.zIndex = '1000';
    
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.maxWidth = '90%';
        img.style.maxHeight = '90%';
    
        fullImage.appendChild(img);
        fullImage.addEventListener('click', () => {
          document.body.removeChild(fullImage);
        });
    
        document.body.appendChild(fullImage);
      };

    refreshTable();
});