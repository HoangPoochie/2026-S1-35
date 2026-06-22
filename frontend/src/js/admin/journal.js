const journalForm = document.getElementById("journal-form");
const journalFileInput = document.getElementById("journal-pdf-file");
const journalMessage = document.getElementById("journal-message");
const journalUploadButton = document.getElementById("journal-upload-button");

function setJournalMessage(message, isError = false) {
  if (!journalMessage) return;

  journalMessage.textContent = message;
  journalMessage.style.color = isError ? "#C62828" : "#2E7D32";
}

function setUploadLoading(isLoading) {
  if (!journalUploadButton) return;

  journalUploadButton.disabled = isLoading;
  journalUploadButton.textContent = isLoading
    ? "Uploading..."
    : "Upload Journal PDF";
}

if (journalForm) {
  journalForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = journalFileInput?.files?.[0];

    setJournalMessage("");

    if (!file) {
      setJournalMessage("Please select a PDF file.", true);
      return;
    }

    if (file.type !== "application/pdf") {
      setJournalMessage("Only PDF files are allowed.", true);
      return;
    }

    const formData = new FormData();
    formData.append("journalPdf", file);

    try {
      setUploadLoading(true);

      const response = await fetch("/api/admin/journal", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          `Failed to upload journal PDF. Status: ${response.status}`
        );
      }

      setJournalMessage("Journal PDF uploaded successfully.");
      journalForm.reset();
    } catch (error) {
      setJournalMessage(error.message, true);
    } finally {
      setUploadLoading(false);
    }
  });
}