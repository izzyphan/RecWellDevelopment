function r_e(id) {
  return document.querySelector(`#${id}`);
}

function toggleNavbar() {
  var navbarLinks = document.getElementById("navbar-links");
  if (navbarLinks.style.display === "block") {
    navbarLinks.style.display = "none";
  } else {
    navbarLinks.style.display = "block";
  }
}

// message bar popup
function configure_message_bar(message) {
  r_e("message_bar").classList.remove("is-hidden");

  r_e("message_bar").innerHTML = message;

  // hide the message bar
  setTimeout(() => {
    r_e("message_bar").classList.add("is-hidden");
    // clear values in bar
    r_e("message_bar").innerHTML = "";
  }, 5000);
}

function hideModal() {
  document.getElementById("loginModal").style.display = "none";
  sessionStorage.setItem("modalHidden", "true");
}

// Function to fetch and load HTML content dynamically
function loadContent(url) {
  // Hide the modal
  hideModal();

  // Fetch the HTML content from the specified URL
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.text(); // Get the response text
    })
    .then((html) => {
      // Exclude modal content if loading home.html
      if (url !== "home.html") {
        // Set the innerHTML of the main-content div to the fetched HTML content
        document.getElementById("main-content").innerHTML = html;
      } else {
        // Extract the main content from the loaded HTML
        var tempElement = document.createElement("div");
        tempElement.innerHTML = html;
        var mainContentHtml =
          tempElement.querySelector("#main-content").innerHTML;
        document.getElementById("main-content").innerHTML = mainContentHtml;
      }
    })
    .catch((error) => console.error("Error fetching HTML:", error));
}

// Function to check the modal state on page load
function checkModalState() {
  const modalHidden = sessionStorage.getItem("modalHidden");
  if (modalHidden === "true") {
    hideModal(); // Hide the modal if the flag indicates it should be hidden
    r_e("main-content").style.display = "block";
  }
}

// Call the function to check the modal state on page load
checkModalState();

// Event listener for clicks on the document
document.addEventListener("click", function (event) {
  console.log("Clicked element:", event.target);

  // Check if the clicked element is a link with one of the specified IDs
  if (
    event.target.matches("#directory, #talent, #myaccount, #points, #home-logo")
  ) {
    event.preventDefault(); // Prevent default link behavior

    // Get the ID of the clicked element
    var id = event.target.id;

    console.log("Clicked link ID:", id);

    // Define the corresponding URL based on the clicked element's ID
    var url;
    switch (id) {
      case "directory":
        url = "directory.html";
        break;
      case "talent":
        url = "talent.html";
        break;
      case "myaccount":
        url = "myaccount.html";
        break;
      case "points":
        url = "points.html";
        break;
      case "home-logo":
        url = "home.html";
        break;
    }

    console.log("Loading URL:", url);

    // Load the content corresponding to the clicked link
    loadContent(url);
  }
});

// Firebase Sign Up and Log In
document
  .getElementById("loginform")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    // Get form input values
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    // Determine which button was clicked
    var submitButtonValue = event.submitter.value;

    if (submitButtonValue === "Log In") {
      // Perform login logic here
      auth.signInWithEmailAndPassword(username, password).then((cred) => {
        const modal = document.getElementById("loginModal");
        document.getElementById("loginform").reset();

        r_e("loginModal").style.display = "none";
        r_e("main-content").style.display = "block";
      });
    } else if (submitButtonValue === "Sign Up") {
      // Perform sign-up logic here
      auth.createUserWithEmailAndPassword(username, password).then((cred) => {
        const modal = document.getElementById("loginModal");
        document.getElementById("loginform").reset();

        r_e("loginModal").style.display = "none";
        r_e("main-content").style.display = "block";
      });
    }
  });
