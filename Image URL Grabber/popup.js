document.getElementById("grabButton").addEventListener("click", () => {
  browser.tabs.executeScript({
    code: `
      (() => {
        // Get image URLs from <img> tags, including lazy-loaded images
        const images = Array.from(document.getElementsByTagName('img'))
          .map(img => img.src || img.dataset.src || img.getAttribute('data-src'));

        // Get background image URLs from elements with background-image in their styles
        const backgroundImages = Array.from(document.querySelectorAll('*'))
          .map(el => window.getComputedStyle(el).backgroundImage)
          .filter(bg => bg.startsWith('url('))  // Check if background image is set
          .map(bg => bg.slice(5, -2));          // Extract URL from 'url(...)'

        // Combine all URLs and filter out duplicates and empty ones
        const allUrls = [...images, ...backgroundImages];
        const uniqueUrls = [...new Set(allUrls.filter(Boolean))]; // Remove duplicates and empty values

        // Copy the URLs to the clipboard if any are found
        if (uniqueUrls.length > 0) {
          navigator.clipboard.writeText(uniqueUrls.join('\\n')).then(() => {
            browser.runtime.sendMessage({type: "success", count: uniqueUrls.length});
          }).catch(err => {
            browser.runtime.sendMessage({type: "error", message: err});
          });
        } else {
          browser.runtime.sendMessage({type: "empty"});
        }

        return uniqueUrls;
      })();
    `
  });
});

// Listen for messages from the content script and trigger notifications
browser.runtime.onMessage.addListener((message) => {
  if (message.type === "success") {
    browser.notifications.create({
      "type": "basic",
      "title": "Success",
      "message": `${message.count} image URLs copied to clipboard!`
    });
  } else if (message.type === "error") {
    browser.notifications.create({
      "type": "basic",
      "title": "Error",
      "message": `Failed to copy: ${message.message}`
    });
  } else if (message.type === "empty") {
    browser.notifications.create({
      "type": "basic",
      "title": "No Images",
      "message": "No image URLs found on this page."
    });
  }
});
