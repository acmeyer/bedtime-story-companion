from flask import Flask, render_template, request, jsonify
import os
import openai
from models import Message
from dataclasses import asdict

openai.api_key = os.getenv('OPENAI_API_KEY')
MODEL_TEMPERATURE = 0.7
CHAT_MODEL = 'gpt-3.5-turbo'

app = Flask(__name__)

def setup_system_prompt(type: str) -> str:
    """Creates a prompt for gpt for generating a response."""
    if type == 'story':
        filename = 'story_prompt.md'
    elif type == 'image':
        filename = 'image_prompt.md'
    else:
        raise ValueError('Invalid prompt type')

    with open(filename) as f:
        prompt = f.read()
    return prompt

def ask_gpt_chat(prompt: str, messages: list[Message]):
    """Returns ChatGPT's response to the given prompt."""
    system_message = [{"role": "system", "content": prompt}]
    message_dicts = [asdict(message) for message in messages]
    conversation_messages = system_message + message_dicts
    response = openai.ChatCompletion.create(
        model=CHAT_MODEL,
        messages=conversation_messages,
        temperature=MODEL_TEMPERATURE
    )
    return response.choices[0]['message']['content'].strip()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chatgpt', methods=['POST'])
def chatgpt():
    text = request.json['text']
    prompt = setup_system_prompt('story')
    conversation_messages = []
    conversation_messages.append(Message(role="user", content=text))
    suggestion = ask_gpt_chat(prompt, conversation_messages)
    return jsonify({'suggested_text': suggestion})

@app.route('/api/dalle2', methods=['POST'])
def dalle2():
    text = request.json['text']
    prompt = setup_system_prompt('image')
    conversation_messages = []
    conversation_messages.append(Message(role="user", content=text))
    image_prompt = ask_gpt_chat(prompt, conversation_messages)
    response = openai.Image.create(
        prompt=image_prompt,
        n=1,
        size="512x512"
    )
    image_url = response['data'][0]['url']
    return jsonify({'image_url': image_url})

if __name__ == '__main__':
    app.run(debug=True)
