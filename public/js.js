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
function loadContent(url, options = {}) {
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
        // Check if a message is provided in the options
        if (options.message) {
          // Configure and display the message bar with the provided message
          configure_message_bar(options.message);
        }
      }
    })
    .catch((error) => console.error("Error fetching HTML:", error));
}

// Event listener for clicks on the document
document.addEventListener("click", function (event) {
  // Check if the clicked element is a link with one of the specified IDs
  if (
    event.target.matches(
      "#directory, #talent, #myaccount, #points, #home-logo, #admin"
    )
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
        // Load user data when "My Account" link is clicked
        firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            var userId = user.uid;
            loadUserData(userId); // Load user data into the form

            // Set the URL after loading user data (e.g., redirect to myaccount.html)
            url = "myaccount.html";
            // Save the current URL to localStorage
            saveStateToStorage({ url });
            // Load the content corresponding to the clicked link
            loadContent(url);
          } else {
            console.log("User is not authenticated.");
          }
        });
        return; // Exit the function without loading a URL
      case "points":
        url = "points.html";
        break;
      case "home-logo":
        url = "home.html";
        break;
    }
    // Save the current URL to localStorage
    saveStateToStorage({ url });
    // Load the content corresponding to the clicked link
    loadContent(url);
  }
});
// Call loadLastVisitedUrl when the page loads or is refreshed
window.addEventListener("load", loadLastVisitedUrl);

// Function to handle login form submission
function handleLoginFormSubmission(event) {
  event.preventDefault();
  // Get form input values
  var username = document.getElementById("l_username").value;
  var password = document.getElementById("l_password").value;

  // Determine which button was clicked
  var submitButtonValue = event.submitter.value;

  if (submitButtonValue === "Log In") {
    // Check if the username exists in Firestore
    db.collection("employees")
      .where("email", "==", username)
      .get()
      .then((querySnapshot) => {
        if (querySnapshot.empty) {
          // Username doesn't exist, show "create account" message
          document.querySelector(".error_message1").innerHTML =
            "Create An Account!";
        } else {
          // Username exists, try to sign in with Firebase Authentication
          auth
            .signInWithEmailAndPassword(username, password)
            .then((cred) => {
              document.getElementById("loginform").reset();
              hideModal();
              showMainContent();

              // Redirect user to home page after successful login
              loadContent("home.html", {
                message: username + " " + "is now logged in.",
              });
            })
            .catch((error) => {
              let errorMessage = error.message;
              document.querySelector(".error_message1").innerHTML =
                "Incorrect Password";

              // Keep the modal visible on incorrect password
              showModal();
            });
        }
      })
      .catch((error) => {
        console.error("Error checking username in Firestore:", error);
      });
  }
}

/// Function to handle signup form submission
function handleSignupFormSubmission(event) {
  event.preventDefault();
  // Get form input values
  var s_username = document.getElementById("s_username").value;
  var s_password = document.getElementById("s_password").value;
  var firstName = document.getElementById("f_name").value;
  var lastName = document.getElementById("l_name").value;

  // Perform sign-up logic here
  auth
    .createUserWithEmailAndPassword(s_username, s_password)
    .then((cred) => {
      // Get the authenticated user
      var user = cred.user;

      // Store user information in Firestore
      return db.collection("employees").doc(user.uid).set({
        firstName: firstName,
        email: s_username,
        lastName: lastName,
        // Add more employee details as needed
      });
    })
    .then(() => {
      // Reset the signup form
      document.getElementById("signupform").reset();
      // Show main content
      showMainContent();
      // Redirect user to home page after successful login
      loadContent("home.html", {
        message: s_username + " " + "is now logged in.",
      });
    })
    .catch((error) => {
      // Handle authentication errors
      console.error("Error creating user:", error);
      // Display error message
      document.querySelector(".error_message2").innerHTML =
        "Error creating user";
    })
    .finally(() => {
      // Hide the modal
      hideModal();
    });
}

// // Function to save state information in localStorage
function saveStateToStorage(stateData) {
  localStorage.setItem("currentState", JSON.stringify(stateData));
}

// Function to load state information from localStorage
function loadStateFromStorage() {
  const storedState = localStorage.getItem("currentState");
  return storedState ? JSON.parse(storedState) : null;
}

// Function to load the last visited URL from localStorage
function loadLastVisitedUrl() {
  const stateData = loadStateFromStorage();
  if (stateData && stateData.url) {
    loadContent(stateData.url);
  } else {
    // Default action (e.g., load home page)
    loadContent("home.html");
  }
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
    window.location.href = "home.html";
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
        var capitalizedFirstName =
          firstName.charAt(0).toUpperCase() + firstName.slice(1);

        var position = userData.position;
        var department = userData.department;
        var phoneNumber = userData.phoneNumber;
        var email = userData.email;
        var biography = userData.biography;

        // Check if the elements exist before accessing them
        var nameHeader = document.getElementById("NameHeader");
        var account_fname = document.getElementById("account_fname");
        var account_lname = document.getElementById("account_lname");
        var account_position = document.getElementById("position");
        var account_department = document.getElementById("department");
        var account_phoneNumber = document.getElementById("phoneNumber");
        var account_email = document.getElementById("email");
        var account_biography = document.getElementById("biography");

        if (nameHeader && account_fname && account_lname) {
          // Change value of elements
          // Update the inner HTML of nameHeader with the modified firstName
          nameHeader.innerHTML = capitalizedFirstName + "'s Account";
          account_fname.value = firstName;
          account_lname.value = lastName;
          account_position.value = position;
          account_department.value = department;
          account_phoneNumber.value = phoneNumber;
          account_email.value = email;
          account_biography.value = biography;
        } else {
          console.log("One or more elements not found.");
        }
        // Attach event listener to form submission after loading user data
        document
          .getElementById("SaveAccount")
          .addEventListener("click", handleFormSubmission);
      }
    })
    .catch(function (error) {
      console.log("Error getting document:", error);
    });
}

// Function to handle form submission and update data in Firestore
function handleFormSubmission(event) {
  event.preventDefault(); // Prevent the default form submission behavior

  // Get form input values
  var firstName = document.getElementById("account_fname").value;
  var lastName = document.getElementById("account_lname").value;
  var position = document.getElementById("position").value;
  var department = document.getElementById("department").value;
  var phoneNumber = document.getElementById("phoneNumber").value;
  var email = document.getElementById("email").value;
  var biography = document.getElementById("biography").value;

  // Get the user ID of the authenticated user
  var userId = firebase.auth().currentUser.uid;

  // Check if the user ID is available
  if (userId) {
    // Reference the user's document in Firestore
    var userRef = db.collection("employees").doc(userId);

    // Update the user data in Firestore
    userRef
      .set(
        {
          firstName: firstName,
          lastName: lastName,
          position: position,
          department: department,
          phoneNumber: phoneNumber,
          email: email,
          biography: biography,
          // Add more fields as needed
        },
        { merge: true } // Merge the new data with existing data
      )
      .then(() => {
        configure_message_bar("Account Has Been Saved!");
        // Scroll to the message bar
        document
          .getElementById("message_bar")
          .scrollIntoView({ behavior: "smooth" });
      })
      .catch((error) => {
        console.error("Error updating user data:", error);
        // Optionally, display an error message to the user
      });
  } else {
    console.error("User ID not available.");
    // Optionally, handle the case where the user ID is not available
  }
}

// Function to check the authentication state and load user data
function checkAuthStateAndLoadUserData() {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in
      var userId = user.uid;

      // Load user data based on the user ID
      loadUserData(userId);
    }
  });
}
// Call checkAuthStateAndLoadUserData on page load
window.addEventListener("load", checkAuthStateAndLoadUserData);

// Event listener for clicks on "My Account" link
document
  .getElementById("myaccount")
  .addEventListener("click", function (event) {
    event.preventDefault(); // Prevent default link behavior

    // Call loadUserData function to load user data into the form
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        var userId = user.uid;
        loadUserData(userId);
      }
    });
  });

// Call the checkAuthStateAndLoadUserData function to ensure user is authenticated and load data
// checkAuthStateAndLoadUserData();

// Upload Blog Post
// const uploadForm = document.getElementById("uploadForm");
// const pdfFileInput = document.getElementById("pdfFile");
// const pdfViewer = document.getElementById("pdfViewer");

// uploadForm.addEventListener("submit", (e) => {
//   e.preventDefault();

//   const file = pdfFileInput.files[0];
//   if (file) {
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const pdfContent = event.target.result;
//       pdfViewer.innerHTML = `<embed src="${pdfContent}" type="application/pdf" width="100%" height="100%">`;
//     };
//     reader.readAsDataURL(file);
//   }
// });

//Confirm Matching Passwords
function checkPasswordMatch() {
  var password = document.getElementById("s_password").value;
  var confirmPassword = document.getElementById("c_s_password").value;

  if (password == confirmPassword) {
    document.getElementById("passwordMatchMessage").innerHTML =
      "Passwords match";
  } else {
    document.getElementById("passwordMatchMessage").innerHTML =
      "Passwords don't match";
  }
}

function makeAdmin() {
  var firstName = document.getElementById("adminAccount_fname").value.trim();
  var lastName = document.getElementById("adminAccount_lname").value.trim();
  var email = document.getElementById("adminAccount_email").value.trim();

  if (!firstName || !lastName || !email) {
    console.log("First name, last name, and email are required.");
    return;
  }

  // Query Firestore for the user with the given first name, last name, and email
  db.collection("employees")
    .where("firstName", "==", firstName)
    .where("lastName", "==", lastName)
    .where("email", "==", email)
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        console.log(
          "No user found with the provided information:",
          firstName,
          lastName,
          email
        );
        return;
      }

      // Get the first matching document
      const userDoc = querySnapshot.docs[0];

      // Update the user's isAdmin field to true
      db.collection("employees")
        .doc(userDoc.id)
        .update({
          isAdmin: true,
        })
        .then(() => {
          console.log(
            "User successfully made an admin:",
            firstName,
            lastName,
            email
          );
          // Optionally, update the UI to reflect the change
        })
        .catch((error) => {
          console.error("Error updating user admin status:", error);
        });
    })
    .catch((error) => {
      console.error("Error fetching users:", error);
    });
}
