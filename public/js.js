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
  var messageBar = r_e("message_bar");

  // Display the message and set its content
  messageBar.style.display = "block";
  messageBar.innerHTML = message;

  // Hide the message bar after 5 seconds
  setTimeout(() => {
    messageBar.innerHTML = ""; // Clear the message content
  }, 5000);
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

// Event listener for clicks on the document
document.addEventListener("click", function (event) {
  // Check if the clicked element is a link with one of the specified IDs
  if (
    event.target.matches("#directory, #talent, #myaccount, #points, #home-logo")
  ) {
    event.preventDefault(); // Prevent default link behavior

    // Get the ID of the clicked element
    var id = event.target.id;

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

    // Load the content corresponding to the clicked link
    loadContent(url);
  }
});

// Function to handle login form submission
function handleLoginFormSubmission(event) {
  event.preventDefault();
  // Get form input values
  var username = document.getElementById("l_username").value;
  var password = document.getElementById("l_password").value;

  // Determine which button was clicked
  var submitButtonValue = event.submitter.value;

  if (submitButtonValue === "Log In") {
    // Perform login logic here
    auth
      .signInWithEmailAndPassword(username, password)
      .then((cred) => {
        document.getElementById("loginform").reset();
        hideModal();
        showMainContent();
        configure_message_bar(username + " " + "is now logged in.");
        console.log(cred.user.uid);
      })
      .catch((error) => {
        let errorMessage = error.message;
        document.querySelector(".error_message1").innerHTML = errorMessage;
      });
  }
}

// Function to handle signup form submission
function handleSignupFormSubmission(event) {
  event.preventDefault();
  // Get form input values
  var s_username = document.getElementById("s_username").value; // Get sign-up form username
  var s_password = document.getElementById("s_password").value; // Get sign-up form password
  var firstName = document.getElementById("f_name").value; // Get sign-up form password
  var lastName = document.getElementById("l_name").value; // Get sign-up form password
  // Perform sign-up logic here
  auth
    .createUserWithEmailAndPassword(s_username, s_password)
    .then((cred) => {
      document.getElementById("signupform").reset();
      hideModal();
      showMainContent();
      configure_message_bar(s_username + " " + "is now logged in.");

      // Get the authenticated user
      var user = cred.user;

      // Store user information in Firestore
      db.collection("employees").doc(user.uid).set({
        firstName: firstName,
        email: s_username,
        lastName: lastName,

        // Add more employee details as needed
      });
    })
    .catch((error) => {
      let errorMessage = error.message;
      document.querySelector(".error_message2").innerHTML = errorMessage;
    });
}

// Attach event listeners to login and signup forms
document
  .getElementById("loginform")
  .addEventListener("submit", handleLoginFormSubmission);
document
  .getElementById("signupform")
  .addEventListener("submit", handleSignupFormSubmission);

function showMainContent() {
  r_e("main-content").style.display = "block";
}

// Function to hide the main content
function hideMainContent() {
  r_e("main-content").style.display = "none";
}

// Function to show the modal
function showModal() {
  r_e("loginModal").style.display = "block";
  r_e("signupModal").style.display = "none";
}

// Function to hide the modal
function hideModal() {
  r_e("loginModal").style.display = "none";
  r_e("signupModal").style.display = "none";
}

// Function to check the authentication state on page load
function checkAuthState() {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in
      showMainContent();
      hideModal();

      // Get the authenticated user's ID
      var userId = user.uid;
    } else {
      // User is signed out, show the modal
      showModal();
      hideMainContent();
    }
  });
}

// Function to handle logout
function handleLogout() {
  auth.signOut().then(() => {
    // Reload the page to trigger the onAuthStateChanged listener
    window.location.reload();
  });
}

// Attach the event listener using event delegation
document.addEventListener("click", function (event) {
  if (event.target.id === "signout") {
    handleLogout();
  }
});

// Call the function to check authentication state on page load
checkAuthState();

document.addEventListener("DOMContentLoaded", function () {
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");
  const newUserButton = document.getElementById("new_user");
  const oldUserButton = document.getElementById("old_user");

  // Show signup modal and hide login modal
  newUserButton.addEventListener("click", function () {
    loginModal.style.display = "none";
    signupModal.style.display = "block";
  });

  // Show login modal and hide signup modal
  oldUserButton.addEventListener("click", function () {
    loginModal.style.display = "block";
    signupModal.style.display = "none";
  });
});

// Function to load user data into the table
function loadUserData(userId) {
  var userRef = db.collection("employees").doc(userId);
  userRef
    .get()
    .then(function (doc) {
      if (doc.exists) {
        var userData = doc.data();
        var firstName = userData.firstName;
        var lastName = userData.lastName;

        // Check if the elements exist before accessing them
        var nameHeader = document.getElementById("NameHeader");
        var account_fname = document.getElementById("account_fname");
        var account_lname = document.getElementById("account_lname");

        if (nameHeader && account_fname && account_lname) {
          // Change value of elements
          nameHeader.innerHTML = firstName;
          account_fname.value = firstName;
          account_lname.value = lastName;
        } else {
          console.log("One or more elements not found.");
        }
      }
    })
    .catch(function (error) {
      console.log("Error getting document:", error);
    });
}

// Function to check the authentication state and load user data
function checkAuthStateAndLoadUserData() {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in
      var userId = user.uid;

      // Load user data based on the user ID
      loadUserData(userId);
    } else {
      // User is signed out, handle accordingly (e.g., show login modal)
      console.log("User is not authenticated.");
    }
  });
}

// Make sure My Account is loaded before loading information
let myAccountLink = document.getElementById("myaccount");
myAccountLink.addEventListener("click", function (event) {
  event.preventDefault(); // Prevent the default link behavior

  // Call the checkAuthStateAndLoadUserData function to ensure user is authenticated and load data
  checkAuthStateAndLoadUserData();
});

// Upload Blog Post
const uploadForm = document.getElementById("uploadForm");
const pdfFileInput = document.getElementById("pdfFile");
const pdfViewer = document.getElementById("pdfViewer");

uploadForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const file = pdfFileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const pdfContent = event.target.result;
      pdfViewer.innerHTML = `<embed src="${pdfContent}" type="application/pdf" width="100%" height="100%">`;
    };
    reader.readAsDataURL(file);
  }
});

//Confirm Matching Passwords
function checkPasswordMatch() {
  var password = document.getElementById("s_password").value;
  var confirmPassword = document.getElementById("c_s_password").value;

  if (password == confirmPassword) {
    document.getElementById("passwordMatchMessage").innerHTML =
      "Passwords Match";
  } else {
    document.getElementById("passwordMatchMessage").innerHTML =
      "Passwords do not Match";
  }
}
