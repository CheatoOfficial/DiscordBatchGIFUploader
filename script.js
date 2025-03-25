/***********************************************************
 * 1) Scrolling & Favoriting Script (your "works mint" code)
 ***********************************************************/
async function scrollChannelAndFavoriteGifs() {
  // PART A: Find the scroller with partial class matching
  const scroller = document.querySelector(
    'div[class^="scroller__"][class*="managedReactiveScroller_"]'
  );
  if (!scroller) {
    console.error("❌ Could not find the Discord scroller with partial class matches.");
    return;
  }
  console.log("✅ Found scroller for scrolling:", scroller);

  // PART B: Hover & favorite visible GIFs
  async function favoriteAllVisibleGifs() {
    // All "imageWrapper_" elements (no gifTag_ check, because it shows on hover)
    const gifContainers = document.querySelectorAll('div[class*="imageWrapper_"]');
    if (!gifContainers.length) {
      console.log("No GIF containers found at the moment.");
      return;
    }

    console.log(`→ Found ${gifContainers.length} visible GIF container(s). Attempting to favorite...`);

    for (const container of gifContainers) {
      // Outline for debugging
      container.style.outline = '2px solid red';
      container.style.outlineOffset = '2px';

      // Hover event to reveal "Add to Favorites"
      const mouseOverEvent = new MouseEvent("mouseover", {
        bubbles: true,
        cancelable: true,
        view: window
      });
      container.dispatchEvent(mouseOverEvent);

      // Wait a bit
      await new Promise(res => setTimeout(res, 800));

      // Attempt to click [aria-label="Add to Favorites"]
      const favoriteButton = container.querySelector('[aria-label="Add to Favorites"]');
      if (favoriteButton) {
        console.log("   - Clicking 'Add to Favorites':", container);
        favoriteButton.click();
      } else {
        // Not every image is necessarily a GIF or the button may require more time
        console.log("   - No 'Add to Favorites' button found for:", container);
      }
    }
  }

  // PART C: Scroll Up to load older messages
  async function scrollToTopAndLoadAll() {
    console.log("Scrolling UP to load older messages...");
    let lastScrollTop = -1;

    while (true) {
      // Scroll up by 500px each time (tweak as needed)
      scroller.scrollTop = Math.max(scroller.scrollTop - 500, 0);

      // Wait for older messages to load
      await new Promise(res => setTimeout(res, 2000));

      // Favorite newly visible GIFs
      await favoriteAllVisibleGifs();

      // Stop if at top or can't scroll further
      if (scroller.scrollTop === 0 || scroller.scrollTop === lastScrollTop) {
        console.log("Reached the top or no more older messages.");
        break;
      }
      lastScrollTop = scroller.scrollTop;
    }
  }

  // PART D: Scroll Down to load newer messages
  async function scrollToBottomAndLoadAll() {
    console.log("Scrolling DOWN to load newer messages...");
    let lastScrollHeight = -1;

    while (true) {
      // Jump to bottom
      scroller.scrollTop = scroller.scrollHeight;

      // Wait for newer messages
      await new Promise(res => setTimeout(res, 2000));

      // Favorite newly visible GIFs
      await favoriteAllVisibleGifs();

      // If scrollHeight doesn't grow, we've likely loaded everything
      if (scroller.scrollHeight === lastScrollHeight) {
        console.log("Reached the bottom or no more newer messages.");
        break;
      }
      lastScrollHeight = scroller.scrollHeight;
    }
  }

  // PART E: Execute top→bottom scroll
  console.log("🏁 Starting top-to-bottom scroll & favorite routine...");
  await scrollToTopAndLoadAll();
  await scrollToBottomAndLoadAll();
  console.log("✅ Finished scrolling & favoriting from top to bottom.");
}

/**************************************************************
 * 2) Bulk Upload Script + Replacing the Old Fav Button Logic
 **************************************************************/
async function bulkUploadAndFavoriteGIFs() {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = '.gif';
  input.click();

  input.onchange = async () => {
    const MAX_BATCH_SIZE = 9;
    const MAX_FILE_SIZE_MB = 10;

    const allFiles = Array.from(input.files);
    // Filter out files > 10MB
    const validFiles = allFiles.filter(f => f.size <= MAX_FILE_SIZE_MB * 1024 * 1024);
    const skippedFiles = allFiles.filter(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (skippedFiles.length > 0) {
      console.warn(`Skipped ${skippedFiles.length} file(s) over 10MB:`,
                   skippedFiles.map(f => f.name));
    }

    // Helper to find the message input box each time
    const getMessageBox = () => document.querySelector('[role="textbox"]');

    // Upload in batches
    for (let i = 0; i < validFiles.length; i += MAX_BATCH_SIZE) {
      const batch = validFiles.slice(i, i + MAX_BATCH_SIZE);
      const dt = new DataTransfer();
      batch.forEach(file => dt.items.add(file));

      // Select the standard file input for Discord
      const uploadInput = document.querySelector('input[type=file]');
      if (!uploadInput) {
        console.error("Upload input not found. Cannot attach files.");
        return;
      }
      uploadInput.files = dt.files;
      uploadInput.dispatchEvent(new Event('change', { bubbles: true }));

      console.log(`Uploading batch #${Math.floor(i / MAX_BATCH_SIZE) + 1}:`,
                  batch.map(f => f.name));

      // Give the preview time to load
      await delay(3000);

      const messageBox = getMessageBox();
      if (messageBox) {
        // Focus and "type" a space to trigger Discord's send
        messageBox.focus();
        document.execCommand('insertText', false, ' ');
        await delay(500);

        // Press Enter
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          which: 13,
          keyCode: 13,
          bubbles: true,
          cancelable: true
        });
        messageBox.dispatchEvent(enterEvent);
        console.log(`Sent batch #${Math.floor(i / MAX_BATCH_SIZE) + 1}`);
      } else {
        console.error(`Message box not found for batch #${Math.floor(i / MAX_BATCH_SIZE) + 1}`);
        continue;
      }

      // Wait more for the files to finish sending (tweak as needed)
      await delay(1500 + batch.length * 1000);

      // === REPLACE NAIVE FAVORITE CLICKING WITH THE SCROLL+FAVORITE SCRIPT ===
      console.log(`Favoriting all GIFs after batch #${Math.floor(i / MAX_BATCH_SIZE) + 1}...`);
      await scrollChannelAndFavoriteGifs();
      console.log(`✅ Done favoriting batch #${Math.floor(i / MAX_BATCH_SIZE) + 1}`);

      // Short pause before next batch
      await delay(1500);
    }

    console.log('✅ Bulk upload & auto-favorite complete!');
  };
}

// 3) Run the bulk upload process
bulkUploadAndFavoriteGIFs();
