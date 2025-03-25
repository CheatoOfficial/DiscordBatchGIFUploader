async function bulkUploadAndFavoriteGIFs() {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.gif';
    input.click();

    input.onchange = async () => {
        const MAX_BATCH_SIZE = 10;
        const MAX_FILE_SIZE_MB = 10;

        const files = Array.from(input.files).filter(f => f.size <= MAX_FILE_SIZE_MB * 1024 * 1024);
        const skipped = Array.from(input.files).filter(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);

        if (skipped.length > 0) {
            console.warn(`Skipped ${skipped.length} files (>10MB):`, skipped.map(f => f.name));
        }

        const getMessageBox = () => document.querySelector('[role="textbox"]');

        for (let i = 0; i < files.length; i += MAX_BATCH_SIZE) {
            const batch = files.slice(i, i + MAX_BATCH_SIZE);
            const dt = new DataTransfer();
            batch.forEach(file => dt.items.add(file));

            const uploadInput = document.querySelector('input[type=file]');
            uploadInput.files = dt.files;
            uploadInput.dispatchEvent(new Event('change', { bubbles: true }));

            console.log(`Uploading batch ${i / MAX_BATCH_SIZE + 1}:`, batch.map(f => f.name));

            await delay(3000); // Wait for upload preview to load

            const messageBox = getMessageBox();
            if (messageBox) {
                messageBox.focus();
                document.execCommand('insertText', false, ' '); // Force input registration
                await delay(500);

                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    which: 13,
                    keyCode: 13,
                    bubbles: true,
                    cancelable: true
                });
                messageBox.dispatchEvent(enterEvent);
                console.log(`Sent batch ${i / MAX_BATCH_SIZE + 1}`);
            } else {
                console.error(`Message box not found for batch ${i / MAX_BATCH_SIZE + 1}`);
                continue;
            }

            await delay(5000 + batch.length * 1000); // Wait longer if batch is large

            // Favorite all GIFs from this batch
            const favButtons = [...document.querySelectorAll('div[class*="gifFavoriteButton"][aria-label="Add to Favorites"]')].slice(-batch.length);
            for (const btn of favButtons) {
                btn.click();
                await delay(500);
            }
            console.log(`Favorited batch ${i / MAX_BATCH_SIZE + 1}`);

            await delay(4000); // Wait before starting next batch
        }

        console.log('✅ Bulk upload complete.');
    };
}

bulkUploadAndFavoriteGIFs();
