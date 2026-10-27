// const tabs = document.querySelectorAll(".tab");
// const panels = document.querySelectorAll(".tab-content");
// const toast = document.getElementById("toast");

// function showToast(message) {
//   toast.textContent = message;
//   toast.classList.add("toast-visible");
//   window.clearTimeout(showToast.timer);
//   showToast.timer = window.setTimeout(() => toast.classList.remove("toast-visible"), 2200);
// }

// tabs.forEach((tab) => {
//   tab.addEventListener("click", () => {
//     tabs.forEach((item) => item.classList.toggle("active", item === tab));
//     panels.forEach((panel) => panel.classList.toggle("hidden", panel.id !== tab.dataset.tab));
//   });
// });

// document.getElementById("copyReply").addEventListener("click", async () => {
//   const text = document.querySelector(".reply").textContent.trim();
//   try {
//     await navigator.clipboard.writeText(text);
//     showToast("Suggested response copied");
//   } catch {
//     showToast("Copy is not available in this preview");
//   }
// });

// document.getElementById("copyQuestion").addEventListener("click", async () => {
//   const text = "Which features are essential for the first release?";
//   try {
//     await navigator.clipboard.writeText(text);
//     showToast("Question copied");
//   } catch {
//     showToast("Copy is not available in this preview");
//   }
// });

// document.getElementById("refreshReply").addEventListener("click", () => {
//   const reply = document.querySelector(".reply");
//   reply.textContent = reply.dataset.alternate || "To make sure we can meet your expectations, could we agree on the priority features and review the timeline together?";
//   reply.dataset.alternate = reply.dataset.alternate ? "" : reply.textContent;
// });

// document.getElementById("endSession").addEventListener("click", () => {
//   showToast("Demo session ended — no recording was made");
// });

// document.getElementById("exportNotes").addEventListener("click", () => {
//   const notes = "MeetMind AI — Sample Meeting Notes\\n\\nKey points\\n- Target first version in 10 days.\\n- Must-have features: login, dashboard, report export.\\n- Confirm timeline after scope review.\\n\\nAction items\\n- Confirm MVP scope\\n- Share realistic delivery plan\\n\\nPreview sample only.";
//   const blob = new Blob([notes], { type: "text/plain;charset=utf-8" });
//   const url = URL.createObjectURL(blob);
//   const link = document.createElement("a");
//   link.href = url;
//   link.download = "meetmind-sample-notes.txt";
//   link.click();
//   URL.revokeObjectURL(url);
//   showToast("Sample notes exported");
// });

// let mediaRecorder = null;
// let capturedStream = null;
// let recordedChunks = [];

// const startRecordingButton = document.getElementById("startRecording");
// const stopRecordingButton = document.getElementById("endSession");

// startRecordingButton?.addEventListener("click", async () => {
//   try {
//     if (!chrome.tabCapture?.capture) {
//       showToast("Tab audio capture is unavailable.");
//       return;
//     }

//     chrome.tabCapture.capture(
//       { audio: true, video: false },
//       (stream) => {
//         if (chrome.runtime.lastError) {
//           showToast(chrome.runtime.lastError.message);
//           return;
//         }

//         if (!stream) {
//           showToast("No audio stream. Open the meeting in this Chrome tab.");
//           return;
//         }

//         capturedStream = stream;
//         recordedChunks = [];

//         mediaRecorder = new MediaRecorder(stream);

//         mediaRecorder.ondataavailable = (event) => {
//           if (event.data && event.data.size > 0) {
//             recordedChunks.push(event.data);
//           }
//         };

//         mediaRecorder.onstop = () => {
//           const blob = new Blob(recordedChunks, {
//             type: mediaRecorder.mimeType || "audio/webm"
//           });

//           const url = URL.createObjectURL(blob);
//           const link = document.createElement("a");
//           link.href = url;
//           link.download = "meetmind-recording.webm";
//           link.click();

//           setTimeout(() => URL.revokeObjectURL(url), 1000);
//           capturedStream?.getTracks().forEach((track) => track.stop());
//           capturedStream = null;

//           showToast("Recording saved to your downloads.");
//         };

//         mediaRecorder.start(1000);
//         startRecordingButton.disabled = true;
//         stopRecordingButton.textContent = "Stop Recording";
//         showToast("Recording started.");
//       }
//     );
//   } catch (error) {
//     showToast("Could not start recording: " + error.message);
//   }
// });

// stopRecordingButton?.addEventListener("click", () => {
//   if (mediaRecorder && mediaRecorder.state !== "inactive") {
//     mediaRecorder.stop();
//     startRecordingButton.disabled = false;
//   } else {
//     showToast("No recording is active.");
//   }
// });