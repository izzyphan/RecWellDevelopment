const puppeteer = require("puppeteer");

async function testMyWebsite() {
  const browser = await puppeteer.launch({
    headless: false, // Set to false to watch the test in action
    slowMo: 50, // Slow down by 50ms for each action
  });

  const page = await browser.newPage();

  // Visit the login page of your website
  await page.goto("https://rec-well-staff-w.web.app/home.html");

  // Simulate typing into the login form
  await page.type("#l_username", "testing1016@gmail.com");
  await page.type("#l_password", "Testing1016");

  // Click the login button
  await page.click("#log_in_button"); // Adjust #loginButton to match the selector on your site

  await new Promise((r) => setTimeout(r, 2000));
  // Testing My Account Functions
  await page.click("#myaccount");
  await page.type("#phoneNumber", "4143204569");

  await page.click("#SaveAccount");

  // Set delay to observe the actions
  await new Promise((r) => setTimeout(r, 2000));

  // Signing out
  await page.click("#signout"); // Adjust #logoutButton to match the selector on your site

  // Wait for the page to navigate to the logout screen or homepage
  await page.waitForNavigation();

  // Close the browser
  await browser.close();
}

testMyWebsite();
