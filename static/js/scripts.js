let recognizing = false;
let recognition;
let timeoutId;
let story_lines = [];

function toggleRecording() {
  const micButton = document.getElementById('mic-button');

  if (recognizing) {
      recognition.stop();
      micButton.textContent = 'Start Story';
      story_lines = [];
  } else {
      recognition.start();
      micButton.textContent = 'Stop Story';
      story_lines = [];
  }
  recognizing = !recognizing;
}

async function getNextLineSuggestion(transcript) {
  story_lines.push(transcript);
  const fullStory = story_lines.join("\n");
  const chatGPTResponse = await fetch("/api/chatgpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fullStory }),
  });
  const chatGPTData = await chatGPTResponse.json();
  const suggestedText = chatGPTData.suggested_text;
  document.getElementById("suggested-text").textContent = suggestedText;
  document.getElementById("story-text").textContent = fullStory;
}

async function getImageFromDalle(transcript) {
  const dalleResponse = await fetch("/api/dalle2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: transcript }),
  });
  const dalleData = await dalleResponse.json();
  const imgUrl = dalleData.image_url;
  let imgContainer = document.getElementById("image-container");
  let imgElement = document.getElementById("generated-image");
  if (!imgElement) {
    imgElement = document.createElement("img");
    imgElement.id = "generated-image";
    imgContainer.appendChild(imgElement);
  }
  imgElement.src = imgUrl;
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}


// Check if the browser supports the Web Speech API
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = function() {
        recognizing = true;
    };

    recognition.onend = function() {
        recognizing = false;
    };

    let debouncedGetNextLineSuggestion = debounce(getNextLineSuggestion, 500);
    let debouncedGetImageFromDalle = debounce(getImageFromDalle, 500);

    recognition.onresult = function (event) {
      let transcript = event.results[event.results.length - 1][0].transcript.trim();
      debouncedGetNextLineSuggestion(transcript);
      debouncedGetImageFromDalle(transcript);
    };  
} else {
    alert('Your browser does not support the Web Speech API. Please try a different browser.');
}

