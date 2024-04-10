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
        displayMostRecentBlog();

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
        // Call checkAdminStatusAndHideElement when loading points.html and talent.html
        firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            var userEmail = user.email;
            var elementIdToHide = "penalty_container"; // Replace with ID of the element to hide
            var blogForm = "blogContainer";
            checkAdminStatusAndHideElement(userEmail, elementIdToHide);
            // checkAdminStatusAndHideElement(userEmail, blogForm);
          }
        });
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
              if (window.location.pathname.endsWith("/points.html")) {
                checkAdminStatusAndHideElement(username, "penalty_container");
              }
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
// Function to load the last visited URL from localStorage
function loadLastVisitedUrl() {
  const stateData = loadStateFromStorage();
  if (stateData && stateData.url) {
    loadContent(stateData.url);
    // Check if the last visited URL ends with "talent.html" and call displayMostRecentBlog
    if (stateData.url.endsWith("talent.html")) {
      displayMostRecentBlog();
    }
  } else {
    // Default action (e.g., load home page)
    loadContent("home.html");
  }

  // Check admin status when the page loads
  // Check if the current page is points.html before calling the function
  if (window.location.pathname.endsWith("points.html")) {
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        var userEmail = user.email;
        var elementIdToHide = "penalty_container"; // Replace with ID of the element to hide
        checkAdminStatusAndHideElement(userEmail, elementIdToHide);
      }
    });
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
        var adminAccount_fname = document.getElementById("adminAccount_fname");
        var adminAccount_lname = document.getElementById("adminAccount_lname");
        var adminAccount_email = document.getElementById("adminAccount_email");

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
          adminAccount_fname.value = firstName;
          adminAccount_lname.value = lastName;
          adminAccount_email.value = email;
        }
        // Add event listener for "SaveAccount" button click
        document.addEventListener("click", (e) => {
          // Check if the clicked element is the "SaveAccount" button
          if (e.target.id === "SaveAccount") {
            handleFormSubmission(e); // Call handleFormSubmission function
          }
        });
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
      // Get the current user's email
      var currentUserEmail = user.email;
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
  var keyword = document.getElementById("adminAccount_keyword").value.trim();

  if (!firstName || !lastName || !email) {
    console.log("First name, last name, and email are required.");
    return;
  }

  if (keyword !== "admin2024") {
    alert("Incorrect keyword. Admin privileges cannot be granted.");
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

async function handlePostBlogClick(event) {
  // Check if the clicked element is the "postBlog" button
  if (event.target.id === "postBlog") {
    event.preventDefault(); // Prevent default form submission behavior

    // Code for handling PDF uploads
    const pdfInput = document.getElementById("pdfFile");
    const file = pdfInput.files[0];

    if (!file) {
      console.error("No file selected.");
      return;
    }

    // Display an alert message when the button is clicked
    alert("PDF upload in progress...");

    try {
      // Upload the PDF file to Firebase Storage
      const storageRef = firebase.storage().ref("pdfs/" + file.name); // Specify the path in Storage
      const uploadTask = storageRef.put(file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Handle upload progress if needed
        },
        (error) => {
          console.error("Error uploading PDF to Storage:", error);
        },
        async () => {
          // Get the download URL of the uploaded file
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          const publishDate = new Date();

          // Add the PDF details to Firestore
          await db.collection("Blog").add({
            title: file.name,
            content: downloadURL, // Store the download URL
            publishDate: publishDate,
            // Add other attributes as needed (e.g., authorId, blogId)
          });

          console.log("PDF uploaded to Storage and added to Firestore.");

          // Update the embed element with the new PDF URL
          const embedElement = document.getElementById("output");
          embedElement.src = downloadURL;

          // Optionally, fetch and display the most recent blog post after upload
          await displayMostRecentBlog();
        }
      );
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  }
}

document.addEventListener("click", (e) => {
  // Check if the clicked element is the "SaveAccount" button
  if (e.target.id === "postBlog") {
    handlePostBlogClick(e); // Call handleFormSubmission function
  }
});

// Reference to the Firestore collection
const blogRef = db.collection("Blog");

// Function to fetch and display the most recent blog post
async function displayMostRecentBlog() {
  try {
    // Query Firestore to get the most recent blog post
    const querySnapshot = await blogRef
      .orderBy("publishDate", "desc")
      .limit(1)
      .get();

    // Check if there are any documents in the query snapshot
    if (!querySnapshot.empty) {
      // Get the data of the most recent blog post
      const blogPost = querySnapshot.docs[0].data();

      // Update the HTML content of the "output" div with the blog post information
      const outputDiv = document.getElementById("output");
      outputDiv.innerHTML = `
      <h2>${blogPost.title}</h2>
      <embed id="embedPdf" src="${blogPost.content}" type="application/pdf" width="100%" height="600px" />
      <!-- Add other fields as needed -->
      `;
    } else {
      console.log("No blog posts found.");
    }
  } catch (error) {
    console.error("Error fetching blog posts:", error);
  }
}
// Check if the current page URL contains "talent.html" before calling the function
if (window.location.href.includes("talent.html")) {
  displayMostRecentBlog();
}
// Function to fetch employee data from Firestore and populate the dropdown
// async function populateEmployeeDropdown() {
//   const employeeSelect = document.getElementById("employeeSelect");

//   try {
//     // Query Firestore to get employee data
//     const querySnapshot = await db.collection("employees").get();

//     // Iterate over each document in the query snapshot
//     querySnapshot.forEach((doc) => {
//       // Get the data of the employee
//       const employeeData = doc.data();
//       const firstName = employeeData.firstName;

//       // Create an <option> element for the employee and append it to the dropdown
//       const option = document.createElement("option");
//       option.value = doc.id; // Use employee ID or another unique identifier as the value
//       option.text = firstName; // Display the employee's first name

//       employeeSelect.appendChild(option);
//     });
//   } catch (error) {
//     console.error("Error fetching employee data:", error);
//   }
// }

// populateEmployeeDropdown();
//dynamic directory loading
// db.collection("employees")
//   .get()
//   .then((res) => {
//     let data = res.docs;
//     let html = ``;
//     data.forEach((d) => {
//       html += `<div class="card">
//       <img src="john-doe.jpg" alt="johndoe" class="employee-image" />
//       <div class="employee-name">${d.data().firstName} ${
//         d.data().lastName
//       }</div>
//       <div class="employee-phone">${d.data().phoneNumber}</div>
//     </div>`;
//     });
//     document.querySelector("#employee_directory").innerHTML += html;
//   });

// function formatPhoneNumber() {}

// Function to check admin status and hide/show element based on isAdmin field
function checkAdminStatusAndHideElement(userEmail, elementId) {
  const employeesRef = db.collection("employees");
  employeesRef
    .where("email", "==", userEmail)
    .get()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        const isAdmin = querySnapshot.docs[0].data().isAdmin;
        const element = document.getElementById(elementId);
        if (isAdmin && element) {
          element.style.display = "block"; // Show the element
        } else {
          element.style.display = "none"; // Hide the element
        }
      } else {
        console.log("User not found.");
      }
    })
    .catch((error) => {
      console.error("Error checking admin status:", error);
    });
}

// checkAdminStatusAndHideElement("emfiretruck@gmail.com", "penalty_container");
