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

        const allFiles = Array.from(input.files);
        const validFiles = allFiles.filter(f => f.size <= MAX_FILE_SIZE_MB * 1024 * 1024);
        const skippedFiles = allFiles.filter(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);

        if (skippedFiles.length > 0) {
            console.warn(`Skipped ${skippedFiles.length} files over 10MB:`, skippedFiles.map(f => f.name));
        }

        const getMessageBox = () => document.querySelector('[role="textbox"]');

        for (let i = 0; i < validFiles.length; i += MAX_BATCH_SIZE) {
            const batch = validFiles.slice(i, i + MAX_BATCH_SIZE);
            const dt = new DataTransfer();
            batch.forEach(file => dt.items.add(file));

            const uploadInput = document.querySelector('input[type=file]');
            uploadInput.files = dt.files;
            uploadInput.dispatchEvent(new Event('change', { bubbles: true }));

            console.log(`Uploading batch ${i / MAX_BATCH_SIZE + 1}:`, batch.map(f => f.name));

            await delay(3500); // Slightly longer wait for upload preview

            const messageBox = getMessageBox();
            if (messageBox) {
                messageBox.focus();
                document.execCommand('insertText', false, ' ');
                await delay(500);

                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
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

            await delay(5000 + batch.length * 1500); // Wait longer based on batch size

            // Wait explicitly for GIF favorite buttons to load
            let attempts = 0;
            let favButtons;
            while (attempts < 10) {
                favButtons = [...document.querySelectorAll('div[class*="gifFavoriteButton"][aria-label="Add to Favorites"]')].slice(-batch.length);
                if (favButtons.length === batch.length) break;
                await delay(1000);
                attempts++;
            }

            if (favButtons.length === batch.length) {
                for (const btn of favButtons) {
                    btn.click();
                    await delay(800); // Slightly longer delay ensures click registers
                }
                console.log(`Favorited batch ${i / MAX_BATCH_SIZE + 1}`);
            } else {
                console.warn(`Failed to find all favorite buttons for batch ${i / MAX_BATCH_SIZE + 1}`);
            }

            await delay(5000); // Safe delay before next batch
        }

        console.log('✅ Bulk upload complete.');
    };
}

bulkUploadAndFavoriteGIFs();
