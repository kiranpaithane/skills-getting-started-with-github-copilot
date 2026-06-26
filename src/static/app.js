document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let activitiesData = {};

  function renderActivities(activities) {
    activitiesData = activities;

    // Clear loading message and current options
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    // Populate activities list
    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;
      const participants = details.participants || [];
      const participantMarkup =
        participants.length > 0
          ? `<ul class="participants-list">${participants
              .map(
                (participant) => `
                  <li class="participant-item">
                    <span>${participant}</span>
                    <button
                      type="button"
                      class="remove-participant-btn"
                      data-activity="${name}"
                      data-participant="${participant}"
                      aria-label="Remove ${participant}"
                    >
                      ✕
                    </button>
                  </li>`
              )
              .join("")}</ul>`
          : '<p class="no-participants">No participants yet — be the first to sign up!</p>';

      activityCard.innerHTML = `
        <div class="activity-card-header">
          <h4>${name}</h4>
          <span class="availability-badge">${spotsLeft} spots left</span>
        </div>
        <p class="activity-description">${details.description}</p>
        <p class="activity-meta"><strong>Schedule:</strong> ${details.schedule}</p>
        <div class="participants-section">
          <h5>Participants</h5>
          ${participantMarkup}
        </div>
      `;

      activitiesList.appendChild(activityCard);

      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      renderActivities(activities);
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".remove-participant-btn");
    if (!removeButton) {
      return;
    }

    event.preventDefault();
    const activity = removeButton.dataset.activity;
    const participant = removeButton.dataset.participant;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(participant)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        if (activitiesData[activity]) {
          activitiesData[activity] = {
            ...activitiesData[activity],
            participants: activitiesData[activity].participants.filter(
              (registeredParticipant) => registeredParticipant !== participant
            ),
          };
          renderActivities(activitiesData);
        } else {
          await fetchActivities();
        }
      } else {
        messageDiv.textContent = result.detail || "Failed to remove participant";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        if (activitiesData[activity]) {
          activitiesData[activity] = {
            ...activitiesData[activity],
            participants: [...activitiesData[activity].participants, email],
          };
          renderActivities(activitiesData);
        } else {
          await fetchActivities();
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
