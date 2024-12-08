const isDev = process.env.NODE_ENV !== 'production';
const fs = require('fs');

const functions = require('@google-cloud/functions-framework');
// Import the required modules
const { Storage } = require('@google-cloud/storage');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

// Initialize the Google Cloud Storage client
const storage = new Storage();

functions.http('helloHttp', (req, res) => {
  res.send(`Hello ${req.query.name || req.body.name || 'World'}!`);
});

functions.http('screenshot', async (req, res) => {
  const result = await screenshot(req.query.url);
  const status = result.error ? 500 : 200;
  res.status(status).send(result);
});

// Google Cloud Function
async function screenshot(url = 'https://www.google.com') {
  try {
    // Placeholder for Google Cloud Storage bucket name (to be filled)
    const bucketName = 'b-2443'; // GCS bucket name

    // Parse the URL to extract the hostname
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    // Construct the GCS filename using the hostname
    const gcsKey = `screenshots/${hostname}.png`;

    const localChromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
    const executablePath = isDev ? localChromePath : await chromium.executablePath();

    // Launch a headless Chrome browser using Puppeteer with no-sandbox argument
    const browser = await puppeteer.launch({
      executablePath,
      args: [...chromium.args, '--no-sandbox'],
      headless: true
    });

    // Open a new page in the browser
    const page = await browser.newPage();

    // Navigate to the specified URL
    await page.goto(url);

    // Take a screenshot of the page
    const screenshotBuffer = await page.screenshot();

    // Close the browser
    await browser.close();

    if (isDev) {
      // Save the screenshot to the local filesystem
      fs.writeFileSync('screenshot.png', screenshotBuffer);
    } else {
      // Upload the screenshot to Google Cloud Storage
      await storage.bucket(bucketName).file(gcsKey).save(screenshotBuffer, {
        contentType: 'image/png',
      });

    }

    return { message: `Screenshot uploaded to ${bucketName}/${gcsKey}` }
  } catch (error) {
    // Handle and log errors
    console.error('Error:', error);
    return { error: error.toString() }
  }
};

screenshot();
